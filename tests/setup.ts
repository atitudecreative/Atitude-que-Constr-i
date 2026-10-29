// Banco de teste separado. Nunca aponte para o banco de produção.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://atitude:atitude_dev@localhost:5432/atitude_lp_test'
process.env.APP_URL = 'http://localhost:3000'
process.env.IP_HASH_SALT = 'test-salt-0123456789abcdef0123456789abcdef'
process.env.TRUST_PROXY = 'true'
