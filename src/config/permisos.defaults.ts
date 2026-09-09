import { ModuloSistema, AccionPermiso } from '@prisma/client';

// Matriz base de permisos por rol de sistema.
// Sólo la consume el SEED (prisma/seed/seed.ts) para poblar `roles`, `rol_permisos` y el
// catálogo `permisos`. El runtime resuelve permisos leyendo `rol_permisos` (ver permiso.middleware).
export type NombreRolSistema = 'SUPERADMIN' | 'ADMIN' | 'GESTOR' | 'VIEWER';

export type AccionesMap = Record<AccionPermiso, boolean>;
export type PermisosMap = Record<ModuloSistema, AccionesMap>;

const TODOS: AccionesMap = { VER: true, CREAR: true, EDITAR: true, ELIMINAR: true, ACTIVAR: true, DESACTIVAR: true };
const NINGUNO: AccionesMap = { VER: false, CREAR: false, EDITAR: false, ELIMINAR: false, ACTIVAR: false, DESACTIVAR: false };
const SOLO_VER: AccionesMap = { VER: true, CREAR: false, EDITAR: false, ELIMINAR: false, ACTIVAR: false, DESACTIVAR: false };
const GESTIONA: AccionesMap = { VER: true, CREAR: true, EDITAR: true, ELIMINAR: false, ACTIVAR: false, DESACTIVAR: false };

const TODOS_MODULOS: PermisosMap = {
  DASHBOARD: TODOS, CONTRIBUYENTES: TODOS, DECLARACIONES: TODOS,
  CERTIFICADOS: TODOS, PLATAFORMAS: TODOS, USUARIOS: TODOS,
  ROLES: TODOS, CONFIGURACION: TODOS, EXPORTAR: TODOS,
};

export const PERMISOS_DEFAULTS: Record<NombreRolSistema, PermisosMap> = {
  SUPERADMIN: TODOS_MODULOS,
  ADMIN: {
    DASHBOARD:      { ...SOLO_VER },
    CONTRIBUYENTES: { ...TODOS },
    DECLARACIONES:  { ...TODOS },
    CERTIFICADOS:   { ...TODOS },
    PLATAFORMAS:    { ...TODOS },
    USUARIOS:       { ...TODOS },
    ROLES:          { ...TODOS },
    CONFIGURACION:  { VER: true, CREAR: false, EDITAR: true, ELIMINAR: false, ACTIVAR: false, DESACTIVAR: false },
    EXPORTAR:       { ...SOLO_VER },
  },
  GESTOR: {
    DASHBOARD:      { ...SOLO_VER },
    CONTRIBUYENTES: { ...GESTIONA },
    DECLARACIONES:  { ...GESTIONA },
    CERTIFICADOS:   { ...GESTIONA },
    PLATAFORMAS:    { ...GESTIONA },
    USUARIOS:       { ...NINGUNO },
    ROLES:          { ...NINGUNO },
    CONFIGURACION:  { ...NINGUNO },
    EXPORTAR:       { ...SOLO_VER },
  },
  VIEWER: {
    DASHBOARD:      { ...SOLO_VER },
    CONTRIBUYENTES: { ...SOLO_VER },
    DECLARACIONES:  { ...SOLO_VER },
    CERTIFICADOS:   { ...SOLO_VER },
    PLATAFORMAS:    { ...NINGUNO },
    USUARIOS:       { ...NINGUNO },
    ROLES:          { ...NINGUNO },
    CONFIGURACION:  { ...NINGUNO },
    EXPORTAR:       { ...SOLO_VER },
  },
};
