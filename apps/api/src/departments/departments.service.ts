import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.departmentConfig.findMany({ orderBy: { order: 'asc' } });
  }

  async create(input: { name: string; slug?: string }) {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('Nome é obrigatório.');

    const slug = (input.slug?.trim() || slugify(name));
    if (!slug) throw new BadRequestException('Slug inválido.');

    const existing = await this.prisma.departmentConfig.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Já existe um departamento com o slug "${slug}".`);

    const last = await this.prisma.departmentConfig.findFirst({ orderBy: { order: 'desc' } });

    return this.prisma.departmentConfig.create({
      data: { name, slug, order: (last?.order ?? 0) + 1 },
    });
  }

  async update(id: string, input: { name?: string; isActive?: boolean; order?: number }) {
    const dept = await this.prisma.departmentConfig.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado.');

    return this.prisma.departmentConfig.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.order !== undefined && { order: input.order }),
      },
    });
  }

  async delete(id: string) {
    const dept = await this.prisma.departmentConfig.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado.');
    await this.prisma.departmentConfig.delete({ where: { id } });
  }
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
