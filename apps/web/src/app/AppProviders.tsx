import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { appQueryClient } from './queryClient';
import { router } from '@router/index';
import { initTheme } from '@store/theme';

initTheme();

export default function AppProviders() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            borderRadius: '12px',
            boxShadow:
              '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)',
            border: '1px solid var(--toast-border)',
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            fontSize: '0.875rem',
          },
        }}
      />
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
