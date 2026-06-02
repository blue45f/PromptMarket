import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import { isPrismaP2002 } from '../prisma/prisma-errors'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  private signToken(user: { id: string; email: string; username: string; isAdmin: boolean }) {
    return this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      { expiresIn: '7d' }
    )
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    })
    if (existing) {
      throw new ConflictException('Email or username already in use')
    }
    const passwordHash = await argon2.hash(dto.password)
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          passwordHash,
          balanceCents: 0,
        },
      })
      const token = this.signToken(user)
      return { token, user: this.publicUser(user) }
    } catch (err) {
      if (isPrismaP2002(err)) {
        throw new ConflictException('Email or username already in use')
      }
      throw err
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    let ok: boolean
    try {
      ok = await argon2.verify(user.passwordHash, dto.password)
    } catch {
      ok = false
    }
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const token = this.signToken(user)
    return {
      token,
      user: this.publicUser(user),
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()
    return this.publicUser(user)
  }

  private publicUser(user: {
    id: string
    email: string
    username: string
    isAdmin: boolean
    bio: string | null
    avatarUrl: string | null
    balanceCents: number
    createdAt: Date
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      balanceCents: user.balanceCents,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    }
  }
}
