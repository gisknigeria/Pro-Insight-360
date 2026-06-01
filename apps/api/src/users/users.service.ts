import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SETUP_TOKEN_EXPIRY_HOURS = 48;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private redis: RedisService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async createUser(dto: {
    email: string;
    role: UserRole;
    organisationId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        `A user with email ${dto.email} already exists.`,
      );
    }

    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenExpiresAt = new Date(
      Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    const tempHash = await bcrypt.hash(
      crypto.randomBytes(16).toString('hex'),
      12,
    );

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

    // Send invitation email with setup link (task 4.3)
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    await this.email.sendInvitation(dto.email, setupToken, frontendUrl);

    await this.audit.log({
      action: 'USER_CREATED',
      resourceType: 'User',
      resourceId: user.id,
      metadata: { email: dto.email, role: dto.role },
    });

    return user;
  }

  async regenerateSetupToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenExpiresAt = new Date(
      Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

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

    // Resend invitation email
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    await this.email.sendInvitation(user.email, setupToken, frontendUrl);

    return updated;
  }

  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Invalidate all active sessions immediately (task 4.4)
    await this.redis.invalidateUserSessions(userId);

    await this.audit.log({
      action: 'USER_DEACTIVATED',
      resourceType: 'User',
      resourceId: userId,
    });

    return { id: userId, email: user.email, isActive: false };
  }

  async reactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

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

  async updateRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

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

  async findById(id: string) {
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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
