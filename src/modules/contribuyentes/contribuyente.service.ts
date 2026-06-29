import prisma from '../../config/database';
import { CreateContribuyenteDto, UpdateContribuyenteDto } from './contribuyente.schema';

export async function findAll(tenantId: string, query: { page: number; limit: number; search?: string; regimen?: string; activo?: boolean }) {
  const { page, limit, search, regimen, activo } = query;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { tenantId };
  if (search) where.OR = [
    { nombre: { contains: search, mode: 'insensitive' } },
    { rfc: { contains: search.toUpperCase() } },
  ];
  if (regimen) where.regimenFiscal = regimen;
  if (activo !== undefined) where.activo = activo;

  const [data, total] = await Promise.all([
    prisma.contribuyente.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' } }),
    prisma.contribuyente.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function findById(tenantId: string, id: string) {
  const c = await prisma.contribuyente.findFirst({
    where: { id, tenantId },
    include: {
      declaraciones: { orderBy: { periodo: 'desc' }, take: 10 },
      certificados: true,
      constanciaFiscal: true,
      accesosPlataforma: true,
      anunciosVencimientos: { where: { alertaEnviada: false }, orderBy: { fechaVencimiento: 'asc' } },
    },
  });
  if (!c) throw Object.assign(new Error('Contribuyente no encontrado'), { statusCode: 404 });
  return c;
}

export async function create(tenantId: string, data: CreateContribuyenteDto, userId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { maxContribuyentes: true } });
  const count = await prisma.contribuyente.count({ where: { tenantId, activo: true } });
  if (tenant && count >= tenant.maxContribuyentes) {
    throw Object.assign(new Error(`Límite de contribuyentes alcanzado (${tenant.maxContribuyentes})`), { statusCode: 400 });
  }
  return prisma.contribuyente.create({ data: { ...data, tenantId } });
}

export async function update(tenantId: string, id: string, data: UpdateContribuyenteDto) {
  const exists = await prisma.contribuyente.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Contribuyente no encontrado'), { statusCode: 404 });
  return prisma.contribuyente.update({ where: { id }, data });
}

export async function softDelete(tenantId: string, id: string) {
  const exists = await prisma.contribuyente.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Contribuyente no encontrado'), { statusCode: 404 });
  return prisma.contribuyente.update({ where: { id }, data: { activo: false } });
}
