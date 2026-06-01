import {
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Param,
  Req,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';

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
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', resolve);
      req.on('error', reject);
    });

    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] ?? 'application/octet-stream';
    const fileName =
      (req.headers['x-file-name'] as string) ?? `upload-${Date.now()}`;

    if (!ALLOWED_MIME_TYPES.has(contentType.split(';')[0].trim())) {
      throw new BadRequestException(
        `File type is not allowed. Accepted types: PDF, Word, Excel, images (JPEG, PNG), and videos (MP4, WebM).`,
      );
    }

    const { key } = await this.storage.upload(
      body,
      contentType,
      `evaluations/${evaluationId}`,
      fileName,
    );

    const document = await this.prisma.document.create({
      data: {
        evaluationId,
        name: fileName,
        mimeType: contentType,
        storageKey: key,
        fileSizeBytes: BigInt(body.length),
        uploadedById: user.id,
      },
    });

    return {
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes.toString(),
      uploadedAt: document.uploadedAt,
    };
  }
}
