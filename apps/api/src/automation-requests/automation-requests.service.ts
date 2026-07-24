import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AutomationRequestCadence,
  AutomationRequestStatus,
  AutomationRequestUrgency,
  type User,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { isAdmin } from '../shared/access';

type AutomationRequestCreateInput = {
  title?: unknown;
  systemName?: unknown;
  portalUrl?: unknown;
  description?: unknown;
  urgency?: unknown;
  cadence?: unknown;
  requiresLogin?: unknown;
  requiresCertificate?: unknown;
  requiresCaptcha?: unknown;
  kindLabel?: unknown;
  pageLabel?: unknown;
};

type AutomationRequestUpdateInput = {
  status?: unknown;
  adminNotes?: unknown;
};

const automationRequestSelect = {
  id: true,
  requesterUserId: true,
  requesterName: true,
  requesterEmail: true,
  title: true,
  systemName: true,
  portalUrl: true,
  description: true,
  urgency: true,
  cadence: true,
  requiresLogin: true,
  requiresCertificate: true,
  requiresCaptcha: true,
  status: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AutomationRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listForUser(user: Pick<User, 'id' | 'role' | 'departments'>) {
    return this.prisma.automationRequest.findMany({
      where: isAdmin(user) ? undefined : { requesterUserId: user.id },
      orderBy: { createdAt: 'desc' },
      select: automationRequestSelect,
    });
  }

  async create(user: Pick<User, 'id' | 'name' | 'email'>, input: AutomationRequestCreateInput) {
    const description = cleanText(input.description);
    if (!description) {
      throw new BadRequestException('Descreva o que precisa ser automatizado.');
    }

    const title = cleanText(input.title) || cleanText(input.systemName) || 'Pedido de automação';
    const kindLabel = cleanText(input.kindLabel) || 'automação';
    const pageLabel = cleanText(input.pageLabel) || 'Solicitar automação';

    const request = await this.prisma.automationRequest.create({
      data: {
        requesterUserId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        title,
        systemName: cleanTextOrNull(input.systemName),
        portalUrl: cleanTextOrNull(input.portalUrl),
        description,
        urgency: parseUrgency(input.urgency),
        cadence: parseCadence(input.cadence),
        requiresLogin: input.requiresLogin === true || input.requiresLogin === 'true',
        requiresCertificate: input.requiresCertificate === true || input.requiresCertificate === 'true',
        requiresCaptcha: input.requiresCaptcha === true || input.requiresCaptcha === 'true',
      },
      select: automationRequestSelect,
    });

    try {
      await this.notificationsService.createForAutomationRequest({
        requesterUserId: request.requesterUserId,
        requesterName: request.requesterName,
        title: request.title,
        systemName: request.systemName,
        kindLabel,
        pageLabel,
      });
    } catch {
      // O pedido já foi salvo; a notificação interna não pode bloquear o fluxo.
    }

    return request;
  }

  async update(id: string, user: Pick<User, 'id' | 'role' | 'departments'>, input: AutomationRequestUpdateInput) {
    if (!isAdmin(user)) {
      throw new ForbiddenException();
    }

    const existing = await this.prisma.automationRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    const updated = await this.prisma.automationRequest.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: parseStatus(input.status) } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: cleanTextOrNull(input.adminNotes) } : {}),
      },
      select: automationRequestSelect,
    });

    if (input.status !== undefined && updated.status !== existing.status) {
      try {
        await this.notificationsService.createForAutomationRequestStatusChange({
          requesterUserId: updated.requesterUserId,
          requesterName: updated.requesterName,
          title: updated.title,
          status: updated.status,
        });
      } catch {
        // A atualização do pedido não deve falhar se a notificação não puder ser criada.
      }
    }

    return updated;
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanTextOrNull(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function parseUrgency(value: unknown) {
  if (typeof value === 'string' && Object.values(AutomationRequestUrgency).includes(value as AutomationRequestUrgency)) {
    return value as AutomationRequestUrgency;
  }
  return AutomationRequestUrgency.normal;
}

function parseCadence(value: unknown) {
  if (typeof value === 'string' && Object.values(AutomationRequestCadence).includes(value as AutomationRequestCadence)) {
    return value as AutomationRequestCadence;
  }
  return AutomationRequestCadence.once;
}

function parseStatus(value: unknown) {
  if (typeof value === 'string' && Object.values(AutomationRequestStatus).includes(value as AutomationRequestStatus)) {
    return value as AutomationRequestStatus;
  }
  throw new BadRequestException('Status inválido.');
}
