import { OrganisationsService } from './organisations.service';
declare class CreateOrgDto {
    name: string;
    sector?: string;
}
declare class UpdateOrgDto {
    name?: string;
    sector?: string;
}
export declare class OrganisationsController {
    private orgsService;
    constructor(orgsService: OrganisationsService);
    create(dto: CreateOrgDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        archivedAt: Date | null;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        archivedAt: Date | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        archivedAt: Date | null;
    }>;
    update(id: string, dto: UpdateOrgDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        archivedAt: Date | null;
    }>;
    archive(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sector: string | null;
        archivedAt: Date | null;
    }>;
}
export {};
