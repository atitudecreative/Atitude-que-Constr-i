import { readPhoto } from '@/server/campaign'
import { errors, route } from '@/server/http'

export const GET = route<{ params: Promise<{ slot: string }> }>('GET /api/media/[slot]', async (request, { params }) => {
  const { slot } = await params
  const photo = await readPhoto(slot)
  if (!photo) throw errors.notFound()
  const etag = `"${photo.sha256}"`
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } })
  return new Response(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mime_type,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  })
})
