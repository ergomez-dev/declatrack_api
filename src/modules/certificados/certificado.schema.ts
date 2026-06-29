import { z } from 'zod';

export const createCertificadoSchema = z.object({
  contribuyenteId: z.string().uuid(),
  tipo: z.enum(['EFIRMA', 'CSD']),
  fechaVencimiento: z.string().min(8),
  fechaDescargaXml: z.string().optional().nullable(),
  notas: z.string().optional(),
});

export const updateCertificadoSchema = createCertificadoSchema.partial().omit({ contribuyenteId: true, tipo: true });

export type CreateCertificadoDto = z.infer<typeof createCertificadoSchema>;
export type UpdateCertificadoDto = z.infer<typeof updateCertificadoSchema>;
