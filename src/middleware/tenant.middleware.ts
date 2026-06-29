import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util';

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return errorResponse(res, 'Autenticación requerida', 401);
  }
  if (req.user.rol === 'SUPERADMIN') {
    req.tenantId = req.user.tenantId ?? undefined;
    return next();
  }
  if (!req.user.tenantId) {
    return errorResponse(res, 'Usuario no asociado a ningún despacho', 403);
  }
  req.tenantId = req.user.tenantId;
  next();
}
