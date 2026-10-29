# LP "Atitude que Constrói"

Landing page da campanha, com backend próprio, criada a partir do Figma
[LP — Atitude que Constrói | Nov 2026](https://www.figma.com/design/jExjPhZQXrpHv5iMgXNOMe/) (página "02 — Design", frames V1 1440 / 1280 / 768 / 375).

O que foi feito, as decisões tomadas, os desvios do Figma e as pendências estão em [`docs/LP_ATITUDE_QUE_CONSTROI.md`](docs/LP_ATITUDE_QUE_CONSTROI.md).

## Stack

- **Next.js 16** (App Router, Route Handlers, `proxy.ts` para a CSP), **React 19** e **TypeScript**
- **PostgreSQL ≥ 14** acessado com `pg` (SQL parametrizado) e migrations SQL versionadas em `db/migrations`
- **Zod** para validar dados no cliente e no servidor
- CSS Modules com os tokens do Figma em `src/app/globals.css`, e a fonte Inter servida pelo próprio site (`@fontsource/inter`)
- Vitest (testes de unidade e integração com banco real) e Playwright (testes ponta a ponta e verificação de layout)

## Rodar localmente

Requisitos: Node 22+ e PostgreSQL.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o ambiente. Copie o modelo e preencha `DATABASE_URL`, `APP_URL` e `IP_HASH_SALT`:

   ```bash
   cp .env.example .env
   ```

3. Crie as tabelas:

   ```bash
   npm run db:migrate
   ```

4. Crie o primeiro usuário do painel. Não existe cadastro público de administradores:

   ```bash
   ADMIN_PASSWORD='uma-senha-longa-e-unica' npm run admin:create -- --email voce@igreja.org --name "Seu Nome" --role admin
   ```

5. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

O site abre em http://localhost:3000 e o painel em http://localhost:3000/admin.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript |
| `npm run db:migrate` | Aplica as migrations pendentes (idempotente, com lock) |
| `npm run admin:create` | Cria um usuário do painel ou redefine a senha (encerra as sessões antigas) |
| `npm test` | Testes de unidade e integração. Usam o banco de `TEST_DATABASE_URL`, que por padrão é `atitude_lp_test` local |
| `npm run test:e2e` | Testes ponta a ponta. Rode `npm run build` antes; o banco usado é `E2E_DATABASE_URL`, que por padrão é `atitude_lp_e2e` |

Os bancos de teste são **apagados e recriados a cada execução**. Nunca aponte essas variáveis para o banco de produção.

## Estrutura

```
db/migrations/        SQL versionado (001_init.sql)
scripts/              migrate.ts, create-admin.ts
public/brand/         logo e linhas topográficas (SVG exportados do Figma)
src/app/              páginas (landing, /admin) e API (/api/*)
src/components/       landing/ (seções), admin/ (painel), ui/ (botões, chip, logo)
src/content/          textos da landing (transcritos do Figma)
src/lib/              validação (Zod) e formatação compartilhadas
src/server/           banco, autenticação, rate limit, serviços, integrações, logs
src/proxy.ts          CSP com nonce por requisição
tests/                unit/, integration/, e2e/
```
