import { useEffect, useState } from 'react'

export function useHashPath(): string {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}
export const navigate = (to: string) => {
  window.location.hash = to
}
