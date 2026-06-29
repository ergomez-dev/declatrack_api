import { RolUsuario, ModuloSistema, AccionPermiso } from '@prisma/client';

export type AccionesMap = Record<AccionPermiso, boolean>;
export type PermisosMap = Record<ModuloSistema, AccionesMap>;

const TODOS: AccionesMap = { VER: true, CREAR: true, EDITAR: true, ELIMINAR: true };
const NINGUNO: AccionesMap = { VER: false, CREAR: false, EDITAR: false, ELIMINAR: false };
const SOLO_VER: AccionesMap = { VER: true, CREAR: false, EDITAR: false, ELIMINAR: false };

const TODOS_MODULOS: PermisosMap = {
  DASHBOARD: TODOS, CONTRIBUYENTES: TODOS, DECLARACIONES: TODOS,
  CERTIFICADOS: TODOS, PLATAFORMAS: TODOS, USUARIOS: TODOS,
  ROLES: TODOS, CONFIGURACION: TODOS, EXPORTAR: TODOS,
};

export const PERMISOS_DEFAULTS: Record<RolUsuario, PermisosMap> = {
  SUPERADMIN: TODOS_MODULOS,
  ADMIN: {
    DASHBOARD:      { ...SOLO_VER },
    CONTRIBUYENTES: { ...TODOS },
    DECLARACIONES:  { ...TODOS },
    CERTIFICADOS:   { ...TODOS },
    PLATAFORMAS:    { ...TODOS },
    USUARIOS:       { ...TODOS },
    ROLES:          { ...TODOS },
    CONFIGURACION:  { VER: true, CREAR: false, EDITAR: true, ELIMINAR: false },
    EXPORTAR:       { ...SOLO_VER },
  },
  GESTOR: {
    DASHBOARD:      { ...SOLO_VER },
    CONTRIBUYENTES: { VER: true, CREAR: true, EDITAR: true, ELIMINAR: false },
    DECLARACIONES:  { VER: true, CREAR: true, EDITAR: true, ELIMINAR: false },
    CERTIFICADOS:   { VER: true, CREAR: true, EDITAR: true, ELIMINAR: false },
    PLATAFORMAS:    { VER: true, CREAR: true, EDITAR: true, ELIMINAR: false },
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
