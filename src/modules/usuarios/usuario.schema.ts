import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nombre: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8, 'Contraseña mínimo 8 caracteres'),
  rol: z.enum(['ADMIN', 'GESTOR', 'VIEWER']).default('GESTOR'),
});

export const updateUsuarioSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),
  rol: z.enum(['ADMIN', 'GESTOR', 'VIEWER']).optional(),
  activo: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>;
