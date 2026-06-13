import { useAuthStore } from '@store/auth'
import axios from 'axios'

import i18n from '@/i18n'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

// Helper to extract a human-readable error message from an axios error.
// The fallback follows the active UI language; server messages pass through.
export function getErrorMessage(
  err: unknown,
  fallback: string = i18n.t('common:errors.generic')
): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
    return err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
