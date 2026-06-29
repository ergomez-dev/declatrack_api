import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createCertificadoSchema, updateCertificadoSchema } from './certificado.schema';
import * as svc from './certificado.service';
import { successResponse, paginatedResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('CERTIFICADOS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      contribuyenteId: req.query.contribuyenteId ? String(req.query.contribuyenteId) : undefined,
      tipo: req.query.tipo ? String(req.query.tipo) : undefined,
      vencidosEn: req.query.vencidosEn ? Number(req.query.vencidosEn) : undefined,
    };
    const r = await svc.findAll(req.tenantId!, q);
    paginatedResponse(res, r.data, r.total, r.page, r.limit);
  } catch (e) { next(e); }
});

router.get('/proximos-vencer', requirePermiso('CERTIFICADOS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.getProximosVencer(req.tenantId!, Number(req.query.dias ?? 30))); } catch (e) { next(e); }
});

router.post('/', requirePermiso('CERTIFICADOS', 'CREAR'), validate(createCertificadoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.create(req.tenantId!, req.body), 'Certificado creado', 201); } catch (e) { next(e); }
});

router.get('/:id', requirePermiso('CERTIFICADOS', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.findById(req.tenantId!, String(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', requirePermiso('CERTIFICADOS', 'EDITAR'), validate(updateCertificadoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await svc.update(req.tenantId!, String(req.params.id), req.body), 'Actualizado'); } catch (e) { next(e); }
});

router.delete('/:id', requirePermiso('CERTIFICADOS', 'ELIMINAR'), async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.remove(req.tenantId!, String(req.params.id)); successResponse(res, null, 'Eliminado'); } catch (e) { next(e); }
});

export default router;
