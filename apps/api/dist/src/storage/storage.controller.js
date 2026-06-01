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
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const storage_service_1 = require("./storage.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let StorageController = class StorageController {
    storageService;
    constructor(storageService) {
        this.storageService = storageService;
    }
    requestUploadUrl(dto, user) {
        return this.storageService.createUploadUrl(dto, user.id);
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('upload-url'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOD, client_1.UserRole.RESPONDENT, client_1.UserRole.CLIENT_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [storage_service_1.RequestUploadUrlDto, Object]),
    __metadata("design:returntype", void 0)
], StorageController.prototype, "requestUploadUrl", null);
exports.StorageController = StorageController = __decorate([
    (0, common_1.Controller)('storage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageController);
//# sourceMappingURL=storage.controller.js.map