import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { PrismaService, RedisService } from '../libs';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const [db, cache] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const healthy = db.status === 'ok' && cache.status === 'ok';

    return {
      status: healthy ? 'ok' : 'degraded',
      services: { db, cache },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }
}
