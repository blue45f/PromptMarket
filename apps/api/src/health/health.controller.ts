import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { HealthService, type HealthStatus } from './health.service'

/**
 * Health/readiness probe for hosted deploys (Render, Fly, Docker, k8s).
 *
 * - `GET /api/health` is a fast liveness check that never touches the DB, so
 *   it stays green while the process is up even if the database blips.
 * - `GET /api/health/ready` pings the database so orchestrators can gate
 *   traffic until the API can actually serve queries.
 *
 * Both routes carry no auth guard (public by default in this codebase — auth
 * is opt-in via `@UseGuards(JwtAuthGuard)`) and are `@SkipThrottle()` so that
 * frequent platform probes are never rate-limited by the global ThrottlerGuard.
 */
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe (no dependencies)' })
  live(): HealthStatus {
    return this.health.liveness()
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (checks database connectivity)' })
  ready(): Promise<HealthStatus> {
    return this.health.readiness()
  }
}
