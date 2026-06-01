import { Module } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { ScoringService } from './scoring.service';
import { GapAnalysisService } from './gap-analysis.service';
import { DiagnosisController } from './diagnosis.controller';

@Module({
  providers: [
    AggregationService,
    ConflictDetectionService,
    ScoringService,
    GapAnalysisService,
  ],
  controllers: [DiagnosisController],
  exports: [AggregationService, ConflictDetectionService, ScoringService, GapAnalysisService],
})
export class DiagnosisModule {}
