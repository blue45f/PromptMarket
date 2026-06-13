import { useAuthStore } from '@store/auth'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'

import { api, getErrorMessage } from './api'

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null })
})

describe('api request interceptor', () => {
  function reqHandler() {
    const handlers = (
      api.interceptors.request as unknown as {
        handlers: { fulfilled: (config: unknown) => Promise<{ headers: Record<string, string> }> }[]
      }
    ).handlers
    return handlers[0].fulfilled
  }

  it('does not attach Authorization when no token is set', async () => {
    const config = await reqHandler()({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('attaches Bearer token when the auth store has one', async () => {
    useAuthStore.setState({ token: 't-1', user: null })
    const config = await reqHandler()({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer t-1')
  })

  it('creates headers if config arrived without them', async () => {
    useAuthStore.setState({ token: 't-2', user: null })
    const config = await reqHandler()({})
    expect(config.headers.Authorization).toBe('Bearer t-2')
  })
})

describe('getErrorMessage', () => {
  it('returns the message field from an axios response when it is a string', () => {
    const err = new AxiosError('req fail', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      data: { message: 'Invalid credentials' },
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as never },
    })
    expect(getErrorMessage(err)).toBe('Invalid credentials')
  })

  it('joins array-shaped validation messages', () => {
    const err = new AxiosError('req fail', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 422,
      data: { message: ['title is required', 'price must be >= 0'] },
      statusText: 'Unprocessable',
      headers: {},
      config: { headers: {} as never },
    })
    expect(getErrorMessage(err)).toBe('title is required, price must be >= 0')
  })

  it('falls back to the axios error message when response has no body', () => {
    const err = new AxiosError('Network Error')
    expect(getErrorMessage(err)).toBe('Network Error')
  })

  it('uses the fallback string for an axios error with no message', () => {
    const err = new AxiosError('')
    expect(getErrorMessage(err, '문제가 발생했어요')).toBe('문제가 발생했어요')
  })

  it('returns the message from a plain Error', () => {
    expect(getErrorMessage(new Error('oops'))).toBe('oops')
  })

  it('uses the fallback for unknown shapes', () => {
    expect(getErrorMessage(null, 'fb')).toBe('fb')
    expect(getErrorMessage(42, 'fb')).toBe('fb')
    expect(getErrorMessage({ what: 'this' }, 'fb')).toBe('fb')
  })
})
