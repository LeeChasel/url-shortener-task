import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, PrismaModule } from './libs';

@Module({
  imports: [
    // libs
    ConfigModule,
    PrismaModule,

    // features
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
