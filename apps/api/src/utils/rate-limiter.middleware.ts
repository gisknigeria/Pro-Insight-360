import { Injectable, NestMiddleware, TooManyRequestsException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting Middleware
 * Task 34.7: Implement rate limiting on all public API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly windowMs = 60 * 1000; // 1 minute window
  private readonly maxRequests = 100; // 100 requests per minute
  private readonly store = new Map<string, RateLimitEntry>();

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.getKey(req);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      this.setRateLimitHeaders(res, this.maxRequests - 1, this.maxRequests);
      next();
    } else if (entry.count < this.maxRequests) {
      // Within limit
      entry.count++;
      this.setRateLimitHeaders(res, this.maxRequests - entry.count, this.maxRequests);
      next();
    } else {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      res.set('X-RateLimit-Limit', this.maxRequests.toString());
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', entry.resetTime.toString());
      throw new TooManyRequestsException('Rate limit exceeded. Please try again later.');
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance on each request
      this.cleanup();
    }
  }

  private getKey(req: Request): string {
    // Use API key if available, otherwise IP
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || req.ip || req.connection.remoteAddress || 'unknown';
  }

  private setRateLimitHeaders(res: Response, remaining: number, limit: number) {
    res.set('X-RateLimit-Limit', limit.toString());
    res.set('X-RateLimit-Remaining', remaining.toString());
    res.set('X-RateLimit-Reset', Math.ceil((Date.now() + this.windowMs) / 1000).toString());
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}