import prisma from '../../config/database';
import { hashPassword } from '../../utils/bcrypt.util';
import { CreateUsuarioDto, UpdateUsuarioDto } from './usuario.schema';

export async function findAll(tenantId: string, query: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { tenantId };
  if (search) where.OR = [{ nombre: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];

  const [data, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAcceso: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.usuario.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function findById(tenantId: string, id: string) {
  const u = await prisma.usuario.findFirst({
    where: { id, tenantId },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAcceso: true, createdAt: true, usuarioRoles: { include: { rol: true } } },
  });
  if (!u) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  return u;
}

export async function create(tenantId: string, data: CreateUsuarioDto) {
  const hash = await hashPassword(data.password);
  const { password, ...rest } = data;
  return prisma.usuario.create({
    data: { ...rest, tenantId, passwordHash: hash },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
}

export async function update(tenantId: string, id: string, data: UpdateUsuarioDto) {
  const exists = await prisma.usuario.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  return prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, updatedAt: true },
  });
}

export async function resetPassword(tenantId: string, id: string, newPassword: string) {
  const exists = await prisma.usuario.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  const hash = await hashPassword(newPassword);
  return prisma.usuario.update({ where: { id }, data: { passwordHash: hash } });
}
