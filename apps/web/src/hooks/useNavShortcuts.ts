import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GitHub-style "g x" two-key navigation. Press `g`, then one of the keys
 * below within 1.2s to jump.
 *
 * Sequences are intentionally short and only fire when nothing else is
 * focused (so `g` inside a textarea or input stays a literal character).
 */
const SEQUENCE_TIMEOUT_MS = 1200;

const ROUTES: Record<string, string> = {
  h: '/',
  b: '/browse',
  d: '/dashboard',
  s: '/sell',
  l: '/login',
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useNavShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let armed = false;
    let timer: number | null = null;

    function disarm() {
      armed = false;
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!armed) {
        if (e.key.toLowerCase() === 'g') {
          armed = true;
          timer = window.setTimeout(disarm, SEQUENCE_TIMEOUT_MS);
        }
        return;
      }

      // Armed — consume the next key
      const route = ROUTES[e.key.toLowerCase()];
      disarm();
      if (route) {
        e.preventDefault();
        navigate(route);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timer != null) window.clearTimeout(timer);
    };
  }, [navigate]);
}
