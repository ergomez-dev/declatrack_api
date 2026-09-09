import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as svc from './permiso.service';
import { successResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, requireRole('SUPERADMIN'));

// GET /api/v1/permisos?nombreRol=ADMIN  — listado del catálogo (solo lectura, SUPERADMIN).
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nombreRol = req.query.nombreRol ? String(req.query.nombreRol) : undefined;
    successResponse(res, await svc.findAll({ nombreRol }));
  } catch (e) { next(e); }
});

export default router;
