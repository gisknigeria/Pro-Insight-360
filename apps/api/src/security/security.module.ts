import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { FileValidationService } from './file-validation.service';

/**
 * Security Module
 * Task 32: Security hardening
 */

@Module({
  providers: [EncryptionService, FileValidationService],
  exports: [EncryptionService, FileValidationService],
})
export class SecurityModule {}