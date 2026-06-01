import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
declare class CreateUserDto {
    email: string;
    role: UserRole;
    organisationId?: string;
}
declare class UpdateRoleDto {
    role: UserRole;
}
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto): Promise<{
        id: string;
        email: string;
        organisationId: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        setupToken: string | null;
        setupTokenExpiresAt: Date | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    reactivate(id: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    regenerateSetupToken(id: string): Promise<{
        id: string;
        email: string;
        setupToken: string | null;
        setupTokenExpiresAt: Date | null;
    }>;
}
export {};
