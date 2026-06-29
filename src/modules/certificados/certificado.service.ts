import prisma from '../../config/database';
import { CreateCertificadoDto, UpdateCertificadoDto } from './certificado.schema';

export async function findAll(tenantId: string, query: { page: number; limit: number; contribuyenteId?: string; tipo?: string; vencidosEn?: number }) {
  const { page, limit, contribuyenteId, tipo, vencidosEn } = query;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { tenantId };
  if (contribuyenteId) where.contribuyenteId = contribuyenteId;
  if (tipo) where.tipo = tipo;
  if (vencidosEn) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + vencidosEn);
    where.fechaVencimiento = { lte: fecha };
  }

  const [data, total] = await Promise.all([
    prisma.certificado.findMany({
      where,
      skip,
      take: limit,
      include: { contribuyente: { select: { rfc: true, nombre: true } } },
      orderBy: { fechaVencimiento: 'asc' },
    }),
    prisma.certificado.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function findById(tenantId: string, id: string) {
  const c = await prisma.certificado.findFirst({ where: { id, tenantId }, include: { contribuyente: true } });
  if (!c) throw Object.assign(new Error('Certificado no encontrado'), { statusCode: 404 });
  return c;
}

export async function create(tenantId: string, data: CreateCertificadoDto) {
  return prisma.certificado.create({
    data: {
      tenantId,
      contribuyenteId: data.contribuyenteId,
      tipo: data.tipo,
      fechaVencimiento: new Date(data.fechaVencimiento),
      fechaDescargaXml: data.fechaDescargaXml ? new Date(data.fechaDescargaXml) : undefined,
      notas: data.notas,
    },
    include: { contribuyente: true },
  });
}

export async function update(tenantId: string, id: string, data: UpdateCertificadoDto) {
  const exists = await prisma.certificado.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Certificado no encontrado'), { statusCode: 404 });
  return prisma.certificado.update({
    where: { id },
    data: {
      ...data,
      fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
      fechaDescargaXml: data.fechaDescargaXml ? new Date(data.fechaDescargaXml) : data.fechaDescargaXml === null ? null : undefined,
    },
    include: { contribuyente: true },
  });
}

export async function remove(tenantId: string, id: string) {
  const exists = await prisma.certificado.findFirst({ where: { id, tenantId } });
  if (!exists) throw Object.assign(new Error('Certificado no encontrado'), { statusCode: 404 });
  return prisma.certificado.delete({ where: { id } });
}

export async function getProximosVencer(tenantId: string, dias: number) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return prisma.certificado.findMany({
    where: { tenantId, fechaVencimiento: { lte: fecha } },
    include: { contribuyente: { select: { rfc: true, nombre: true } } },
    orderBy: { fechaVencimiento: 'asc' },
  });
}
