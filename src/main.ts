/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1');
  app.set('trust proxy', true);

  const port = process.env.PORT || 3000;
  app.enableCors({
    origin: ['http://localhost:5173', 'https://finnybank-fe.vercel.app'], // your frontend URL
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
