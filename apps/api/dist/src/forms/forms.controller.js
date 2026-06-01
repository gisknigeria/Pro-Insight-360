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
exports.FormsController = void 0;
const common_1 = require("@nestjs/common");
const forms_service_1 = require("./forms.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
class AssignRespondentsDto {
    respondentIds;
}
class ReopenFormDto {
    deadline;
}
let FormsController = class FormsController {
    formsService;
    constructor(formsService) {
        this.formsService = formsService;
    }
    create(dto, user) {
        return this.formsService.create(dto, user.id);
    }
    findOne(id) {
        return this.formsService.findOne(id);
    }
    getDefinition(id) {
        return this.formsService.getDefinition(id);
    }
    getPrettyJson(id) {
        return this.formsService.getPrettyJson(id);
    }
    update(id, dto, user) {
        return this.formsService.update(id, dto, user.id);
    }
    publish(id, user) {
        return this.formsService.publish(id, user.id);
    }
    close(id, user) {
        return this.formsService.close(id, user.id);
    }
    reopen(id, dto, user) {
        return this.formsService.reopen(id, dto.deadline, user.id);
    }
    assignRespondents(id, dto, user) {
        return this.formsService.assignRespondents(id, dto.respondentIds, user.id);
    }
    getCompletionStatus(id) {
        return this.formsService.getCompletionStatus(id);
    }
    checkQuestionDeletion(formId, questionId) {
        return this.formsService.checkQuestionDeletion(formId, questionId);
    }
};
exports.FormsController = FormsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forms_service_1.CreateFormDto, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/definition'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.HOD, client_1.UserRole.RESPONDENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "getDefinition", null);
__decorate([
    (0, common_1.Get)(':id/pretty'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "getPrettyJson", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, forms_service_1.UpdateFormDto, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "publish", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "close", null);
__decorate([
    (0, common_1.Patch)(':id/reopen'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReopenFormDto, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "reopen", null);
__decorate([
    (0, common_1.Post)(':id/respondents'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignRespondentsDto, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "assignRespondents", null);
__decorate([
    (0, common_1.Get)(':id/completion'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "getCompletionStatus", null);
__decorate([
    (0, common_1.Get)(':id/check-deletion/:questionId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('questionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "checkQuestionDeletion", null);
exports.FormsController = FormsController = __decorate([
    (0, common_1.Controller)('forms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [forms_service_1.FormsService])
], FormsController);
//# sourceMappingURL=forms.controller.js.map