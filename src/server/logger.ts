import 'server-only'

type Level = 'debug' | 'info' | 'warn' | 'error'
type Context = Record<string, unknown>

// Logs estruturados em JSON (stdout/stderr). Nunca registrar nome, e-mail, telefone ou senha.
function write(level: Level, msg: string, ctx?: Context) {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return
  const entry = { ts: new Date().toISOString(), level, msg, ...ctx }
  const line = JSON.stringify(entry, (_k, v) => (v instanceof Error ? { name: v.name, message: v.message } : v))
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, ctx?: Context) => write('debug', msg, ctx),
  info: (msg: string, ctx?: Context) => write('info', msg, ctx),
  warn: (msg: string, ctx?: Context) => write('warn', msg, ctx),
  error: (msg: string, ctx?: Context) => write('error', msg, ctx),
}
