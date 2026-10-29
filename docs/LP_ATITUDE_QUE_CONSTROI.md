# LP "Atitude que Constrói": implementação

| Campo | Valor |
|---|---|
| Fonte visual | Figma [LP — Atitude que Constrói \| Nov 2026](https://www.figma.com/design/jExjPhZQXrpHv5iMgXNOMe/), página "02 — Design" |
| Código | raiz deste repositório |
| Data | 29/10/2026 |
| Estado | V1 implementada e testada localmente. **Ainda não publicada**: faltam hospedagem, domínio e as decisões listadas em [Pendências](#pendências) |

## 1. Auditoria do Figma

O arquivo tem três páginas:

- **01 — Foundations:** está vazia.
- **02 — Design:** traz a biblioteca de componentes e quatro frames: `V1 / Desktop / 1440`, `V1 / Desktop / 1280`, `V1 / Tablet / 768` e `V1 / Mobile / 375`.
- **03 — Components:** contém o `AQ / Button / Accent`.

O próprio design se declara **"V1 ESTRUTURAL — dados, fluxo, fotos e formulário pendentes"** e marca as lacunas com o componente `AQ / Pending / Chip`. A descrição desse componente no Figma é "Sinaliza conteúdo, dados, assets ou decisões ainda pendentes". O texto do bloco de progresso diz "Sem valores, percentuais ou estados inventados nesta versão". A implementação segue essas regras: **nenhum valor, foto ou campo final foi inventado**. Cada pendência visível no Figma continua visível no site até ser resolvida pelo painel.

### Inventário de telas e seções

| # | Seção (nó Figma) | Âncora | Elementos interativos | Dados | Origem dos dados |
|---|---|---|---|---|---|
| 0 | Status (8:32) | — | — | Texto da versão | Fixo. Pode ser ocultado no painel |
| 1 | Header (8:33) | — | Logo (volta ao topo), 3 links de menu (só no desktop), CTA "Quero contribuir" / "Contribuir" | — | Fixo |
| 2 | Hero (8:34) | `#inicio` | CTA "Doe agora mesmo" → `#como-contribuir` | — | Fixo |
| 3 | Propósito (8:35) | `#sobre-a-campanha` | — | — | Fixo |
| 4 | Progresso (8:36) | `#nosso-progresso` | — | Total arrecadado, pagamentos, frequência de atualização, muro de 12 partes | **Banco**, editado no painel |
| 5 | Como contribuir (8:37) | `#como-contribuir` | Cards PIX, Cartão e Boleto. O card vira link quando há um link publicado | Instruções, chave PIX, link de pagamento | **Banco**, editado no painel |
| 6 | O terreno (8:38) | `#o-terreno` | — | 3 fotos e texto alternativo | **Banco**, upload pelo painel |
| 7 | Contato (8:39) | `#receba-atualizacoes` | Formulário: nome, e-mail, WhatsApp, consentimento e envio | Cadastros | **Banco**, com envio opcional ao Inbound |
| 8 | Footer (8:40) | — | — | — | Fixo |

**Estados implementados.** O carregamento é renderizado no servidor, então a página já chega completa. O formulário cobre envio em andamento, sucesso, erro de validação por campo, erro de rede e limite de tentativas. Para as fotos, o estado vazio usa o placeholder do Figma. Para os dados financeiros, o estado pendente usa o chip e o texto "PENDENTE" do Figma. Se o banco cair, a página continua no ar no estado pendente e o erro vai para o log.

O **painel `/admin`**, que não existe no Figma, tem estas telas: login, prestação de contas, formas de contribuição, fotos do terreno, cadastros (busca, paginação, exportação CSV, exclusão e reenvio ao Inbound) e configurações.

## 2. Arquitetura

```
Navegador ──► Next.js 16 (Node)
               ├─ src/proxy.ts            CSP com nonce por requisição
               ├─ /                      landing (Server Component, dados do banco a cada requisição)
               ├─ /admin/*               painel (sessão verificada no servidor)
               ├─ /api/leads             formulário público
               ├─ /api/media/[slot]      fotos (ETag + cache)
               ├─ /api/admin/*           API do painel (sessão + perfil + verificação de origem)
               └─ /api/health            verificação do banco
                      │
                      ▼
               PostgreSQL ─ webhook opcional assinado (HMAC) ─► ferramenta do Inbound
                          ─ e-mail opcional (SMTP) ─► equipe
```

A base foi escolhida pelos seguintes motivos:

- **Next.js:** o repositório não tinha código, e o masterplan prevê React. Um único app atende a página, a API e o painel, o que diminui a infraestrutura.
- **PostgreSQL com SQL puro:** permite um esquema pequeno e auditável e migrations legíveis. O ORM foi descartado porque o Prisma 7 mudou a forma de conexão, e essa dependência não se justifica para 9 tabelas.
- **Fotos guardadas no banco** (`bytea`, no máximo 3 × 5 MB): dispensam um serviço de arquivos à parte e funcionam em qualquer hospedagem, inclusive serverless.

### Banco de dados (`db/migrations/001_init.sql`)

| Tabela | Conteúdo | Regras |
|---|---|---|
| `leads` | Cadastros do formulário | Um registro por e-mail (índice único em minúsculas). Consentimento obrigatório (`CHECK`), com texto e data gravados. IP salvo só como hash com sal. Guarda UTM e status da integração |
| `campaign_progress` | Prestação de contas (linha única) | Valores em centavos (`BIGINT`). `bricks_completed ≤ bricks_total` |
| `contribution_methods` | PIX, cartão e boleto | Texto pendente original do Figma, mais instruções, chave e link publicados |
| `gallery_photos` | 3 posições | Tipo real conferido pela assinatura do arquivo. Guarda SHA-256 (cache) e texto alternativo obrigatório |
| `site_settings` | Faixa "V1" e aprovação do formulário | Linha única |
| `admin_users`, `admin_sessions` | Painel | Senhas com bcrypt (custo 12). Sessões guardadas como hash de token aleatório de 256 bits, válidas por 12 h |
| `rate_limits` | Limite de requisições | Janela fixa no banco, que funciona com várias instâncias |
| `audit_log` | Ações do painel | Login, alterações, exportações e exclusões |
| `schema_migrations` | Controle de versão do schema | — |

**Migrations.** Rode `npm run db:migrate`. Ele é idempotente e usa *advisory lock*, então pode ficar no passo de deploy. Mudanças futuras entram como `002_*.sql`, `003_*.sql` etc. Nunca altere uma migration já aplicada.

**Backup.** Use o backup automático do provedor do PostgreSQL (Neon, Supabase, RDS etc.) com retenção de pelo menos 7 dias, ou rode `pg_dump` diariamente. Os dados críticos são `leads`, `campaign_progress`, `contribution_methods` e `gallery_photos`.

### API

| Método e rota | Acesso | Função |
|---|---|---|
| `POST /api/leads` | Público. Exige mesma origem e aceita 5 envios por IP a cada 10 min | Cria ou atualiza o cadastro. Responde `201` também para o campo isca, sem revelar nada |
| `GET /api/media/[slot]` | Público | Serve a foto, com `ETag` e `304` |
| `GET /api/health` | Público | `200` ou `503`, conforme o banco |
| `POST /api/admin/login` / `logout` | Mesma origem. Login limitado a 5/15 min por conta+IP e 30/15 min por IP | Sessão em cookie `HttpOnly`, `SameSite=Strict` (`__Host-` e `Secure` em HTTPS) |
| `GET /api/admin/leads?page&pageSize&q` | Admin | Lista com busca e paginação |
| `DELETE /api/admin/leads/[id]` | Admin | Exclusão (pedido do titular pela LGPD) |
| `POST /api/admin/leads/[id]/resend` | Admin | Reenvia ao Inbound |
| `GET /api/admin/leads/export` | Admin | CSV (UTF-8 com BOM, separador `;`, proteção contra fórmulas) |
| `GET/PUT /api/admin/progress` | Admin e editor | Prestação de contas |
| `GET/PUT /api/admin/contribution` | Admin e editor | Formas de contribuição (aceita somente links `https://`) |
| `GET/POST /api/admin/gallery`, `DELETE /api/admin/gallery/[slot]` | Admin e editor | Fotos (JPG, PNG ou WebP, até 5 MB) |
| `GET/PUT /api/admin/settings` | Admin (escrita) | Faixa V1 e aprovação do formulário |

Todos os erros seguem o formato `{ "error": { "code", "message", "fields?" } }`. Erros de validação respondem `422` com uma mensagem por campo, e erros inesperados respondem `500` com mensagem genérica e log estruturado.

**Perfis de acesso.** O `admin` faz tudo. O `editor` cuida do conteúdo (progresso, contribuição e fotos) e **não vê dados pessoais**, seguindo o princípio de minimização da LGPD.

### Segurança

- Validação no servidor com Zod em todas as entradas. O SQL é sempre parametrizado.
- CSP com nonce por requisição (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `frame-ancestors 'none'`), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `X-Frame-Options`.
- Proteção contra CSRF: cookies `SameSite=Strict` e checagem de `Origin`/`Referer` em toda escrita.
- Rate limit no formulário e no login, e campo isca contra robôs.
- Senhas em bcrypt. O login responde em tempo constante quando o e-mail não existe e usa mensagem genérica.
- Uploads validados pelo conteúdo do arquivo (SVG e HTML disfarçados são recusados) e servidos com `nosniff` e CSP própria.
- Logs em JSON sem nome, e-mail, telefone ou senha.
- Painel e API marcados como `noindex`/`no-store`. O `.env` fica fora do Git.
- Nenhum segredo vai para o navegador: não há variáveis `NEXT_PUBLIC_*`.

## 3. Fidelidade visual

Os tokens foram tirados dos estilos do Figma:

- **Cores:** `Brand/Black #262626`, `Orange #EB773C`, `Cream #ECE5DB`, `Green #265F56`, `Yellow #EBC21A`, `Lavender #808BC3`.
- **Textos:** `AQ / Display`, `Heading`, `Body`, `UI` e `Meta`.

Os assets (logo oficial e linhas topográficas) foram exportados do Figma como SVG, sem redesenho. As composições do hero usam as mesmas proporções do Figma em todas as larguras: círculo a 42% da largura, com diâmetro de 72% ou 78% do bloco.

**Como a fidelidade foi verificada.** Em vez de comparar screenshots, o teste mede a **geometria** de cada seção no navegador e compara com as coordenadas do Figma (`tests/e2e/01-landing.spec.ts`). Também conferi posições internas, como o título do hero em (48, 275) com 665 × 228 e o bloco visual em (777, 229) com 615 × 460 no frame 1440.

| Frame | Status | Header | Hero | Propósito | Progresso | Contribuir | Terreno | Contato | Footer |
|---|---|---|---|---|---|---|---|---|---|
| 1440 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+56** | 0 |
| 1280 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+56** | 0 |
| 768 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+54** | 0 |
| 375 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+94** | 0 |

Os valores são a diferença de altura em px (site − Figma).

**Breakpoints.** O celular vale abaixo de 768px, o tablet de 768 a 1023px e o desktop a partir de 1024px. Acima de 1440px, o conteúdo fica limitado a 1344px e centralizado. O Figma não tem frames entre 768 e 1280; o corte em 1024 é uma decisão documentada.

### Diferenças intencionais em relação ao Figma

1. **Formulário de contato.** O Figma mostra três campos genéricos ("CAMPO A DEFINIR / Campo 01 — definir") e informa que os campos e o texto LGPD serão definidos pelo Inbound. Um formulário sem campos não salva nada, então foram usados campos provisórios: Nome, E-mail e WhatsApp (opcional), no mesmo componente visual. Também entrou uma **caixa de consentimento obrigatória**, exigida pela LGPD para comunicação de marketing; é ela que deixa a seção mais alta. Os textos ficam em `src/content/landing.ts` e `src/lib/validation.ts` (`CONSENT_TEXT`).
2. **Estados não desenhados no V1**, criados com os tokens da marca:
   - foco por teclado: anel creme e preto;
   - hover: botões levemente mais claros e cards com link sobem 2px;
   - erros do formulário: borda laranja e mensagem;
   - parte concluída do muro: fundo verde com número;
   - tela de sucesso do formulário;
   - painel administrativo inteiro.
3. **Menu no tablet e no celular.** O Figma não mostra os links do menu nessas larguras, então eles ficam ocultos, como no design. O CTA leva à seção de contribuição.
4. **Fonte.** O Figma usa Inter, com estilos marcados como "Neue Haas pending" e "Inner pending". Foi mantida a Inter, servida pelo próprio site. A troca para a fonte definitiva é feita em `globals.css` (`--font-sans`) e nos arquivos de fonte.

## 4. Testes executados (29/10/2026)

| Suíte | Comando | Resultado |
|---|---|---|
| TypeScript | `npm run typecheck` | Sem erros |
| ESLint (Next core-web-vitals e TS) | `npm run lint` | Sem erros ou avisos |
| Unidade e integração (Vitest, PostgreSQL 16 real) | `npm test` | **35/35 aprovados** |
| Ponta a ponta (Playwright, Chromium, build de produção) | `npm run build && npm run test:e2e` | **9/9 aprovados** |

O que os testes cobrem:

- **Formulário:** validação, normalização, consentimento obrigatório, deduplicação por e-mail, campo isca, CSRF, rate limit com `Retry-After` e IP gravado só em hash.
- **Login:** senha errada, bloqueio por tentativas, logout, sessão expirada, perfil editor sem acesso a dados pessoais.
- **Cadastros:** busca, paginação, CSV, exclusão e auditoria.
- **Conteúdo:** publicação da prestação de contas (com regra de publicação), links `https` obrigatórios, upload de imagem real, recusa de SVG disfarçado, cache 304, remoção.
- **Webhook:** assinatura HMAC conferida por um servidor receptor real, registro de falha e reenvio.
- **E2E:**
  - geometria das 4 larguras comparada ao Figma, sem rolagem horizontal, sem imagens quebradas e sem erros de console com a CSP ativa;
  - âncoras do menu e navegação por teclado;
  - formulário completo com UTM persistida no banco;
  - fluxo do painel publicando dados e conferindo o reflexo na landing;
  - exportação CSV, ocultação da faixa V1 e logout.

Os testes ponta a ponta acharam e já corrigiram dois defeitos: a CSP não era aplicada em produção (o `proxy.ts` estava fora de `src/`) e a mensagem de senha errada não aparecia no login.

**Ainda não testado:** Safari e Firefox reais, leitores de tela (NVDA/VoiceOver), SMTP real, a ferramenta real do Inbound e a performance no ambiente de produção.

## 5. Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `DATABASE_URL` | Sim | Conexão PostgreSQL |
| `APP_URL` | Sim | URL pública, sem barra final. Usada na checagem de origem e nos cookies `Secure` |
| `IP_HASH_SALT` | Sim | Sal aleatório com pelo menos 32 caracteres (`openssl rand -hex 32`) |
| `TRUST_PROXY` | Não (`false`) | Use `true` só atrás de CDN ou proxy que define `X-Forwarded-For` (Vercel, Cloudflare, Nginx). Sem ele, o rate limit do formulário usa um balde compartilhado |
| `SMTP_URL`, `MAIL_FROM`, `LEAD_NOTIFY_TO` | Não | Aviso por e-mail de novo cadastro, sem dados pessoais no corpo |
| `LEADS_WEBHOOK_URL`, `LEADS_WEBHOOK_SECRET` | Não, mas o segredo é obrigatório se a URL existir | Envio do cadastro ao Inbound. JSON `{"event":"lead.upserted","data":{…}}`, assinatura `X-Signature: sha256=<HMAC do corpo>` e `X-Event-Id` |
| `ADMIN_PASSWORD` | Só no `admin:create` | Senha do usuário criado (mínimo de 12 caracteres) |

## 6. Publicação em produção

1. Crie um PostgreSQL gerenciado com backup automático e um usuário sem privilégios de superusuário.
2. Hospede este repositório. Qualquer host Node 22 serve: Vercel, Render, Railway, Fly.io ou uma VPS com `npm run build && npm start`. Defina as variáveis da seção 5.
3. No deploy, rode `npm ci && npm run db:migrate && npm run build`.
4. Crie os usuários do painel com `npm run admin:create`.
5. Configure o domínio com HTTPS. O `APP_URL` precisa ser exatamente o domínio final.
6. Ative `TRUST_PROXY=true` se o host ou a CDN definir `X-Forwarded-For`.
7. Monitore `GET /api/health` (Better Stack, UptimeRobot etc.) e colete os logs JSON da saída padrão.
8. Pelo painel:
   - publique os dados reais;
   - envie as fotos aprovadas;
   - quando o Inbound aprovar, ajuste os campos e o texto LGPD e marque "formulário aprovado";
   - desligue a faixa "V1 ESTRUTURAL".

### Publicação no Render

O arquivo `render.yaml` (Blueprint) cria o site e o PostgreSQL juntos, já com build, migrations, health check, `TRUST_PROXY=true` e `IP_HASH_SALT` gerado.

1. No Render: **New → Blueprint**, escolha este repositório e a branch a publicar.
2. Quando pedir `APP_URL`, informe `https://atitude-que-constroi.onrender.com` (ou o domínio próprio, se já houver). Deve ser **exatamente** a URL pela qual o público acessa, sem barra final; se o Render der outro endereço ao serviço, corrija a variável e faça novo deploy. Os campos de SMTP e webhook podem ficar vazios.
3. Aguarde o primeiro deploy e abra `/api/health`: deve responder `200`.
4. Crie o primeiro usuário do painel. O plano gratuito não tem Shell, então rode no seu computador usando a **External Database URL** do banco (página do banco no Render → Connect):

   ```bash
   DATABASE_URL='<External Database URL>?sslmode=require' ADMIN_PASSWORD='uma-senha-longa-e-unica' npm run admin:create -- --email voce@igreja.org --name "Seu Nome" --role admin
   ```

5. Domínio próprio: Settings → Custom Domains no serviço, ajuste o DNS e depois troque `APP_URL` para o novo domínio.

**Limites do plano gratuito:**

- **O banco gratuito expira em 30 dias e os dados são apagados**, sem backup. Serve para homologação; antes de divulgar, mude o banco para um plano pago (ex.: Basic 256 MB).
- O site gratuito "dorme" após 15 minutos sem acesso, e a primeira visita seguinte leva cerca de 1 minuto para abrir. Para a campanha no ar, use pelo menos o plano Starter.

## 7. Pendências

| Item | Responsável | Impacto até resolver |
|---|---|---|
| Campos finais do formulário, texto de consentimento LGPD e ferramenta de destino (RD Station, HubSpot etc.) | Inbound | Os campos provisórios funcionam e os cadastros ficam no banco. Integrar exige configurar o webhook, ou um adaptador específico se a ferramenta não aceitar webhooks |
| Política de privacidade e encarregado de dados (DPO) | Jurídico ou Igreja | O consentimento cita a LGPD, mas não há link para a política. **Recomendado antes de divulgar** |
| Valores da prestação de contas, regra das 12 partes do muro e frequência de atualização | Tesouraria | O site mostra "PENDENTE", como no Figma |
| Chave PIX, PIX recorrente, links de cartão e boleto e gateway | Tesouraria e financeiro | Os cards mostram os textos pendentes do Figma. Esta LP **não processa pagamentos**: ela só leva ao link do gateway escolhido |
| 3 fotos do terreno aprovadas | Comunicação | Os placeholders do Figma continuam no lugar |
| Conteúdo do rodapé (links institucionais e dados legais) | Comunicação ou jurídico | O texto pendente do Figma continua no lugar |
| Fonte definitiva ("Neue Haas" e "Inner") e licença web | Design | Inter no lugar |
| Imagem de compartilhamento (Open Graph) e favicon definitivo | Design | O favicon usa o logo |
| Hospedagem, domínio, banco de produção e SMTP | TI ou Igreja | Nada foi publicado |
| Testes em Safari, Firefox e leitor de tela | QA | Validado só em Chromium |

**Riscos:**

- Divulgar o formulário antes da política de privacidade.
- Usar `TRUST_PROXY=true` sem um proxy confiável na frente, o que permite falsificar o IP no rate limit.
- O limite de 5 MB do upload confia no `Content-Length`. O upload exige login, então o risco é baixo.

## 8. Checklist final

| Item | Status | Evidência |
|---|---|---|
| Todas as telas do Figma (4 frames) | Concluído | 9 seções; geometria com diferença de 0px exceto no contato (seção 3) |
| Fidelidade visual | Concluído, com diferenças documentadas | Tokens e assets do Figma; teste de geometria nas 4 larguras |
| Responsividade | Concluído | E2E em 1440, 1280, 768 e 375 sem rolagem horizontal |
| Navegação, âncoras e CTAs | Concluído | E2E "links do menu e CTAs" |
| Formulário funcional com persistência | Concluído (campos provisórios) | Integração e E2E `02-lead` |
| Prestação de contas editável | Concluído | E2E `03-admin`: R$ 125.430,50 e 5 partes na landing |
| Formas de contribuição editáveis | Concluído (sem gateway) | Integração e E2E |
| Galeria com upload | Concluído | Integração e E2E |
| Painel com autenticação e perfis | Concluído | Testes de autenticação e perfil |
| Segurança (CSP, CSRF, rate limit, validação, hash) | Concluído | Testes de integração e cabeçalho CSP no E2E |
| Integração com o Inbound | Parcial | Webhook HMAC testado com receptor local; ferramenta real pendente |
| Aviso por e-mail | Parcial | Implementado; SMTP real não configurado nem testado |
| Pagamentos (PIX, cartão, boleto) | Pendente (fora do escopo da V1) | O Figma marca o fluxo como pendente |
| Documentação | Concluído | Este arquivo e `README.md` |
| Publicação em produção | Pendente | Depende de hospedagem, domínio e credenciais |
