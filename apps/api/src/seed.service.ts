import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { COMPANY_DEPARTMENTS } from './shared/access';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedRobots();
    await this.ensureAdminBootstrap();
  }

  private async seedRobots() {
    const total = await this.prisma.robot.count();
    if (total > 0) {
      return;
    }

    await this.prisma.robot.createMany({
      data: [
        {
          slug: 'financial-reconciliation',
          name: 'Monthly Financial Reconciliation',
          summary: 'Concilia relatórios SAP e Excel e gera pacote para auditoria.',
          description:
            'Automatiza a conciliação mensal de relatórios financeiros, valida divergências e publica um pacote final com os artefatos gerados.',
          category: 'Finance',
          icon: 'bank',
          version: '2.4.0',
          estimatedMinutes: 12,
          allowedDepartments: ['fiscal', 'contabil', 'auditoria'],
          documentationLabel: 'Documentation',
          documentationUrl: '#',
          supportLabel: 'Support',
          supportValue: 'rpa-center@company.com',
          dataPolicy: 'Dados financeiros trafegam e ficam armazenados em ambiente interno monitorado.',
          schema: {
            fields: [
              { name: 'environment', label: 'Execution Environment', type: 'select', required: true, options: ['Production (East-US)', 'Staging (Brazil)', 'Sandbox'] },
              { name: 'priority', label: 'Process Priority', type: 'radio', options: ['Standard', 'High', 'Critical'], defaultValue: 'Standard' },
              { name: 'startDate', label: 'Start Period Date', type: 'date', required: true },
              { name: 'endDate', label: 'End Period Date', type: 'date', required: true },
              { name: 'profitCenter', label: 'SAP Profit Center Code', type: 'text', placeholder: 'e.g. PC-2023-AMER' },
              { name: 'recipients', label: 'Notification Recipients', type: 'text', placeholder: 'finance-alerts@company.com' },
              { name: 'notes', label: 'Execution Notes', type: 'textarea', placeholder: 'Add any specific instructions for this run...' },
            ],
            fileInputs: [
              { name: 'baseFiles', label: 'Source Files', accept: '.xlsx,.csv,.zip', multiple: true, required: true, helperText: 'Envie os arquivos base para a conciliação.' },
            ],
          },
        },
        {
          slug: 'invoice-processor',
          name: 'Invoice Processor',
          summary: 'Extrai dados de PDFs/XMLs e devolve planilha consolidada.',
          description:
            'Recebe um lote de notas fiscais, identifica os metadados principais e devolve os arquivos processados em uma saída consolidada.',
          category: 'Finance',
          icon: 'receipt',
          version: '1.8.2',
          estimatedMinutes: 7,
          allowedDepartments: ['fiscal', 'contabil'],
          documentationLabel: 'SOP',
          documentationUrl: '#',
          supportLabel: 'Business Owner',
          supportValue: 'fiscal-team@company.com',
          dataPolicy: 'Arquivos de saída são removidos automaticamente do servidor após o prazo definido.',
          schema: {
            fields: [
              { name: 'batchName', label: 'Batch Name', type: 'text', required: true, placeholder: 'Invoices - March' },
              { name: 'region', label: 'Region', type: 'select', options: ['Brazil', 'LATAM', 'North America'], required: true },
              { name: 'ocrMode', label: 'OCR Mode', type: 'radio', options: ['Fast', 'Balanced', 'High Accuracy'], defaultValue: 'Balanced' },
            ],
            fileInputs: [
              { name: 'invoiceFiles', label: 'Invoices', accept: '.pdf,.xml,.zip', multiple: true, required: true, helperText: 'Envie um ou vários arquivos.' },
            ],
          },
        },
        {
          slug: 'sales-sync',
          name: 'Sales Sync',
          summary: 'Atualiza metas e indicadores para os gestores regionais.',
          description:
            'Executa sincronização entre fontes internas e prepara uma saída resumida para o time comercial.',
          category: 'Operations',
          icon: 'chart',
          version: '3.1.0',
          estimatedMinutes: 5,
          allowedDepartments: ['pessoal', 'tecnologia', 'inovacao', 'rh'],
          documentationLabel: 'Playbook',
          documentationUrl: '#',
          supportLabel: 'Ops Support',
          supportValue: 'ops.support@company.com',
          dataPolicy: 'Sem necessidade de upload inicial. Saídas são geradas conforme parâmetros informados.',
          schema: {
            fields: [
              { name: 'weekRef', label: 'Reference Week', type: 'text', required: true, placeholder: '2026-W12' },
              { name: 'channel', label: 'Sales Channel', type: 'select', options: ['All', 'Retail', 'Inside Sales', 'Partners'], required: true },
              { name: 'notify', label: 'Notify team after finish', type: 'checkbox' },
            ],
            fileInputs: [],
          },
        },
      ],
    });

    this.logger.log('Seeded initial robots catalog.');
  }

  private async ensureAdminBootstrap() {
    const adminCount = await this.prisma.user.count({
      where: { role: UserRole.admin },
    });

    if (adminCount > 0) {
      return;
    }

    const firstUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!firstUser) {
      return;
    }

    await this.prisma.user.update({
      where: { id: firstUser.id },
      data: {
        role: UserRole.admin,
        departments:
          firstUser.departments.length > 0
            ? firstUser.departments
            : COMPANY_DEPARTMENTS,
      },
    });

    this.logger.warn(`Promoted ${firstUser.email} to admin to bootstrap access control.`);
  }
}
