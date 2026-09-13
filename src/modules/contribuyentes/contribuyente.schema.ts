import { z } from 'zod';

export const createContribuyenteSchema = z.object({
  rfc: z.string().min(12).max(13).toUpperCase(),
  clave: z.string().max(100).optional().nullable(),
  nombre: z.string().min(2).max(200),
  correo: z.string().email().optional().nullable(),
  regimenFiscal: z.enum(['RESICO', 'RIF', 'GENERAL', 'OTRO']).optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const updateContribuyenteSchema = createContribuyenteSchema.partial();

export const queryContribuyenteSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  regimen: z.enum(['RESICO', 'RIF', 'GENERAL', 'OTRO']).optional(),
  activo: z.coerce.boolean().optional(),
});

export type CreateContribuyenteDto = z.infer<typeof createContribuyenteSchema>;
export type UpdateContribuyenteDto = z.infer<typeof updateContribuyenteSchema>;
