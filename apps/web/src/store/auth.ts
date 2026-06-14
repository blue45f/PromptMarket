import { create } from 'zustand'

import type { User } from '@/types'

const TOKEN_KEY = 'pm_token'

interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: readToken(),
  user: null,
  login: (token, user) => {
    writeToken(token)
    set({ token, user })
  },
  logout: () => {
    writeToken(null)
    set({ token: null, user: null })
  },
  setUser: (user) => set({ user }),
}))
