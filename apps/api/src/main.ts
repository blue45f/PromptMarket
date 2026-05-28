import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('PromptMarket API')
    .setDescription('Marketplace for AI prompts, CLAUDE.md and agent.md')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  // nestjs-zod 5 replaces the 4.x patchNestJsSwagger flow: create the doc as
  // usual, then post-process it so zod-derived DTOs surface in OpenAPI.
  const rawDoc = SwaggerModule.createDocument(app, config);
  const doc = cleanupOpenApiDoc(rawDoc);
  SwaggerModule.setup('api/docs', app, doc, {
    jsonDocumentUrl: 'api/docs-json',
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}
bootstrap();
