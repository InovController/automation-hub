import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isAdmin, isManager } from '../shared/access';

type MinimalUser = { role: string; departments: string[] };

@Injectable()
export class SharedCredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: MinimalUser) {
    const all = await this.prisma.sharedCredential.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    if (isAdmin(user as any)) return all;
    return all.filter((c) => {
      if (c.minRole === 'manager' && !isManager(user as any)) return false;
      if (c.allowedDepartments.length === 0) return true;
      return c.allowedDepartments.some((d) => user.departments.includes(d));
    });
  }

  create(data: {
    name: string;
    url?: string;
    login: string;
    password: string;
    notes?: string;
    allowedDepartments?: string[];
    minRole?: string;
    order?: number;
  }) {
    return this.prisma.sharedCredential.create({ data: data as any });
  }

  update(
    id: string,
    data: {
      name?: string;
      url?: string | null;
      login?: string;
      password?: string;
      notes?: string | null;
      allowedDepartments?: string[];
      minRole?: string;
      order?: number;
    },
  ) {
    return this.prisma.sharedCredential.update({ where: { id }, data: data as any });
  }

  delete(id: string) {
    return this.prisma.sharedCredential.delete({ where: { id } });
  }
}
