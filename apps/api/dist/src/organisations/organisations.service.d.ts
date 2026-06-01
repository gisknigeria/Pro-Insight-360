import { PrismaService } from '../prisma/prisma.service';
export declare class OrganisationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: {
        name: string;
        sector?: string;
    }): Promise<{
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
    update(id: string, dto: {
        name?: string;
        sector?: string;
    }): Promise<{
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
