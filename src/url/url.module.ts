import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { ConfigService } from '../libs';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') as StringValue },
      }),
    }),
  ],
  controllers: [UrlController],
  providers: [UrlService],
})
export class UrlModule {}
