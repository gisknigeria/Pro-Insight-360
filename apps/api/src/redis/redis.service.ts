import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      url: this.config.getOrThrow<string>('UPSTASH_REDIS_REST_URL'),
      token: this.config.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { ex: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get<string>(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** Store a refresh token with 7-day TTL */
  async storeRefreshToken(userId: string, token: string): Promise<void> {
    await this.set(`refresh:${userId}`, token, 7 * 24 * 60 * 60);
  }

  /** Invalidate all sessions for a user (deactivation) */
  async invalidateUserSessions(userId: string): Promise<void> {
    await this.del(`refresh:${userId}`);
  }

  /** Check if a refresh token is valid */
  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const stored = await this.get(`refresh:${userId}`);
    return stored === token;
  }
}
