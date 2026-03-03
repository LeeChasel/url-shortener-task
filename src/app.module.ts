import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, PrismaModule } from './libs';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // libs
    ConfigModule,
    PrismaModule,

    // features
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
