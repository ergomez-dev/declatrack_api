import prisma from '../../config/database';
import { ModuloSistema, AccionPermiso } from '@prisma/client';
import { CreateOverrideDto } from './rol.schema';

// Espejo de buildPermisos (permiso.middleware) — usado por GET /roles/mis-permisos.
export async function resolvePermisos(tenantId: string | undefined, usuarioId: string, rolId: string) {
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

export async function findOverrides(tenantId: string, usuarioId: string) {
  return prisma.usuarioPermiso.findMany({ where: { tenantId, usuarioId } });
}

export async function upsertOverride(tenantId: string, data: CreateOverrideDto, adminId: string) {
  return prisma.usuarioPermiso.upsert({
    where: { tenantId_usuarioId_modulo_accion: { tenantId, usuarioId: data.usuarioId, modulo: data.modulo as ModuloSistema, accion: data.accion as AccionPermiso } },
    create: { tenantId, usuarioId: data.usuarioId, modulo: data.modulo as ModuloSistema, accion: data.accion as AccionPermiso, tipo: data.tipo, razon: data.razon, createdBy: adminId },
    update: { tipo: data.tipo, razon: data.razon },
  });
}

export async function removeOverride(overrideId: string) {
  return prisma.usuarioPermiso.delete({ where: { id: overrideId } });
}

// Cambia el rol de un usuario (usuarios.id_rol). El rol debe pertenecer al tenant o ser de sistema.
export async function assignRol(tenantId: string, usuarioId: string, rolId: string) {
  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, tenantId } });
  if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

  const rol = await prisma.rol.findFirst({ where: { id: rolId, OR: [{ tenantId }, { tenantId: null, esSistema: true }] } });
  if (!rol) throw Object.assign(new Error('Rol no encontrado'), { statusCode: 404 });
  if (rol.nombre === 'SUPERADMIN') throw Object.assign(new Error('No se puede asignar el rol SUPERADMIN'), { statusCode: 400 });

  return prisma.usuario.update({ where: { id: usuarioId }, data: { rolId }, select: { id: true, rolId: true } });
}
