import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util';

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return errorResponse(res, 'Autenticación requerida', 401);
  }
  // El SUPERADMIN global (tenantId null) no tiene despacho propio: dejarlo pasar con
  // tenantId undefined haría que Prisma ignore el filtro (where: { tenantId: undefined }
  // no filtra) y mezcle datos de todos los despachos en las rutas tenant-scoped.
  if (!req.user.tenantId) {
    return errorResponse(res, 'SUPERADMIN no tiene un despacho asociado; usa el módulo de Tenants', 403);
  }
  req.tenantId = req.user.tenantId;
  next();
}
