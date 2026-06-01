import { routes } from './index'

describe('router routes', () => {
  it('uses a static root route with lazy page modules', () => {
    const root = routes[0]

    expect(root.path).toBe('/')
    expect(root.children?.map((route) => route.path ?? 'index')).toEqual([
      'index',
      'browse',
      'listings/:slug',
      'sell',
      'login',
      'register',
      'users/:username',
      'dashboard',
      'admin',
      '*',
    ])
    expect(root.children?.every((route) => typeof route.lazy === 'function')).toBe(true)
  })
})
