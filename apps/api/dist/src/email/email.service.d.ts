import { ConfigService } from '@nestjs/config';
interface SendEmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}
export declare class EmailService {
    private config;
    private readonly logger;
    constructor(config: ConfigService);
    sendEmail(options: SendEmailOptions): Promise<void>;
    sendInvitation(email: string, setupToken: string, frontendUrl: string): Promise<void>;
    sendAccountLockNotification(adminEmail: string, lockedEmail: string): Promise<void>;
}
export {};
