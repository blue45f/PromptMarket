import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '@/types';
import { useAuthStore } from './auth';

const TOKEN_KEY = 'pm_token';
const baseUser: User = {
  id: 'u1',
  email: 'a@b.com',
  username: 'alex',
  bio: null,
  avatarUrl: null,
  balanceCents: 0,
};

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null });
});

describe('useAuthStore', () => {
  it('persists the token to localStorage on login', () => {
    useAuthStore.getState().login('tok-1', baseUser);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-1');
    expect(useAuthStore.getState().token).toBe('tok-1');
    expect(useAuthStore.getState().user).toEqual(baseUser);
  });

  it('clears both store + localStorage on logout', () => {
    localStorage.setItem(TOKEN_KEY, 'stale');
    useAuthStore.setState({ token: 'stale', user: baseUser });
    useAuthStore.getState().logout();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setUser updates the user without touching the token', () => {
    useAuthStore.setState({ token: 'tok-1', user: null });
    useAuthStore.getState().setUser(baseUser);
    expect(useAuthStore.getState().user).toEqual(baseUser);
    expect(useAuthStore.getState().token).toBe('tok-1');
  });

  it('setUser(null) clears just the user', () => {
    useAuthStore.setState({ token: 'tok-1', user: baseUser });
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBe('tok-1');
  });
});
