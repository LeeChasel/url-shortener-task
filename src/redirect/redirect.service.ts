import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, RedisService } from '../libs';

interface CachedLink {
  originalUrl: string;
  expiresAt: string;
  maxClicks: number | null;
}

@Injectable()
export class RedirectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async resolve(shortCode: string): Promise<string> {
    const cacheKey = `url:${shortCode}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const { originalUrl, expiresAt, maxClicks } = JSON.parse(
        cached,
      ) as CachedLink;

      if (new Date() > new Date(expiresAt)) {
        await this.redis.del(cacheKey);
        throw new GoneException('Link has expired');
      }

      // Links without maxClicks can be resolved from cache alone
      if (maxClicks === null) {
        await this.prisma.shortLink.update({
          where: { shortCode },
          data: { clickCount: { increment: 1 } },
        });
        return originalUrl;
      }
    }

    // Always go to DB for authoritative click count validation
    const link = await this.prisma.shortLink.findUnique({
      where: { shortCode },
    });

    if (!link) {
      await this.redis.del(cacheKey);
      throw new NotFoundException('Short link not found');
    }

    if (new Date() > link.expiresAt) {
      await this.redis.del(cacheKey);
      throw new GoneException('Link has expired');
    }

    if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
      await this.redis.del(cacheKey);
      throw new GoneException('Link click limit reached');
    }

    const updated = await this.prisma.shortLink.update({
      where: { shortCode },
      data: { clickCount: { increment: 1 } },
    });

    // Invalidate cache if click limit now reached
    if (updated.maxClicks !== null && updated.clickCount >= updated.maxClicks) {
      await this.redis.del(cacheKey);
    } else if (!cached) {
      const ttlSeconds = Math.max(
        0,
        Math.floor((link.expiresAt.getTime() - Date.now()) / 1000),
      );
      if (ttlSeconds > 0) {
        await this.redis.set(
          cacheKey,
          JSON.stringify({
            originalUrl: link.originalUrl,
            expiresAt: link.expiresAt.toISOString(),
            maxClicks: link.maxClicks,
          }),
          ttlSeconds,
        );
      }
    }

    return link.originalUrl;
  }
}
