import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createDeclaracionSchema, updateDeclaracionSchema } from './declaracion.schema';
import * as svc from './declaracion.service';
import { successResponse, paginatedResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('DECLARACIONES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      contribuyenteId: req.query.contribuyenteId ? String(req.query.contribuyenteId) : undefined,
      periodo: req.query.periodo ? String(req.query.periodo) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
    };
    const r = await svc.findAll(req.tenantId!, q);
    paginatedResponse(res, r.data, r.total, r.page, r.limit);
  } catch (e) { next(e); }
});

router.post('/', requirePermiso('DECLARACIONES', 'CREAR'), validate(createDeclaracionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.create(req.tenantId!, req.body, req.user!.sub), 'Declaración creada', 201); } catch (e) { next(e); }
});

router.get('/:id', requirePermiso('DECLARACIONES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findById(req.tenantId!, String(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', requirePermiso('DECLARACIONES', 'EDITAR'), validate(updateDeclaracionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.update(req.tenantId!, String(req.params.id), req.body), 'Actualizado'); } catch (e) { next(e); }
});

router.delete('/:id', requirePermiso('DECLARACIONES', 'ELIMINAR'), async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.remove(req.tenantId!, String(req.params.id)); successResponse(res, null, 'Eliminado'); } catch (e) { next(e); }
});

export default router;
