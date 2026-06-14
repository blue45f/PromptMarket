import { describe, expect, it } from 'vitest'

import { Argon2Hasher } from './argon2-hasher'

// 실제 argon2 를 사용(인자 순서 매핑과 손상 해시 처리를 진짜로 검증).
describe('Argon2Hasher', () => {
  const hasher = new Argon2Hasher()

  it('hashes then verifies a password (round-trip)', async () => {
    const stored = await hasher.hash('s3cret-password')
    expect(stored).not.toBe('s3cret-password')
    expect(await hasher.verify('s3cret-password', stored)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const stored = await hasher.hash('right-password')
    expect(await hasher.verify('wrong-password', stored)).toBe(false)
  })

  it('returns false (never throws) for a corrupt stored hash', async () => {
    expect(await hasher.verify('whatever', 'not-a-valid-argon2-hash')).toBe(false)
  })
})
