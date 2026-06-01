import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<Omit<{
        id: string;
        email: string;
        organisationId: string | null;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        failedLoginCount: number;
        lockedUntil: Date | null;
        setupToken: string | null;
        setupTokenExpiresAt: Date | null;
        isActive: boolean;
        createdAt: Date;
    }, "passwordHash">>;
}
export {};
