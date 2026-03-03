import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JWT_Payload } from 'src/auth/types';
import { UserService } from './user.service';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getUserInformation(@CurrentUser() user: JWT_Payload) {
    const userInfo = await this.userService.getUserById(user.sub);

    return {
      registerAt: userInfo.createdAt,
      lastLoginAt: userInfo.lastLoginAt,
    };
  }
}
