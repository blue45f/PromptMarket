import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import type { AuthUser } from './current-user.decorator';

function makeController(overrides: Record<string, unknown> = {}) {
  const service = {
    register: vi.fn().mockResolvedValue({ token: 't', user: { id: 'u1' } }),
    login: vi.fn().mockResolvedValue({ token: 't', user: { id: 'u1' } }),
    me: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@b.com' }),
    ...overrides,
  };
  return { controller: new AuthController(service as never), service };
}

describe('AuthController', () => {
  it('register forwards the body to AuthService.register', async () => {
    const { controller, service } = makeController();
    const dto = { email: 'a@b.com', username: 'alex', password: 's3c' } as never;
    await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('login forwards the body to AuthService.login', async () => {
    const { controller, service } = makeController();
    const dto = { email: 'a@b.com', password: 's3c' } as never;
    await controller.login(dto);
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('me forwards the JWT-extracted user id', async () => {
    const { controller, service } = makeController();
    await controller.me({ id: 'u1' } as AuthUser);
    expect(service.me).toHaveBeenCalledWith('u1');
  });
});
