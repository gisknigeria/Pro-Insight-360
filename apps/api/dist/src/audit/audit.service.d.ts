import { PrismaService } from '../prisma/prisma.service';
interface AuditLogEntry {
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(entry: AuditLogEntry): Promise<void>;
    exportCsv(startDate: Date, endDate: Date): Promise<string>;
}
export {};
