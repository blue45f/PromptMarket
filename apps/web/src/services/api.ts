import { useAuthStore } from '@store/auth'
import ky, { type Options } from 'ky'

import i18n from '@/i18n'

/** ky beforeRequest 에서 호출 — 토큰이 있으면 Authorization 헤더를 단다. (테스트용 export) */
export function applyAuth(headers: Headers): void {
  const token = useAuthStore.getState().token
  if (token) headers.set('Authorization', `Bearer ${token}`)
}

const client = ky.create({
  prefix: '/api',
  hooks: {
    beforeRequest: [({ request }) => applyAuth(request.headers)],
  },
})

/** axios 시절 `{ params }` 호출부 호환 — ky 의 searchParams 로 변환한다. */
type ApiOptions = Omit<Options, 'method' | 'json' | 'searchParams'> & {
  params?: Record<string, string | number | boolean | null | undefined>
}

function toOptions(opts?: ApiOptions): Options {
  if (!opts) return {}
  const { params, ...rest } = opts
  if (!params) return rest
  const searchParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  )
  return { ...rest, searchParams }
}

async function toJson<T>(promise: ReturnType<typeof client.get>): Promise<T> {
  const res = await promise
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

// axios 호환 제네릭 시그니처(<T, R = T, D>) — 응답 인터셉터가 data 를 반환하던 호출부를 그대로 둔다.
export const api = {
  get: <T = unknown, R = T>(url: string, options?: ApiOptions): Promise<R> =>
    toJson<R>(client.get(url, toOptions(options))),
  post: <T = unknown, R = T, D = unknown>(
    url: string,
    body?: D,
    options?: ApiOptions
  ): Promise<R> => toJson<R>(client.post(url, { json: body, ...toOptions(options) })),
  patch: <T = unknown, R = T, D = unknown>(
    url: string,
    body?: D,
    options?: ApiOptions
  ): Promise<R> => toJson<R>(client.patch(url, { json: body, ...toOptions(options) })),
  put: <T = unknown, R = T, D = unknown>(url: string, body?: D, options?: ApiOptions): Promise<R> =>
    toJson<R>(client.put(url, { json: body, ...toOptions(options) })),
  delete: <T = unknown, R = T>(url: string, options?: ApiOptions): Promise<R> =>
    toJson<R>(client.delete(url, toOptions(options))),
}

// Helper to extract a human-readable error message from a ky error.
// The fallback follows the active UI language; server messages pass through.
export function getErrorMessage(
  err: unknown,
  fallback: string = i18n.t('common:errors.generic')
): string {
  // ky HTTPError 는 파싱된 응답 본문을 `data` 로 보관한다.
  const data = (err as { data?: { message?: string | string[] } } | null)?.data
  const msg = data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string') return msg
  if (err instanceof Error) return err.message || fallback
  return fallback
}
