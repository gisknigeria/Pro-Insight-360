import { ConfigService } from '@nestjs/config';
export declare class RequestUploadUrlDto {
    formId: string;
    questionId: string;
    filename: string;
    contentType: string;
    uploadType: 'file_upload' | 'photo_upload' | 'video_upload';
    fileSize: number;
}
export declare class StorageService {
    private config;
    private readonly logger;
    private readonly s3;
    private readonly bucket;
    private readonly publicBaseUrl;
    constructor(config: ConfigService);
    createUploadUrl(dto: RequestUploadUrlDto, userId: string): Promise<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
        expiresIn: number;
    }>;
}
