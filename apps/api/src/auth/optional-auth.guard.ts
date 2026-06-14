import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

import { TokenService } from './heejun/token.service'

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const header: string | undefined = req.headers['authorization']
    if (!header || !header.startsWith('Bearer ')) {
      return true
    }
    const token = header.slice('Bearer '.length).trim()
    try {
      req.user = this.tokens.verify(token)
    } catch {
      // ignore — treat as anonymous
    }
    return true
  }
}
