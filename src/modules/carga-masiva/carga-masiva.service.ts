import ExcelJS from 'exceljs';
import prisma from '../../config/database';
import { encryptText } from '../../utils/crypto.util';
import {
  BIMESTRES, Bimestre, ColumnKey, CATALOGOS_TEXTO,
  columnas, nombreHoja, periodos,
  DATE_KEYS, BOOL_KEYS, INT_KEYS,
  rowSchema, RowDto,
} from './carga-masiva.schema';

const SHEET_RE = new RegExp(`^(${BIMESTRES.map((b) => b.slug).join('|')}) (\\d{4})$`);

export async function generarPlantilla(anio: number): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  for (const b of BIMESTRES) {
    const sheet = wb.addWorksheet(nombreHoja(b, anio));
    sheet.columns = columnas(b).map((c) => ({ header: c.header, key: c.key, width: 22 }));
    sheet.getRow(1).font = { bold: true };
  }

  const catalogos = wb.addWorksheet('Catálogos');
  catalogos.columns = [
    { header: 'Campo', key: 'campo', width: 30 },
    { header: 'Valores válidos', key: 'valores', width: 60 },
  ];
  catalogos.getRow(1).font = { bold: true };
  catalogos.addRows(CATALOGOS_TEXTO);

  return wb;
}

export function cellRaw(row: ExcelJS.Row, col: number | undefined): ExcelJS.CellValue | undefined {
  if (!col) return undefined;
  const v = row.getCell(col).value;
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'object' && !(v instanceof Date)) {
    const anyV = v as { text?: string; result?: unknown };
    if (anyV.text !== undefined) return anyV.text;
    if (anyV.result !== undefined) return anyV.result as ExcelJS.CellValue;
  }
  return v;
}

export function asString(v: ExcelJS.CellValue | undefined): string | undefined {
  if (v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export function asDate(v: ExcelJS.CellValue | undefined): Date | 'invalido' | undefined {
  if (v === undefined) return undefined;
  if (v instanceof Date) return v;
  const s = asString(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? 'invalido' : d;
}

export function asBool(v: ExcelJS.CellValue | undefined): boolean | 'invalido' | undefined {
  const s = asString(v)?.toUpperCase();
  if (!s) return undefined;
  if (['SI', 'SÍ', 'TRUE', 'YES', '1'].includes(s)) return true;
  if (['NO', 'FALSE', '0'].includes(s)) return false;
  return 'invalido';
}

export function asInt(v: ExcelJS.CellValue | undefined): number | 'invalido' | undefined {
  const s = asString(v);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 'invalido' : n;
}

interface DetalleFila {
  hoja: string;
  fila: number;
  rfc?: string;
  resultado: 'creado' | 'actualizado' | 'error';
  mensaje?: string;
}

interface Advertencia {
  hoja: string;
  filas: number[];
  rfc: string;
  mensaje: string;
}

export interface ImportResumen {
  totalFilas: number;
  hojasProcesadas: number;
  hojasIgnoradas: number;
  contribuyentesCreados: number;
  contribuyentesActualizados: number;
  declaracionesGuardadas: number;
  certificadosGuardados: number;
  accesosGuardados: number;
  constanciasGuardadas: number;
  detalle: DetalleFila[];
  advertencias: Advertencia[];
}

const PLATAFORMAS = [
  { tipo: 'BUZON_SATQ' as const, usuarioKey: 'buzonSatqUsuario' as const, passwordKey: 'buzonSatqPassword' as const, label: 'Buzón SATQ', correoKey: 'buzonSatqCorreoActivo' as const, telefonoKey: 'buzonSatqTelefonoActivo' as const },
  { tipo: 'BUZON_TRIBUTARIO' as const, usuarioKey: 'buzonTributarioUsuario' as const, passwordKey: 'buzonTributarioPassword' as const, label: 'Buzón Tributario', correoKey: 'buzonTributarioCorreoActivo' as const, telefonoKey: 'buzonTributarioTelefonoActivo' as const },
  { tipo: 'SIFO' as const, usuarioKey: 'sifoUsuario' as const, passwordKey: 'sifoPassword' as const, label: 'SIFO' },
  { tipo: 'AYUNTAMIENTO' as const, usuarioKey: 'ayuntamientoUsuario' as const, passwordKey: 'ayuntamientoPassword' as const, label: 'Ayuntamiento' },
];

export async function importar(tenantId: string, userId: string, buffer: Buffer): Promise<ImportResumen> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const resumen: ImportResumen = {
    totalFilas: 0,
    hojasProcesadas: 0,
    hojasIgnoradas: 0,
    contribuyentesCreados: 0,
    contribuyentesActualizados: 0,
    declaracionesGuardadas: 0,
    certificadosGuardados: 0,
    accesosGuardados: 0,
    constanciasGuardadas: 0,
    detalle: [],
    advertencias: [],
  };

  const bimestreSheets = wb.worksheets.filter((s) => SHEET_RE.test(s.name));
  resumen.hojasIgnoradas = wb.worksheets.length - bimestreSheets.length;
  if (bimestreSheets.length === 0) {
    throw Object.assign(new Error('El archivo no tiene ninguna hoja con el formato esperado (ej. "ene-feb 2026")'), { statusCode: 422 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { maxContribuyentes: true } });
  let contribuyentesActivos = await prisma.contribuyente.count({ where: { tenantId, activo: true } });

  // Ordena las hojas encontradas según el orden fijo de BIMESTRES (ene-feb -> nov-dic), no el orden del archivo.
  const orden = new Map<string, number>(BIMESTRES.map((b, i) => [b.slug, i]));
  bimestreSheets.sort((a, b) => {
    const [, sa] = a.name.match(SHEET_RE)!;
    const [, sb] = b.name.match(SHEET_RE)!;
    return (orden.get(sa) ?? 0) - (orden.get(sb) ?? 0);
  });

  for (const sheet of bimestreSheets) {
    const match = sheet.name.match(SHEET_RE)!;
    const slug = match[1];
    const anio = Number(match[2]);
    const bimestre = BIMESTRES.find((b) => b.slug === slug) as Bimestre;
    const cols = columnas(bimestre);
    const per = periodos(bimestre, anio);
    resumen.hojasProcesadas++;

    const headerRow = sheet.getRow(1);
    const colByKey = new Map<ColumnKey, number>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = String(cell.value ?? '').trim();
      const col = cols.find((c) => c.header === header);
      if (col) colByKey.set(col.key, colNumber);
    });
    if (!colByKey.has('rfc') || !colByKey.has('nombre')) {
      resumen.detalle.push({ hoja: sheet.name, fila: 1, resultado: 'error', mensaje: 'La hoja no tiene el encabezado esperado (falta columna RFC o Nombre)' });
      continue;
    }

    const rfcPorFila = new Map<string, number[]>();

    const filas: { rowNumber: number; raw: Record<string, unknown>; problemas: string[] }[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const raw: Record<string, unknown> = {};
      const problemas: string[] = [];
      for (const { key, header } of cols) {
        const cell = cellRaw(row, colByKey.get(key));
        let value: unknown;
        if (DATE_KEYS.includes(key)) value = asDate(cell);
        else if (BOOL_KEYS.includes(key)) value = asBool(cell);
        else if (INT_KEYS.includes(key)) value = asInt(cell);
        else value = asString(cell);
        if (value === 'invalido') {
          problemas.push(`${header}: valor inválido`);
          value = undefined;
        }
        raw[key] = value;
      }
      if (!raw.rfc && !raw.nombre) return; // fila vacía
      filas.push({ rowNumber, raw, problemas });
    });

    for (const { rowNumber, raw, problemas } of filas) {
      resumen.totalFilas++;

      const faltantes: string[] = [];
      if (!raw.rfc) faltantes.push('RFC*');
      if (!raw.nombre) faltantes.push('Nombre*');
      if (faltantes.length) {
        resumen.detalle.push({ hoja: sheet.name, fila: rowNumber, rfc: raw.rfc as string | undefined, resultado: 'error', mensaje: `Falta(n) el/los campo(s) obligatorio(s): ${faltantes.join(', ')}` });
        continue;
      }

      const rfc = String(raw.rfc).toUpperCase();
      const parsed = rowSchema.safeParse({ ...raw, rfc });
      if (!parsed.success) {
        const mensajes = parsed.error.issues.map((i) => {
          const col = cols.find((c) => c.key === i.path[0]);
          return `${col?.header ?? i.path.join('.')}: ${i.message}`;
        });
        resumen.detalle.push({ hoja: sheet.name, fila: rowNumber, rfc, resultado: 'error', mensaje: [...problemas, ...mensajes].join('; ') });
        continue;
      }
      if (problemas.length) {
        resumen.detalle.push({ hoja: sheet.name, fila: rowNumber, rfc, resultado: 'error', mensaje: problemas.join('; ') });
        continue;
      }
      const d: RowDto = parsed.data;

      const cruzados: string[] = [];
      for (const p of PLATAFORMAS) {
        const usuario = d[p.usuarioKey];
        const password = d[p.passwordKey];
        if (usuario && !password) cruzados.push(`${p.label}: falta la contraseña`);
        if (!usuario && password) cruzados.push(`${p.label}: falta el usuario`);
      }
      if (cruzados.length) {
        resumen.detalle.push({ hoja: sheet.name, fila: rowNumber, rfc, resultado: 'error', mensaje: cruzados.join('; ') });
        continue;
      }

      if (!rfcPorFila.has(rfc)) rfcPorFila.set(rfc, []);
      rfcPorFila.get(rfc)!.push(rowNumber);

      try {
        let resultado: 'creado' | 'actualizado' = 'creado';
        await prisma.$transaction(async (tx) => {
          let contribuyente = await tx.contribuyente.findFirst({ where: { tenantId, rfc } });
          if (contribuyente) {
            resultado = 'actualizado';
            contribuyente = await tx.contribuyente.update({
              where: { id: contribuyente.id },
              data: { nombre: d.nombre, clave: d.clave, correo: d.correo, regimenFiscal: d.regimenFiscal, notas: d.notas },
            });
          } else {
            if (tenant && contribuyentesActivos >= tenant.maxContribuyentes) {
              throw Object.assign(new Error(`Límite de contribuyentes del plan alcanzado (${tenant.maxContribuyentes})`), { statusCode: 400 });
            }
            contribuyente = await tx.contribuyente.create({
              data: { tenantId, rfc, nombre: d.nombre, clave: d.clave, correo: d.correo, regimenFiscal: d.regimenFiscal, notas: d.notas },
            });
            contribuyentesActivos++;
          }
          const contribuyenteId = contribuyente.id;

          if (d.fechaMensualMes1) {
            await tx.declaracion.upsert({
              where: { tenantId_contribuyenteId_periodo_tipoDeclaracion: { tenantId, contribuyenteId, periodo: per.mes1, tipoDeclaracion: 'MENSUAL' } },
              create: { tenantId, contribuyenteId, periodo: per.mes1, tipoDeclaracion: 'MENSUAL', fechaPresentacion: d.fechaMensualMes1, statusDeclaracion: d.statusDeclaracion ?? 'PENDIENTE', statusEntrega: d.statusEntrega ?? 'PENDIENTE', createdBy: userId },
              update: { fechaPresentacion: d.fechaMensualMes1, statusDeclaracion: d.statusDeclaracion, statusEntrega: d.statusEntrega },
            });
            resumen.declaracionesGuardadas++;
          }
          if (d.fechaMensualMes2) {
            await tx.declaracion.upsert({
              where: { tenantId_contribuyenteId_periodo_tipoDeclaracion: { tenantId, contribuyenteId, periodo: per.mes2, tipoDeclaracion: 'MENSUAL' } },
              create: { tenantId, contribuyenteId, periodo: per.mes2, tipoDeclaracion: 'MENSUAL', fechaPresentacion: d.fechaMensualMes2, statusDeclaracion: d.statusDeclaracion ?? 'PENDIENTE', statusEntrega: d.statusEntrega ?? 'PENDIENTE', createdBy: userId },
              update: { fechaPresentacion: d.fechaMensualMes2, statusDeclaracion: d.statusDeclaracion, statusEntrega: d.statusEntrega },
            });
            resumen.declaracionesGuardadas++;
          }
          if (d.fechaBimestral) {
            await tx.declaracion.upsert({
              where: { tenantId_contribuyenteId_periodo_tipoDeclaracion: { tenantId, contribuyenteId, periodo: per.bimestral, tipoDeclaracion: 'BIMESTRAL' } },
              create: { tenantId, contribuyenteId, periodo: per.bimestral, tipoDeclaracion: 'BIMESTRAL', fechaPresentacion: d.fechaBimestral, fechaMes1: d.fechaMensualMes1, fechaMes2: d.fechaMensualMes2, statusDeclaracion: d.statusDeclaracion ?? 'PENDIENTE', statusEntrega: d.statusEntrega ?? 'PENDIENTE', createdBy: userId },
              update: { fechaPresentacion: d.fechaBimestral, fechaMes1: d.fechaMensualMes1, fechaMes2: d.fechaMensualMes2, statusDeclaracion: d.statusDeclaracion, statusEntrega: d.statusEntrega },
            });
            resumen.declaracionesGuardadas++;
          }

          if (d.efirmaVence) {
            await tx.certificado.upsert({
              where: { tenantId_contribuyenteId_tipo: { tenantId, contribuyenteId, tipo: 'EFIRMA' } },
              create: { tenantId, contribuyenteId, tipo: 'EFIRMA', fechaVencimiento: d.efirmaVence },
              update: { fechaVencimiento: d.efirmaVence },
            });
            resumen.certificadosGuardados++;
          }
          if (d.csdVence) {
            await tx.certificado.upsert({
              where: { tenantId_contribuyenteId_tipo: { tenantId, contribuyenteId, tipo: 'CSD' } },
              create: { tenantId, contribuyenteId, tipo: 'CSD', fechaVencimiento: d.csdVence, fechaDescargaXml: d.descargaXml },
              update: { fechaVencimiento: d.csdVence, fechaDescargaXml: d.descargaXml },
            });
            resumen.certificadosGuardados++;
          }

          for (const p of PLATAFORMAS) {
            const usuario = d[p.usuarioKey];
            const password = d[p.passwordKey];
            if (!usuario || !password) continue;
            const correoActivo = p.correoKey ? d[p.correoKey] : undefined;
            const telefonoActivo = p.telefonoKey ? d[p.telefonoKey] : undefined;
            await tx.accesoPlataforma.upsert({
              where: { tenantId_contribuyenteId_plataforma: { tenantId, contribuyenteId, plataforma: p.tipo } },
              create: { tenantId, contribuyenteId, plataforma: p.tipo, usuario, passwordEncriptado: encryptText(password), correoActivo: correoActivo ?? false, telefonoActivo: telefonoActivo ?? false },
              update: { usuario, passwordEncriptado: encryptText(password), correoActivo, telefonoActivo },
            });
            resumen.accesosGuardados++;
          }

          if (d.esResico !== undefined || d.esRif !== undefined || d.mesTramite || d.diaTramite !== undefined || d.anualStatus) {
            await tx.constanciaFiscal.upsert({
              where: { tenantId_contribuyenteId: { tenantId, contribuyenteId } },
              create: { tenantId, contribuyenteId, esResico: d.esResico ?? false, esRif: d.esRif ?? false, mesTramite: d.mesTramite, diaTramite: d.diaTramite, anual2024Status: d.anualStatus },
              update: { esResico: d.esResico, esRif: d.esRif, mesTramite: d.mesTramite, diaTramite: d.diaTramite, anual2024Status: d.anualStatus },
            });
            resumen.constanciasGuardadas++;
          }
        });

        resumen.detalle.push({ hoja: sheet.name, fila: rowNumber, rfc, resultado });
        if (resultado === 'creado') resumen.contribuyentesCreados++;
        else resumen.contribuyentesActualizados++;
      } catch (e) {
        resumen.detalle.push({ hoja: sheet.name, fila: rowNumber, rfc, resultado: 'error', mensaje: e instanceof Error ? e.message : 'Error desconocido' });
      }
    }

    for (const [rfc, rows] of rfcPorFila) {
      if (rows.length > 1) {
        resumen.advertencias.push({ hoja: sheet.name, filas: rows, rfc, mensaje: `RFC repetido ${rows.length} veces en la hoja; se aplicó la fila ${rows[rows.length - 1]}` });
      }
    }
  }

  await prisma.auditoria.create({
    data: { tenantId, usuarioId: userId, accion: 'IMPORT', entidad: 'CargaMasiva', payloadDespues: resumen as unknown as object },
  });

  return resumen;
}
