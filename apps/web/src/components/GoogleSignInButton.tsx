import { useEffect, useRef } from 'react'

// Google Identity Services (GIS) ID-token flow. The button callback receives the
// credential (ID token) directly and posts it to the backend — no redirect URI.
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (cfg: {
        client_id: string
        callback: (resp: { credential: string }) => void
      }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
  // Additive global so `globalThis.google` type-checks (the GIS script attaches
  // to the global scope). Survives a window→globalThis codemod either way.

  var google: GoogleIdentityServices | undefined
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

function loadGis(): Promise<GoogleIdentityServices> {
  return new Promise((resolve, reject) => {
    if (globalThis.google?.accounts?.id) {
      resolve(globalThis.google)
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => globalThis.google && resolve(globalThis.google))
      existing.addEventListener('error', () => reject(new Error('GIS load failed')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => globalThis.google && resolve(globalThis.google)
    script.onerror = () => reject(new Error('GIS load failed'))
    document.head.appendChild(script)
  })
}

export default function GoogleSignInButton({
  clientId,
  onCredential,
}: {
  clientId: string
  onCredential: (credential: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onCredential)
  useEffect(() => {
    cbRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let cancelled = false
    loadGis()
      .then((gis) => {
        if (cancelled || !ref.current) return
        gis.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => cbRef.current(resp.credential),
        })
        gis.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 320,
        })
      })
      .catch(() => {
        // Offline / blocked: hide the button only; email login is unaffected.
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  return <div ref={ref} className="flex justify-center" />
}
