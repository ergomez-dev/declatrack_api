import prisma from '../../config/database';
import { PERMISOS_DEFAULTS } from '../../config/permisos.defaults';
import { RolUsuario, ModuloSistema, AccionPermiso } from '@prisma/client';
import { CreateOverrideDto } from './rol.schema';

export async function resolvePermisos(tenantId: string, usuarioId: string, rolBase: RolUsuario) {
  const permisos = JSON.parse(JSON.stringify(PERMISOS_DEFAULTS[rolBase])) as Record<string, Record<string, boolean>>;

  const usuarioRoles = await prisma.usuarioRol.findMany({
    where: { tenantId, usuarioId },
    include: { rol: { include: { permisos: true } } },
  });

  for (const ur of usuarioRoles) {
    for (const rp of ur.rol.permisos) {
      if (!permisos[rp.modulo]) permisos[rp.modulo] = {};
      permisos[rp.modulo][rp.accion] = rp.permitido;
    }
  }

  const overrides = await prisma.usuarioPermiso.findMany({ where: { tenantId, usuarioId } });
  for (const ov of overrides) {
    if (!permisos[ov.modulo]) permisos[ov.modulo] = {};
    permisos[ov.modulo][ov.accion] = ov.tipo === 'GRANT';
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

export async function assignRol(tenantId: string, usuarioId: string, rolId: string) {
  return prisma.usuarioRol.upsert({
    where: { tenantId_usuarioId_rolId: { tenantId, usuarioId, rolId } },
    create: { tenantId, usuarioId, rolId },
    update: {},
  });
}

export async function unassignRol(tenantId: string, usuarioId: string, rolId: string) {
  return prisma.usuarioRol.delete({ where: { tenantId_usuarioId_rolId: { tenantId, usuarioId, rolId } } });
}
