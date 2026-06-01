import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { FormsModule } from './forms/forms.module';
import { TemplatesModule } from './templates/templates.module';
import { ResponsesModule } from './responses/responses.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuditModule,
    AuthModule,
    UsersModule,
    OrganisationsModule,
    EvaluationsModule,
    FormsModule,
    TemplatesModule,
    ResponsesModule,
    StorageModule,
    NotificationsModule,
    DiagnosisModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
