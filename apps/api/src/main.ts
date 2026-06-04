import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  app.use(compression())
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    })
  )
  app.setGlobalPrefix('api')
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000']
  app.enableCors({ origin: allowedOrigins, credentials: true })
  app.useGlobalPipes(new ZodValidationPipe())

  const config = new DocumentBuilder()
    .setTitle('PromptMarket API')
    .setDescription('Marketplace for AI prompts, CLAUDE.md and agent.md')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  // nestjs-zod 5 replaces the 4.x patchNestJsSwagger flow: create the doc as
  // usual, then post-process it so zod-derived DTOs surface in OpenAPI.
  const rawDoc = SwaggerModule.createDocument(app, config)
  const doc = cleanupOpenApiDoc(rawDoc)
  SwaggerModule.setup('api/docs', app, doc, {
    jsonDocumentUrl: 'api/docs-json',
  })

  // Let Nest run PrismaService.onModuleDestroy ($disconnect) on SIGTERM/SIGINT
  // so Render shutdowns close the DB pool cleanly instead of leaking it.
  app.enableShutdownHooks()

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
  await app.listen(port)
  console.log(`API listening on http://localhost:${port}/api`)
}
bootstrap()
