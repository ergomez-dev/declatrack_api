import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createRolSchema, updateRolSchema, createOverrideSchema, assignRolSchema } from './rol.schema';
import * as rolSvc from './rol.service';
import * as permisoSvc from './permiso.service';
import { successResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('ROLES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await rolSvc.findAllRoles(req.tenantId!)); } catch (e) { next(e); }
});

router.get('/matrix', requirePermiso('ROLES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await rolSvc.getRolMatrix(req.tenantId!)); } catch (e) { next(e); }
});

router.get('/mis-permisos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await permisoSvc.resolvePermisos(req.tenantId, req.user!.sub, req.user!.rolId);
    successResponse(res, p);
  } catch (e) { next(e); }
});

router.post('/', requirePermiso('ROLES', 'CREAR'), validate(createRolSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await rolSvc.createRol(req.tenantId!, req.body), 'Rol creado', 201); } catch (e) { next(e); }
});

router.get('/:id', requirePermiso('ROLES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await rolSvc.findRolById(req.tenantId!, String(req.params.id))); } catch (e) { next(e); }
});

router.put('/:id', requirePermiso('ROLES', 'EDITAR'), validate(updateRolSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await rolSvc.updateRol(req.tenantId!, String(req.params.id), req.body), 'Rol actualizado'); } catch (e) { next(e); }
});

router.delete('/:id', requirePermiso('ROLES', 'ELIMINAR'), async (req: Request, res: Response, next: NextFunction) => {
  try { await rolSvc.removeRol(req.tenantId!, String(req.params.id)); successResponse(res, null, 'Rol eliminado'); } catch (e) { next(e); }
});

router.get('/usuarios/:uid/permisos', requirePermiso('ROLES', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await permisoSvc.findOverrides(req.tenantId!, String(req.params.uid))); } catch (e) { next(e); }
});

router.post('/usuarios/:uid/permisos', requirePermiso('ROLES', 'EDITAR'), validate(createOverrideSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await permisoSvc.upsertOverride(req.tenantId!, req.body, req.user!.sub), 'Override creado', 201); } catch (e) { next(e); }
});

router.delete('/permisos/:overrideId', requirePermiso('ROLES', 'EDITAR'), async (req: Request, res: Response, next: NextFunction) => {
  try { await permisoSvc.removeOverride(String(req.params.overrideId)); successResponse(res, null, 'Override eliminado'); } catch (e) { next(e); }
});

router.post('/usuarios/:uid/asignar', requirePermiso('ROLES', 'EDITAR'), validate(assignRolSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { successResponse(res, await permisoSvc.assignRol(req.tenantId!, String(req.params.uid), req.body.rolId), 'Rol asignado'); } catch (e) { next(e); }
});

export default router;
