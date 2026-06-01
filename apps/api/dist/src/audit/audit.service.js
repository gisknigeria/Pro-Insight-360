"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(entry) {
        await this.prisma.auditLog.create({
            data: {
                userId: entry.userId ?? null,
                action: entry.action,
                resourceType: entry.resourceType ?? null,
                resourceId: entry.resourceId ?? null,
                metadata: entry.metadata ? entry.metadata : undefined,
                ipAddress: entry.ipAddress ?? null,
            },
        });
    }
    async exportCsv(startDate, endDate) {
        const logs = await this.prisma.auditLog.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { email: true, role: true } } },
        });
        const header = 'id,userId,userEmail,action,resourceType,resourceId,ipAddress,createdAt\n';
        const rows = logs
            .map((log) => [
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
            .join(','))
            .join('\n');
        return header + rows;
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map