import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { tenantMiddleware } from './tenant.middleware';
import { AuthPayload } from '../utils/jwt.util';

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(user?: AuthPayload) {
  return { user } as Request;
}

describe('tenantMiddleware', () => {
  it('bloquea al SUPERADMIN global (tenantId null) en vez de dejar tenantId undefined', () => {
    const req = mockReq({ sub: '1', email: 'admin@declatrack.mx', rol: 'SUPERADMIN', rolId: 'r1', tenantId: null });
    const res = mockRes();
    const next = vi.fn();

    tenantMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(req.tenantId).toBeUndefined();
  });

  it('deja pasar a un usuario de tenant y fija req.tenantId', () => {
    const req = mockReq({ sub: '1', email: 'admin@garcia.mx', rol: 'ADMIN', rolId: 'r2', tenantId: 'tenant-1' });
    const res = mockRes();
    const next = vi.fn();

    tenantMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.tenantId).toBe('tenant-1');
  });

  it('responde 401 si no hay usuario autenticado', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = vi.fn();

    tenantMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
