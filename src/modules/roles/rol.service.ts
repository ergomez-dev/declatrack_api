import prisma from '../../config/database';
import { CreateRolDto, UpdateRolDto } from './rol.schema';
import { ModuloSistema, AccionPermiso } from '@prisma/client';

const SISTEMA_NOMBRES = ['SUPERADMIN', 'ADMIN', 'GESTOR', 'VIEWER'];

// Sin la matriz de permisos: ningún caller de este listado la usa (ni la tabla de
// Roles ni los selectores de rol en Usuarios/Permisos), y exponerla igual filtraría
// la matriz completa a cualquier usuario del tenant al abrir este endpoint sin permiso.
// El detalle de un rol (findRolById) y /roles/matrix sí la incluyen porque ahí se muestra.
export async function findAllRoles(tenantId: string) {
  return prisma.rol.findMany({
    where: { OR: [{ tenantId }, { tenantId: null, esSistema: true }] },
    include: {
      _count: { select: { usuarios: true } },
    },
    orderBy: [{ esSistema: 'desc' }, { nombre: 'asc' }],
  });
}

export async function findRolById(tenantId: string, rolId: string) {
  const rol = await prisma.rol.findFirst({
    where: { id: rolId, OR: [{ tenantId }, { tenantId: null, esSistema: true }] },
    include: { permisos: true, _count: { select: { usuarios: true } } },
  });
  if (!rol) throw Object.assign(new Error('Rol no encontrado'), { statusCode: 404 });
  return rol;
}

export async function createRol(tenantId: string, data: CreateRolDto) {
  if (SISTEMA_NOMBRES.includes(data.nombre)) {
    throw Object.assign(new Error('Nombre reservado para roles de sistema'), { statusCode: 400 });
  }
  return prisma.rol.create({
    data: {
      tenantId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      color: data.color,
      permisos: {
        createMany: {
          data: (data.permisos ?? []).map((p) => ({ modulo: p.modulo as ModuloSistema, accion: p.accion as AccionPermiso, permitido: p.permitido })),
          skipDuplicates: true,
        },
      },
    },
    include: { permisos: true },
  });
}

export async function updateRol(tenantId: string, rolId: string, data: UpdateRolDto) {
  const existing = await findRolById(tenantId, rolId);
  if (existing.esSistema) throw Object.assign(new Error('No se puede modificar un rol de sistema'), { statusCode: 400 });

  return prisma.$transaction(async (tx) => {
    if (data.permisos !== undefined) {
      await tx.rolPermiso.deleteMany({ where: { rolId } });
      if (data.permisos.length > 0) {
        await tx.rolPermiso.createMany({
          data: data.permisos.map((p) => ({ rolId, modulo: p.modulo as ModuloSistema, accion: p.accion as AccionPermiso, permitido: p.permitido })),
          skipDuplicates: true,
        });
      }
    }
    return tx.rol.update({
      where: { id: rolId },
      data: { nombre: data.nombre, descripcion: data.descripcion, color: data.color },
      include: { permisos: true },
    });
  });
}

export async function removeRol(tenantId: string, rolId: string) {
  const existing = await findRolById(tenantId, rolId);
  if (existing.esSistema) throw Object.assign(new Error('No se puede eliminar un rol de sistema'), { statusCode: 400 });

  const asignados = await prisma.usuario.findMany({ where: { rolId }, select: { nombre: true, email: true } });
  if (asignados.length > 0) {
    const err = Object.assign(new Error('El rol tiene usuarios asignados'), { statusCode: 409 });
    (err as unknown as Record<string, unknown>).usuarios = asignados;
    throw err;
  }

  return prisma.rol.delete({ where: { id: rolId } });
}

export async function getRolMatrix(tenantId: string) {
  const roles = await prisma.rol.findMany({
    where: { OR: [{ tenantId }, { tenantId: null, esSistema: true }] },
    include: { permisos: true },
  });

  const modulos: ModuloSistema[] = ['DASHBOARD','CONTRIBUYENTES','DECLARACIONES','CERTIFICADOS','PLATAFORMAS','USUARIOS','ROLES','CONFIGURACION','EXPORTAR'];
  const acciones: AccionPermiso[] = ['VER','CREAR','EDITAR','ELIMINAR','ACTIVAR','DESACTIVAR'];

  return roles.map((rol) => ({
    id: rol.id,
    nombre: rol.nombre,
    esSistema: rol.esSistema,
    matriz: modulos.map((modulo) => ({
      modulo,
      acciones: acciones.map((accion) => ({
        accion,
        permitido: rol.permisos.find((p) => p.modulo === modulo && p.accion === accion)?.permitido ?? false,
      })),
    })),
  }));
}
