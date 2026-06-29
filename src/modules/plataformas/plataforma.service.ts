import prisma from '../../config/database';
import { encryptText, decryptText } from '../../utils/crypto.util';
import { CreateAccesoDto, UpdateAccesoDto } from './plataforma.schema';

export async function findAll(tenantId: string, contribuyenteId?: string) {
  const where: Record<string, unknown> = { tenantId };
  if (contribuyenteId) where.contribuyenteId = contribuyenteId;

  const accesos = await prisma.accesoPlataforma.findMany({
    where,
    include: { contribuyente: { select: { rfc: true, nombre: true } } },
    orderBy: { plataforma: 'asc' },
  });

  return accesos.map(({ passwordEncriptado, ...rest }) => rest);
}

export async function findById(tenantId: string, id: string, includePassword = false) {
  const a = await prisma.accesoPlataforma.findFirst({ where: { id, tenantId }, include: { contribuyente: true } });
  if (!a) throw Object.assign(new Error('Acceso no encontrado'), { statusCode: 404 });

  const { passwordEncriptado, ...rest } = a;
  if (includePassword) {
    return { ...rest, password: decryptText(passwordEncriptado) };
  }
  return rest;
}

export async function create(tenantId: string, data: CreateAccesoDto) {
  const { password, ...rest } = data;
  return prisma.accesoPlataforma.create({
    data: { ...rest, tenantId, passwordEncriptado: encryptText(password) },
    include: { contribuyente: { select: { rfc: true, nombre: true } } },
  }).then(({ passwordEncriptado, ...r }) => r);
}

export async function update(tenantId: string, id: string, data: UpdateAccesoDto) {
  const exists = await prisma.accesoPlataforma.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Acceso no encontrado'), { statusCode: 404 });

  const { password, ...rest } = data;
  return prisma.accesoPlataforma.update({
    where: { id },
    data: { ...rest, ...(password ? { passwordEncriptado: encryptText(password) } : {}) },
  }).then(({ passwordEncriptado, ...r }) => r);
}

export async function remove(tenantId: string, id: string) {
  const exists = await prisma.accesoPlataforma.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Acceso no encontrado'), { statusCode: 404 });
  return prisma.accesoPlataforma.delete({ where: { id } });
}
