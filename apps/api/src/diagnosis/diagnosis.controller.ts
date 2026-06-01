import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { ScoringService } from './scoring.service';
import { GapAnalysisService } from './gap-analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

class ResolveConflictDto {
  resolutionNote: string;
}

class UpdateWeightsDto {
  weights: { category: string; weight: number }[];
}

@Controller('diagnosis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiagnosisController {
  constructor(
    private aggregation: AggregationService,
    private conflicts: ConflictDetectionService,
    private scoring: ScoringService,
    private gapAnalysis: GapAnalysisService,
  ) {}

  // ─── Aggregation ───────────────────────────────────────────────────────────

  @Get('evaluations/:id/aggregate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  aggregateEvaluation(@Param('id') id: string) {
    return this.aggregation.aggregateEvaluation(id);
  }

  @Get('forms/:id/aggregate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  aggregateForm(@Param('id') id: string) {
    return this.aggregation.aggregateForm(id);
  }

  // ─── Conflict Detection ────────────────────────────────────────────────────

  @Post('evaluations/:id/detect-conflicts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  detectConflicts(@Param('id') id: string) {
    return this.conflicts.detectConflicts(id);
  }

  @Get('evaluations/:id/conflicts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  getConflicts(@Param('id') id: string) {
    return this.conflicts.getConflicts(id);
  }

  @Patch('conflicts/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  resolveConflict(
    @Param('id') id: string,
    @Body() dto: ResolveConflictDto,
    @CurrentUser() user: any,
  ) {
    return this.conflicts.resolveConflict(id, dto.resolutionNote, user.id);
  }

  // ─── Scoring ───────────────────────────────────────────────────────────────

  @Post('evaluations/:id/score')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  computeScores(@Param('id') id: string) {
    return this.scoring.computeAll(id);
  }

  @Get('evaluations/:id/scores')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  getScores(@Param('id') id: string) {
    return this.scoring.getScores(id);
  }

  @Post('scoring-weights')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  updateWeights(@Body() dto: UpdateWeightsDto, @CurrentUser() user: any) {
    return this.scoring.updateWeightsAndRecompute(dto.weights, user.id);
  }

  // ─── Gap Analysis ──────────────────────────────────────────────────────────

  @Get('evaluations/:id/gaps')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  getGaps(@Param('id') id: string) {
    return this.gapAnalysis.getGapSummary(id);
  }
}
