import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

import { TokenService } from './heejun/token.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const header: string | undefined = req.headers['authorization']
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token')
    }
    const token = header.slice('Bearer '.length).trim()
    try {
      req.user = this.tokens.verify(token)
      return true
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
