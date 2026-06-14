import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { isPrismaP2002 } from '../prisma/prisma-errors'
import { PrismaService } from '../prisma/prisma.service'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { Argon2Hasher } from './heejun/argon2-hasher'
import { OAUTH_VERIFIER } from './heejun/oauth.provider'
import { TokenService } from './heejun/token.service'

import type { OAuthProfile, OAuthVerifier } from '@heejun/auth'

/**
 * 인증 서비스. 암호 해싱·토큰 발급/검증·Google ID 토큰 검증은 모두 `@heejun/auth`
 * 포트(Argon2Hasher / TokenService / OAuthVerifier)에 위임하고, 마켓플레이스 고유
 * 규칙(회원명 유일성·정지 계정 차단·잔액 초기화·Google 계정 연결)은 여기서 소유한다.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly hasher: Argon2Hasher,
    private readonly config: ConfigService,
    @Inject(OAUTH_VERIFIER) private readonly oauth: OAuthVerifier | null
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    })
    if (existing) {
      throw new ConflictException('Email or username already in use')
    }
    const passwordHash = await this.hasher.hash(dto.password)
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          passwordHash,
          balanceCents: 0,
        },
      })
      const token = this.tokens.sign(user)
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
    // Argon2Hasher 가 손상 해시의 throw 까지 흡수해 false 로 돌려준다.
    const ok = await this.hasher.verify(dto.password, user.passwordHash)
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials')
    }
    this.assertNotSuspended(user)
    const token = this.tokens.sign(user)
    return {
      token,
      user: this.publicUser(user),
    }
  }

  /** Suspended members keep their data but cannot start new sessions. */
  private assertNotSuspended(user: { suspendedAt?: Date | null }) {
    if (user.suspendedAt) {
      throw new ForbiddenException('This account is suspended')
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

  // Verify a Google ID token (GIS credential) via @heejun/auth's OAuthVerifier,
  // then find-or-create the user by email and issue the same JWT as password
  // login. email_verified is required and the audience is enforced by the
  // verifier, so the token must target our client.
  async googleAuth(credential: string) {
    if (!this.oauth) throw new UnauthorizedException('Google sign-in is not configured')

    let profile: OAuthProfile
    try {
      profile = await this.oauth.verify(credential)
    } catch {
      throw new UnauthorizedException('Google authentication failed')
    }
    if (!profile.sub || !profile.email || !profile.emailVerified) {
      throw new UnauthorizedException('Google authentication failed')
    }

    const sub = profile.sub
    const email = profile.email.toLowerCase()

    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) {
      this.assertNotSuspended(existing)
      // Link the Google identity to the existing account on first use.
      const user =
        existing.googleSub === sub
          ? existing
          : await this.prisma.user.update({
              where: { id: existing.id },
              data: { googleSub: sub },
            })
      return { token: this.tokens.sign(user), user: this.publicUser(user) }
    }

    // 표준 OAuthProfile 은 표시 이름을 담지 않으므로(이메일 로컬파트로 시드) 자동 생성한다.
    const username = await this.uniqueUsername(email.split('@')[0] ?? 'user')
    const user = await this.prisma.user.create({
      data: { email, username, provider: 'google', googleSub: sub, balanceCents: 0 },
    })
    return { token: this.tokens.sign(user), user: this.publicUser(user) }
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
