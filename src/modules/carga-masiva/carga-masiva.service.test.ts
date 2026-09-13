import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { cellRaw, asString, asDate, asBool, asInt } from './carga-masiva.service';

function rowWithValues(values: unknown[]): ExcelJS.Row {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('s');
  const row = sheet.addRow(values);
  return row;
}

describe('asString', () => {
  it('recorta espacios y trata la celda vacía como undefined', () => {
    expect(asString('  hola  ')).toBe('hola');
    expect(asString('')).toBeUndefined();
    expect(asString(undefined)).toBeUndefined();
  });

  it('convierte números a texto', () => {
    expect(asString(123)).toBe('123');
  });
});

describe('asDate', () => {
  it('devuelve directo un objeto Date (como lo entrega una celda de fecha de Excel)', () => {
    const d = new Date('2026-01-15');
    expect(asDate(d)).toBe(d);
  });

  it('parsea una fecha en texto', () => {
    const r = asDate('2026-03-01');
    expect(r).toBeInstanceOf(Date);
  });

  it('marca como inválida una fecha que no se puede parsear', () => {
    expect(asDate('no es una fecha')).toBe('invalido');
  });

  it('celda vacía es undefined, no inválida', () => {
    expect(asDate(undefined)).toBeUndefined();
  });
});

describe('asBool', () => {
  it('reconoce SI/SÍ/TRUE/YES/1 como true', () => {
    for (const v of ['SI', 'sí', 'true', 'YES', '1']) expect(asBool(v)).toBe(true);
  });

  it('reconoce NO/FALSE/0 como false', () => {
    for (const v of ['NO', 'no', 'false', '0']) expect(asBool(v)).toBe(false);
  });

  it('marca como inválido cualquier otro texto', () => {
    expect(asBool('tal vez')).toBe('invalido');
  });

  it('celda vacía es undefined, no inválida', () => {
    expect(asBool(undefined)).toBeUndefined();
  });
});

describe('asInt', () => {
  it('parsea un entero en texto o número', () => {
    expect(asInt('15')).toBe(15);
    expect(asInt(15)).toBe(15);
  });

  it('marca como inválido un texto no numérico', () => {
    expect(asInt('quince')).toBe('invalido');
  });

  it('celda vacía es undefined, no inválida', () => {
    expect(asInt(undefined)).toBeUndefined();
  });
});

describe('cellRaw', () => {
  it('lee el valor plano de una celda normal', () => {
    const row = rowWithValues([undefined, 'valor']);
    expect(cellRaw(row, 2)).toBe('valor');
  });

  it('extrae el texto de una celda de hipervínculo ({ text, hyperlink })', () => {
    const row = rowWithValues([undefined, { text: 'correo@ejemplo.com', hyperlink: 'mailto:correo@ejemplo.com' }]);
    expect(cellRaw(row, 2)).toBe('correo@ejemplo.com');
  });

  it('extrae el resultado de una celda con fórmula', () => {
    const row = rowWithValues([undefined, { formula: '1+1', result: 2 }]);
    expect(cellRaw(row, 2)).toBe(2);
  });

  it('devuelve undefined si la columna no existe', () => {
    const row = rowWithValues([undefined, 'valor']);
    expect(cellRaw(row, undefined)).toBeUndefined();
  });
});
