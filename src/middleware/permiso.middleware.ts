import { Request, Response, NextFunction } from 'express';
import { ModuloSistema, AccionPermiso } from '@prisma/client';
import { errorResponse } from '../utils/response.util';
import prisma from '../config/database';

// Resuelve los permisos efectivos del usuario:
//   1. Base: rol_permisos del rol asignado (usuarios.id_rol).
//   2. Overrides por usuario (usuario_permisos, GRANT/REVOKE) — hoy sin uso, se conserva.
async function buildPermisos(
  tenantId: string | undefined,
  usuarioId: string,
  rolId: string
): Promise<Record<string, Record<string, boolean>>> {
  const permisos: Record<string, Record<string, boolean>> = {};

  const rolPermisos = await prisma.rolPermiso.findMany({ where: { rolId } });
  for (const rp of rolPermisos) {
    if (!permisos[rp.modulo]) permisos[rp.modulo] = {};
    permisos[rp.modulo][rp.accion] = rp.permitido;
  }

  if (tenantId) {
    const overrides = await prisma.usuarioPermiso.findMany({ where: { tenantId, usuarioId } });
    for (const ov of overrides) {
      if (!permisos[ov.modulo]) permisos[ov.modulo] = {};
      permisos[ov.modulo][ov.accion] = ov.tipo === 'GRANT';
    }
  }

  return permisos;
}

export function requirePermiso(modulo: ModuloSistema, accion: AccionPermiso) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return errorResponse(res, 'Autenticación requerida', 401);
    if (req.user.rol === 'SUPERADMIN') return next();

    try {
      if (!req.permisos) {
        req.permisos = await buildPermisos(req.tenantId, req.user.sub, req.user.rolId);
      }
      if (req.permisos[modulo]?.[accion]) return next();
      return errorResponse(res, `Sin permiso para ${accion} en ${modulo}`, 403);
    } catch {
      return errorResponse(res, 'Error verificando permisos', 500);
    }
  };
}
