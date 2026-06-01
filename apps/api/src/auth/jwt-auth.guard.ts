import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const header: string | undefined = req.headers['authorization']
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token')
    }
    const token = header.slice('Bearer '.length).trim()
    try {
      const payload = this.jwtService.verify(token)
      req.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        isAdmin: !!payload.isAdmin,
      }
      return true
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
