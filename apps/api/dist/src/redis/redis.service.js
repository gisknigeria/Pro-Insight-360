"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("@upstash/redis");
let RedisService = class RedisService {
    config;
    client;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        this.client = new redis_1.Redis({
            url: this.config.getOrThrow('UPSTASH_REDIS_REST_URL'),
            token: this.config.getOrThrow('UPSTASH_REDIS_REST_TOKEN'),
        });
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.client.set(key, value, { ex: ttlSeconds });
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        return this.client.get(key);
    }
    async del(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async storeRefreshToken(userId, token) {
        await this.set(`refresh:${userId}`, token, 7 * 24 * 60 * 60);
    }
    async invalidateUserSessions(userId) {
        await this.del(`refresh:${userId}`);
    }
    async validateRefreshToken(userId, token) {
        const stored = await this.get(`refresh:${userId}`);
        return stored === token;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map