import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createTenantSchema, updateTenantSchema, updateTenantConfigSchema } from './tenant.schema';
import * as svc from './tenant.service';
import { successResponse, paginatedResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, requireRole('SUPERADMIN'));

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.findAllTenants({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search ? String(req.query.search) : undefined,
    });
    paginatedResponse(res, result.data, result.total, result.page, result.limit);
  } catch (e) { next(e); }
});

router.post('/', validate(createTenantSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.createTenant(req.body), 'Tenant creado', 201); } catch (e) { next(e); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findTenantById(String(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', validate(updateTenantSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.updateTenant(String(req.params.id), req.body), 'Tenant actualizado'); } catch (e) { next(e); }
});

router.put('/:id/config', validate(updateTenantConfigSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.updateTenantConfig(String(req.params.id), req.body), 'Config actualizada'); } catch (e) { next(e); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.deactivateTenant(String(req.params.id)); successResponse(res, null, 'Tenant desactivado'); } catch (e) { next(e); }
});

router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.getTenantStats(String(req.params.id))); } catch (e) { next(e); }
});

export default router;
