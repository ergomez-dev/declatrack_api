import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import * as svc from './carga-masiva.service';
import { successResponse, errorResponse } from '../../utils/response.util';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ok = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.toLowerCase().endsWith('.xlsx');
    if (!ok) return cb(new Error('Solo se aceptan archivos .xlsx'));
    cb(null, true);
  },
});

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/plantilla', requirePermiso('CONTRIBUYENTES', 'CREAR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear();
    const wb = await svc.generarPlantilla(anio);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="plantilla-carga-masiva-${anio}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
});

router.post('/importar', requirePermiso('CONTRIBUYENTES', 'CREAR'), upload.single('archivo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return errorResponse(res, 'Debe adjuntar un archivo .xlsx en el campo "archivo"', 422);
    const resumen = await svc.importar(req.tenantId!, req.user!.sub, req.file.buffer);
    successResponse(res, resumen, 'Carga masiva procesada');
  } catch (e) { next(e); }
});

export default router;
