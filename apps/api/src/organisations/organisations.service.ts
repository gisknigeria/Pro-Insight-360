import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganisationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: { name: string; sector?: string }) {
    return this.prisma.organisation.create({
      data: { name: dto.name, sector: dto.sector },
    });
  }

  async findAll() {
    return this.prisma.organisation.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organisation.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organisation not found.');
    return org;
  }

  async update(id: string, dto: { name?: string; sector?: string }) {
    await this.findOne(id);
    return this.prisma.organisation.update({ where: { id }, data: dto });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.organisation.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }
}
