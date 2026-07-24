import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ExecutionStatus, type Robot } from '@prisma/client';
import { AthenasService } from '../auth/athenas.service';
import {
  ExecutionIdentitiesService,
  normalizeExternalLogin,
} from '../execution-identities/execution-identities.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  departmentsForAthenasLogin,
  formatAthenasPersonName,
} from '../shared/athenas-identity';
import { hashToken } from '../shared/crypto';

type IngestPayload = {
  secondsSaved?: number;
  userName?: string;
  userLogin?: string;
  unitsProcessed?: number;
  notes?: string;
  externalId?: string;
};

// Sanity bound: nenhuma execução isolada economiza mais que 30 dias — protege
// contra um valor errado (segundos vs minutos, etc.) poluir os relatórios
const MAX_SECONDS_SAVED = 30 * 24 * 60 * 60;

@Injectable()
export class IntegrationsService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly identities: ExecutionIdentitiesService,
    private readonly athenas: AthenasService,
  ) {}

  onModuleInit() {
    void this.backfillExternalIdentities().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Não foi possível reconciliar identidades externas: ${message}`);
    });
  }

  async authenticateRobot(apiKey: string): Promise<Robot> {
    const robot = await this.prisma.robot.findUnique({
      where: { apiKeyHash: hashToken(apiKey) },
    });

    if (!robot || !robot.isExternal) {
      throw new UnauthorizedException('Chave de API inválida.');
    }

    return robot;
  }

  async ingestTimeSavings(robot: Robot, payload: IngestPayload) {
    const secondsSaved = Number(payload.secondsSaved);
    if (!Number.isFinite(secondsSaved) || secondsSaved <= 0 || secondsSaved > MAX_SECONDS_SAVED) {
      throw new BadRequestException(
        'secondsSaved é obrigatório e deve ser um número positivo, em segundos (máximo 30 dias).',
      );
    }

    const userLogin = normalizeExternalLogin(payload.userLogin ?? '') || null;
    if (!userLogin) {
      throw new BadRequestException('userLogin é obrigatório.');
    }

    const externalId = payload.externalId?.trim() || null;

    // Idempotência: reenvio (retry de rede) com o mesmo externalId não duplica
    if (externalId) {
      const existing = await this.prisma.execution.findFirst({
        where: { robotId: robot.id, externalId },
      });
      if (existing) {
        return { execution: existing, deduplicated: true };
      }
    }

    const linkedUser = await this.identities.findUserByLogin(userLogin);
    const providedName = payload.userName?.trim() || userLogin;
    const externalProfile = !linkedUser
      ? await this.ensureExternalProfile(userLogin)
      : null;
    const receivedName = externalProfile?.name ?? providedName;

    const unitsProcessed =
      typeof payload.unitsProcessed === 'number' && Number.isFinite(payload.unitsProcessed)
        ? Math.max(0, Math.round(payload.unitsProcessed))
        : null;

    const now = new Date();
    const execution = await this.prisma.execution.create({
      data: {
        robotId: robot.id,
        userId: linkedUser?.user.id ?? null,
        requestedByName: receivedName,
        requestedByEmail: userLogin,
        notes: payload.notes?.trim() || null,
        status: ExecutionStatus.success,
        progress: 100,
        currentStep: 'Execução externa registrada',
        startedAt: now,
        finishedAt: now,
        unitsProcessed,
        manualEstimatedSeconds: Math.round(secondsSaved),
        externalId,
      },
    });

    const savedLabel = formatSavedTime(secondsSaved);
    await this.prisma.executionLog.create({
      data: {
        executionId: execution.id,
        level: 'info',
        message: linkedUser
          ? `Registrado via integração externa. Login: ${userLogin}. Tempo economizado: ${savedLabel}. Usuário vinculado internamente por ${linkedUser.method}.`
          : `Registrado via integração externa. Login: ${userLogin}. Tempo economizado: ${savedLabel}. Nenhum usuário interno foi vinculado.`,
      },
    });

    return { execution, deduplicated: false };
  }

  private async ensureExternalProfile(login: string) {
    const existing = await this.prisma.externalIdentity.findUnique({
      where: { login },
    });
    if (existing) return existing;

    const athenasName = await this.athenas.findActiveUserName(login);
    if (!athenasName) return null;

    return this.prisma.externalIdentity.upsert({
      where: { login },
      create: {
        login,
        name: formatAthenasPersonName(athenasName),
        department: departmentsForAthenasLogin(login)[0] ?? null,
      },
      update: {},
    });
  }

  private async backfillExternalIdentities() {
    const executions = await this.prisma.execution.findMany({
      where: {
        userId: null,
        robot: { isExternal: true },
        OR: [
          { requestedByName: { not: null } },
          { requestedByEmail: { not: null } },
        ],
      },
      select: {
        requestedByName: true,
        requestedByEmail: true,
      },
    });

    const logins = new Set(
      executions
        .map((execution) =>
          normalizeExternalLogin(
            execution.requestedByEmail ?? execution.requestedByName ?? '',
          ),
        )
        .filter(Boolean),
    );

    for (const login of logins) {
      await this.ensureExternalProfile(login);
    }
  }

}

function formatSavedTime(seconds: number) {
  const totalSeconds = Math.max(1, Math.round(seconds));

  if (totalSeconds < 60) {
    return `${totalSeconds} segundo${totalSeconds === 1 ? '' : 's'}`;
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} minuto${totalMinutes === 1 ? '' : 's'}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hora${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hora${hours === 1 ? '' : 's'} e ${minutes} minuto${minutes === 1 ? '' : 's'}`;
}
