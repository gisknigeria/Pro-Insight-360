import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';

/**
 * AES-256 Encryption Service
 * Task 32.1: Implement AES-256 encryption at rest for sensitive fields
 */

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      this.logger.warn('ENCRYPTION_KEY not set - encryption disabled');
      return;
    }
    this.key = this.deriveKey(encryptionKey);
  }

  private deriveKey(password: string): Buffer {
    return scryptSync(password, 'salt', 32);
  }

  encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
    if (!this.key) {
      return { ciphertext: plaintext, iv: '', authTag: '' };
    }

    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(data: { ciphertext: string; iv: string; authTag: string }): string {
    if (!this.key || !data.iv || !data.authTag) {
      return data.ciphertext;
    }

    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(data.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }

  // Encrypt MFA secrets
  encryptMFASecret(secret: string): string {
    const encrypted = this.encrypt(secret);
    return JSON.stringify(encrypted);
  }

  decryptMFASecret(encryptedData: string): string {
    try {
      const parsed = JSON.parse(encryptedData);
      return this.decrypt(parsed);
    } catch {
      return encryptedData; // Return as-is if not encrypted
    }
  }

  // Encrypt PII data
  encryptPII(data: string): string {
    const encrypted = this.encrypt(data);
    return JSON.stringify(encrypted);
  }

  decryptPII(encryptedData: string): string {
    try {
      const parsed = JSON.parse(encryptedData);
      return this.decrypt(parsed);
    } catch {
      return encryptedData;
    }
  }
}