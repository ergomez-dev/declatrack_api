import prisma from '../../config/database';
import { CreateDeclaracionDto, UpdateDeclaracionDto } from './declaracion.schema';

export async function findAll(tenantId: string, query: { page: number; limit: number; contribuyenteId?: string; periodo?: string; status?: string }) {
  const { page, limit, contribuyenteId, periodo, status } = query;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { tenantId };
  if (contribuyenteId) where.contribuyenteId = contribuyenteId;
  if (periodo) where.periodo = { contains: periodo };
  if (status) where.statusDeclaracion = status;

  const [data, total] = await Promise.all([
    prisma.declaracion.findMany({
      where,
      skip,
      take: limit,
      include: { contribuyente: { select: { rfc: true, nombre: true, regimenFiscal: true } } },
      orderBy: [{ periodo: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.declaracion.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function findById(tenantId: string, id: string) {
  const d = await prisma.declaracion.findFirst({
    where: { id, tenantId },
    include: { contribuyente: true },
  });
  if (!d) throw Object.assign(new Error('Declaración no encontrada'), { statusCode: 404 });
  return d;
}

export async function create(tenantId: string, data: CreateDeclaracionDto, userId: string) {
  const contrib = await prisma.contribuyente.findFirst({ where: { id: data.contribuyenteId, tenantId } });
  if (!contrib) throw Object.assign(new Error('Contribuyente no pertenece al tenant'), { statusCode: 400 });

  return prisma.declaracion.create({
    data: {
      tenantId,
      contribuyenteId: data.contribuyenteId,
      periodo: data.periodo,
      tipoDeclaracion: data.tipoDeclaracion,
      fechaPresentacion: data.fechaPresentacion ? new Date(data.fechaPresentacion) : undefined,
      statusDeclaracion: data.statusDeclaracion ?? 'PENDIENTE',
      statusEntrega: data.statusEntrega ?? 'PENDIENTE',
      fechaMes1: data.fechaMes1 ? new Date(data.fechaMes1) : undefined,
      fechaMes2: data.fechaMes2 ? new Date(data.fechaMes2) : undefined,
      notas: data.notas,
      createdBy: userId,
    },
    include: { contribuyente: true },
  });
}

export async function update(tenantId: string, id: string, data: UpdateDeclaracionDto) {
  const exists = await prisma.declaracion.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Declaración no encontrada'), { statusCode: 404 });
  return prisma.declaracion.update({
    where: { id },
    data: {
      ...data,
      fechaPresentacion: data.fechaPresentacion ? new Date(data.fechaPresentacion) : data.fechaPresentacion === null ? null : undefined,
      fechaMes1: data.fechaMes1 ? new Date(data.fechaMes1) : data.fechaMes1 === null ? null : undefined,
      fechaMes2: data.fechaMes2 ? new Date(data.fechaMes2) : data.fechaMes2 === null ? null : undefined,
    },
    include: { contribuyente: true },
  });
}

export async function remove(tenantId: string, id: string) {
  const exists = await prisma.declaracion.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Declaración no encontrada'), { statusCode: 404 });
  return prisma.declaracion.delete({ where: { id } });
}
