import prisma from '../../config/database';
import { hashPassword } from '../../utils/bcrypt.util';
import { CreateUsuarioDto, UpdateUsuarioDto } from './usuario.schema';

const USUARIO_SELECT = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
  ultimoAcceso: true,
  createdAt: true,
  rol: { select: { id: true, nombre: true } },
} as const;

type UsuarioConRol = { rol: { id: string; nombre: string } } & Record<string, unknown>;
const flatten = <T extends UsuarioConRol>(u: T) => ({ ...u, rol: u.rol.nombre, rolId: u.rol.id });

// El rol asignado por la API debe ser del tenant (o de sistema) y nunca SUPERADMIN.
async function assertRolAsignable(tenantId: string, rolId: string) {
  const rol = await prisma.rol.findFirst({ where: { id: rolId, OR: [{ tenantId }, { tenantId: null, esSistema: true }] } });
  if (!rol) throw Object.assign(new Error('Rol no encontrado'), { statusCode: 400 });
  if (rol.nombre === 'SUPERADMIN') throw Object.assign(new Error('No se puede asignar el rol SUPERADMIN'), { statusCode: 400 });
}

export async function findAll(tenantId: string, query: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { tenantId };
  if (search) where.OR = [{ nombre: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];

  const [data, total] = await Promise.all([
    prisma.usuario.findMany({ where, skip, take: limit, select: USUARIO_SELECT, orderBy: { nombre: 'asc' } }),
    prisma.usuario.count({ where }),
  ]);
  return { data: data.map(flatten), total, page, limit };
}

export async function findById(tenantId: string, id: string) {
  const u = await prisma.usuario.findFirst({ where: { id, tenantId }, select: USUARIO_SELECT });
  if (!u) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  return flatten(u);
}

export async function create(tenantId: string, data: CreateUsuarioDto) {
  await assertRolAsignable(tenantId, data.rolId);
  const hash = await hashPassword(data.password);
  const { password, ...rest } = data;
  const u = await prisma.usuario.create({
    data: { ...rest, tenantId, passwordHash: hash },
    select: USUARIO_SELECT,
  });
  return flatten(u);
}

export async function update(tenantId: string, id: string, data: UpdateUsuarioDto) {
  const exists = await prisma.usuario.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  if (data.rolId) await assertRolAsignable(tenantId, data.rolId);
  const u = await prisma.usuario.update({ where: { id }, data, select: USUARIO_SELECT });
  return flatten(u);
}

export async function resetPassword(tenantId: string, id: string, newPassword: string) {
  const exists = await prisma.usuario.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  const hash = await hashPassword(newPassword);
  return prisma.usuario.update({ where: { id }, data: { passwordHash: hash } });
}
