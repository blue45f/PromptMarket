import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { AllExceptionsFilter } from './all-exceptions.filter'

interface CapturedResponse {
  statusCode: number
  body: unknown
}

function makeHost(url = '/api/listings', method = 'GET') {
  const captured: CapturedResponse = { statusCode: 0, body: undefined }
  const response = {
    status: vi.fn().mockImplementation((code: number) => {
      captured.statusCode = code
      return response
    }),
    json: vi.fn().mockImplementation((payload: unknown) => {
      captured.body = payload
      return response
    }),
  }
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url, method }),
    }),
  }
  return { host: host as never, response, captured }
}

function makeLogger() {
  return { error: vi.fn() } as never
}

describe('AllExceptionsFilter', () => {
  it('preserves statusCode and string message from an HttpException, adding path/timestamp', () => {
    const logger = makeLogger()
    const filter = new AllExceptionsFilter(logger)
    const { host, captured } = makeHost('/api/x')

    filter.catch(new HttpException('Boom', HttpStatus.FORBIDDEN), host)

    const body = captured.body as Record<string, unknown>
    expect(captured.statusCode).toBe(403)
    expect(body.statusCode).toBe(403)
    expect(body.message).toBe('Boom')
    expect(body.path).toBe('/api/x')
    expect(typeof body.timestamp).toBe('string')
    expect(() => new Date(body.timestamp as string)).not.toThrow()
  })

  it('preserves an array message verbatim (validation-style errors)', () => {
    const filter = new AllExceptionsFilter(makeLogger())
    const { host, captured } = makeHost()

    // BadRequestException with an object response carrying message[] — the
    // exact shape the web client (getErrorMessage) joins with ", ".
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: ['name should not be empty', 'price must be positive'],
        error: 'Bad Request',
      }),
      host
    )

    const body = captured.body as Record<string, unknown>
    expect(body.statusCode).toBe(400)
    expect(body.message).toEqual(['name should not be empty', 'price must be positive'])
    expect(body.error).toBe('Bad Request')
    expect(body.path).toBe('/api/listings')
  })

  it('does not log 4xx but emits a 500 envelope and logs unknown errors', () => {
    const logger = makeLogger()
    const filter = new AllExceptionsFilter(logger)

    const notFound = makeHost()
    filter.catch(new HttpException('Nope', HttpStatus.NOT_FOUND), notFound.host)
    expect((logger as { error: ReturnType<typeof vi.fn> }).error).not.toHaveBeenCalled()

    const boom = makeHost('/api/crash', 'POST')
    filter.catch(new Error('kaboom'), boom.host)

    const body = boom.captured.body as Record<string, unknown>
    expect(boom.captured.statusCode).toBe(500)
    expect(body.statusCode).toBe(500)
    expect(body.message).toBe('Internal server error')
    expect((logger as { error: ReturnType<typeof vi.fn> }).error).toHaveBeenCalledTimes(1)
  })
})
