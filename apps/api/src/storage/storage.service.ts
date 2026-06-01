import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get<string>('B2_BUCKET_NAME', 'pro-insight-360-files');
    this.endpoint = config.get<string>(
      'B2_ENDPOINT',
      'https://s3.us-east-005.backblazeb2.com',
    );

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-005',
      credentials: {
        accessKeyId: config.get<string>('B2_KEY_ID', ''),
        secretAccessKey: config.get<string>('B2_APPLICATION_KEY', ''),
      },
      forcePathStyle: true, // required for Backblaze B2
    });
  }

  /**
   * Upload a file buffer to Backblaze B2.
   * Returns the storage key for later retrieval.
   */
  async upload(
    buffer: Buffer,
    mimeType: string,
    folder: string,
    originalName: string,
  ): Promise<{ key: string; url: string }> {
    const ext = originalName.split('.').pop() ?? 'bin';
    const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const url = `${this.endpoint}/${this.bucket}/${key}`;
    this.logger.log(`Uploaded: ${key}`);
    return { key, url };
  }

  /**
   * Generate a pre-signed download URL valid for the given duration.
   */
  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Delete a file from storage.
   */
  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted: ${key}`);
  }
}
