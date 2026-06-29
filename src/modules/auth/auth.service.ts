import prisma from '../../config/database';
import { comparePassword, hashPassword } from '../../utils/bcrypt.util';
import { signToken } from '../../utils/jwt.util';
import { LoginDto, ChangePasswordDto } from './auth.schema';

const INVALID_MSG = 'Credenciales incorrectas';

export async function login(data: LoginDto, ip?: string) {
  let usuario;
  let tenant = null;

  if (data.tenantSlug) {
    const t = await prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
      include: { tenantConfig: true },
    });
    if (!t || !t.activo) throw Object.assign(new Error(INVALID_MSG), { statusCode: 401 });
    tenant = t;
    usuario = await prisma.usuario.findFirst({
      where: { email: data.email, tenantId: t.id },
    });
  } else {
    usuario = await prisma.usuario.findFirst({
      where: { email: data.email, tenantId: null, rol: 'SUPERADMIN' },
    });
  }

  if (!usuario || !usuario.activo) throw Object.assign(new Error(INVALID_MSG), { statusCode: 401 });

  const valid = await comparePassword(data.password, usuario.passwordHash);
  if (!valid) throw Object.assign(new Error(INVALID_MSG), { statusCode: 401 });

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } });

  await prisma.auditoria.create({
    data: {
      tenantId: usuario.tenantId,
      usuarioId: usuario.id,
      accion: 'LOGIN',
      entidad: 'usuarios',
      entidadId: usuario.id,
      ipAddress: ip,
    },
  });

  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol, tenantId: usuario.tenantId });

  return {
    token,
    user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tenantId: usuario.tenantId },
    ...(tenant ? { tenant: { id: tenant.id, nombre: tenant.nombre, slug: tenant.slug, config: tenant.tenantConfig } } : {}),
  };
}

export async function getProfile(userId: string, tenantId?: string) {
  const where = tenantId ? { id: userId, tenantId } : { id: userId };
  const usuario = await prisma.usuario.findFirst({
    where,
    select: { id: true, nombre: true, email: true, rol: true, tenantId: true, ultimoAcceso: true, createdAt: true },
  });
  if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  return usuario;
}

export async function changePassword(userId: string, tenantId: string | null, data: ChangePasswordDto) {
  const where = tenantId ? { id: userId, tenantId } : { id: userId };
  const usuario = await prisma.usuario.findFirst({ where });
  if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

  const valid = await comparePassword(data.currentPassword, usuario.passwordHash);
  if (!valid) throw Object.assign(new Error('Contraseña actual incorrecta'), { statusCode: 400 });

  const newHash = await hashPassword(data.newPassword);
  await prisma.usuario.update({ where: { id: userId }, data: { passwordHash: newHash } });
}
