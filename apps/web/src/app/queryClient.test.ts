import { createAppQueryClient } from './queryClient';

describe('createAppQueryClient', () => {
  it('keeps the marketplace query defaults in a reusable factory', () => {
    const client = createAppQueryClient();
    const defaults = client.getDefaultOptions().queries;

    expect(defaults?.staleTime).toBe(30_000);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
    expect(defaults?.retry).toBe(1);
  });
});
