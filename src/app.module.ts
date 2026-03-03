import { Module } from '@nestjs/common';
import { ConfigModule } from './libs';

@Module({
  imports: [
    // libs
    ConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
