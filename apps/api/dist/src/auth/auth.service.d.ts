import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { User } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    private config;
    private auditService;
    private emailService;
    private redisService;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService, auditService: AuditService, emailService: EmailService, redisService: RedisService);
    validateUser(email: string, password: string): Promise<Omit<User, 'passwordHash'> | null>;
    login(user: Omit<User, 'passwordHash'>, ipAddress?: string): Promise<{
        accessToken: string;
        requiresMfa: boolean;
    }>;
    setupAccount(token: string, password: string): Promise<{
        message: string;
    }>;
    enableMfa(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    verifyMfa(userId: string, code: string): Promise<boolean>;
    validatePasswordComplexity(password: string): void;
    private notifySuperAdminsOfLock;
}
