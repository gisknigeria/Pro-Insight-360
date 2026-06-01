import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * File Upload Validation Service
 * Task 32.4: Implement file upload validation (MIME type, size limit, malware scan)
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class FileValidationService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'text/csv',
    'application/json',
  ];

  validateFile(file: Express.Multer.File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type '${file.mimetype}' is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      };
    }

    // Check file extension
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'csv', 'json'];
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension '.${extension}' is not allowed`,
      };
    }

    return { isValid: true };
  }

  validateImageFile(file: Express.Multer.File): FileValidationResult {
    const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    
    if (!imageMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Only image files (PNG, JPEG, GIF) are allowed',
      };
    }

    return this.validateFile(file);
  }

  validateDocumentFile(file: Express.Multer.File): FileValidationResult {
    const documentMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!documentMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Only document files (PDF, DOC, DOCX) are allowed',
      };
    }

    return this.validateFile(file);
  }
}