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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsController = void 0;
const common_1 = require("@nestjs/common");
const evaluations_service_1 = require("./evaluations.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
class AssignConsultantsDto {
    consultantIds;
}
let EvaluationsController = class EvaluationsController {
    evaluationsService;
    constructor(evaluationsService) {
        this.evaluationsService = evaluationsService;
    }
    create(dto, user) {
        return this.evaluationsService.create(dto, user.id);
    }
    findAll(user) {
        return this.evaluationsService.findAll(user.id, user.role);
    }
    findOne(id) {
        return this.evaluationsService.findOne(id);
    }
    activate(id, user) {
        return this.evaluationsService.activate(id, user.id);
    }
    archive(id, user) {
        return this.evaluationsService.archive(id, user.id);
    }
    assignConsultants(id, dto, user) {
        return this.evaluationsService.assignConsultants(id, dto.consultantIds, user.id);
    }
};
exports.EvaluationsController = EvaluationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluations_service_1.CreateEvaluationDto, Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)(':id/consultants'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignConsultantsDto, Object]),
    __metadata("design:returntype", void 0)
], EvaluationsController.prototype, "assignConsultants", null);
exports.EvaluationsController = EvaluationsController = __decorate([
    (0, common_1.Controller)('evaluations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [evaluations_service_1.EvaluationsService])
], EvaluationsController);
//# sourceMappingURL=evaluations.controller.js.map