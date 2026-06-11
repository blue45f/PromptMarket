import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import App from '@/App'
import { RequireAdmin, RequireAuth } from '@components/route'
import RouteError from '@components/common/RouteError/RouteError'

type PageModule = {
  default: ComponentType
}

function lazyPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Component } = await loader()
    return { Component }
  }
}

function lazyProtectedPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Page } = await loader()

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
    const { default: Page } = await loader()

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
    children: [
      { index: true, lazy: lazyPage(() => import('@pages/Home')) },
      { path: 'browse', lazy: lazyPage(() => import('@pages/Browse')) },
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
