import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from '@/server/csv'
import { formatBRL, formatInteger } from '@/lib/format'
import { sniffImageType } from '@/server/campaign'

describe('CSV', () => {
  it('neutraliza fórmulas (CSV injection)', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+5511')).toBe("'+5511")
    expect(csvCell('@soma')).toBe("'@soma")
  })

  it('escapa separador, aspas e quebras de linha', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('linha\nnova')).toBe('"linha\nnova"')
    expect(csvCell(null)).toBe('')
  })

  it('inclui BOM e cabeçalho', () => {
    const csv = toCsv(['nome'], [['Ana']])
    expect(csv.startsWith('﻿nome\r\nAna')).toBe(true)
  })
})

describe('formatação', () => {
  it('formata reais e inteiros em pt-BR', () => {
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89')
    expect(formatInteger(12500)).toBe('12.500')
  })
})

describe('sniffImageType', () => {
  it('reconhece pela assinatura, não pela extensão', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(sniffImageType(new TextEncoder().encode('RIFF1234WEBPVP8 '))).toBe('image/webp')
    expect(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
  })
})
