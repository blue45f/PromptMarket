import { useAuthStore } from '@store/auth'
import { beforeEach, describe, expect, it } from 'vitest'

import { api, applyAuth, getErrorMessage } from './api'

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

describe('applyAuth (ky beforeRequest)', () => {
  it('does not attach Authorization when no token is set', () => {
    const headers = new Headers()
    applyAuth(headers)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('attaches Bearer token when the auth store has one', () => {
    useAuthStore.setState({ token: 't-1', user: null })
    const headers = new Headers()
    applyAuth(headers)
    expect(headers.get('Authorization')).toBe('Bearer t-1')
  })
})

describe('api surface', () => {
  it('exposes the standard verbs', () => {
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.patch).toBe('function')
    expect(typeof api.put).toBe('function')
    expect(typeof api.delete).toBe('function')
  })
})

/** ky HTTPError 는 파싱된 응답 본문을 `data` 에 보관한다. */
function httpErrWith(message: string | string[]) {
  const e = new Error('req fail') as Error & { data?: unknown }
  e.data = { message }
  return e
}

describe('getErrorMessage', () => {
  it('returns the message field when it is a string', () => {
    expect(getErrorMessage(httpErrWith('Invalid credentials'))).toBe('Invalid credentials')
  })

  it('joins array-shaped validation messages', () => {
    expect(getErrorMessage(httpErrWith(['title is required', 'price must be >= 0']))).toBe(
      'title is required, price must be >= 0'
    )
  })

  it('falls back to the error message when the response has no body', () => {
    expect(getErrorMessage(new Error('Network Error'))).toBe('Network Error')
  })

  it('uses the fallback string for an error with no message', () => {
    expect(getErrorMessage(new Error(''), '문제가 발생했어요')).toBe('문제가 발생했어요')
  })

  it('returns the message from a plain Error', () => {
    expect(getErrorMessage(new Error('oops'))).toBe('oops')
  })

  it('hides raw ky transport error messages (internal URL leak) behind the fallback', () => {
    const httpErr = new Error('Request failed with status code 502: GET http://localhost/api/x')
    httpErr.name = 'HTTPError'
    expect(getErrorMessage(httpErr, '잠시 후 다시 시도해 주세요')).toBe(
      '잠시 후 다시 시도해 주세요'
    )

    const netErr = new Error('Request failed due to a network error: GET http://localhost/api/x')
    netErr.name = 'NetworkError'
    expect(getErrorMessage(netErr, 'fb')).toBe('fb')
  })

  it('still surfaces server-provided messages even on a transport error shape', () => {
    const e = new Error(
      'Request failed with status code 400: POST http://localhost/api/x'
    ) as Error & {
      data?: unknown
    }
    e.name = 'HTTPError'
    e.data = { message: 'Invalid credentials' }
    expect(getErrorMessage(e)).toBe('Invalid credentials')
  })

  it('uses the fallback for unknown shapes', () => {
    expect(getErrorMessage(null, 'fb')).toBe('fb')
    expect(getErrorMessage(42, 'fb')).toBe('fb')
    expect(getErrorMessage({ what: 'this' }, 'fb')).toBe('fb')
  })
})
