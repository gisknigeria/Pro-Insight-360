import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('export')
  @Roles(UserRole.SUPER_ADMIN)
  async exportCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Please provide both startDate and endDate query parameters (ISO 8601 format).',
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Please use ISO 8601 format, e.g. 2025-01-01.',
      );
    }

    const csv = await this.auditService.exportCsv(start, end);
    const filename = `audit-log-${startDate}-to-${endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
