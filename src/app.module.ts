import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ConfigModule, PrismaModule, RedisModule } from './libs';
import { RedirectModule } from './redirect/redirect.module';
import { UrlModule } from './url/url.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // libs
    ConfigModule,
    PrismaModule,
    RedisModule,

    // features
    AuthModule,
    UserModule,
    UrlModule,
    HealthModule,
    RedirectModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
