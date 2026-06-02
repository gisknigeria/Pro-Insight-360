import {
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(
    private storage: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload a file for an evaluation.
   * Expects multipart/form-data with a 'file' field.
   * Uses raw body parsing to avoid multer dependency.
   */
  @Post('evaluation/:evaluationId')
  async uploadDocument(
    @Param('evaluationId') evaluationId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    // Read raw body chunks
    const chunks: Buffer[] = [];
    let totalSize = 0;

    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE) {
          reject(
            new BadRequestException(
              `File is too large. Maximum allowed size is 50 MB.`,
            ),
          );
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve());
      req.on('error', (err) => reject(err));
    });

    // Parse multipart/form-data manually (simple parser)
    // For production, consider using @nestjs/platform-express with multer
    // This is a minimal implementation for the API contract
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      throw new BadRequestException('Invalid multipart form data');
    }
    const boundary = `--${boundaryMatch[1]}`;
    const parts = body.toString('binary').split(boundary);

    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let mimeType = '';
    let fieldName = '';

    for (const part of parts) {
      if (!part || part === '--\r\n' || part === '--') continue;
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      const headers = part.substring(0, headerEnd);
      const content = part.substring(headerEnd + 4, part.length - 2); // strip trailing \r\n

      const nameMatch = headers.match(/name="([^"]+)"/);
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      const contentTypeMatch = headers.match(/Content-Type:\s*(.+)/i);

      if (filenameMatch && nameMatch) {
        fieldName = nameMatch[1];
        fileName = filenameMatch[1];
        mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
        fileBuffer = Buffer.from(content, 'binary');
      }
    }

    if (!fileBuffer || !fileName) {
      throw new BadRequestException('No file uploaded');
    }

    if (fieldName !== 'file') {
      throw new BadRequestException('Expected field name "file"');
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `File type "${mimeType}" is not allowed`,
      );
    }

    // Verify evaluation exists
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });
    if (!evaluation) {
      throw new BadRequestException('Evaluation not found');
    }

    // Upload to B2 / S3
    const { key: storageKey } = await this.storage.upload(
      fileBuffer,
      mimeType,
      `evaluation/${evaluationId}`,
      fileName,
    );

    // Save document record
    const document = await this.prisma.document.create({
      data: {
        evaluationId,
        name: fileName,
        mimeType,
        storageKey,
        fileSizeBytes: BigInt(fileBuffer.length),
        uploadedById: user.id,
      },
    });

    return {
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      size: document.fileSizeBytes.toString(),
      storageKey: document.storageKey,
    };
  }
}
