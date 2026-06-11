import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Blocks suspended members from write actions. Always used *after*
 * JwtAuthGuard (it relies on req.user). Reads are intentionally left open —
 * suspension silences a member, it does not erase their access to public
 * content.
 */
@Injectable()
export class SuspensionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const userId: string | undefined = req.user?.id
    if (!userId) throw new ForbiddenException('Authentication required')
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { suspendedAt: true },
    })
    if (user?.suspendedAt) {
      throw new ForbiddenException('This account is suspended')
    }
    return true
  }
}
