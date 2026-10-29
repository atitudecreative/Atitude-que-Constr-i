import { query } from '@/server/db'
import { logger } from '@/server/logger'

export async function GET() {
  try {
    await query('SELECT 1')
    return Response.json({ status: 'ok' })
  } catch (error) {
    logger.error('health_db_failed', { error })
    return Response.json({ status: 'degraded' }, { status: 503 })
  }
}
