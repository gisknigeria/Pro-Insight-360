import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit {
    private config;
    private client;
    constructor(config: ConfigService);
    onModuleInit(): void;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    storeRefreshToken(userId: string, token: string): Promise<void>;
    invalidateUserSessions(userId: string): Promise<void>;
    validateRefreshToken(userId: string, token: string): Promise<boolean>;
}
