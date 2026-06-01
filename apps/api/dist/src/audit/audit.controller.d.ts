import type { Response } from 'express';
import { AuditService } from './audit.service';
export declare class AuditController {
    private auditService;
    constructor(auditService: AuditService);
    exportCsv(startDate: string, endDate: string, res: Response): Promise<void>;
}
