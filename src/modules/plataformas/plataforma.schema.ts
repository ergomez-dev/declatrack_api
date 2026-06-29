import { z } from 'zod';

export const createAccesoSchema = z.object({
  contribuyenteId: z.string().uuid(),
  plataforma: z.enum(['BUZON_SATQ', 'BUZON_TRIBUTARIO', 'SIFO', 'AYUNTAMIENTO']),
  usuario: z.string().min(1).max(100),
  password: z.string().min(1),
  correoActivo: z.boolean().optional().default(false),
  telefonoActivo: z.boolean().optional().default(false),
  notas: z.string().optional(),
});

export const updateAccesoSchema = createAccesoSchema.partial().omit({ contribuyenteId: true, plataforma: true });

export type CreateAccesoDto = z.infer<typeof createAccesoSchema>;
export type UpdateAccesoDto = z.infer<typeof updateAccesoSchema>;
