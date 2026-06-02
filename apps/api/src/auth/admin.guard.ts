import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    if (!req.user?.id) throw new ForbiddenException('Admin access required')
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id as string },
      select: { isAdmin: true },
    })
    if (!user?.isAdmin) throw new ForbiddenException('Admin access required')
    return true
  }
}
