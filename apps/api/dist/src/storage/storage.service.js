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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = exports.RequestUploadUrlDto = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const ALLOWED_MIME_TYPES = {
    file_upload: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
    ],
    photo_upload: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    video_upload: ['video/mp4', 'video/webm', 'video/quicktime'],
};
const MAX_FILE_BYTES = 50 * 1024 * 1024;
class RequestUploadUrlDto {
    formId;
    questionId;
    filename;
    contentType;
    uploadType;
    fileSize;
}
exports.RequestUploadUrlDto = RequestUploadUrlDto;
let StorageService = StorageService_1 = class StorageService {
    config;
    logger = new common_1.Logger(StorageService_1.name);
    s3;
    bucket;
    publicBaseUrl;
    constructor(config) {
        this.config = config;
        const keyId = config.get('B2_KEY_ID');
        const appKey = config.get('B2_APPLICATION_KEY');
        const endpoint = config.get('B2_ENDPOINT');
        this.bucket = config.get('B2_BUCKET_NAME', 'pro-insight-360-files');
        if (keyId && appKey && endpoint) {
            this.s3 = new client_s3_1.S3Client({
                region: 'auto',
                endpoint,
                credentials: { accessKeyId: keyId, secretAccessKey: appKey },
                forcePathStyle: true,
            });
            this.publicBaseUrl = `${endpoint.replace(/\/$/, '')}/${this.bucket}`;
        }
        else {
            this.s3 = null;
            this.publicBaseUrl = '';
            this.logger.warn('Object storage not configured (B2_KEY_ID / B2_APPLICATION_KEY). File uploads disabled.');
        }
    }
    async createUploadUrl(dto, userId) {
        if (!this.s3) {
            throw new common_1.ServiceUnavailableException('File uploads are not available right now. Please contact your consultant.');
        }
        const allowed = ALLOWED_MIME_TYPES[dto.uploadType];
        if (!allowed?.includes(dto.contentType)) {
            throw new common_1.BadRequestException(`This file type is not allowed. Allowed types: ${allowed?.join(', ') ?? 'none'}.`);
        }
        if (dto.fileSize > MAX_FILE_BYTES) {
            throw new common_1.BadRequestException('This file is too large. Maximum size is 50 MB.');
        }
        const safeName = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
        const key = `uploads/${dto.formId}/${dto.questionId}/${userId}/${(0, uuid_1.v4)()}-${safeName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: dto.contentType,
            ContentLength: dto.fileSize,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn: 900 });
        return {
            uploadUrl,
            key,
            publicUrl: `${this.publicBaseUrl}/${key}`,
            expiresIn: 900,
        };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map