"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const env_validation_1 = require("./config/env.validation");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const email_module_1 = require("./email/email.module");
const audit_module_1 = require("./audit/audit.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const organisations_module_1 = require("./organisations/organisations.module");
const evaluations_module_1 = require("./evaluations/evaluations.module");
const forms_module_1 = require("./forms/forms.module");
const templates_module_1 = require("./templates/templates.module");
const responses_module_1 = require("./responses/responses.module");
const storage_module_1 = require("./storage/storage.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, validate: env_validation_1.validateEnv }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            email_module_1.EmailModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            organisations_module_1.OrganisationsModule,
            evaluations_module_1.EvaluationsModule,
            forms_module_1.FormsModule,
            templates_module_1.TemplatesModule,
            responses_module_1.ResponsesModule,
            storage_module_1.StorageModule,
        ],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map