import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthPayload } from '../utils/jwt.util';
import { errorResponse } from '../utils/response.util';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      tenantId?: string;
      permisos?: Record<string, Record<string, boolean>>;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(res, 'Token de autenticación requerido', 401);
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    const message = err instanceof Error && err.message === 'TOKEN_EXPIRED'
      ? 'Token expirado, inicia sesión nuevamente'
      : 'Token inválido';
    return errorResponse(res, message, 401);
  }
}
