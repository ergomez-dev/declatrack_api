import { z } from 'zod';

export const createTenantSchema = z.object({
  nombre: z.string().min(2).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones').min(2).max(100),
  rfcDespacho: z.string().max(13).optional(),
  correoContacto: z.string().email().optional(),
  telefono: z.string().max(30).optional(),
  direccion: z.string().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  maxContribuyentes: z.number().int().positive().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

export const updateTenantConfigSchema = z.object({
  idiomaDefecto: z.string().max(5).optional(),
  zonaHoraria: z.string().max(50).optional(),
  diasAlertaEfirma: z.number().int().positive().optional(),
  diasAlertaCsd: z.number().int().positive().optional(),
  diasAlertaAnuncio: z.number().int().positive().optional(),
  colorPrimario: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  notificacionesEmail: z.boolean().optional(),
  correoNotificaciones: z.string().email().optional(),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>;
export type UpdateTenantConfigDto = z.infer<typeof updateTenantConfigSchema>;
