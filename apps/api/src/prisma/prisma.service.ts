import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');

  // Always use the standard Prisma client for Supabase/Postgres.
  return new PrismaClient();
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client!: PrismaClient;
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.client = await createPrismaClient();
    await this.client.$connect();
    this.logger.log('Database connected');

    // Proxy all PrismaClient properties to this instance
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) return (target as any)[prop];
        const val = (target.client as any)[prop];
        return typeof val === 'function' ? val.bind(target.client) : val;
      },
    });
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }

  // Expose all Prisma model accessors
  get user() { return this.client.user; }
  get organisation() { return this.client.organisation; }
  get evaluation() { return this.client.evaluation; }
  get evaluationConsultant() { return this.client.evaluationConsultant; }
  get template() { return this.client.template; }
  get templateVersion() { return this.client.templateVersion; }
  get form() { return this.client.form; }
  get question() { return this.client.question; }
  get conditionalLogic() { return this.client.conditionalLogic; }
  get formAssignment() { return this.client.formAssignment; }
  get response() { return this.client.response; }
  get answer() { return this.client.answer; }
  get conflict() { return this.client.conflict; }
  get scoreResult() { return this.client.scoreResult; }
  get diagnosis() { return this.client.diagnosis; }
  get diagnosisVersion() { return this.client.diagnosisVersion; }
  get recommendation() { return this.client.recommendation; }
  get report() { return this.client.report; }
  get sharedLink() { return this.client.sharedLink; }
  get organogram() { return this.client.organogram; }
  get workflowMap() { return this.client.workflowMap; }
  get document() { return this.client.document; }
  get auditLog() { return this.client.auditLog; }
  get scoringWeight() { return this.client.scoringWeight; }

  $connect() { return this.client.$connect(); }
  $disconnect() { return this.client.$disconnect(); }
  $transaction(...args: any[]) { return (this.client.$transaction as any)(...args); }
  $queryRaw(...args: any[]) { return (this.client.$queryRaw as any)(...args); }
  $executeRaw(...args: any[]) { return (this.client.$executeRaw as any)(...args); }
}
