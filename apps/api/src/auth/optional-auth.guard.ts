import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return true;
    }
    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = this.jwtService.verify(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };
    } catch {
      // ignore — treat as anonymous
    }
    return true;
  }
}
