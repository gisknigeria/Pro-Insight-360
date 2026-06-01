import { AuthService } from './auth.service';
declare class SetupAccountDto {
    token: string;
    password: string;
}
declare class MfaVerifyDto {
    code: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        accessToken: string;
        requiresMfa: boolean;
    }>;
    setupAccount(dto: SetupAccountDto): Promise<{
        message: string;
    }>;
    enableMfa(user: any): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    verifyMfa(user: any, dto: MfaVerifyDto): Promise<{
        verified: boolean;
        message: string;
    }>;
}
export {};
