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
exports.TemplatesController = void 0;
const common_1 = require("@nestjs/common");
const templates_service_1 = require("./templates.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
class InstantiateTemplateDto {
    evaluationId;
    title;
}
let TemplatesController = class TemplatesController {
    templatesService;
    constructor(templatesService) {
        this.templatesService = templatesService;
    }
    create(dto, user) {
        return this.templatesService.create(dto, user.id);
    }
    findAll(sector, evaluationType, keyword) {
        return this.templatesService.findAll({ sector, evaluationType, keyword });
    }
    findOne(id) {
        return this.templatesService.findOne(id);
    }
    update(id, dto, user) {
        return this.templatesService.update(id, dto, user.id);
    }
    publish(id, user) {
        return this.templatesService.publish(id, user.id);
    }
    delete(id, user) {
        return this.templatesService.delete(id, user.id);
    }
    instantiate(id, dto, user) {
        return this.templatesService.instantiateAsForm(id, dto.evaluationId, dto.title, user.id);
    }
    getVersionHistory(id) {
        return this.templatesService.getVersionHistory(id);
    }
};
exports.TemplatesController = TemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [templates_service_1.CreateTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Query)('sector')),
    __param(1, (0, common_1.Query)('evaluationType')),
    __param(2, (0, common_1.Query)('keyword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, templates_service_1.UpdateTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "publish", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/instantiate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, InstantiateTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "instantiate", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "getVersionHistory", null);
exports.TemplatesController = TemplatesController = __decorate([
    (0, common_1.Controller)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [templates_service_1.TemplatesService])
], TemplatesController);
//# sourceMappingURL=templates.controller.js.map