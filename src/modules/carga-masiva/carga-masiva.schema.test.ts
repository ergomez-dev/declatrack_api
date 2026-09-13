import { describe, it, expect } from 'vitest';
import { BIMESTRES, nombreHoja, periodos, columnas, rowSchema } from './carga-masiva.schema';

describe('BIMESTRES / nombreHoja / periodos', () => {
  it('define 6 bimestres cubriendo el año completo en orden', () => {
    expect(BIMESTRES.map((b) => b.slug)).toEqual(['ene-feb', 'mar-abr', 'may-jun', 'jul-ago', 'sep-oct', 'nov-dic']);
  });

  it('nombreHoja arma "<slug> <año>" igual al Excel de referencia', () => {
    expect(nombreHoja(BIMESTRES[0], 2026)).toBe('ene-feb 2026');
    expect(nombreHoja(BIMESTRES[5], 2025)).toBe('nov-dic 2025');
  });

  it('periodos deriva mes1/mes2/bimestral con ceros a la izquierda', () => {
    expect(periodos(BIMESTRES[0], 2026)).toEqual({ mes1: '2026-01', mes2: '2026-02', bimestral: '2026-01/02' });
    expect(periodos(BIMESTRES[5], 2026)).toEqual({ mes1: '2026-11', mes2: '2026-12', bimestral: '2026-11/12' });
  });
});

describe('columnas', () => {
  it('arma encabezados dinámicos con el nombre de mes de cada bimestre', () => {
    const cols = columnas(BIMESTRES[0]);
    const mes1 = cols.find((c) => c.key === 'fechaMensualMes1');
    const mes2 = cols.find((c) => c.key === 'fechaMensualMes2');
    expect(mes1?.header).toBe('Mensual ene (fecha)');
    expect(mes2?.header).toBe('Mensual feb (fecha)');
  });

  it('siempre incluye las columnas obligatorias RFC y Nombre', () => {
    const headers = columnas(BIMESTRES[1]).map((c) => c.header);
    expect(headers).toContain('RFC*');
    expect(headers).toContain('Nombre*');
  });
});

describe('rowSchema', () => {
  const base = { rfc: 'AAZR830117S4A', nombre: 'REYNA VICTORIA AVALOS ZACARIAS' };

  it('acepta una fila mínima con solo RFC y Nombre', () => {
    const r = rowSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('rechaza un RFC demasiado corto', () => {
    const r = rowSchema.safeParse({ ...base, rfc: 'CORTO' });
    expect(r.success).toBe(false);
  });

  it('rechaza un correo mal formado', () => {
    const r = rowSchema.safeParse({ ...base, correo: 'no-es-un-correo' });
    expect(r.success).toBe(false);
  });

  it('rechaza un régimen fiscal fuera del catálogo', () => {
    const r = rowSchema.safeParse({ ...base, regimenFiscal: 'INVENTADO' });
    expect(r.success).toBe(false);
  });

  it('acepta los status de declaración/entrega del catálogo', () => {
    const r = rowSchema.safeParse({ ...base, statusDeclaracion: 'PRESENTADA', statusEntrega: 'ENTREGADA' });
    expect(r.success).toBe(true);
  });

  it('junta todos los errores de la fila, no solo el primero', () => {
    const r = rowSchema.safeParse({ ...base, correo: 'malo', regimenFiscal: 'X' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.length).toBeGreaterThanOrEqual(2);
  });
});
