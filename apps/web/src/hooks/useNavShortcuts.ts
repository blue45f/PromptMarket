import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth'

/**
 * Keyboard navigation:
 * - "g x"  GitHub-style two-key navigation. Press `g`, then one of the keys
 *          below within 1.2s to jump.
 * - "c"    Single-key shortcut to /sell (create listing), authed only.
 *
 * All shortcuts skip when a typing target is focused so they stay literal
 * inside inputs/textareas/contentEditable surfaces.
 */
const SEQUENCE_TIMEOUT_MS = 1200

const BASE_ROUTES: Record<string, string> = {
  h: '/',
  b: '/browse',
  d: '/dashboard',
  s: '/sell',
  l: '/login',
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useNavShortcuts() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isAdmin = !!user?.isAdmin

  useEffect(() => {
    let armed = false
    let timer: number | null = null

    function disarm() {
      armed = false
      if (timer != null) {
        window.clearTimeout(timer)
        timer = null
      }
    }

    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (!armed) {
        const lower = e.key.toLowerCase()
        if (lower === 'g') {
          armed = true
          timer = window.setTimeout(disarm, SEQUENCE_TIMEOUT_MS)
          return
        }
        if (lower === 'c' && token) {
          e.preventDefault()
          navigate('/sell')
        }
        return
      }

      // Armed — consume the next key
      const route = (isAdmin ? { ...BASE_ROUTES, a: '/admin' } : BASE_ROUTES)[e.key.toLowerCase()]
      disarm()
      if (route) {
        e.preventDefault()
        navigate(route)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (timer != null) window.clearTimeout(timer)
    }
  }, [navigate, token, isAdmin])
}
