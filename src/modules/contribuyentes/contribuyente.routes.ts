import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createContribuyenteSchema, updateContribuyenteSchema } from './contribuyente.schema';
import * as svc from './contribuyente.service';
import { successResponse, paginatedResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('CONTRIBUYENTES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      search: req.query.search ? String(req.query.search) : undefined,
      regimen: req.query.regimen ? String(req.query.regimen) : undefined,
      activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
    };
    const r = await svc.findAll(req.tenantId!, q);
    paginatedResponse(res, r.data, r.total, r.page, r.limit);
  } catch (e) { next(e); }
});

router.post('/', requirePermiso('CONTRIBUYENTES', 'CREAR'), validate(createContribuyenteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.create(req.tenantId!, req.body, req.user!.sub), 'Contribuyente creado', 201); } catch (e) { next(e); }
});

router.get('/:id', requirePermiso('CONTRIBUYENTES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findById(req.tenantId!, String(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', requirePermiso('CONTRIBUYENTES', 'EDITAR'), validate(updateContribuyenteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.update(req.tenantId!, String(req.params.id), req.body), 'Contribuyente actualizado'); } catch (e) { next(e); }
});

router.delete('/:id', requirePermiso('CONTRIBUYENTES', 'DESACTIVAR'), async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.softDelete(req.tenantId!, String(req.params.id)); successResponse(res, null, 'Desactivado'); } catch (e) { next(e); }
});

export default router;
