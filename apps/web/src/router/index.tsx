import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import App from '@/App';
import { RequireAuth } from '@components/route';
import RouteError from '@components/common/RouteError/RouteError';

type PageModule = {
  default: ComponentType;
};

function lazyPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Component } = await loader();
    return { Component };
  };
}

function lazyProtectedPage(loader: () => Promise<PageModule>) {
  return async () => {
    const { default: Page } = await loader();

    function ProtectedPage() {
      return (
        <RequireAuth>
          <Page />
        </RequireAuth>
      );
    }

    return { Component: ProtectedPage };
  };
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
      { path: '*', lazy: lazyPage(() => import('@pages/NotFound')) },
    ],
  },
] satisfies RouteObject[];

export const router = createBrowserRouter(routes);
