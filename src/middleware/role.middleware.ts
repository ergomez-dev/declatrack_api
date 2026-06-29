import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';
import { errorResponse } from '../utils/response.util';

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Autenticación requerida', 401);
    }
    if (!roles.includes(req.user.rol as RolUsuario)) {
      return errorResponse(res, 'Permisos insuficientes para esta acción', 403);
    }
    next();
  };
}
