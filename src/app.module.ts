import { Module } from '@nestjs/common';
import { ConfigModule, PrismaModule } from './libs';

@Module({
  imports: [
    // libs
    ConfigModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
