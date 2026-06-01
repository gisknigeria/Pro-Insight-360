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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const redis_service_1 = require("../redis/redis.service");
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MINUTES = 15;
let AuthService = class AuthService {
    prisma;
    jwtService;
    config;
    auditService;
    emailService;
    redisService;
    constructor(prisma, jwtService, config, auditService, emailService, redisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.auditService = auditService;
        this.emailService = emailService;
        this.redisService = redisService;
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive)
            return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.ForbiddenException('Your account has been temporarily locked. Please try again after 15 minutes.');
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            const newCount = user.failedLoginCount + 1;
            const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: newCount,
                    lockedUntil: shouldLock
                        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
                        : undefined,
                },
            });
            if (shouldLock) {
                await this.notifySuperAdminsOfLock(user.email);
                throw new common_1.ForbiddenException('Your account has been temporarily locked. Please try again after 15 minutes.');
            }
            return null;
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null },
        });
        const { passwordHash: _, ...result } = user;
        return result;
    }
    async login(user, ipAddress) {
        await this.auditService.log({
            userId: user.id,
            action: 'LOGIN',
            resourceType: 'User',
            resourceId: user.id,
            ipAddress,
        });
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            requiresMfa: user.mfaEnabled,
        };
    }
    async setupAccount(token, password) {
        const user = await this.prisma.user.findFirst({
            where: {
                setupToken: token,
                setupTokenExpiresAt: { gt: new Date() },
                isActive: true,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('This setup link has expired or is invalid. Please contact your administrator to request a new one.');
        }
        this.validatePasswordComplexity(password);
        const passwordHash = await bcrypt.hash(password, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash, setupToken: null, setupTokenExpiresAt: null },
        });
        return { message: 'Account set up successfully. You can now log in.' };
    }
    async enableMfa(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const secret = speakeasy.generateSecret({
            name: `Pro-Insight 360 (${user.email})`,
            length: 20,
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret.base32, mfaEnabled: false },
        });
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        return { secret: secret.base32, qrCodeUrl };
    }
    async verifyMfa(userId, code) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        if (!user.mfaSecret)
            return false;
        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (isValid && !user.mfaEnabled) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { mfaEnabled: true },
            });
        }
        return isValid;
    }
    validatePasswordComplexity(password) {
        const minLength = password.length >= 12;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        if (!minLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new common_1.BadRequestException('Password must be at least 12 characters and include an uppercase letter, lowercase letter, number, and special character.');
        }
    }
    async notifySuperAdminsOfLock(lockedEmail) {
        const admins = await this.prisma.user.findMany({
            where: { role: 'SUPER_ADMIN', isActive: true },
            select: { email: true },
        });
        for (const admin of admins) {
            await this.emailService
                .sendAccountLockNotification(admin.email, lockedEmail)
                .catch(() => { });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        email_service_1.EmailService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map