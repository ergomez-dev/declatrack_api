import prisma from '../../config/database';
import { CreateTenantDto, UpdateTenantDto, UpdateTenantConfigDto } from './tenant.schema';

export async function findAllTenants(query: { page?: number; limit?: number; search?: string }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const where = query.search
    ? { OR: [{ nombre: { contains: query.search, mode: 'insensitive' as const } }, { slug: { contains: query.search, mode: 'insensitive' as const } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: { select: { contribuyentes: true, usuarios: true } },
        tenantConfig: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function findTenantById(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      tenantConfig: true,
      _count: { select: { contribuyentes: true, usuarios: true, declaraciones: true } },
    },
  });
  if (!tenant) throw Object.assign(new Error('Tenant no encontrado'), { statusCode: 404 });
  return tenant;
}

export async function createTenant(data: CreateTenantDto) {
  return prisma.tenant.create({
    data: {
      ...data,
      tenantConfig: { create: {} },
    },
    include: { tenantConfig: true },
  });
}

export async function updateTenant(id: string, data: UpdateTenantDto) {
  return prisma.tenant.update({ where: { id }, data });
}

export async function updateTenantConfig(tenantId: string, data: UpdateTenantConfigDto) {
  return prisma.tenantConfig.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
}

export async function deactivateTenant(id: string) {
  return prisma.tenant.update({ where: { id }, data: { activo: false } });
}

export async function getTenantStats(tenantId: string) {
  const [contribuyentes, usuarios, declaraciones, certificados] = await Promise.all([
    prisma.contribuyente.count({ where: { tenantId } }),
    prisma.usuario.count({ where: { tenantId } }),
    prisma.declaracion.count({ where: { tenantId } }),
    prisma.certificado.count({ where: { tenantId } }),
  ]);
  return { contribuyentes, usuarios, declaraciones, certificados };
}
