import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';
import { env } from '../config/env';

export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El registro ya existe (duplicado)' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Referencia a registro inexistente' });
    }
  }

  const status = 500;
  const message = 'Error interno del servidor';
  const stack = env.NODE_ENV !== 'production' ? err.stack : undefined;

  return res.status(status).json({ success: false, message, ...(stack ? { stack } : {}) });
}
