import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useRouteError: vi.fn(),
    isRouteErrorResponse: vi.fn(),
  };
});

import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import RouteError from './RouteError';

function renderRouteError() {
  return render(
    <MemoryRouter>
      <RouteError />
    </MemoryRouter>,
  );
}

describe('RouteError', () => {
  it('shows the status and statusText when isRouteErrorResponse returns true', () => {
    (useRouteError as unknown as Mock).mockReturnValue({ status: 404, statusText: 'Not Found' });
    (isRouteErrorResponse as unknown as Mock).mockReturnValue(true);

    renderRouteError();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('404 Not Found');
  });

  it('shows 문제가 발생했어요 heading when error is a plain Error', () => {
    (useRouteError as unknown as Mock).mockReturnValue(new Error('something went wrong'));
    (isRouteErrorResponse as unknown as Mock).mockReturnValue(false);

    renderRouteError();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('문제가 발생했어요');
  });

  it('shows the error message when error is a plain Error', () => {
    (useRouteError as unknown as Mock).mockReturnValue(new Error('something went wrong'));
    (isRouteErrorResponse as unknown as Mock).mockReturnValue(false);

    renderRouteError();

    expect(screen.getByText('something went wrong')).toBeTruthy();
  });

  it('has a 홈으로 link to "/"', () => {
    (useRouteError as unknown as Mock).mockReturnValue(new Error('oops'));
    (isRouteErrorResponse as unknown as Mock).mockReturnValue(false);

    renderRouteError();

    const link = screen.getByRole('link', { name: /홈으로/ });
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).getAttribute('href')).toBe('/');
  });
});
