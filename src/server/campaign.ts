import 'server-only'
import { createHash } from 'node:crypto'
import { query } from './db'
import { audit } from './audit'
import { errors } from './http'
import {
  altTextSchema,
  contributionSchema,
  progressSchema,
  settingsSchema,
  type ContributionInput,
  type ProgressInput,
} from '@/lib/validation'

export type Settings = { showStatusBar: boolean; leadFormApproved: boolean }
export type Progress = ProgressInput & { updatedAt: string }
export type ContributionMethod = ContributionInput & { title: string; pendingDescription: string }
export type GalleryPhoto = { slot: number; altText: string; version: string; src: string }
export type LandingData = {
  settings: Settings
  progress: Progress
  methods: ContributionMethod[]
  gallery: (GalleryPhoto | null)[]
}

export async function getSettings(): Promise<Settings> {
  const rows = await query<{ show_status_bar: boolean; lead_form_approved: boolean }>(
    'SELECT show_status_bar, lead_form_approved FROM site_settings WHERE id = 1',
  )
  return { showStatusBar: rows[0].show_status_bar, leadFormApproved: rows[0].lead_form_approved }
}

export async function getProgress(): Promise<Progress> {
  const rows = await query<{
    published: boolean
    total_raised_cents: string | null
    payments_count: number | null
    update_frequency: string | null
    bricks_total: number
    bricks_completed: number | null
    updated_at: Date
  }>('SELECT * FROM campaign_progress WHERE id = 1')
  const r = rows[0]
  return {
    published: r.published,
    totalRaisedCents: r.total_raised_cents === null ? null : Number(r.total_raised_cents),
    paymentsCount: r.payments_count,
    updateFrequency: r.update_frequency,
    bricksTotal: r.bricks_total,
    bricksCompleted: r.bricks_completed,
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

export async function getContributionMethods(): Promise<ContributionMethod[]> {
  const rows = await query<{
    code: ContributionInput['code']
    title: string
    pending_description: string
    description: string | null
    pix_key: string | null
    url: string | null
    published: boolean
  }>('SELECT code, title, pending_description, description, pix_key, url, published FROM contribution_methods ORDER BY sort_order')
  return rows.map((r) => ({
    code: r.code,
    title: r.title,
    pendingDescription: r.pending_description,
    description: r.description,
    pixKey: r.pix_key,
    url: r.url,
    published: r.published,
  }))
}

export async function getGallery(): Promise<(GalleryPhoto | null)[]> {
  const rows = await query<{ slot: number; alt_text: string; sha256: string }>(
    'SELECT slot, alt_text, sha256 FROM gallery_photos ORDER BY slot',
  )
  return [1, 2, 3].map((slot) => {
    const row = rows.find((r) => r.slot === slot)
    if (!row) return null
    const version = row.sha256.slice(0, 12)
    return { slot, altText: row.alt_text, version, src: `/api/media/${slot}?v=${version}` }
  })
}

export async function getLandingData(): Promise<LandingData> {
  const [settings, progress, methods, gallery] = await Promise.all([
    getSettings(),
    getProgress(),
    getContributionMethods(),
    getGallery(),
  ])
  return { settings, progress, methods, gallery }
}

export async function updateProgress(input: unknown, userId: string) {
  const data = progressSchema.parse(input)
  await query(
    `UPDATE campaign_progress SET published = $1, total_raised_cents = $2, payments_count = $3, update_frequency = $4,
            bricks_total = $5, bricks_completed = $6, updated_at = now(), updated_by = $7 WHERE id = 1`,
    [data.published, data.totalRaisedCents, data.paymentsCount, data.updateFrequency, data.bricksTotal, data.bricksCompleted, userId],
  )
  await audit(userId, 'update', 'campaign_progress', '1', data)
  return getProgress()
}

export async function updateContributionMethod(input: unknown, userId: string) {
  const data = contributionSchema.parse(input)
  await query(
    `UPDATE contribution_methods SET published = $2, description = $3, pix_key = $4, url = $5, updated_at = now(), updated_by = $6
      WHERE code = $1`,
    [data.code, data.published, data.description, data.code === 'pix' ? data.pixKey : null, data.url, userId],
  )
  await audit(userId, 'update', 'contribution_method', data.code, data)
  return getContributionMethods()
}

export async function updateSettings(input: unknown, userId: string) {
  const data = settingsSchema.parse(input)
  await query('UPDATE site_settings SET show_status_bar = $1, lead_form_approved = $2, updated_at = now(), updated_by = $3 WHERE id = 1', [
    data.showStatusBar,
    data.leadFormApproved,
    userId,
  ])
  await audit(userId, 'update', 'site_settings', '1', data)
  return getSettings()
}

// ---- Galeria ----

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// Identifica o tipo real pelo conteúdo (assinatura do arquivo), não pela extensão.
export function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  )
    return 'image/png'
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp'
  return null
}

export function parseSlot(value: unknown): 1 | 2 | 3 {
  const slot = Number(value)
  if (slot !== 1 && slot !== 2 && slot !== 3) throw errors.badRequest('Posição da foto inválida.')
  return slot
}

export async function savePhoto(slotValue: unknown, file: File | null, altValue: unknown, userId: string) {
  const slot = parseSlot(slotValue)
  const altText = altTextSchema.parse(altValue)
  if (!file) {
    // Apenas atualização do texto alternativo.
    const rows = await query<{ slot: number }>(
      'UPDATE gallery_photos SET alt_text = $2, updated_at = now(), updated_by = $3 WHERE slot = $1 RETURNING slot',
      [slot, altText, userId],
    )
    if (!rows.length) throw errors.badRequest('Envie uma foto para esta posição.')
  } else {
    if (file.size > MAX_PHOTO_BYTES) throw errors.tooLarge('A foto deve ter até 5 MB.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const mime = sniffImageType(bytes)
    if (!mime) throw errors.badRequest('Formato não suportado. Use JPG, PNG ou WebP.')
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    await query(
      `INSERT INTO gallery_photos (slot, mime_type, data, size_bytes, sha256, alt_text, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slot) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data, size_bytes = EXCLUDED.size_bytes,
         sha256 = EXCLUDED.sha256, alt_text = EXCLUDED.alt_text, updated_at = now(), updated_by = EXCLUDED.updated_by`,
      [slot, mime, Buffer.from(bytes), bytes.length, sha256, altText, userId],
    )
  }
  await audit(userId, file ? 'upload' : 'update', 'gallery_photo', String(slot), { altText, size: file?.size ?? null })
  return getGallery()
}

export async function deletePhoto(slotValue: unknown, userId: string) {
  const slot = parseSlot(slotValue)
  await query('DELETE FROM gallery_photos WHERE slot = $1', [slot])
  await audit(userId, 'delete', 'gallery_photo', String(slot))
  return getGallery()
}

export async function readPhoto(slotValue: unknown) {
  const slot = parseSlot(slotValue)
  const rows = await query<{ mime_type: string; data: Buffer; sha256: string }>(
    'SELECT mime_type, data, sha256 FROM gallery_photos WHERE slot = $1',
    [slot],
  )
  return rows[0] ?? null
}
