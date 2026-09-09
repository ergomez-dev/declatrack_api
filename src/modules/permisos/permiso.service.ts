import prisma from '../../config/database';

// Catálogo legible de permisos (tabla `permisos`). Espejo de rol_permisos, poblado por el seed.
export async function findAll(filtro: { nombreRol?: string }) {
  return prisma.permiso.findMany({
    where: filtro.nombreRol ? { nombreRol: filtro.nombreRol } : undefined,
    orderBy: [{ nombreRol: 'asc' }, { identificador: 'asc' }],
    include: {
      creador: { select: { id: true, nombre: true } },
      modificador: { select: { id: true, nombre: true } },
    },
  });
}
