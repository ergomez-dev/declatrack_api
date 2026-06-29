import { z } from 'zod';

const permisoSchema = z.object({
  modulo: z.enum(['DASHBOARD','CONTRIBUYENTES','DECLARACIONES','CERTIFICADOS','PLATAFORMAS','USUARIOS','ROLES','CONFIGURACION','EXPORTAR']),
  accion: z.enum(['VER','CREAR','EDITAR','ELIMINAR']),
  permitido: z.boolean(),
});

export const createRolSchema = z.object({
  nombre: z.string().regex(/^[A-Z_]+$/, 'Solo mayúsculas y guiones bajos').min(2).max(100),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  permisos: z.array(permisoSchema).optional().default([]),
});

export const updateRolSchema = createRolSchema.partial();

export const createOverrideSchema = z.object({
  usuarioId: z.string().uuid(),
  modulo: z.enum(['DASHBOARD','CONTRIBUYENTES','DECLARACIONES','CERTIFICADOS','PLATAFORMAS','USUARIOS','ROLES','CONFIGURACION','EXPORTAR']),
  accion: z.enum(['VER','CREAR','EDITAR','ELIMINAR']),
  tipo: z.enum(['GRANT','REVOKE']),
  razon: z.string().optional(),
});

export const assignRolSchema = z.object({ rolId: z.string().uuid() });

export type CreateRolDto = z.infer<typeof createRolSchema>;
export type UpdateRolDto = z.infer<typeof updateRolSchema>;
export type CreateOverrideDto = z.infer<typeof createOverrideSchema>;
