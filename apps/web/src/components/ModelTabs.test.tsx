import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import ModelTabs from './ModelTabs';

function renderTabs() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ModelTabs />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<ModelTabs />', () => {
  it('renders all five family tabs', () => {
    renderTabs();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(5);
    const labels = tabs.map((t) => t.textContent ?? '');
    expect(labels.some((l) => l.includes('Claude'))).toBe(true);
    expect(labels.some((l) => l.includes('GPT'))).toBe(true);
    expect(labels.some((l) => l.includes('Gemini'))).toBe(true);
    expect(labels.some((l) => l.includes('Llama'))).toBe(true);
    expect(labels.some((l) => l.includes('에디터'))).toBe(true);
  });

  it('marks Claude as active by default', () => {
    renderTabs();
    const claude = screen.getByRole('tab', { name: /Claude/ });
    expect(claude.getAttribute('aria-selected')).toBe('true');
  });

  it('switches the active tab on click', () => {
    renderTabs();
    const gpt = screen.getByRole('tab', { name: /GPT/ });
    fireEvent.click(gpt);
    expect(gpt.getAttribute('aria-selected')).toBe('true');
    const claude = screen.getByRole('tab', { name: /Claude/ });
    expect(claude.getAttribute('aria-selected')).toBe('false');
  });
});
