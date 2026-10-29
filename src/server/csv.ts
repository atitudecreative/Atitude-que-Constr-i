// Gera CSV seguro para Excel/Sheets: escapa aspas e neutraliza fórmulas (CSV injection).
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = value instanceof Date ? value.toISOString() : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",;\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(';'))
  // BOM para o Excel reconhecer UTF-8 (acentos).
  return '﻿' + lines.join('\r\n') + '\r\n'
}
