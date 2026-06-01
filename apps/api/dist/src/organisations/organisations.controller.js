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
exports.OrganisationsController = void 0;
const common_1 = require("@nestjs/common");
const organisations_service_1 = require("./organisations.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
class CreateOrgDto {
    name;
    sector;
}
class UpdateOrgDto {
    name;
    sector;
}
let OrganisationsController = class OrganisationsController {
    orgsService;
    constructor(orgsService) {
        this.orgsService = orgsService;
    }
    create(dto) {
        return this.orgsService.create(dto);
    }
    findAll() {
        return this.orgsService.findAll();
    }
    findOne(id) {
        return this.orgsService.findOne(id);
    }
    update(id, dto) {
        return this.orgsService.update(id, dto);
    }
    archive(id) {
        return this.orgsService.archive(id);
    }
};
exports.OrganisationsController = OrganisationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrgDto]),
    __metadata("design:returntype", void 0)
], OrganisationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganisationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT, client_1.UserRole.CLIENT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganisationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CONSULTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrgDto]),
    __metadata("design:returntype", void 0)
], OrganisationsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganisationsController.prototype, "archive", null);
exports.OrganisationsController = OrganisationsController = __decorate([
    (0, common_1.Controller)('organisations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [organisations_service_1.OrganisationsService])
], OrganisationsController);
//# sourceMappingURL=organisations.controller.js.map