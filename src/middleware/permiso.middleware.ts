import { Request, Response, NextFunction } from 'express';
import { ModuloSistema, AccionPermiso } from '@prisma/client';
import { errorResponse } from '../utils/response.util';
import { PERMISOS_DEFAULTS } from '../config/permisos.defaults';
import prisma from '../config/database';

async function buildPermisos(
  tenantId: string,
  usuarioId: string,
  rolBase: keyof typeof PERMISOS_DEFAULTS
): Promise<Record<string, Record<string, boolean>>> {
  const permisos = JSON.parse(JSON.stringify(PERMISOS_DEFAULTS[rolBase])) as Record<string, Record<string, boolean>>;

  const usuarioRoles = await prisma.usuarioRol.findMany({
    where: { tenantId, usuarioId },
    include: { rol: { include: { permisos: true } } },
  });

  for (const ur of usuarioRoles) {
    for (const rp of ur.rol.permisos) {
      if (!permisos[rp.modulo]) permisos[rp.modulo] = {} as Record<string, boolean>;
      permisos[rp.modulo][rp.accion] = rp.permitido;
    }
  }

  const overrides = await prisma.usuarioPermiso.findMany({ where: { tenantId, usuarioId } });
  for (const ov of overrides) {
    if (!permisos[ov.modulo]) permisos[ov.modulo] = {} as Record<string, boolean>;
    permisos[ov.modulo][ov.accion] = ov.tipo === 'GRANT';
  }

  return permisos;
}

export function requirePermiso(modulo: ModuloSistema, accion: AccionPermiso) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return errorResponse(res, 'Autenticación requerida', 401);
    if (req.user.rol === 'SUPERADMIN') return next();

    try {
      if (!req.permisos) {
        req.permisos = await buildPermisos(
          req.tenantId!,
          req.user.sub,
          req.user.rol as keyof typeof PERMISOS_DEFAULTS
        );
      }
      if (req.permisos[modulo]?.[accion]) return next();
      return errorResponse(res, `Sin permiso para ${accion} en ${modulo}`, 403);
    } catch {
      return errorResponse(res, 'Error verificando permisos', 500);
    }
  };
}
