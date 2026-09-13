import { z } from 'zod';

export const REGIMEN_FISCAL_VALUES = ['RESICO', 'RIF', 'GENERAL', 'OTRO'] as const;
export const TIPO_DECLARACION_VALUES = ['MENSUAL', 'BIMESTRAL', 'ANUAL'] as const;
export const STATUS_DECLARACION_VALUES = ['PENDIENTE', 'PRESENTADA', 'ENVIADA', 'ENTREGADA', 'NO_APLICA'] as const;

export const CATALOGOS_TEXTO = [
  { campo: 'Régimen fiscal', valores: REGIMEN_FISCAL_VALUES.join(', ') },
  { campo: 'Tipo declaración', valores: TIPO_DECLARACION_VALUES.join(', ') },
  { campo: 'Status declaración / entrega', valores: STATUS_DECLARACION_VALUES.join(', ') },
  { campo: 'Campos SI/NO', valores: 'SI, NO' },
  { campo: 'Fechas', valores: 'Usar una celda de tipo Fecha de Excel' },
  { campo: 'RFC / Nombre', valores: 'Obligatorios. El resto de columnas es opcional.' },
];

// Un bimestre por hoja, igual a como el despacho ya organiza "Control de declaraciones.xlsx".
export const BIMESTRES = [
  { slug: 'ene-feb', mes1: { num: 1, nombre: 'ene' }, mes2: { num: 2, nombre: 'feb' } },
  { slug: 'mar-abr', mes1: { num: 3, nombre: 'mar' }, mes2: { num: 4, nombre: 'abr' } },
  { slug: 'may-jun', mes1: { num: 5, nombre: 'may' }, mes2: { num: 6, nombre: 'jun' } },
  { slug: 'jul-ago', mes1: { num: 7, nombre: 'jul' }, mes2: { num: 8, nombre: 'ago' } },
  { slug: 'sep-oct', mes1: { num: 9, nombre: 'sep' }, mes2: { num: 10, nombre: 'oct' } },
  { slug: 'nov-dic', mes1: { num: 11, nombre: 'nov' }, mes2: { num: 12, nombre: 'dic' } },
] as const;

export type Bimestre = (typeof BIMESTRES)[number];

export function nombreHoja(b: Bimestre, anio: number): string {
  return `${b.slug} ${anio}`;
}

export function periodos(b: Bimestre, anio: number) {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return {
    mes1: `${anio}-${p2(b.mes1.num)}`,
    mes2: `${anio}-${p2(b.mes2.num)}`,
    bimestral: `${anio}-${p2(b.mes1.num)}/${p2(b.mes2.num)}`,
  };
}

// Claves estructurales de columna (fijas) + su encabezado (algunas dependen del bimestre).
export type ColumnKey =
  | 'rfc' | 'clave' | 'nombre' | 'correo' | 'regimenFiscal'
  | 'fechaMensualMes1' | 'fechaMensualMes2' | 'fechaBimestral'
  | 'statusDeclaracion' | 'statusEntrega'
  | 'efirmaVence' | 'csdVence' | 'descargaXml'
  | 'esResico' | 'esRif' | 'mesTramite' | 'diaTramite' | 'anualStatus'
  | 'buzonSatqUsuario' | 'buzonSatqPassword' | 'buzonSatqCorreoActivo' | 'buzonSatqTelefonoActivo'
  | 'buzonTributarioUsuario' | 'buzonTributarioPassword' | 'buzonTributarioCorreoActivo' | 'buzonTributarioTelefonoActivo'
  | 'sifoUsuario' | 'sifoPassword'
  | 'ayuntamientoUsuario' | 'ayuntamientoPassword'
  | 'notas';

export function columnas(b: Bimestre): { key: ColumnKey; header: string }[] {
  return [
    { key: 'rfc', header: 'RFC*' },
    { key: 'clave', header: 'Clave' },
    { key: 'nombre', header: 'Nombre*' },
    { key: 'correo', header: 'Correo' },
    { key: 'regimenFiscal', header: 'Régimen fiscal' },
    { key: 'fechaMensualMes1', header: `Mensual ${b.mes1.nombre} (fecha)` },
    { key: 'fechaMensualMes2', header: `Mensual ${b.mes2.nombre} (fecha)` },
    { key: 'fechaBimestral', header: 'Bimestral (fecha)' },
    { key: 'statusDeclaracion', header: 'Status declaración' },
    { key: 'statusEntrega', header: 'Status entrega' },
    { key: 'efirmaVence', header: 'e.Firma vence' },
    { key: 'csdVence', header: 'CSD vence' },
    { key: 'descargaXml', header: 'Descarga XML' },
    { key: 'esResico', header: 'Constancia RESICO (SI/NO)' },
    { key: 'esRif', header: 'Constancia RIF (SI/NO)' },
    { key: 'mesTramite', header: 'Constancia mes trámite' },
    { key: 'diaTramite', header: 'Constancia día trámite' },
    { key: 'anualStatus', header: 'Anuales (status)' },
    { key: 'buzonSatqUsuario', header: 'Buzón SATQ usuario' },
    { key: 'buzonSatqPassword', header: 'Buzón SATQ contraseña' },
    { key: 'buzonSatqCorreoActivo', header: 'Buzón SATQ correo activo (SI/NO)' },
    { key: 'buzonSatqTelefonoActivo', header: 'Buzón SATQ teléfono activo (SI/NO)' },
    { key: 'buzonTributarioUsuario', header: 'Buzón Tributario usuario' },
    { key: 'buzonTributarioPassword', header: 'Buzón Tributario contraseña' },
    { key: 'buzonTributarioCorreoActivo', header: 'Buzón Tributario correo activo (SI/NO)' },
    { key: 'buzonTributarioTelefonoActivo', header: 'Buzón Tributario teléfono activo (SI/NO)' },
    { key: 'sifoUsuario', header: 'SIFO usuario' },
    { key: 'sifoPassword', header: 'SIFO contraseña' },
    { key: 'ayuntamientoUsuario', header: 'Ayuntamiento usuario' },
    { key: 'ayuntamientoPassword', header: 'Ayuntamiento contraseña' },
    { key: 'notas', header: 'Notas' },
  ];
}

export const DATE_KEYS: ColumnKey[] = ['fechaMensualMes1', 'fechaMensualMes2', 'fechaBimestral', 'efirmaVence', 'csdVence', 'descargaXml'];
export const BOOL_KEYS: ColumnKey[] = ['esResico', 'esRif', 'buzonSatqCorreoActivo', 'buzonSatqTelefonoActivo', 'buzonTributarioCorreoActivo', 'buzonTributarioTelefonoActivo'];
export const INT_KEYS: ColumnKey[] = ['diaTramite'];

// El service ya convierte cada celda a su tipo nativo (Date/boolean/number/string) antes de validar.
export const rowSchema = z.object({
  rfc: z.string().min(12, 'debe tener 12-13 caracteres').max(13, 'debe tener 12-13 caracteres'),
  clave: z.string().max(100).optional(),
  nombre: z.string().min(2, 'debe tener al menos 2 caracteres').max(200),
  correo: z.email('correo inválido').optional(),
  regimenFiscal: z.enum(REGIMEN_FISCAL_VALUES, { message: `valor inválido, use: ${REGIMEN_FISCAL_VALUES.join(', ')}` }).optional(),
  fechaMensualMes1: z.date({ message: 'fecha inválida' }).optional(),
  fechaMensualMes2: z.date({ message: 'fecha inválida' }).optional(),
  fechaBimestral: z.date({ message: 'fecha inválida' }).optional(),
  statusDeclaracion: z.enum(STATUS_DECLARACION_VALUES, { message: `valor inválido, use: ${STATUS_DECLARACION_VALUES.join(', ')}` }).optional(),
  statusEntrega: z.enum(STATUS_DECLARACION_VALUES, { message: `valor inválido, use: ${STATUS_DECLARACION_VALUES.join(', ')}` }).optional(),
  efirmaVence: z.date({ message: 'fecha inválida' }).optional(),
  csdVence: z.date({ message: 'fecha inválida' }).optional(),
  descargaXml: z.date({ message: 'fecha inválida' }).optional(),
  esResico: z.boolean({ message: 'use SI o NO' }).optional(),
  esRif: z.boolean({ message: 'use SI o NO' }).optional(),
  mesTramite: z.string().max(20).optional(),
  diaTramite: z.number().int().min(1).max(31).optional(),
  anualStatus: z.string().max(50).optional(),
  buzonSatqUsuario: z.string().max(100).optional(),
  buzonSatqPassword: z.string().optional(),
  buzonSatqCorreoActivo: z.boolean({ message: 'use SI o NO' }).optional(),
  buzonSatqTelefonoActivo: z.boolean({ message: 'use SI o NO' }).optional(),
  buzonTributarioUsuario: z.string().max(100).optional(),
  buzonTributarioPassword: z.string().optional(),
  buzonTributarioCorreoActivo: z.boolean({ message: 'use SI o NO' }).optional(),
  buzonTributarioTelefonoActivo: z.boolean({ message: 'use SI o NO' }).optional(),
  sifoUsuario: z.string().max(100).optional(),
  sifoPassword: z.string().optional(),
  ayuntamientoUsuario: z.string().max(100).optional(),
  ayuntamientoPassword: z.string().optional(),
  notas: z.string().optional(),
});

export type RowDto = z.infer<typeof rowSchema>;
