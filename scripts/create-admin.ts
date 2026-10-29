// Cria ou atualiza um usuário do painel. Não existe cadastro público de administradores.
// Uso: DATABASE_URL=... ADMIN_PASSWORD=... npm run admin:create -- --email pessoa@igreja.org --name "Nome" [--role admin|editor]
import bcrypt from 'bcryptjs'
import { Client } from 'pg'

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}

async function main() {
  const email = arg('email')?.trim().toLowerCase()
  const name = arg('name')?.trim()
  const role = arg('role') ?? 'admin'
  const password = process.env.ADMIN_PASSWORD
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Informe --email válido')
  if (!name) throw new Error('Informe --name')
  if (role !== 'admin' && role !== 'editor') throw new Error('--role deve ser admin ou editor')
  if (!password || password.length < 12) throw new Error('Defina ADMIN_PASSWORD com ao menos 12 caracteres')

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const hash = await bcrypt.hash(password, 12)
    await client.query(
      `INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, active = true`,
      [email, name, hash, role],
    )
    // Encerra sessões antigas ao redefinir a senha.
    await client.query('DELETE FROM admin_sessions WHERE user_id = (SELECT id FROM admin_users WHERE email = $1)', [email])
    console.log(`usuário ${email} (${role}) pronto`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
