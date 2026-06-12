import { CHUNK_RETRY_KEY, importWithRetry, routes } from './index'

describe('router routes', () => {
  it('uses a static root route with lazy page modules', () => {
    const root = routes[0]

    expect(root.path).toBe('/')
    expect(root.children?.map((route) => route.path ?? 'index')).toEqual([
      'index',
      'browse',
      'listings',
      'listings/:slug',
      'sell',
      'login',
      'register',
      'users/:username',
      'dashboard',
      'admin',
      'admin/moderation',
      'admin/reviews',
      'admin/members',
      'community',
      'community/new',
      'community/:id',
      'messages',
      'messages/:id',
      'support',
      'terms',
      'privacy',
      '*',
    ])
    // Every child is a lazily-loaded page, except `/listings`, which is a
    // static redirect to `/browse` (an `element`, not a `lazy` loader).
    expect(
      root.children?.every((route) => typeof route.lazy === 'function' || route.path === 'listings')
    ).toBe(true)
    const redirect = root.children?.find((route) => route.path === 'listings')
    expect(redirect?.lazy).toBeUndefined()
    expect(redirect?.element).toBeTruthy()
  })
})

describe('importWithRetry', () => {
  beforeEach(() => {
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
  })

  it('resolves the module and clears the retry guard on success', async () => {
    sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
    const mod = { default: () => null }
    await expect(importWithRetry(async () => mod)).resolves.toBe(mod)
    expect(sessionStorage.getItem(CHUNK_RETRY_KEY)).toBeNull()
  })

  it('arms the guard and never settles on the first chunk failure', async () => {
    // jsdom logs "Not implemented: navigation" for the reload() call below;
    // that noise is expected — only the guard + pending semantics matter.
    const factory = vi.fn().mockRejectedValue(new Error('chunk 404'))
    let settled = false
    const track = () => {
      settled = true
    }
    void importWithRetry(factory).then(track, track)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(factory).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(CHUNK_RETRY_KEY)).toBe('1')
    expect(settled).toBe(false)
  })

  it('rethrows to the error boundary when a reload was already attempted', async () => {
    sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
    const err = new Error('chunk 404 after reload')
    await expect(importWithRetry(() => Promise.reject(err))).rejects.toBe(err)
    // Guard stays set so the failure is not retried again until a load works.
    expect(sessionStorage.getItem(CHUNK_RETRY_KEY)).toBe('1')
  })
})
