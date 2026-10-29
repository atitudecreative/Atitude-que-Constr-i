import { requireUser } from '@/server/auth'
import { getGallery, MAX_PHOTO_BYTES, savePhoto } from '@/server/campaign'
import { assertSameOrigin, errors, json, route } from '@/server/http'

export const GET = route('GET /api/admin/gallery', async (request) => {
  await requireUser(request)
  return json(await getGallery())
})

// multipart/form-data: slot (1-3), altText, file (opcional quando só o texto muda).
export const POST = route('POST /api/admin/gallery', async (request) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_PHOTO_BYTES + 64 * 1024) throw errors.tooLarge('A foto deve ter até 5 MB.')
  if (!(request.headers.get('content-type') ?? '').includes('multipart/form-data')) throw errors.badRequest('Envie como formulário.')
  const form = await request.formData()
  const file = form.get('file')
  const upload = file instanceof File && file.size > 0 ? file : null
  return json(await savePhoto(form.get('slot'), upload, form.get('altText'), user.id))
})
