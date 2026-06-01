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
exports.ResponsesController = void 0;
const common_1 = require("@nestjs/common");
const responses_service_1 = require("./responses.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let ResponsesController = class ResponsesController {
    responsesService;
    constructor(responsesService) {
        this.responsesService = responsesService;
    }
    saveDraft(dto, user) {
        return this.responsesService.saveDraft(dto, user.id);
    }
    getDraft(formId, user) {
        return this.responsesService.getDraft(formId, user.id);
    }
    getAssignedForms(user) {
        return this.responsesService.getMyAssignedForms(user.id);
    }
    submit(dto, user) {
        return this.responsesService.submit(dto, user.id);
    }
    sync(dto, user) {
        return this.responsesService.syncOfflineResponse(dto, user.id);
    }
    getFormResponses(formId) {
        return this.responsesService.getFormResponses(formId);
    }
    getMyResponses(user) {
        return this.responsesService.getMyResponses(user.id);
    }
};
exports.ResponsesController = ResponsesController;
__decorate([
    (0, common_1.Post)('draft'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [responses_service_1.SaveDraftDto, Object]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Get)('draft/:formId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, common_1.Param)('formId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "getDraft", null);
__decorate([
    (0, common_1.Get)('assigned'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "getAssignedForms", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [responses_service_1.SubmitResponseDto, Object]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [responses_service_1.SyncResponseDto, Object]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "sync", null);
__decorate([
    (0, common_1.Get)('form/:formId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, common_1.Param)('formId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "getFormResponses", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResponsesController.prototype, "getMyResponses", null);
exports.ResponsesController = ResponsesController = __decorate([
    (0, common_1.Controller)('responses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [responses_service_1.ResponsesService])
], ResponsesController);
//# sourceMappingURL=responses.controller.js.map