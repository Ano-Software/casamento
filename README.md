# Our Forever — Ademilson & Regiane

Convite de casamento digital, cinematográfico e mobile-first, com confirmação de presença (RSVP) real: as respostas são **gravadas** no MySQL da Hostinger (ou em arquivo, no desenvolvimento) e **enviadas por e-mail** aos noivos pelo backend.

**Sábado, 28 de novembro de 2026** — um dia, três momentos:

| | Momento | Horário | Local |
|---|---|---|---|
| I | Casamento civil | 15h30 (chegada às 15h20) | Cartório do 2º Ofício de Castanhal — [Google Maps](https://maps.app.goo.gl/QGuHDsKwDNSM1q9Q7) |
| II | Sessão de fotos | Na sequência do civil (a definir) | Jardins Sollaris Condomínio — [Google Maps](https://maps.app.goo.gl/APvL5EhSRhX9P4mq6) |
| III | Encontro noturno | A definir | Restaurante a definir (cada convidado paga o próprio consumo) |

---

## Sumário

1. [A narrativa](#1-a-narrativa)
2. [Estrutura do projeto](#2-estrutura-do-projeto)
3. [Instalação rápida](#3-instalação-rápida)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Banco de dados (MySQL da Hostinger)](#5-banco-de-dados-mysql-da-hostinger)
6. [E-mail (SMTP)](#6-e-mail-smtp)
7. [Música](#7-música)
8. [Produção e publicação](#8-produção-e-publicação)
9. [Consultar as confirmações](#9-consultar-as-confirmações)
10. [Segurança e confiabilidade](#10-segurança-e-confiabilidade)
11. [Personalização](#11-personalização)
12. [Checklist antes de enviar o link](#12-checklist-antes-de-enviar-o-link)

---

## 1. A narrativa

A página é um pequeno filme vertical: um prólogo, o convite e os **três capítulos do dia**.

| Cena | Conteúdo | Foto | Movimento |
|---|---|---|---|
| Abertura | "Algumas histórias são escritas para durar para sempre." → ADEMILSON & REGIANE → botão **VIVER ESSE MOMENTO** | — | Cartelas com fade e desfoque; um toque adianta direto para o botão (≈4 s) |
| Prólogo · Nossa história | "Dois caminhos, uma escolha, uma vida inteira." | `casal2.jpeg` (principal, tela cheia) | Zoom lento de câmera e parallax discreto |
| O noivado | "Um sim que nos trouxe até aqui. Outro que nos acompanhará para sempre." | `mao.jpeg` | Revelação circular que nasce do anel, como uma íris de cinema |
| O convite | Nomes, data em destaque, sumário "Um dia, três momentos" (com links para cada capítulo) e contagem regressiva até as 15h30 | — | A "luz se acende": transição do escuro para o papel |
| **I · O sim** | Casamento civil: "O primeiro sim. O começo de uma vida inteira.", **15h30** em destaque com aviso "Chegada às 15h20 · início pontual", cartório e **COMO CHEGAR** | — | Duas alianças desenhadas em traço fino, sobre tom areia |
| **II · Memórias para sempre** | Sessão de fotos: "Depois do nosso sim, queremos eternizar esse momento.", Jardins Sollaris e **VER LOCALIZAÇÃO** | `casal2`, `mao` e `porta` como fotos impressas | Álbum com parallax em três velocidades, luz de entardecer |
| **III · Uma noite para celebrar** | Encontro no restaurante, informações pendentes e o aviso sobre o consumo individual | — | Noite com brilho âmbar e luzes que cintilam como velas |
| Sua presença | "Queremos você com a gente." + **CONFIRMAR PRESENÇA** | `casal1.jpeg` (fundo) | Formulário em modal (bottom sheet no celular) |

**RSVP:** o convidado informa o nome e responde **sim ou não para cada momento**, de forma independente. Se escolher o encontro noturno, aparece o aviso de que o restaurante e o horário serão divulgados em breve. O e-mail aos noivos traz as três respostas.

Decisões de direção de arte:

- **`porta.jpeg`** é, na prática, o reflexo do casal num espelho. A metade inferior (vime com luz rosa) brigava com a paleta, então a foto aparece recortada no espelho, que funciona como a "moldura" pedida.
- **`mao.jpeg`** tem um fundo vermelho intenso: recebeu uma gradação dessaturada e quente para manter o foco no anel.
- **Tipografia:** EB Garamond (serifada) + Inter (sans-serif). A Cormorant Garamond foi testada, mas a versão atual do Google Fonts desenha o acento circunflexo deslocado (ê, ô), o que estragaria palavras como "você".
- Em telas largas, as fotos mantêm o formato retrato original numa coluna central, sobre um fundo desfocado delas mesmas.
- Respeita `prefers-reduced-motion`: sem zoom, parallax ou granulação animada, e a abertura mostra o botão imediatamente.

## 2. Estrutura do projeto

```
/
├── client/                    Frontend — React + Vite + TypeScript + Tailwind CSS v4 + Motion
│   ├── index.html             SEO, Open Graph (WhatsApp), fontes, preload da foto principal
│   ├── public/                favicon.svg, audio/ (trilha licenciada, opcional)
│   └── src/
│       ├── App.tsx            Orquestra as cenas, o áudio e a modal
│       ├── sections/          Intro, Hero, Engagement, Invitation, Location, Rsvp, Footer
│       ├── components/        Photo, Reveal, Countdown, RsvpModal, ChapterLabel, FilmGrain
│       ├── audio/             Módulo de trilha sonora (config, hook, botão)
│       ├── hooks/             useCountdown, useScrollLock
│       ├── services/api.ts    Cliente HTTP do RSVP
│       ├── config/invite.ts   Textos factuais e URLs das fotos (fonte única)
│       └── styles/index.css   Tema (paleta, fontes), granulação, animações
├── server/                    Backend — Node.js + Express + TypeScript
│   └── src/
│       ├── server.ts          Inicialização e desligamento gracioso
│       ├── app.ts             Helmet, CORS, rate limit, rotas, arquivos estáticos
│       ├── config/env.ts      Leitura e validação das variáveis de ambiente
│       ├── routes/rsvp.ts     GET /api/config · POST /api/rsvp · GET /api/health
│       └── services/          validation (zod), sanitize, storage (MySQL/arquivo), mailer (Nodemailer)
├── database/schema.sql        Tabela, segurança (RLS) e view de resumo
├── .env.example               Modelo de configuração, sem credenciais
└── package.json               Workspaces e scripts do projeto completo
```

## 3. Instalação rápida

Requisitos: **Node.js 20.11+** (testado com Node 24) e npm.

```bash
# 1. Instalar as dependências (frontend e backend)
npm install

# 2. Criar o arquivo de configuração
cp .env.example .env          # Windows (PowerShell): Copy-Item .env.example .env

# 3. Rodar o projeto completo em desenvolvimento
npm run dev
```

- Frontend: http://localhost:5173 (o Vite encaminha `/api` para o backend)
- Backend: http://localhost:3001

Sem nenhuma configuração extra, o RSVP já funciona: as respostas ficam em `server/data/rsvps.jsonl` e o e-mail é ignorado (o log avisa). Para testar no celular na mesma rede Wi-Fi, abra `http://IP-DO-COMPUTADOR:5173`.

Comandos individuais:

| Comando | O que faz |
|---|---|
| `npm run dev` | Frontend + backend com recarregamento automático |
| `npm run dev:client` | Só o frontend |
| `npm run dev:server` | Só o backend |
| `npm run build` | Gera `client/dist` e `server/dist` |
| `npm start` | Inicia o backend compilado (produção) |
| `npm run typecheck` | Verifica os tipos dos dois projetos |

## 4. Variáveis de ambiente

Um único `.env` na raiz serve aos dois lados. **Tudo que começa com `VITE_` vai parar no navegador**: nunca coloque segredos nessas variáveis.

| Variável | Onde | Descrição |
|---|---|---|
| `PORT` | servidor | Porta HTTP (padrão 3001; a hospedagem costuma definir) |
| `TRUST_PROXY` | servidor | `1` quando atrás de proxy (Render, Railway, Nginx), para o rate limit identificar o IP real |
| `ALLOWED_ORIGINS` | servidor | Domínios do frontend, separados por vírgula, quando hospedado em outro domínio |
| `SERVE_CLIENT` | servidor | `true` para o backend também servir o site (`client/dist`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | servidor | Credenciais do provedor de e-mail |
| `RSVP_RECIPIENT_EMAIL` | servidor | **E-mail real dos noivos** (aceita vários, separados por vírgula). Configure antes de publicar |
| `RSVP_SENDER_EMAIL` | servidor | Remetente (normalmente o mesmo do `SMTP_USER`) |
| `RSVP_ALLOW_COMPANIONS` | servidor | `true` exibe o campo de acompanhantes; `false` o oculta |
| `RSVP_MAX_COMPANIONS` | servidor | Limite de acompanhantes por convidado (validado no servidor) |
| `STORAGE_DRIVER` | servidor | `mysql` ou `file`; vazio escolhe automaticamente |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_TABLE`, `DB_SSL` | servidor | MySQL da Hostinger (seção 5) |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MIN` | servidor | Envios permitidos por IP na janela (padrão 5 a cada 15 min) |
| `VITE_API_URL` | navegador | URL do backend quando ele está em outro domínio (sem `/` no final) |
| `VITE_AUDIO_SRC`, `VITE_AUDIO_TITLE` | navegador | Trilha sonora licenciada (seção 7) |
| `VITE_SPOTIFY_TRACK_URL` | navegador | Opcional: player oficial do Spotify no rodapé |

> As variáveis `VITE_` são lidas no momento do **build**. Ao alterá-las, gere o frontend de novo.

## 5. Banco de dados (MySQL da Hostinger)

O e-mail sozinho não é um RSVP confiável (pode cair em spam ou falhar). Em produção, o registro oficial fica no **MySQL da Hostinger**. O Supabase é usado apenas para hospedar as fotos.

1. No **hPanel → Bancos de dados → Gerenciamento**, crie um banco MySQL com um usuário exclusivo para o convite e uma senha forte.
2. Preencha no `.env` do servidor:
   ```env
   DB_HOST=127.0.0.1        # app Node.js rodando na própria Hostinger
   DB_PORT=3306
   DB_USER=u123456789_convite
   DB_PASSWORD=senha-forte
   DB_NAME=u123456789_casamento
   ```
3. Inicie o servidor. A tabela `rsvps` é **criada automaticamente**, e o log mostra `[db] MySQL conectado; tabela pronta.` Se preferir criá-la à mão, rode [`database/schema.sql`](database/schema.sql) no phpMyAdmin.

**Qual host usar?**
- **Backend hospedado na Hostinger** (plano com Node.js ou VPS no mesmo servidor): `DB_HOST=127.0.0.1`. Não use `localhost`, que pode resolver para IPv6 e falhar.
- **Backend fora da Hostinger** (ou para testar no seu computador): no hPanel, abra **Bancos de dados → MySQL remoto**, libere o IP de onde o backend vai conectar e use o host exibido ali (`srvNNNN.hstgr.io`). Considere `DB_SSL=true`.

Segurança:
- As credenciais ficam só no `.env` do servidor e nunca chegam ao navegador.
- Todas as consultas são parametrizadas (sem risco de SQL injection).
- `request_id` único + `INSERT IGNORE`: se o convidado reenviar após uma falha de rede, a resposta não é duplicada.

## 6. E-mail (SMTP)

O backend envia um e-mail a cada nova resposta, com nome, resposta, acompanhantes (se habilitado) e data/hora de Brasília. Assunto: **Confirmação de presença — Casamento Ademilson & Regiane**.

Exemplos de configuração:

**Gmail** (exige verificação em duas etapas e uma *senha de app* em myaccount.google.com → Segurança → Senhas de app):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu.email@gmail.com
SMTP_PASS=senha-de-app-de-16-letras
RSVP_SENDER_EMAIL=seu.email@gmail.com
RSVP_RECIPIENT_EMAIL=email-dos-noivos@exemplo.com
```

**E-mail do seu domínio** (Hostinger, Zoho, etc.): use o host, a porta e a senha da caixa indicados pelo provedor (ex.: `smtp.hostinger.com`, porta 465, `SMTP_SECURE=true`).

**Serviços transacionais** (Brevo, Resend, Mailgun, SendGrid): crie a credencial SMTP no painel e verifique o domínio do remetente.

Ao iniciar, o servidor testa a conexão SMTP e registra o resultado no log.

**Regra de sucesso:** o convidado só vê a mensagem de confirmação quando a resposta foi **gravada no banco ou entregue por e-mail**. Se os dois falharem, recebe um aviso claro para tentar de novo (HTTP 503). Se só o e-mail falhar, a resposta continua gravada e o erro fica no log.

> Algumas hospedagens bloqueiam as portas SMTP (25/465/587) em planos gratuitos. Se o e-mail não sair em produção, confira a política do seu provedor ou use um serviço transacional que ofereça porta alternativa (alguns aceitam 2525 ou 2587).

## 7. Música

A trilha é **"Photograph", de Ed Sheeran**, tocada pelo **player oficial do Spotify** (Spotify iFrame API). O projeto não inclui nenhum arquivo de áudio da música e não usa extração do YouTube, scraping nem serviços não autorizados.

### Como funciona (padrão: Spotify)

- O player oficial é preparado enquanto a abertura roda. Ao tocar em **VIVER ESSE MOMENTO**, o convite tenta iniciar a faixa.
- Um mini player discreto aparece no rodapé da tela. Quando a música começa, ele se recolhe sozinho (ou pela seta) e fica só o botão redondo no topo, para pausar e retomar.
- Se o navegador não deixar o site iniciar a música sozinho (comum no iPhone), o player continua visível para o convidado tocar no ▶.
- A música pausa ao trocar de aba ou de app (por exemplo, ao voltar para o WhatsApp) e retoma ao voltar.

**Limitações do Spotify (definidas por ele, não pelo convite):**
- Quem **não está logado no Spotify** naquele navegador ouve só a **prévia de 30 segundos** (o player mostra a etiqueta "Prévia"). Quem está logado ouve a faixa completa.
- O Spotify decide quando aceita o comando de tocar; no celular, às vezes é preciso tocar no próprio player.

A faixa fica em [`client/src/audio/config.ts`](client/src/audio/config.ts). Para trocar sem mexer no código:
```env
VITE_SPOTIFY_TRACK_URL=https://open.spotify.com/track/ID_DA_FAIXA   # ou "off" para desligar
```

### Alternativa: arquivo de áudio (música completa para todos)

Para que todos ouçam a música inteira, em loop e com início mais confiável, use um arquivo de áudio cuja publicação você tenha permissão para fazer: uma versão licenciada, um arranjo instrumental com licença de uso, uma trilha *royalty-free* ou uma gravação própria autorizada. O arquivo tem prioridade sobre o Spotify:

```env
# arquivo em client/public/audio/trilha.mp3, ou uma URL pública
VITE_AUDIO_SRC=/audio/trilha.mp3
VITE_AUDIO_TITLE=Photograph — Ed Sheeran
```

Dicas: MP3 ou M4A, 128 kbps (≈3–4 MB). No iPhone o volume é controlado só pelos botões do aparelho, então o fade-in não tem efeito.

Em qualquer caso, se a música falhar, o convite segue funcionando normalmente.

> As variáveis `VITE_` entram no **build**: depois de alterá-las, gere e publique o site de novo.

## 8. Produção e publicação

```bash
npm install
npm run build        # gera client/dist e server/dist
npm start            # inicia o backend (node server/dist/server.js)
```

> Use `npm install --include=dev` no build das hospedagens: com `NODE_ENV=production` o npm pula as ferramentas de build (Vite, TypeScript).

Variáveis mínimas de produção: `NODE_ENV=production`, `TRUST_PROXY=1` (se houver proxy), credenciais do MySQL e do SMTP e `RSVP_RECIPIENT_EMAIL`.

### Opção A — Um único serviço Node.js (mais simples)

O backend serve o site e a API no mesmo domínio: sem CORS e sem `VITE_API_URL`.

Serve para Render, Railway, Fly.io, uma VPS ou planos da Hostinger com suporte a aplicações Node.js.

| Configuração | Valor |
|---|---|
| Build command | `npm install --include=dev && npm run build` |
| Start command | `npm start` |
| Variáveis | `SERVE_CLIENT=true`, `TRUST_PROXY=1`, `NODE_ENV=production`, `DB_*`, SMTP, `RSVP_*` |
| Versão do Node | 20 ou superior |

Observações:
- Planos gratuitos que "hibernam" (ex.: Render Free) demoram alguns segundos no primeiro acesso. O convite já "acorda" a API em segundo plano quando é aberto, e o reenvio após um tempo esgotado não duplica respostas.
- Configure o **MySQL** (`DB_*`): em hospedagens sem disco persistente, o arquivo `rsvps.jsonl` seria apagado a cada nova publicação.

Numa VPS (Ubuntu), o roteiro típico é: instalar o Node 20+, clonar o projeto, criar o `.env`, rodar `npm install && npm run build`, manter o processo ativo com `pm2 start "npm start" --name convite` e colocar o Nginx na frente (`proxy_pass http://127.0.0.1:3001`) com HTTPS via `certbot --nginx`.

### Hostinger (Node.js Web App via GitHub)

Se a Hostinger detectar o framework errado (por exemplo, **Next.js**, que falha com `No output directory found after build`), ajuste em **Configurações de compilação e saída**:

| Campo | Valor |
|---|---|
| Framework | **Express** |
| Versão do Node | 22 (ou 20+) |
| Diretório raiz | `./` |
| Comando de build | `npm run build` |
| Arquivo de entrada | `server/dist/server.js` |
| Diretório de saída | vazio |

Variáveis de ambiente do site: `SERVE_CLIENT=true`, `TRUST_PROXY=1`, além de `DB_*`, SMTP e `RSVP_*`.
### Opção B — Frontend estático + backend separado

**Frontend** (Vercel, Netlify, Cloudflare Pages ou a hospedagem comum da Hostinger):
- Diretório: `client` · Build: `npm install --include=dev && npm run build` · Saída: `client/dist`
  (em monorepo, também funciona `npm install && npm run build:client` na raiz)
- Variável de build: `VITE_API_URL=https://api.seudominio.com.br` (e as de áudio, se houver)
- Numa hospedagem comum, basta enviar o conteúdo de `client/dist` para a pasta pública (`public_html`).

**Backend** (Render, Railway, Fly.io, VPS):
- Build: `npm install --include=dev && npm run build:server` · Start: `npm start`
- Variáveis: `ALLOWED_ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br`, `TRUST_PROXY=1`, `DB_*` (use o host remoto `srvNNNN.hstgr.io`, seção 5), SMTP, `RSVP_*`

### Se a hospedagem não executar Node.js

Planos de hospedagem compartilhada comuns servem só arquivos estáticos e PHP: não mantêm um processo Node ativo nem garantem SMTP. Nesse caso, publique o frontend estático ali (Opção B) e o backend num serviço que execute Node.js. Não existe RSVP confiável apenas no navegador, porque as credenciais de e-mail e do banco precisam ficar no servidor.

### Domínio e HTTPS

1. No provedor do domínio, crie os registros DNS indicados pela hospedagem (geralmente um `CNAME` para `www` e um `A`/`ALIAS` para o domínio raiz; numa API separada, um `CNAME` para `api`).
2. Render, Railway, Vercel, Netlify e Hostinger emitem o certificado HTTPS automaticamente (Let's Encrypt) depois que o DNS propagar.
3. Atualize `ALLOWED_ORIGINS` e `VITE_API_URL` com os endereços finais em `https://` e gere o frontend novamente.

### Pré-visualização no WhatsApp

As tags Open Graph já apontam para a foto principal. O WhatsApp guarda a pré-visualização em cache: teste com o link definitivo antes de distribuí-lo. Para conferir as tags, use o [Sharing Debugger da Meta](https://developers.facebook.com/tools/debug/).

## 9. Consultar as confirmações

**MySQL (Hostinger):** no hPanel, abra **Bancos de dados → phpMyAdmin**, selecione o banco e a tabela `rsvps`, ou rode na aba **SQL**:

```sql
-- Totais por momento
SELECT SUM(civil)  AS casamento_civil,
       SUM(photos) AS sessao_de_fotos,
       SUM(dinner) AS encontro_noturno,
       SUM(civil = 0 AND photos = 0 AND dinner = 0) AS nao_poderao_ir
FROM rsvps;

-- Todas as respostas (horário de Brasília)
SELECT full_name,
       IF(civil,  'Sim', 'Não') AS civil,
       IF(photos, 'Sim', 'Não') AS fotos,
       IF(dinner, 'Sim', 'Não') AS jantar,
       DATE_SUB(created_at, INTERVAL 3 HOUR) AS enviado_em
FROM rsvps ORDER BY full_name;

-- Lista para a reserva do restaurante
SELECT full_name FROM rsvps WHERE dinner = 1 ORDER BY full_name;
```

A aba **Exportar** do phpMyAdmin gera CSV ou planilha.

**Arquivo local:** `server/data/rsvps.jsonl`, com uma resposta JSON por linha.

## 10. Segurança e confiabilidade

- **Validação no servidor** com zod: esquema estrito (campos extras são rejeitados), nome com 3–120 caracteres contendo só letras, espaços, hífen e apóstrofo, e limite de acompanhantes conferido no servidor.
- **Sanitização:** remove caracteres de controle, invisíveis e bidirecionais e normaliza Unicode e espaços.
- **E-mail sem injeção:** destinatário, remetente e assunto vêm só da configuração; o conteúdo do convidado é escapado no HTML.
- **Antiabuso:** rate limit por IP no RSVP (5 a cada 15 min) e na API inteira, honeypot invisível, tempo mínimo de preenchimento e corpo JSON limitado a 10 kB.
- **Sem duplicidade:** cada preenchimento tem um `requestId`; reenvios não duplicam o registro nem o e-mail.
- **Cabeçalhos:** Helmet, com CSP restritiva quando o backend serve o site, e CORS limitado aos domínios configurados.
- **Erros:** respostas HTTP adequadas (400, 413, 415, 429, 503) com mensagens amigáveis; detalhes internos ficam só no log.
- **Privacidade:** os logs não registram nomes nem IPs, e o banco guarda apenas nome, as três respostas, acompanhantes e data.
- **Credenciais:** apenas no `.env` do servidor (ignorado pelo git). O frontend não tem nenhum segredo.

## 11. Personalização

- **Textos factuais** (nomes, data, horários, locais, links dos mapas, URLs das fotos): [`client/src/config/invite.ts`](client/src/config/invite.ts)
- **Informações pendentes:** no mesmo arquivo, os campos que estão `null` aparecem no site como "será informado em breve". Quando forem definidos, basta preenchê-los, fazer o commit e publicar:
  ```ts
  photos: { ..., time: '17h' },                       // horário da sessão de fotos
  dinner: {
    venue: 'Nome do Restaurante',
    address: 'Endereço — Castanhal',
    time: '20h',
    mapsUrl: 'https://maps.app.goo.gl/...',            // mostra o botão VER LOCALIZAÇÃO
  },
  ```
- **Frases das cenas:** nos arquivos de [`client/src/sections/`](client/src/sections/)
- **Paleta e fontes:** bloco `@theme` em [`client/src/styles/index.css`](client/src/styles/index.css)
- **Imagem de compartilhamento e título:** [`client/index.html`](client/index.html)
- **Acompanhantes:** `RSVP_ALLOW_COMPANIONS` e `RSVP_MAX_COMPANIONS` no `.env` (sem novo build)

## 12. Checklist antes de enviar o link

- [ ] Banco MySQL criado na Hostinger, `DB_*` configurados e o log mostrando `[db] MySQL conectado; tabela pronta.`
- [ ] SMTP configurado e `RSVP_RECIPIENT_EMAIL` com o **e-mail real dos noivos**
- [ ] Teste de RSVP completo em produção: a resposta aparece no phpMyAdmin **e** o e-mail chega (confira o spam)
- [ ] Acompanhantes: decisão tomada (`RSVP_ALLOW_COMPANIONS`) e limite definido
- [ ] Música: arquivo **autorizado** configurado, ou nenhum
- [ ] Site acessado por HTTPS no domínio final; testado num iPhone (Safari) e num Android (Chrome)
- [ ] Link colado numa conversa de teste do WhatsApp para conferir a pré-visualização
