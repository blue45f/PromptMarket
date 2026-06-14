import RouteError from '@components/common/RouteError/RouteError'
import RouteFallback from '@components/common/RouteFallback/RouteFallback'
import { RequireAdmin, RequireAuth } from '@components/route'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import type { ComponentType } from 'react'

import App from '@/App'

type PageModule = {
  default: ComponentType
}

// Vite emits content-hashed chunk filenames, so a redeploy mid-session can
// 404 the lazy chunks an already-open tab still references. On the first
// failed page-chunk load, force one full reload to pick up the fresh asset
// graph. The sessionStorage guard deliberately survives that reload — it is
// cleared only after a chunk loads successfully — so a second consecutive
// failure falls through to the route error boundary instead of reload-looping.
export const CHUNK_RETRY_KEY = 'promptmarket-chunk-retry'

// Web Storage can throw a SecurityError on mere access (sandboxed embeds,
// strict privacy modes). Treat unreadable storage as "already retried" so we
// never enter a reload loop we cannot guard, and only reload when the guard
// was actually persisted.
function hasRetryGuard(): boolean {
  try {
    return sessionStorage.getItem(CHUNK_RETRY_KEY) !== null
  } catch {
    return true
  }
}

function armRetryGuard(): boolean {
  try {
    sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
    return true
  } catch {
    return false
  }
}

function clearRetryGuard(): void {
  try {
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
  } catch {
    // storage unavailable — nothing persisted, nothing to clear
  }
}

export async function importWithRetry<T>(factory: () => Promise<T>): Promise<T> {
  try {
    const mod = await factory()
    clearRetryGuard()
    return mod
  } catch (err) {
    if (!hasRetryGuard() && armRetryGuard()) {
      window.location.reload()
      // Never settle: keep the current fallback on screen while the browser
      // tears the document down for the reload.
      return new Promise<never>(() => {})
    }
    throw err
  }
}

function lazyPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Component } = await importWithRetry(loader)
    return { Component }
  }
}

function lazyProtectedPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Page } = await importWithRetry(loader)

    function ProtectedPage() {
      return (
        <RequireAuth>
          <Page />
        </RequireAuth>
      )
    }

    return { Component: ProtectedPage }
  }
}

function lazyAdminProtectedPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Page } = await importWithRetry(loader)

    function ProtectedPage() {
      return (
        <RequireAdmin>
          <Page />
        </RequireAdmin>
      )
    }

    return { Component: ProtectedPage }
  }
}

export const routes = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />,
    // Rendered during the initial route resolution / hydration; without it
    // React Router logs a "No `HydrateFallback` element provided" warning.
    HydrateFallback: RouteFallback,
    children: [
      { index: true, lazy: lazyPage(() => import('@pages/Home')) },
      { path: 'browse', lazy: lazyPage(() => import('@pages/Browse')) },
      // The catalog index lives at /browse; /listings has no own page, so
      // treat the bare path as a common typo and redirect instead of 404ing.
      { path: 'listings', element: <Navigate to="/browse" replace /> },
      {
        path: 'listings/:slug',
        lazy: lazyPage(() => import('@pages/ListingDetail')),
      },
      {
        path: 'sell',
        lazy: lazyProtectedPage(() => import('@pages/CreateListing')),
      },
      { path: 'login', lazy: lazyPage(() => import('@pages/Login')) },
      { path: 'register', lazy: lazyPage(() => import('@pages/Register')) },
      { path: 'users/:username', lazy: lazyPage(() => import('@pages/Profile')) },
      {
        path: 'dashboard',
        lazy: lazyProtectedPage(() => import('@pages/Dashboard')),
      },
      {
        path: 'admin',
        lazy: lazyAdminProtectedPage(() => import('@pages/Admin')),
      },
      {
        path: 'admin/moderation',
        lazy: lazyAdminProtectedPage(() => import('@pages/AdminModeration')),
      },
      {
        path: 'admin/reviews',
        lazy: lazyAdminProtectedPage(() => import('@pages/AdminReviews')),
      },
      {
        path: 'admin/members',
        lazy: lazyAdminProtectedPage(() => import('@pages/AdminMembers')),
      },
      // Community boards — reading is public, posting requires a session.
      { path: 'community', lazy: lazyPage(() => import('@pages/Community')) },
      {
        path: 'community/new',
        lazy: lazyProtectedPage(() => import('@pages/CommunityNew')),
      },
      {
        path: 'community/:id',
        lazy: lazyPage(() => import('@pages/CommunityThread')),
      },
      // Buyer ↔ seller Q&A — strictly personal, so both routes are gated.
      {
        path: 'messages',
        lazy: lazyProtectedPage(() => import('@pages/Messages')),
      },
      {
        path: 'messages/:id',
        lazy: lazyProtectedPage(() => import('@pages/MessageThread')),
      },
      // In-app inquiry form posting to the external TermsDesk intake.
      { path: 'support', lazy: lazyPage(() => import('@pages/Support')) },
      // Legal documents — one lazy page module serves both paths and picks
      // the policy slug from the pathname.
      { path: 'terms', lazy: lazyPage(() => import('@pages/Policy')) },
      { path: 'privacy', lazy: lazyPage(() => import('@pages/Policy')) },
      { path: '*', lazy: lazyPage(() => import('@pages/NotFound')) },
    ],
  },
] satisfies RouteObject[]

export const router = createBrowserRouter(routes)
