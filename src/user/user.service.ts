import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/libs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { shortLinks: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserLinks(userId: string) {
    const links = await this.prisma.shortLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        expiresAt: true,
        maxClicks: true,
        clickCount: true,
        createdAt: true,
      },
    });

    return links.map((link) => ({
      ...link,
      status: this.getLinkStatus(link),
    }));
  }

  private getLinkStatus(link: {
    expiresAt: Date;
    maxClicks: number | null;
    clickCount: number;
  }): 'active' | 'expired' {
    if (new Date() > link.expiresAt) return 'expired';
    if (link.maxClicks !== null && link.clickCount >= link.maxClicks)
      return 'expired';
    return 'active';
  }
}
