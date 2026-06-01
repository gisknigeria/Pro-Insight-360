"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const redis_service_1 = require("../redis/redis.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const SETUP_TOKEN_EXPIRY_HOURS = 48;
let UsersService = class UsersService {
    prisma;
    email;
    redis;
    audit;
    config;
    constructor(prisma, email, redis, audit, config) {
        this.prisma = prisma;
        this.email = email;
        this.redis = redis;
        this.audit = audit;
        this.config = config;
    }
    async createUser(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException(`A user with email ${dto.email} already exists.`);
        }
        const setupToken = crypto.randomBytes(32).toString('hex');
        const setupTokenExpiresAt = new Date(Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                role: dto.role,
                organisationId: dto.organisationId ?? null,
                passwordHash: tempHash,
                setupToken,
                setupTokenExpiresAt,
            },
            select: {
                id: true,
                email: true,
                role: true,
                organisationId: true,
                isActive: true,
                createdAt: true,
                setupToken: true,
                setupTokenExpiresAt: true,
            },
        });
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        await this.email.sendInvitation(dto.email, setupToken, frontendUrl);
        await this.audit.log({
            action: 'USER_CREATED',
            resourceType: 'User',
            resourceId: user.id,
            metadata: { email: dto.email, role: dto.role },
        });
        return user;
    }
    async regenerateSetupToken(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        const setupToken = crypto.randomBytes(32).toString('hex');
        const setupTokenExpiresAt = new Date(Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { setupToken, setupTokenExpiresAt },
            select: {
                id: true,
                email: true,
                setupToken: true,
                setupTokenExpiresAt: true,
            },
        });
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
        await this.email.sendInvitation(user.email, setupToken, frontendUrl);
        return updated;
    }
    async deactivateUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        await this.redis.invalidateUserSessions(userId);
        await this.audit.log({
            action: 'USER_DEACTIVATED',
            resourceType: 'User',
            resourceId: userId,
        });
        return { id: userId, email: user.email, isActive: false };
    }
    async reactivateUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        await this.audit.log({
            action: 'USER_REACTIVATED',
            resourceType: 'User',
            resourceId: userId,
        });
        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
            select: { id: true, email: true, isActive: true },
        });
    }
    async updateRole(userId, role) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        await this.audit.log({
            action: 'USER_ROLE_CHANGED',
            resourceType: 'User',
            resourceId: userId,
            metadata: { oldRole: user.role, newRole: role },
        });
        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, email: true, role: true },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                organisationId: true,
                isActive: true,
                mfaEnabled: true,
                createdAt: true,
            },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        redis_service_1.RedisService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map