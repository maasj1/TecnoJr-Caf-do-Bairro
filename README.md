# Café do Bairro — site e API de encomendas

Entrega da TecnoJr para o **Café do Bairro**, da Dona Marta: uma landing page mobile-first,
uma API de encomendas com limite de 5 por dia e os materiais de design e de conversa
com a cliente.

> **Prazo combinado:** site no ar até **30/11/2026**, antes da temporada de panetone e
> bolo de Natal.

---

## O que foi entregue

| Pasta | Conteúdo |
| --- | --- |
| `frontend/` | Landing page completa (HTML, CSS e JS puros), com cardápio, horário, endereço, WhatsApp e formulário de encomenda. |
| `backend/` | API de encomendas em Node.js puro, com persistência em JSON, limite diário e testes. Também serve o site. |
| `design/` | Direção visual (`direcao-visual.md`) e mockup mobile navegável (`mockup-mobile.html`). |
| `comercial/` | Mensagem pós-reunião, respostas às objeções, abordagem ao Seu Jorge, perguntas da segunda reunião e plano até novembro. |

### Checklist do desafio

- [x] Página com cardápio, horário, endereço e botão de WhatsApp
- [x] Layout mobile-first, colorido, com clima de “casa de vó”
- [x] Encomenda funcional pelo site (com fallback para WhatsApp)
- [x] API com nome, telefone, produto, data de entrega e status
- [x] Criar, listar, atualizar e remover encomendas
- [x] Bônus: bloquear mais de 5 encomendas por dia
- [x] Bônus: impedir encomenda duplicada (mesmo telefone + produto + data)
- [x] Bônus: consulta de vagas por dia e validação de data/fuso
- [x] Direção visual mobile (paleta, tipografia e frase-conceito)
- [x] Mensagem comercial e plano de objeções
- [x] README, documentação da API e `.gitignore`

---

## Como rodar

Pré-requisito: **Node.js 18.17 ou superior**. O projeto **não tem dependências externas**,
então não é preciso rodar `npm install`.

```bash
cd backend
npm start
```

Depois abra **http://localhost:3000/**.

O próprio servidor entrega o site e a API na mesma origem, sem configuração de CORS no dia a dia.

```text
Site:    http://localhost:3000/
API:     http://localhost:3000/api/pedidos
Saúde:   http://localhost:3000/api/health
Dados:   backend/data/pedidos.json
```

### Scripts

```bash
npm start          # sobe o site + API na porta 3000
npm run dev        # sobe com --watch (reinicia ao editar)
npm test           # roda a suíte de testes da API
npm run seed       # cria encomendas de exemplo (inclui um dia lotado)
npm run seed -- --limpar   # apaga os dados e recria os exemplos
```

### Variáveis de ambiente

Todas opcionais; os padrões funcionam localmente.

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP. |
| `LIMITE_DIARIO` | `5` | Máximo de encomendas por data de entrega. |
| `DATA_FILE` | `data/pedidos.json` | Arquivo de dados, relativo à pasta `backend/`. |
| `CORS_ORIGIN` | `*` | Origem liberada para chamadas externas à API. |
| `FUSO_HORARIO` | `America/Sao_Paulo` | Fuso usado para “hoje” e para validar datas. |
| `SERVE_FRONTEND` | `true` | `false` desliga a entrega dos arquivos do site. |
| `LOG_REQUISICOES` | `true` | `false` desliga o log de cada requisição. |

Exemplo no PowerShell:

```powershell
$env:PORT=3001; npm start
```

---

## Como o site funciona

1. A pessoa vê o cardápio, o horário e o endereço.
2. Escolhe o produto e a data no formulário. O site consulta as vagas do dia na API.
3. Se houver vaga, a encomenda é salva e aparece uma confirmação com resumo.
4. A confirmação oferece um link de WhatsApp com tudo preenchido para combinar pagamento.
5. Se a API estiver fora do ar, o formulário **não trava**: mostra um aviso e o link de
   WhatsApp com a mensagem já preenchida, para a Dona Marta anotar no caderninho.

O site também abre direto pelo arquivo `frontend/index.html` (sem servidor). Nesse caso,
as chamadas vão para `http://localhost:3000/api`; sem a API, o fallback de WhatsApp assume.

### Regras de negócio

- **5 encomendas por dia** (contando todos os status). A checagem acontece dentro de uma
  fila no servidor, então dois pedidos simultâneos não furam o limite.
- **Duplicidade:** mesmo telefone + mesmo produto + mesma data retorna `409 PEDIDO_DUPLICADO`.
  O site pergunta se é outra encomenda e reenvia com `confirmarDuplicado: true`.
- **Datas:** validadas no fuso `America/Sao_Paulo`, incluindo fevereiro e anos bissextos.
- **Status:** `recebida`, `em_preparo` ou `entregue`. A API também aceita `"em preparo"`.
- **Antecedência:** o site exige 2 dias para bolos. A API aceita a partir de hoje — a regra
  de 2 dias é de interface. Se precisar de regra dura no servidor, é um ajuste pequeno
  (ver “Limitações”).
- **Persistência:** arquivo JSON com escrita atômica (`.tmp` + renomeação) e fila interna.
  Para o volume da Dona Marta (dezenas por mês), resolve sem banco e sem instalação.

---

## Documentação da API

Referência completa em **[`backend/README.md`](backend/README.md)**. Resumo:

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/api/health` | Saúde do serviço e limite configurado. |
| `GET` | `/api/disponibilidade?data=AAAA-MM-DD` | Vagas restantes no dia. |
| `GET` | `/api/pedidos` | Lista com filtros e paginação. |
| `POST` | `/api/pedidos` | Cria uma encomenda. |
| `GET` | `/api/pedidos/:id` | Busca uma encomenda. |
| `PUT` | `/api/pedidos/:id` | Substitui os dados da encomenda. |
| `PATCH` | `/api/pedidos/:id` | Atualiza só os campos enviados (ex.: status). |
| `DELETE` | `/api/pedidos/:id` | Remove a encomenda. |

---

## Testes

A suíte usa apenas o runner nativo do Node (`node:test`), sem instalar nada:

```bash
cd backend
npm test
```

São 19 casos cobrindo criação, validação, limite diário, concorrência, duplicidade,
filtros, paginação, `PATCH`/`PUT`/`DELETE`, disponibilidade, CORS, métodos não permitidos,
JSON inválido e persistência em arquivo.

> **Verificação:** **19/19 testes passando** em Node.js 22.14.0 (`node --test`), em
> 01/11/2026. O servidor também foi testado de ponta a ponta: `/` e `/styles.css`
> responderam `200`, `/api/health` respondeu `ok`, e o fluxo real do formulário
> (consulta de vagas, criação e confirmação) gravou a encomenda no JSON.
> O projeto declara suporte a Node 18.17+; se rodar em uma versão mais antiga, confirme o
> resultado antes da entrega.

---

## Design e material comercial

- **Direção visual:** [`design/direcao-visual.md`](design/direcao-visual.md) — conceito,
  paleta com contrastes, tipografia, medidas, componentes, briefing de fotos e guia de
  montagem no Figma.
- **Mockup mobile:** abra [`design/mockup-mobile.html`](design/mockup-mobile.html) no
  navegador. Ele mostra três telas reais em molduras de celular (Home, Cardápio e
  Encomenda), além da paleta e dos tipos.
- **Plugin Figma:** [`figma-plugin/`](figma-plugin/) — `manifest.json` + `code.js` geram a
  capa, as três telas e a prancha de tokens no Figma.
- **Arquivo Figma:** [Café do Bairro — Design Mobile](https://www.figma.com/design/wwh9yCmSRvrumDjku9KyPp/Caf%C3%A9-do-Bairro---Design-Mobile?node-id=0-1&t=QR1sTnIkeueLE8M4-1).
- **Comercial:** [`comercial/mensagem-dona-marta.md`](comercial/mensagem-dona-marta.md) —
  mensagem pós-reunião, versão curta, roteiro de áudio, objeções (“sobrinho por R$ 300” e
  “já tenho Instagram”), estratégia para o Seu Jorge, três perguntas para a segunda reunião
  e cronograma até 30/11.
- **Documento comercial:** [Mensagem pós-reunião — Google Docs](https://docs.google.com/document/d/1A8fjo8TZEBFONR0Ktx_0QfBalXcWmB95LZB14Qdu4u0/edit?usp=sharing).

> O design mobile foi gerado pelo plugin local do Figma (`figma-plugin/`); o mockup HTML em
> `design/mockup-mobile.html` segue como referência viva da experiência. Para abrir no
> Figma, use **Plugins → Development → Import plugin from manifest…** e selecione
> `figma-plugin/manifest.json`.

---

## O que trocar antes de publicar

Estes dados são **placeholders** e precisam ser confirmados com a Dona Marta:

| Onde | O que está hoje | O que fazer |
| --- | --- | --- |
| WhatsApp | `5583999999999` / `(83) 99999-9999` | Trocar pelo número real em `frontend/index.html`, `frontend/app.js` (`CONFIG.whatsapp`) e no JSON-LD. |
| Endereço | `Rua das Laranjeiras, 123 — Centro, João Pessoa/PB` | Confirmar endereço e ponto de referência; atualizar também o link do Google Maps. |
| Instagram | `@cafedobairro` | Trocar pelo perfil real. |
| Cardápio e preços | Itens e valores de exemplo | Substituir pelos preços reais (HTML, `<select>` do formulário e `seed.js`). |
| Horários | Ter–sex 7h–18h, sáb 7h–13h, dom 7h–12h, seg fechado | Confirmar com a cliente. |
| Fotos | Ilustrações SVG | Trocar pelas fotos reais do Instagram, com autorização. O briefing está em `design/direcao-visual.md`. |
| História | “Seis anos…”, frase da Dona Marta | Confirmar os fatos e a frase antes de publicar. |
| Domínio | Ainda não configurado | Registrar (sugestão `.com.br`) e apontar para a hospedagem. |

---

## Limitações conhecidas (e próximos passos)

- **Sem autenticação.** Qualquer pessoa com acesso à URL da API pode listar, editar e apagar
  encomendas. Para produção, o mínimo é proteger as rotas de escrita com uma senha/token e
  restringir o CORS. O site público só precisa de `POST` e `GET /api/disponibilidade`.
- **Sem painel administrativo.** A Dona Marta não tem uma tela para ver/atualizar pedidos;
  hoje isso é feito pela API. Um painel simples é o próximo passo natural — e é o que
  justifica a conversa sobre escopo com o Seu Jorge.
- **Arquivo JSON em uma única instância.** Funciona bem em um servidor só. Não use em
  várias réplicas sem trocar por banco.
- **Antecedência de 2 dias só no front-end.** A API aceita datas a partir de hoje. Para
  valer no servidor, incluir a regra em `validacao.js`/`pedidos.js` e ajustar os testes.
- **Sem pagamento online, e-mail ou SMS.** O combinado é confirmar no WhatsApp.
- **Sem integração com o Instagram.** O site linka o perfil; não lê mensagens nem publica.
- **Hospedagem precisa de disco persistente** por causa do JSON (Render, Railway, VPS etc.).
  Serviços só de arquivos estáticos não servem para a API.
- **Dados de exemplo.** O `npm run seed` cria um dia lotado de propósito; use
  `npm run seed -- --limpar` antes de entregar.
- **Ilustrações e preços fictícios.** Não apresentar como conteúdo final da cliente.

---

## Estrutura

```text
tecnojr/
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js
│  ├─ robots.txt
│  └─ assets/            # logo, favicon e ilustrações SVG
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ README.md          # documentação da API
│  ├─ src/
│  │  ├─ app.js          # rotas HTTP, CORS e arquivos estáticos
│  │  ├─ config.js
│  │  ├─ errors.js
│  │  ├─ pedidos.js      # regras de negócio
│  │  ├─ store.js        # fila + persistência atômica
│  │  └─ validacao.js
│  ├─ scripts/seed.js
│  ├─ test/pedidos.test.js
│  └─ data/              # criado em tempo de execução (ignorado no git)
├─ design/
│  ├─ direcao-visual.md
│  └─ mockup-mobile.html
├─ comercial/
│  └─ mensagem-dona-marta.md
├─ README.md
└─ .gitignore
```

---

Feito pela **TecnoJr** para o Café do Bairro · novembro/2026.
