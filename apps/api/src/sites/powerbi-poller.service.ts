import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PowerBIService } from './powerbi.service';
import { SitesService } from './sites.service';

const POLL_INTERVAL_MS = 15_000;
const MAX_CONSECUTIVE_FAILURES = 20; // ~5 min a 15s cada
const PENDING_TIMEOUT_MS = 10 * 60 * 1000; // 10 min parado em Unknown/InProgress → Failed

@Injectable()
export class PowerBIPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PowerBIPollerService.name);
  private timer?: NodeJS.Timeout;
  private readonly failureCounts = new Map<string, number>();

  constructor(
    private readonly sitesService: SitesService,
    private readonly powerbiService: PowerBIService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async poll() {
    if (!this.powerbiService.isConfigured()) return;

    let sites: Awaited<ReturnType<typeof this.sitesService.findAllPowerBISites>>;
    try {
      sites = await this.sitesService.findAllPowerBISites();
    } catch {
      return;
    }

    if (sites.length === 0) return;

    await Promise.allSettled(
      sites.map(async (site) => {
        const result = await this.powerbiService.getLatestRefreshInfo(
          site.powerbiGroupId!,
          site.powerbiDatasetId!,
        );

        if (result === null) {
          // Erro de API (403, rede, etc.) — não sobrescreve o status atual.
          // Se já está Failed, não há nada a fazer — evita spam a cada 5min enquanto
          // a API continua inacessível e o site permanece em falha.
          if (site.powerbiRefreshStatus === 'Failed') return;
          const failures = (this.failureCounts.get(site.id) ?? 0) + 1;
          this.failureCounts.set(site.id, failures);
          if (failures >= MAX_CONSECUTIVE_FAILURES) {
            this.logger.error(`Site ${site.id}: ${failures} falhas consecutivas na API do Power BI — marcando como Failed`);
            this.failureCounts.delete(site.id);
            try {
              await this.sitesService.updatePowerBIStatus(site.id, 'Failed');
              void this.mailService.sendBIRefreshFailure(site.name);
            } catch (error) {
              this.logger.error(`Erro ao marcar site ${site.id} como Failed`, error);
            }
          }
          return;
        }

        this.failureCounts.delete(site.id);

        // status === null significa sem histórico de refresh — limpa o badge se necessário.
        if (result.status === null) {
          if (site.powerbiRefreshStatus !== null) {
            try {
              await this.sitesService.updatePowerBIStatus(site.id, null);
            } catch (error) {
              this.logger.error(`Erro ao limpar status Power BI do site ${site.id}`, error);
            }
          }
          return;
        }

        this.logger.debug(`Site ${site.id}: API retornou status="${result.status}" endTime=${result.endTime?.toISOString() ?? 'null'}`);

        const isPending = result.status === 'Unknown' || result.status === 'InProgress';

        if (isPending) {
          // Usa updatedAt do banco como referência — sobrevive a restarts do processo.
          const stuckSince = site.updatedAt instanceof Date ? site.updatedAt : new Date(site.updatedAt);
          const alreadyPending = site.powerbiRefreshStatus === 'Unknown' || site.powerbiRefreshStatus === 'InProgress';
          if (alreadyPending && Date.now() - stuckSince.getTime() > PENDING_TIMEOUT_MS) {
            this.logger.warn(`Site ${site.id}: status "${result.status}" parado desde ${stuckSince.toISOString()} — marcando como Failed`);
            try {
              await this.sitesService.updatePowerBIStatus(site.id, 'Failed');
              void this.mailService.sendBIRefreshFailure(site.name);
            } catch (error) {
              this.logger.error(`Erro ao marcar site ${site.id} como Failed por timeout`, error);
            }
            return;
          }
        }

        // Só grava no banco se algo mudou — preserva updatedAt como referência de mudança real.
        const statusChanged = result.status !== site.powerbiRefreshStatus;
        const endTimeChanged = result.endTime && result.endTime.getTime() !== site.powerbiLastRefreshAt?.getTime();
        if (!statusChanged && !endTimeChanged) return;

        try {
          await this.sitesService.updatePowerBIStatus(site.id, result.status, undefined, result.endTime);
        } catch (error) {
          this.logger.error(`Erro ao atualizar status Power BI do site ${site.id}`, error);
        }

        // Resolve o log de quem pediu o refresh quando a operação termina.
        const wasResolved = result.status === 'Completed' || result.status === 'Failed';
        if (wasResolved) {
          const completedAt = result.endTime ?? new Date();
          void this.sitesService.resolveRefreshLog(site.id, result.status, completedAt);
          // Só envia email na transição para Failed — evita spam se o status já era Failed
          // e o endTime mudou levemente entre polls (mesma falha, timestamp diferente da API).
          if (result.status === 'Failed' && site.powerbiRefreshStatus !== 'Failed') {
            void this.mailService.sendBIRefreshFailure(site.name);
          }
        }
      }),
    );
  }
}
