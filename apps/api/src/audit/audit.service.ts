import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Append-only audit log — never updates or deletes existing entries.
   * Validates: Property 37 (audit log append-only invariant)
   */
  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        resourceType: entry.resourceType ?? null,
        resourceId: entry.resourceId ?? null,
        metadata: entry.metadata ? (entry.metadata as object) : undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }

  async exportCsv(
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { email: true, role: true } } },
    });

    const header = 'id,userId,userEmail,action,resourceType,resourceId,ipAddress,createdAt\n';
    const rows = logs
      .map((log) =>
        [
          log.id,
          log.userId ?? '',
          log.user?.email ?? '',
          log.action,
          log.resourceType ?? '',
          log.resourceId ?? '',
          log.ipAddress ?? '',
          log.createdAt.toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    return header + rows;
  }
}
