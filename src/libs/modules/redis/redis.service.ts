import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  private get isReady() {
    return this.client.status === 'ready';
  }

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.get('REDIS_URL'), {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false, // Redis don't store persistent data
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    this.client.on('close', () => {
      console.warn('Redis connection closed');
    });

    this.client.on('error', (err: Error) => {
      console.error(`Redis error: ${err.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.isReady) return null;

    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`Redis GET "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  async set(
    key: string,
    value: string | Buffer | number,
    ttl: number,
  ): Promise<boolean> {
    if (!this.isReady) return false;
    try {
      await this.client.set(key, value, 'EX', ttl);
      return true;
    } catch (err) {
      console.error(`Redis SET failed [${key}]: ${(err as Error).message}`);
      return false;
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (!keys.length || !this.isReady) return 0;
    try {
      return await this.client.del(...keys);
    } catch (err) {
      console.error(
        `Redis DEL "${keys.join(', ')}": ${(err as Error).message}`,
      );
      return 0;
    }
  }

  async ping(): Promise<string> {
    // Health check handles the error and reports degraded status
    return await this.client.ping();
  }

  /** Shouldn't use it maually */
  async onModuleDestroy() {
    return await this.client.quit();
  }
}
