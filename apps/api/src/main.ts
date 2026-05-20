import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe, patchNestJsSwagger } from 'nestjs-zod';
import * as nodePath from 'path';
import { AppModule } from './app.module';

/**
 * nestjs-zod 4.x patches `@nestjs/swagger`'s SchemaObjectFactory by reaching
 * into a subpath (`@nestjs/swagger/dist/services/schema-object-factory`) that
 * swagger 11 hides behind its package `exports` map. We resolve the file via
 * an absolute path and hand the class to `patchNestJsSwagger` directly so it
 * never has to perform that blocked require.
 */
function loadSchemaObjectFactory(): unknown {
  const swaggerEntry = require.resolve('@nestjs/swagger');
  const target = nodePath.join(
    nodePath.dirname(swaggerEntry),
    'services',
    'schema-object-factory.js',
  );
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(target);
  return mod.SchemaObjectFactory;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ZodValidationPipe());

  // Must run BEFORE createDocument so zod-derived DTOs get OpenAPI metadata.
  patchNestJsSwagger(loadSchemaObjectFactory() as never);
  const config = new DocumentBuilder()
    .setTitle('PromptMarket API')
    .setDescription('Marketplace for AI prompts, CLAUDE.md and agent.md')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  // Mount under the global /api prefix → /api/docs (UI) and /api/docs-json
  SwaggerModule.setup('api/docs', app, doc, {
    jsonDocumentUrl: 'api/docs-json',
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}
bootstrap();
