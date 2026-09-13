import { z } from 'zod';

export const createDeclaracionSchema = z.object({
  contribuyenteId: z.string().uuid(),
  periodo: z.string().min(4).max(20),
  tipoDeclaracion: z.enum(['MENSUAL', 'BIMESTRAL', 'ANUAL']),
  fechaPresentacion: z.string().datetime({ offset: true }).optional().nullable(),
  statusDeclaracion: z.enum(['PENDIENTE', 'PRESENTADA', 'ENVIADA', 'ENTREGADA', 'NO_APLICA']).optional(),
  statusEntrega: z.enum(['PENDIENTE', 'PRESENTADA', 'ENVIADA', 'ENTREGADA', 'NO_APLICA']).optional(),
  fechaMes1: z.string().datetime({ offset: true }).optional().nullable(),
  fechaMes2: z.string().datetime({ offset: true }).optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const updateDeclaracionSchema = createDeclaracionSchema.partial().omit({ contribuyenteId: true, periodo: true, tipoDeclaracion: true });

export type CreateDeclaracionDto = z.infer<typeof createDeclaracionSchema>;
export type UpdateDeclaracionDto = z.infer<typeof updateDeclaracionSchema>;
