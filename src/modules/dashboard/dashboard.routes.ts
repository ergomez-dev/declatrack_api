import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermiso } from '../../middleware/permiso.middleware';
import prisma from '../../config/database';
import { successResponse } from '../../utils/response.util';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermiso('DASHBOARD', 'VER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const hoy = new Date();
    const en30Dias = new Date(); en30Dias.setDate(hoy.getDate() + 30);

    const [
      totalContribuyentes,
      contribuyentesActivos,
      totalDeclaraciones,
      pendientes,
      presentadas,
      certificadosProximos,
      efirmaVencidos,
      csdVencidos,
      ultimasDeclaraciones,
    ] = await Promise.all([
      prisma.contribuyente.count({ where: { tenantId } }),
      prisma.contribuyente.count({ where: { tenantId, activo: true } }),
      prisma.declaracion.count({ where: { tenantId } }),
      prisma.declaracion.count({ where: { tenantId, statusDeclaracion: 'PENDIENTE' } }),
      prisma.declaracion.count({ where: { tenantId, statusDeclaracion: 'PRESENTADA' } }),
      prisma.certificado.count({ where: { tenantId, fechaVencimiento: { lte: en30Dias } } }),
      prisma.certificado.count({ where: { tenantId, tipo: 'EFIRMA', fechaVencimiento: { lte: hoy } } }),
      prisma.certificado.count({ where: { tenantId, tipo: 'CSD', fechaVencimiento: { lte: hoy } } }),
      prisma.declaracion.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { contribuyente: { select: { nombre: true, rfc: true } } },
      }),
    ]);

    successResponse(res, {
      contribuyentes: { total: totalContribuyentes, activos: contribuyentesActivos },
      declaraciones: { total: totalDeclaraciones, pendientes, presentadas },
      certificados: { proximosVencer: certificadosProximos, efirmaVencidos, csdVencidos },
      ultimasDeclaraciones,
    });
  } catch (e) { next(e); }
});

export default router;
