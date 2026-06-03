import { describe, expect, it, vi } from 'vitest'
import { HealthService } from './health.service'

describe('HealthService', () => {
  it('liveness reports ok without touching the database', () => {
    const queryRaw = vi.fn()
    const service = new HealthService({ $queryRaw: queryRaw } as never)

    const result = service.liveness()

    expect(result.status).toBe('ok')
    expect(result.database).toBeUndefined()
    expect(typeof result.uptimeSeconds).toBe('number')
    expect(() => new Date(result.timestamp)).not.toThrow()
    expect(queryRaw).not.toHaveBeenCalled()
  })

  it('readiness reports ok and database up when the query succeeds', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ '1': 1 }])
    const service = new HealthService({ $queryRaw: queryRaw } as never)

    const result = await service.readiness()

    expect(result.status).toBe('ok')
    expect(result.database).toBe('up')
    expect(queryRaw).toHaveBeenCalledTimes(1)
  })

  it('readiness reports degraded and database down when the query throws', async () => {
    const queryRaw = vi.fn().mockRejectedValue(new Error('connection refused'))
    const service = new HealthService({ $queryRaw: queryRaw } as never)

    const result = await service.readiness()

    expect(result.status).toBe('degraded')
    expect(result.database).toBe('down')
  })
})

describe('HealthController', () => {
  it('delegates liveness and readiness to the service', async () => {
    // Imported lazily so the controller's decorator metadata is evaluated only
    // when needed, matching the lightweight unit style used across the API.
    const { HealthController } = await import('./health.controller')
    const liveness = vi.fn().mockReturnValue({ status: 'ok' })
    const readiness = vi.fn().mockResolvedValue({ status: 'ok', database: 'up' })
    const controller = new HealthController({ liveness, readiness } as never)

    expect(controller.live()).toEqual({ status: 'ok' })
    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    })
    expect(liveness).toHaveBeenCalledTimes(1)
    expect(readiness).toHaveBeenCalledTimes(1)
  })
})
