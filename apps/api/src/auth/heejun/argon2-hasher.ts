import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

import type { PasswordHasher } from '@heejun/auth'

/**
 * `@heejun/auth` `PasswordHasher` 포트의 argon2 구현.
 *
 * PromptMarket 은 기존부터 argon2 로 해시했으므로(플랫폼 기본 scrypt 대신) 이 어댑터를
 * 주입한다 — 기존에 저장된 모든 비밀번호 해시가 그대로 검증되어 강제 재설정이 없다.
 * `verify` 의 인자 순서는 포트 규약(`password`, `stored`)을 따르고, 손상된 해시로
 * argon2 가 throw 하면 안전하게 false 로 떨어뜨린다.
 */
@Injectable()
export class Argon2Hasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password)
  }

  async verify(password: string, stored: string): Promise<boolean> {
    try {
      return await argon2.verify(stored, password)
    } catch {
      return false
    }
  }
}
