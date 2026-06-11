import { describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '../auth/current-user.decorator'
import { ReviewsController } from './reviews.controller'

describe('ReviewsController', () => {
  function makeController(serviceOverrides: Record<string, unknown> = {}) {
    const service = {
      listForListing: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'r1' }),
      createReply: vi.fn().mockResolvedValue({ id: 'reply-1' }),
      ...serviceOverrides,
    }
    // The controller's only collaborator is ReviewsService. Skip Nest's DI
    // module-compile path (which transitively loads Prisma) and instantiate
    // directly with the mock — the controller is a pure thin proxy.
    const controller = new ReviewsController(service as never)
    return { controller, service }
  }

  it('GET :id/reviews proxies to ReviewsService.listForListing', async () => {
    const { controller, service } = makeController()
    await controller.list('listing-1')
    expect(service.listForListing).toHaveBeenCalledWith('listing-1')
  })

  it('POST :id/reviews forwards the auth user id and body', async () => {
    const { controller, service } = makeController()
    const user: AuthUser = { id: 'u1', email: 'u1@example.com', username: 'user-u1' }
    await controller.create(user, 'listing-1', { rating: 5, comment: 'good', attachments: [] })
    expect(service.create).toHaveBeenCalledWith('u1', 'listing-1', {
      rating: 5,
      comment: 'good',
      attachments: [],
    })
  })

  it('DELETE replies route forwards the full id chain', async () => {
    const { controller, service } = makeController({
      deleteReply: vi.fn().mockResolvedValue({ ok: true }),
    })
    const user: AuthUser = { id: 'u1', email: 'u1@example.com', username: 'user-u1' }
    await controller.deleteReply(user, 'listing-1', 'review-1', 'reply-1')
    expect(
      (service as unknown as { deleteReply: ReturnType<typeof vi.fn> }).deleteReply
    ).toHaveBeenCalledWith(user, 'listing-1', 'review-1', 'reply-1')
  })

  it('POST :id/reviews/:reviewId/replies forwards listing, review, user, and body', async () => {
    const { controller, service } = makeController()
    const user: AuthUser = { id: 'u1', email: 'u1@example.com', username: 'user-u1' }
    await controller.createReply(user, 'listing-1', 'review-1', {
      body: 'Thanks for the setup note.',
    })
    expect(service.createReply).toHaveBeenCalledWith('u1', 'listing-1', 'review-1', {
      body: 'Thanks for the setup note.',
    })
  })

  it('propagates errors from the service back to the caller', async () => {
    const err = new Error('boom')
    const { controller } = makeController({
      listForListing: vi.fn().mockRejectedValue(err),
    })
    await expect(controller.list('x')).rejects.toBe(err)
  })
})
