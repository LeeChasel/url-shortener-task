import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './libs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — exclude root-level routes
  app.setGlobalPrefix('api', {
    exclude: ['health', ':shortCode'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  await app.listen(configService.get('APP_PORT'));
}

void bootstrap();
