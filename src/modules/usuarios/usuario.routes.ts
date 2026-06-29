import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUsuarioSchema, updateUsuarioSchema, resetPasswordSchema } from './usuario.schema';
import * as svc from './usuario.service';
import { successResponse, paginatedResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('USUARIOS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await svc.findAll(req.tenantId!, { page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 20), search: req.query.search ? String(req.query.search) : undefined });
    paginatedResponse(res, r.data, r.total, r.page, r.limit);
  } catch (e) { next(e); }
});

router.post('/', requirePermiso('USUARIOS', 'CREAR'), validate(createUsuarioSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.create(req.tenantId!, req.body), 'Usuario creado', 201); } catch (e) { next(e); }
});

router.get('/:id', requirePermiso('USUARIOS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findById(req.tenantId!, String(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', requirePermiso('USUARIOS', 'EDITAR'), validate(updateUsuarioSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.update(req.tenantId!, String(req.params.id), req.body), 'Usuario actualizado'); } catch (e) { next(e); }
});

router.post('/:id/reset-password', requirePermiso('USUARIOS', 'EDITAR'), validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.resetPassword(req.tenantId!, String(req.params.id), req.body.newPassword); successResponse(res, null, 'Contraseña restablecida'); } catch (e) { next(e); }
});

export default router;
