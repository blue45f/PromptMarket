import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
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
    private readonly jwt: JwtService,
    private readonly config: ConfigService
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
    // OAuth-only accounts (passwordHash null) cannot password-login; respond the
    // same as a missing account so we never reveal that the email exists.
    if (!user || !user.passwordHash) {
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

  // Public config so the client can decide whether to show the Google button.
  publicConfig() {
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim()
    return { googleClientId: googleClientId ? googleClientId : null }
  }

  // Verify a Google ID token (GIS credential), then find-or-create the user by
  // email and issue the same JWT as password login. The audience is always
  // passed so the token must target our client, and email_verified is required.
  async googleAuth(credential: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim()
    if (!clientId) throw new UnauthorizedException('Google sign-in is not configured')

    const { OAuth2Client } = await import('google-auth-library')
    const client = new OAuth2Client(clientId)
    let payload: import('google-auth-library').TokenPayload | undefined
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
      payload = ticket.getPayload()
    } catch {
      throw new UnauthorizedException('Google authentication failed')
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google authentication failed')
    }

    const sub = payload.sub
    const email = payload.email.toLowerCase()

    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Link the Google identity to the existing account on first use.
      const user =
        existing.googleSub === sub
          ? existing
          : await this.prisma.user.update({
              where: { id: existing.id },
              data: { googleSub: sub },
            })
      return { token: this.signToken(user), user: this.publicUser(user) }
    }

    const username = await this.uniqueUsername(payload.name ?? email.split('@')[0] ?? 'user')
    const user = await this.prisma.user.create({
      data: { email, username, provider: 'google', googleSub: sub, balanceCents: 0 },
    })
    return { token: this.signToken(user), user: this.publicUser(user) }
  }

  // Derive a unique username from a display name/email, appending a numeric
  // suffix when the slug is already taken (username is unique + required).
  private async uniqueUsername(seed: string) {
    const base =
      seed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 20) || 'user'
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}${i}`
      const taken = await this.prisma.user.findUnique({ where: { username: candidate } })
      if (!taken) return candidate
    }
    return `${base}${Date.now().toString(36)}`
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
