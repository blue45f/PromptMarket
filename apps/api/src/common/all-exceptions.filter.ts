import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { type Request, type Response } from 'express'
import { Logger } from 'nestjs-pino'

/**
 * Global exception filter that produces a consistent error envelope while
 * staying strictly backward-compatible with NestJS' default error body.
 *
 * Compatibility contract (the web client reads `data.message` and may surface
 * `statusCode`):
 * - `statusCode` (number) is always preserved.
 * - `message` is preserved verbatim — the framework default keeps it as a
 *   `string` (single HttpException) or `string[]` (e.g. validation errors),
 *   and this filter never flattens or rewrites it.
 * - For an HttpException whose response is an object (the usual case), every
 *   field of that object is spread through, so `statusCode`/`message`/`error`
 *   all survive unchanged.
 * - Only `path` and `timestamp` are ADDED on top.
 *
 * 5xx responses are logged via pino so server faults remain observable.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    // Base body mirrors NestJS' default exception body so existing consumers
    // (e.g. the web client's getErrorMessage) keep working untouched.
    let base: Record<string, unknown>
    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      if (typeof res === 'string') {
        base = { statusCode: status, message: res }
      } else if (res !== null && typeof res === 'object') {
        // Spread the framework-provided object verbatim (keeps statusCode /
        // message / error), then backfill statusCode if it was absent.
        base = { statusCode: status, ...(res as Record<string, unknown>) }
      } else {
        base = { statusCode: status, message: exception.message }
      }
    } else {
      base = {
        statusCode: status,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }
    }

    // ADD-only metadata. Never overwrite statusCode/message/error.
    const body = {
      ...base,
      path: request?.url,
      timestamp: new Date().toISOString(),
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const err = exception instanceof Error ? exception : new Error(String(exception))
      this.logger.error(
        { err, path: request?.url, statusCode: status },
        `Unhandled ${status} on ${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''}`
      )
    }

    response.status(status).json(body)
  }
}
