# API de encomendas — Café do Bairro

API em **Node.js puro**, sem dependências externas. Guarda as encomendas em um arquivo
JSON, aplica o limite de **5 por dia** e também entrega o site que está em `../frontend`.

- Node.js **18.17+**
- Nenhum `npm install` necessário
- Sem banco de dados
- Testes com `node:test`

---

## Rodar

```bash
cd backend
npm start
```

```text
http://localhost:3000/            → site
http://localhost:3000/api          → índice da API
http://localhost:3000/api/health   → saúde
http://localhost:3000/api/pedidos  → encomendas
```

Para desenvolver com reinício automático:

```bash
npm run dev
```

Para criar dados de exemplo (inclui um dia lotado para testar o bloqueio):

```bash
npm run seed
npm run seed -- --limpar   # apaga os dados antes
```

Para apagar tudo e começar do zero manualmente, exclua `backend/data/pedidos.json`
com o servidor parado.

---

## Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP. |
| `LIMITE_DIARIO` | `5` | Máximo de encomendas por `dataEntrega`. |
| `DATA_FILE` | `data/pedidos.json` | Caminho do arquivo, relativo à pasta `backend/`. |
| `CORS_ORIGIN` | `*` | Valor de `Access-Control-Allow-Origin`. |
| `FUSO_HORARIO` | `America/Sao_Paulo` | Fuso de referência para “hoje”. |
| `SERVE_FRONTEND` | `true` | `false` desliga o serviço de arquivos estáticos. |
| `LOG_REQUISICOES` | `true` | `false` desliga o log de requisições. |

Exemplo (PowerShell):

```powershell
$env:PORT=3001
$env:LIMITE_DIARIO=5
npm start
```

---

## Modelo da encomenda

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "nomeCliente": "Ana Clara",
  "telefone": "83999990001",
  "produto": "Bolo de cenoura (inteiro)",
  "dataEntrega": "2026-12-10",
  "status": "recebida",
  "observacao": "Retirar às 16h",
  "criadoEm": "2026-11-01T13:20:00.000Z",
  "atualizadoEm": "2026-11-01T13:20:00.000Z"
}
```

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `nomeCliente` | sim | 2 a 80 caracteres. |
| `telefone` | sim | 10 ou 11 dígitos com DDD. Máscara e `+55` são removidos. |
| `produto` | sim | 2 a 120 caracteres. |
| `dataEntrega` | sim | `AAAA-MM-DD`, data real, não pode estar no passado. |
| `status` | não | `recebida` (padrão), `em_preparo` ou `entregue`. Aceita `"em preparo"`. |
| `observacao` | não | Até 300 caracteres. Padrão `""`. |
| `confirmarDuplicado` | não | `true` libera uma encomenda repetida. Não é salvo no pedido. |

`id`, `criadoEm` e `atualizadoEm` são gerados pelo servidor.

---

## Rotas

### `GET /api`

Índice com as rotas disponíveis.

### `GET /api/health`

```json
{
  "status": "ok",
  "servico": "cafe-do-bairro-api",
  "versao": "1.0.0",
  "hora": "2026-11-01T13:20:00.000Z",
  "limiteDiario": 5
}
```

### `GET /api/disponibilidade?data=AAAA-MM-DD`

Mostra as vagas de um dia. É o que o formulário do site consulta ao escolher a data.

```json
{
  "data": "2026-12-10",
  "limite": 5,
  "ocupadas": 3,
  "restantes": 2,
  "disponivel": true
}
```

Sem `data` ou com data inválida: `422 VALIDACAO`.

### `GET /api/pedidos`

Lista encomendas com filtros, busca, ordenação e paginação.

| Query | Padrão | Descrição |
| --- | --- | --- |
| `status` | — | `recebida`, `em_preparo` ou `entregue`. |
| `data` | — | Data de entrega exata (`AAAA-MM-DD`). |
| `busca` | — | Texto em nome, telefone, produto ou observação (sem diferenciar acentos/maiúsculas). |
| `ordenar` | `dataEntrega` | `dataEntrega`, `criadoEm` ou `nomeCliente`. |
| `ordem` | `asc` | `asc` ou `desc`. |
| `pagina` | `1` | Página a partir de 1. |
| `porPagina` | `50` | De 1 a 100. |

```json
{
  "dados": [ { "id": "…", "nomeCliente": "Ana Clara" } ],
  "paginacao": {
    "pagina": 1,
    "porPagina": 50,
    "total": 7,
    "totalPaginas": 1
  }
}
```

### `POST /api/pedidos`

Cria uma encomenda. Retorna `201` com `Location: /api/pedidos/:id`.

```bash
curl -i -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "Ana Clara",
    "telefone": "(83) 99999-0001",
    "produto": "Bolo de cenoura (inteiro)",
    "dataEntrega": "2026-12-10",
    "observacao": "Retirar às 16h"
  }'
```

```json
{
  "dados": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "nomeCliente": "Ana Clara",
    "telefone": "83999990001",
    "produto": "Bolo de cenoura (inteiro)",
    "dataEntrega": "2026-12-10",
    "status": "recebida",
    "observacao": "Retirar às 16h",
    "criadoEm": "2026-11-01T13:20:00.000Z",
    "atualizadoEm": "2026-11-01T13:20:00.000Z"
  }
}
```

Erros possíveis:

- `422 VALIDACAO` — um ou mais campos inválidos (com detalhes por campo).
- `409 LIMITE_DIARIO` — o dia já tem 5 encomendas.
- `409 PEDIDO_DUPLICADO` — mesmo telefone + produto + data.

Para insistir em uma encomenda repetida:

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "Ana Clara",
    "telefone": "83999990001",
    "produto": "Bolo de cenoura (inteiro)",
    "dataEntrega": "2026-12-10",
    "confirmarDuplicado": true
  }'
```

O campo `confirmarDuplicado` **não** é salvo.

### `GET /api/pedidos/:id`

```json
{ "dados": { "id": "…", "nomeCliente": "Ana Clara" } }
```

`404 NAO_ENCONTRADO` se o id não existir.

### `PATCH /api/pedidos/:id`

Atualiza apenas os campos enviados. É a forma recomendada de mudar o status.

```bash
curl -X PATCH http://localhost:3000/api/pedidos/SEU-ID \
  -H "Content-Type: application/json" \
  -d '{ "status": "em preparo" }'
```

Regras:

- Pelo menos um campo precisa ser enviado.
- Mudar a data para um dia lotado retorna `409 LIMITE_DIARIO`.
- Mudar telefone/produto/data pode acionar `409 PEDIDO_DUPLICADO`.
- `confirmarDuplicado: true` também vale aqui.

### `PUT /api/pedidos/:id`

Substitui os dados da encomenda. Envie os campos obrigatórios novamente; se `status` for
omitido, o status atual é mantido.

```bash
curl -X PUT http://localhost:3000/api/pedidos/SEU-ID \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "Ana Clara",
    "telefone": "83999990001",
    "produto": "Bolo de chocolate (inteiro)",
    "dataEntrega": "2026-12-11",
    "observacao": ""
  }'
```

### `DELETE /api/pedidos/:id`

Retorna `204` sem corpo. Na segunda tentativa, `404 NAO_ENCONTRADO`.

```bash
curl -i -X DELETE http://localhost:3000/api/pedidos/SEU-ID
```

---

## Regras de negócio

### Limite diário

O limite padrão é **5 encomendas por `dataEntrega`**, contando todos os status.
A verificação roda **dentro da fila do store**, junto com a gravação, então requisições
simultâneas não conseguem criar a sexta encomenda. Há um teste específico para isso.

Se a Dona Marta quiser aceitar mais em um dia específico, o caminho é subir `LIMITE_DIARIO`
(global) ou evoluir para limites por data. Não há exceção por status: marcar como
`entregue` não libera vaga, porque a vaga representa capacidade de produção.

### Duplicidade

Uma encomenda é considerada repetida quando **telefone + produto + dataEntrega** coincidem.
Produto é comparado sem diferenciar maiúsculas e acentos. O retorno é:

```json
{
  "erro": {
    "codigo": "PEDIDO_DUPLICADO",
    "mensagem": "Já existe uma encomenda desse produto para essa data com o mesmo telefone. Se for outra encomenda, confirme o envio.",
    "detalhes": {
      "produto": "Bolo de cenoura (inteiro)",
      "dataEntrega": "2026-12-10",
      "pedidoExistenteId": "…"
    }
  }
}
```

### Datas e fuso

“Hoje” é calculado em `America/Sao_Paulo`, não em UTC. Isso evita o bug de a data virar
às 21h no Brasil. A validação cobre meses de 30 dias e anos bissextos sem usar
`new Date("2026-02-31")` (que “corrige” a data silenciosamente).

**Atenção:** a antecedência de 2 dias é uma regra do formulário. A API aceita qualquer data
a partir de hoje. Para endurecer no servidor, ajuste `validacao.js`/`pedidos.js` e os testes.

### Persistência

`PedidoStore` mantém tudo em memória depois da primeira leitura e grava em JSON:

1. escreve `pedidos.json.tmp`;
2. renomeia por cima de `pedidos.json`.

Assim, uma queda no meio da gravação não corrompe o arquivo bom. Toda operação passa por
uma fila (`executar`), o que serializa leitura + verificação + gravação.

Limitações: uma instância só; não compartilhe o arquivo entre processos. Para várias
réplicas, troque o store por um banco.

---

## Erros

Formato único:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Confira os dados enviados.",
    "detalhes": [
      { "campo": "telefone", "mensagem": "O telefone deve ter 10 ou 11 dígitos, com DDD." }
    ]
  }
}
```

| Status | Código | Quando |
| --- | --- | --- |
| `400` | `JSON_INVALIDO` | Corpo não é JSON válido. |
| `400` | `REQUISICAO_INVALIDA` | URL inválida. |
| `400` | `CAMINHO_INVALIDO` | Caminho estático com encoding inválido. |
| `400` | `ID_INVALIDO` | Id com encoding inválido. |
| `404` | `NAO_ENCONTRADO` | Pedido ou arquivo inexistente. |
| `404` | `ROTA_NAO_ENCONTRADA` | Rota de API inexistente. |
| `405` | `METODO_NAO_PERMITIDO` | Método errado; inclui cabeçalho `Allow`. |
| `409` | `LIMITE_DIARIO` | Dia cheio. |
| `409` | `PEDIDO_DUPLICADO` | Encomenda repetida. |
| `413` | `CORPO_MUITO_GRANDE` | Corpo acima de 100 KB. |
| `415` | `TIPO_NAO_SUPORTADO` | `Content-Type` diferente de `application/json`. |
| `422` | `VALIDACAO` | Campos inválidos; `detalhes` traz um item por campo. |
| `500` | `ERRO_INTERNO` | Falha inesperada. |

CORS: `Access-Control-Allow-Origin` configurável, métodos `GET, POST, PUT, PATCH, DELETE,
OPTIONS` e cabeçalho `Content-Type`. `OPTIONS` responde `204`.

---

## Testes

```bash
cd backend
npm test
```

A suíte usa portas efêmeras e arquivos temporários; não mexe nos dados reais. Cobre 19 casos:

- saúde e índice;
- criação, normalização de telefone, `Location` e status padrão;
- validação por campo, data no passado e JSON inválido;
- limite diário e concorrência (6 pedidos simultâneos);
- duplicidade e `confirmarDuplicado`;
- filtros, busca, ordenação e paginação;
- `GET`/`PATCH`/`PUT`/`DELETE` e `404`;
- mudança de data para dia cheio;
- disponibilidade;
- CORS, rota inexistente e método não permitido;
- persistência no arquivo JSON.

> **Resultado:** 19/19 testes passando em Node.js 22.14.0, em 01/11/2026. Também foi feito
> um smoke test do servidor real: `/` e `/styles.css` responderam `200`, `/api/health`
> respondeu `ok`, e o fluxo do formulário (vagas → criação → confirmação) gravou no JSON.

---

## Estrutura

```text
backend/
├─ server.js              # sobe o HTTP e trata sinais
├─ package.json
├─ README.md
├─ src/
│  ├─ app.js              # rotas, CORS, erros e estáticos
│  ├─ config.js           # variáveis de ambiente
│  ├─ errors.js           # ErroHttp + atalhos
│  ├─ pedidos.js          # regras de negócio
│  ├─ store.js            # fila + JSON atômico
│  └─ validacao.js        # datas, fuso, telefone, status
├─ scripts/seed.js
├─ test/pedidos.test.js
└─ data/                  # criado em execução; ignorado no git
```

---

## Antes de produção

1. **Proteger as rotas de escrita.** Hoje qualquer um com a URL pode criar, editar e apagar.
   O mínimo é um token no cabeçalho para `POST`/`PUT`/`PATCH`/`DELETE` e CORS restrito ao
   domínio do site.
2. **Painel para a Dona Marta.** Uma tela simples com os pedidos do dia e botões de status,
   pensada para celular.
3. **Backup do JSON.** Copiar `data/pedidos.json` diariamente (ou usar um banco).
4. **Hospedagem com disco persistente.** Serviços estáticos não servem para a API.
5. **Domínio e HTTPS.** O site deve abrir em `https://…` para o formulário e o WhatsApp
   funcionarem sem aviso do navegador.
6. **Rodar `npm test`** e um teste manual no celular da cliente antes da entrega.
