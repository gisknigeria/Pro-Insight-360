import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { User } from '@prisma/client';

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
    private redisService: RedisService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Your account has been temporarily locked. Please try again after 15 minutes.',
      );
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
        // Notify super admins
        await this.notifySuperAdminsOfLock(user.email);
        throw new ForbiddenException(
          'Your account has been temporarily locked. Please try again after 15 minutes.',
        );
      }
      return null;
    }

    // Reset failed count on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(
    user: Omit<User, 'passwordHash'>,
    ipAddress?: string,
  ): Promise<{ accessToken: string; requiresMfa: boolean }> {
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

  async setupAccount(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        setupToken: token,
        setupTokenExpiresAt: { gt: new Date() },
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'This setup link has expired or is invalid. Please contact your administrator to request a new one.',
      );
    }

    this.validatePasswordComplexity(password);

    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, setupToken: null, setupTokenExpiresAt: null },
    });

    return { message: 'Account set up successfully. You can now log in.' };
  }

  async enableMfa(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const secret = speakeasy.generateSecret({
      name: `Pro-Insight 360 (${user.email})`,
      length: 20,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32, mfaEnabled: false }, // enabled after first verify
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCodeUrl };
  }

  async verifyMfa(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.mfaSecret) return false;

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

  validatePasswordComplexity(password: string): void {
    const minLength = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!minLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new BadRequestException(
        'Password must be at least 12 characters and include an uppercase letter, lowercase letter, number, and special character.',
      );
    }
  }

  private async notifySuperAdminsOfLock(lockedEmail: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { email: true },
    });
    for (const admin of admins) {
      await this.emailService
        .sendAccountLockNotification(admin.email, lockedEmail)
        .catch(() => {}); // don't block login flow on email failure
    }
  }
}
