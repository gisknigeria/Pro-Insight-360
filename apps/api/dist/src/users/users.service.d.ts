import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private prisma;
    private email;
    private redis;
    private audit;
    private config;
    constructor(prisma: PrismaService, email: EmailService, redis: RedisService, audit: AuditService, config: ConfigService);
    createUser(dto: {
        email: string;
        role: UserRole;
        organisationId?: string;
    }): Promise<{
        id: string;
        email: string;
        organisationId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        setupToken: string | null;
        setupTokenExpiresAt: Date | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    regenerateSetupToken(userId: string): Promise<{
        id: string;
        email: string;
        setupToken: string | null;
        setupTokenExpiresAt: Date | null;
    }>;
    deactivateUser(userId: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    reactivateUser(userId: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    updateRole(userId: string, role: UserRole): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        organisationId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        mfaEnabled: boolean;
        isActive: boolean;
        createdAt: Date;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        organisationId: string | null;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        failedLoginCount: number;
        lockedUntil: Date | null;
        setupToken: string | null;
        setupTokenExpiresAt: Date | null;
        isActive: boolean;
        createdAt: Date;
    } | null>;
}
