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
exports.OrganisationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganisationsService = class OrganisationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
    async findOne(id) {
        const org = await this.prisma.organisation.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('Organisation not found.');
        return org;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.organisation.update({ where: { id }, data: dto });
    }
    async archive(id) {
        await this.findOne(id);
        return this.prisma.organisation.update({
            where: { id },
            data: { archivedAt: new Date() },
        });
    }
};
exports.OrganisationsService = OrganisationsService;
exports.OrganisationsService = OrganisationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganisationsService);
//# sourceMappingURL=organisations.service.js.map