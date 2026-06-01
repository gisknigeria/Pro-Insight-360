import { StorageService, RequestUploadUrlDto } from './storage.service';
export declare class StorageController {
    private storageService;
    constructor(storageService: StorageService);
    requestUploadUrl(dto: RequestUploadUrlDto, user: {
        id: string;
    }): Promise<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
        expiresIn: number;
    }>;
}
