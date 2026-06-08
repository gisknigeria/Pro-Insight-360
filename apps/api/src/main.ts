import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Parse allowed frontend URLs from environment
  const frontendUrls = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin header)
      if (!origin) return callback(null, true);
      // Allow if origin is in the whitelist
      if (frontendUrls.includes(origin)) return callback(null, true);
      // Allow any Vercel preview domain
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Deny other origins
      callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Render requires listening on 0.0.0.0 and the PORT env var
  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Pro-Insight 360 API listening on port ${port}`);
}

bootstrap();
