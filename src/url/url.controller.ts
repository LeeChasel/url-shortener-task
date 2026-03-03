import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import type { JWT_Payload } from '../auth/types';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlService } from './url.service';

@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  createShortLink(
    @Body() dto: CreateUrlDto,
    @CurrentUser() user?: JWT_Payload,
  ) {
    return this.urlService.createShortLink(dto.originalUrl, user?.sub, {
      expiresInHours: dto.expiresInHours,
      maxClicks: dto.maxClicks,
    });
  }
}
