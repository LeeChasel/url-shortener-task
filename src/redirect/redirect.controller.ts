import { Controller, Get, Param, Res, VERSION_NEUTRAL } from '@nestjs/common';
import type { Response } from 'express';
import { RedirectService } from './redirect.service';

@Controller({ path: '', version: VERSION_NEUTRAL })
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    const originalUrl = await this.redirectService.resolve(shortCode);
    return res.redirect(302, originalUrl);
  }
}
