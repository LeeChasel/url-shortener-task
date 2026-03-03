import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService, RedisService } from '../libs';

const GUEST_EXPIRY_HOURS = 24;
const MAX_MEMBER_EXPIRY_HOURS = 7 * 24;
const SHORT_CODE_LENGTH = 7;
const SHORT_CODE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class UrlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createShortLink(
    originalUrl: string,
    userId?: string,
    options?: { expiresInHours?: number; maxClicks?: number },
  ) {
    let expiresInHours = GUEST_EXPIRY_HOURS;
    let maxClicks: number | null = null;

    if (userId) {
      expiresInHours = Math.min(
        options?.expiresInHours ?? GUEST_EXPIRY_HOURS,
        MAX_MEMBER_EXPIRY_HOURS,
      );
      maxClicks = options?.maxClicks ?? null;
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const shortCode = await this.generateUniqueShortCode();

    const link = await this.prisma.shortLink.create({
      data: { shortCode, originalUrl, userId, expiresAt, maxClicks },
    });

    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    await this.redis.set(
      `url:${shortCode}`,
      JSON.stringify({
        originalUrl: link.originalUrl,
        expiresAt: link.expiresAt.toISOString(),
        maxClicks: link.maxClicks,
      }),
      'EX',
      ttlSeconds,
    );

    return link;
  }

  private async generateUniqueShortCode(): Promise<string> {
    let shortCode: string;
    let exists: boolean;

    do {
      shortCode = this.generateShortCode();
      const existing = await this.prisma.shortLink.findUnique({
        where: { shortCode },
        select: { id: true },
      });
      exists = !!existing;
    } while (exists);

    return shortCode;
  }

  private generateShortCode(): string {
    const bytes = randomBytes(SHORT_CODE_LENGTH);
    let result = '';
    for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
      result += SHORT_CODE_CHARS[bytes[i] % SHORT_CODE_CHARS.length];
    }
    return result;
  }
}
