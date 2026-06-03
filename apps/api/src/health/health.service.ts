import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface HealthStatus {
  status: 'ok' | 'degraded'
  uptimeSeconds: number
  timestamp: string
  database?: 'up' | 'down'
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness: the process is running and able to respond. Deliberately has no
   * external dependencies so a transient DB issue does not cause an
   * orchestrator to kill an otherwise-healthy container.
   */
  liveness(): HealthStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Readiness: the API can actually serve traffic, i.e. the database answers a
   * trivial query. Returns `degraded` (not a thrown 500) so callers can read a
   * structured payload and decide how to react.
   */
  async readiness(): Promise<HealthStatus> {
    let database: 'up' | 'down'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      database = 'up'
    } catch {
      database = 'down'
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    }
  }
}
