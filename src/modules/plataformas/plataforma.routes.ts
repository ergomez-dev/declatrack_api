import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createAccesoSchema, updateAccesoSchema } from './plataforma.schema';
import * as svc from './plataforma.service';
import { successResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('PLATAFORMAS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findAll(req.tenantId!, req.query.contribuyenteId ? String(req.query.contribuyenteId) : undefined)); } catch (e) { next(e); }
});

router.post('/', requirePermiso('PLATAFORMAS', 'CREAR'), validate(createAccesoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.create(req.tenantId!, req.body), 'Acceso creado', 201); } catch (e) { next(e); }
});

router.get('/:id', requirePermiso('PLATAFORMAS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findById(req.tenantId!, String(req.params.id), req.query.withPassword === 'true')); } catch (e) { next(e); }
});

router.put('/:id', requirePermiso('PLATAFORMAS', 'EDITAR'), validate(updateAccesoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.update(req.tenantId!, String(req.params.id), req.body), 'Acceso actualizado'); } catch (e) { next(e); }
});

router.delete('/:id', requirePermiso('PLATAFORMAS', 'ELIMINAR'), async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.remove(req.tenantId!, String(req.params.id)); successResponse(res, null, 'Acceso eliminado'); } catch (e) { next(e); }
});

export default router;
