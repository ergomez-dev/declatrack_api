import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Autenticación requerida', 401);
    }
    if (!roles.includes(req.user.rol)) {
      return errorResponse(res, 'Permisos insuficientes para esta acción', 403);
    }
    next();
  };
}
