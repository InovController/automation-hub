import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export type PowerBIRefreshStatus = 'Unknown' | 'InProgress' | 'Completed' | 'Failed';

@Injectable()
export class PowerBIService {
  private readonly logger = new Logger(PowerBIService.name);

  private get tenantId() {
    return process.env.POWERBI_TENANT_ID ?? '';
  }

  private get clientId() {
    return process.env.POWERBI_CLIENT_ID ?? '';
  }

  private get clientSecret() {
    return process.env.POWERBI_CLIENT_SECRET ?? '';
  }

  isConfigured(): boolean {
    return Boolean(this.tenantId && this.clientId && this.clientSecret);
  }

  private async getToken(): Promise<string> {
    const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://analysis.windows.net/powerbi/api/.default',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error('Falha ao obter token do Microsoft Entra ID', text);
      throw new ServiceUnavailableException('Não foi possível autenticar com o Power BI. Verifique as credenciais configuradas.');
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new ServiceUnavailableException('Token do Microsoft Entra ID inválido.');
    }

    return data.access_token;
  }

  async requestRefresh(groupId: string, datasetId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestException('As variáveis POWERBI_TENANT_ID, POWERBI_CLIENT_ID e POWERBI_CLIENT_SECRET não estão configuradas no servidor.');
    }

    const token = await this.getToken();
    const url = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/refreshes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (response.status === 202) {
      const location = response.headers.get('Location') ?? '';
      const requestId = location.split('/').pop() ?? '';
      if (!requestId) {
        this.logger.warn('Power BI não retornou requestId no header Location');
      }
      return requestId;
    }

    const text = await response.text();
    this.logger.error(`Refresh do dataset falhou (${response.status})`, text);

    if (response.status === 400) {
      throw new BadRequestException('Solicitação de refresh rejeitada pelo Power BI. Verifique os IDs do grupo e dataset.');
    }
    if (response.status === 429) {
      throw new BadRequestException('Limite de refreshes do Power BI atingido. Aguarde alguns minutos e tente novamente.');
    }

    throw new ServiceUnavailableException(`O Power BI retornou o status ${response.status}. Tente novamente em alguns instantes.`);
  }

  // Retorna null em erro de API; { status: null } quando não há histórico; { status, endTime } com status real.
  async getLatestRefreshInfo(groupId: string, datasetId: string): Promise<{ status: PowerBIRefreshStatus | null; endTime?: Date } | null> {
    if (!this.isConfigured()) return null;

    try {
      const token = await this.getToken();
      // Busca o refresh mais recente — o per-request endpoint só funciona com enhanced refresh.
      const url = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/refreshes?$top=1`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        this.logger.warn(`Power BI retornou ${response.status} para dataset ${datasetId} (grupo ${groupId}) — verifique se o serviço principal tem acesso ao workspace`);
        return null;
      }

      const data = (await response.json()) as { value?: Array<{ status?: string; endTime?: string }> };
      const latest = data.value?.[0];
      if (!latest) return null; // sem histórico de refresh — não mostrar badge

      const endTime = latest.endTime ? new Date(latest.endTime) : undefined;

      const rawStatus = latest.status;
      if (rawStatus === 'Completed') return { status: 'Completed', endTime };
      if (rawStatus === 'Failed' || rawStatus === 'Disabled' || rawStatus === 'Cancelled') return { status: 'Failed', endTime };
      if (rawStatus === 'InProgress') return { status: 'InProgress' };
      return { status: 'Unknown' };
    } catch (error) {
      this.logger.error(`Erro de rede ao consultar status do refresh Power BI para dataset ${datasetId}`, error);
      return null;
    }
  }

  // Alias para compatibilidade com chamadas que só precisam do status.
  async getRefreshStatus(groupId: string, datasetId: string): Promise<PowerBIRefreshStatus> {
    const result = await this.getLatestRefreshInfo(groupId, datasetId);
    return result?.status ?? 'Unknown';
  }
}
