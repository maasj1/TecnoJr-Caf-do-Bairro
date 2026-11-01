import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { PedidoStore } from '../src/store.js';
import { criarServico } from '../src/pedidos.js';
import { criarApp } from '../src/app.js';
import { hojeNoFuso } from '../src/validacao.js';

const FUSO = 'America/Sao_Paulo';

async function criarAmbiente(t) {
  const pasta = await mkdtemp(path.join(os.tmpdir(), 'cafe-do-bairro-'));
  const arquivo = path.join(pasta, 'pedidos.json');
  const store = new PedidoStore(arquivo);
  const servico = criarServico({ store, limiteDiario: 5, fusoHorario: FUSO });

  const app = criarApp({
    servico,
    config: {
      origemPermitida: '*',
      servirFrontend: false,
      registrarRequisicoes: false,
    },
  });

  const servidor = createServer(app);
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const { port } = servidor.address();

  t.after(async () => {
    await new Promise((resolve) => {
      servidor.close(resolve);
      servidor.closeAllConnections?.();
    });
    await rm(pasta, { recursive: true, force: true });
  });

  const pedir = async (caminho, { metodo = 'GET', corpo, bruto, cabecalhos } = {}) => {
    const temCorpo = corpo !== undefined || bruto !== undefined;

    const resposta = await fetch(`http://127.0.0.1:${port}${caminho}`, {
      method: metodo,
      headers: {
        ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
        ...cabecalhos,
      },
      body: bruto !== undefined ? bruto : corpo === undefined ? undefined : JSON.stringify(corpo),
    });

    const texto = await resposta.text();
    let json = null;
    if (texto) {
      try {
        json = JSON.parse(texto);
      } catch (erro) {
        json = texto;
      }
    }

    return { status: resposta.status, corpo: json, cabecalhos: resposta.headers };
  };

  return { pedir, arquivo, servidor };
}

function dataFutura(dias = 5) {
  const hoje = hojeNoFuso(FUSO);
  const [ano, mes, dia] = hoje.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return data.toISOString().slice(0, 10);
}

const pedidoBase = (extra = {}) => ({
  nomeCliente: 'Marta Silva',
  telefone: '83999990000',
  produto: 'Bolo de cenoura (inteiro)',
  dataEntrega: dataFutura(5),
  ...extra,
});

const criarPedido = (pedir, extra = {}) =>
  pedir('/api/pedidos', { metodo: 'POST', corpo: pedidoBase(extra) });

/* -------------------------------------------------------------------------- */
/* Saúde e criação                                                            */
/* -------------------------------------------------------------------------- */

test('GET /api/health responde ok e informa o limite diário', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const resposta = await pedir('/api/health');

  assert.equal(resposta.status, 200);
  assert.equal(resposta.corpo.status, 'ok');
  assert.equal(resposta.corpo.limiteDiario, 5);
});

test('POST /api/pedidos cria com status recebida, normaliza telefone e devolve Location', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const resposta = await pedir('/api/pedidos', {
    metodo: 'POST',
    corpo: pedidoBase({
      nomeCliente: '  Ana   Clara ',
      telefone: '+55 (83) 99999-0000',
      observacao: '  Sem cobertura ',
    }),
  });

  assert.equal(resposta.status, 201);
  assert.ok(resposta.corpo.dados.id);
  assert.equal(resposta.corpo.dados.nomeCliente, 'Ana Clara');
  assert.equal(resposta.corpo.dados.telefone, '83999990000');
  assert.equal(resposta.corpo.dados.status, 'recebida');
  assert.equal(resposta.corpo.dados.observacao, 'Sem cobertura');
  assert.ok(resposta.corpo.dados.criadoEm);
  assert.equal(resposta.corpo.dados.criadoEm, resposta.corpo.dados.atualizadoEm);
  assert.match(resposta.cabecalhos.get('location'), /\/api\/pedidos\/[0-9a-f-]+$/);
});

test('POST inválido devolve 422 com um detalhe por campo', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const resposta = await pedir('/api/pedidos', {
    metodo: 'POST',
    corpo: {
      nomeCliente: 'M',
      telefone: '123',
      produto: '',
      dataEntrega: '2020-02-31',
      status: 'pronto',
    },
  });

  assert.equal(resposta.status, 422);
  assert.equal(resposta.corpo.erro.codigo, 'VALIDACAO');

  const campos = resposta.corpo.erro.detalhes.map((detalhe) => detalhe.campo);
  assert.deepEqual(campos.sort(), ['dataEntrega', 'nomeCliente', 'produto', 'status', 'telefone']);
});

test('data de entrega no passado é recusada', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const resposta = await criarPedido(pedir, { dataEntrega: '2020-01-10' });

  assert.equal(resposta.status, 422);
  assert.equal(resposta.corpo.erro.detalhes[0].campo, 'dataEntrega');
});

/* -------------------------------------------------------------------------- */
/* Regra das 5 encomendas por dia                                             */
/* -------------------------------------------------------------------------- */

test('a sexta encomenda no mesmo dia é recusada com 409 e detalhes', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const data = dataFutura(6);

  for (let indice = 0; indice < 5; indice += 1) {
    const resposta = await criarPedido(pedir, {
      nomeCliente: `Cliente ${indice}`,
      telefone: `8399999000${indice}`,
      produto: `Bolo ${indice}`,
      dataEntrega: data,
    });
    assert.equal(resposta.status, 201);
  }

  const sexta = await criarPedido(pedir, {
    nomeCliente: 'Cliente atrasado',
    telefone: '83999990009',
    produto: 'Bolo de laranja (inteiro)',
    dataEntrega: data,
  });

  assert.equal(sexta.status, 409);
  assert.equal(sexta.corpo.erro.codigo, 'LIMITE_DIARIO');
  assert.deepEqual(sexta.corpo.erro.detalhes, { data, limite: 5, ocupadas: 5 });

  const outroDia = await criarPedido(pedir, {
    nomeCliente: 'Cliente atrasado',
    telefone: '83999990009',
    produto: 'Bolo de laranja (inteiro)',
    dataEntrega: dataFutura(7),
  });
  assert.equal(outroDia.status, 201);
});

test('o limite de 5 é respeitado mesmo com pedidos simultâneos', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const data = dataFutura(8);

  const respostas = await Promise.all(
    Array.from({ length: 7 }, (_, indice) =>
      criarPedido(pedir, {
        nomeCliente: `Simultâneo ${indice}`,
        telefone: `8399999100${indice}`,
        produto: `Bolo simultâneo ${indice}`,
        dataEntrega: data,
      })
    )
  );

  const criados = respostas.filter((resposta) => resposta.status === 201);
  const recusados = respostas.filter((resposta) => resposta.status === 409);

  assert.equal(criados.length, 5);
  assert.equal(recusados.length, 2);
  assert.ok(recusados.every((resposta) => resposta.corpo.erro.codigo === 'LIMITE_DIARIO'));
});

test('encomenda repetida avisa e pode ser confirmada', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const primeira = await criarPedido(pedir);
  assert.equal(primeira.status, 201);

  const repetida = await criarPedido(pedir);
  assert.equal(repetida.status, 409);
  assert.equal(repetida.corpo.erro.codigo, 'PEDIDO_DUPLICADO');

  const confirmada = await criarPedido(pedir, { confirmarDuplicado: true });
  assert.equal(confirmada.status, 201);

  const lista = await pedir('/api/pedidos');
  assert.equal(lista.corpo.paginacao.total, 2);
});

/* -------------------------------------------------------------------------- */
/* Listagem, filtros e paginação                                              */
/* -------------------------------------------------------------------------- */

test('GET /api/pedidos filtra por data, status e busca, com paginação', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const diaA = dataFutura(5);
  const diaB = dataFutura(6);

  await criarPedido(pedir, { nomeCliente: 'Ana', telefone: '83999990001', dataEntrega: diaA });
  await criarPedido(pedir, {
    nomeCliente: 'Bruno',
    telefone: '83999990002',
    produto: 'Bolo de chocolate (inteiro)',
    dataEntrega: diaA,
  });
  const terceiro = await criarPedido(pedir, {
    nomeCliente: 'Carla',
    telefone: '83999990003',
    produto: 'Panetone caseiro (500 g)',
    dataEntrega: diaB,
  });

  await pedir(`/api/pedidos/${terceiro.corpo.dados.id}`, {
    metodo: 'PATCH',
    corpo: { status: 'em preparo' },
  });

  const porData = await pedir(`/api/pedidos?data=${diaB}`);
  assert.equal(porData.corpo.paginacao.total, 1);
  assert.equal(porData.corpo.dados[0].nomeCliente, 'Carla');

  const porStatus = await pedir('/api/pedidos?status=em%20preparo');
  assert.equal(porStatus.corpo.paginacao.total, 1);
  assert.equal(porStatus.corpo.dados[0].status, 'em_preparo');

  const porBusca = await pedir('/api/pedidos?busca=chocolate');
  assert.equal(porBusca.corpo.paginacao.total, 1);
  assert.equal(porBusca.corpo.dados[0].nomeCliente, 'Bruno');

  const paginado = await pedir('/api/pedidos?porPagina=1&pagina=2&ordenar=nomeCliente');
  assert.equal(paginado.corpo.paginacao.total, 3);
  assert.equal(paginado.corpo.paginacao.totalPaginas, 3);
  assert.equal(paginado.corpo.dados.length, 1);
  assert.equal(paginado.corpo.dados[0].nomeCliente, 'Bruno');
});

test('GET /api/pedidos?status=invalido devolve 422', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const resposta = await pedir('/api/pedidos?status=pronto');

  assert.equal(resposta.status, 422);
  assert.equal(resposta.corpo.erro.detalhes[0].campo, 'status');
});

/* -------------------------------------------------------------------------- */
/* Detalhe, atualização e remoção                                             */
/* -------------------------------------------------------------------------- */

test('GET /api/pedidos/:id devolve o pedido e 404 quando não existe', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const criado = await criarPedido(pedir);

  const encontrado = await pedir(`/api/pedidos/${criado.corpo.dados.id}`);
  assert.equal(encontrado.status, 200);
  assert.equal(encontrado.corpo.dados.id, criado.corpo.dados.id);

  const inexistente = await pedir('/api/pedidos/00000000-0000-0000-0000-000000000000');
  assert.equal(inexistente.status, 404);
  assert.equal(inexistente.corpo.erro.codigo, 'NAO_ENCONTRADO');
});

test('PATCH atualiza só o status e valida valores', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const criado = await criarPedido(pedir);
  const id = criado.corpo.dados.id;

  const atualizado = await pedir(`/api/pedidos/${id}`, {
    metodo: 'PATCH',
    corpo: { status: 'em preparo' },
  });

  assert.equal(atualizado.status, 200);
  assert.equal(atualizado.corpo.dados.status, 'em_preparo');
  assert.equal(atualizado.corpo.dados.criadoEm, criado.corpo.dados.criadoEm);
  assert.notEqual(atualizado.corpo.dados.atualizadoEm, undefined);

  const invalido = await pedir(`/api/pedidos/${id}`, {
    metodo: 'PATCH',
    corpo: { status: 'pronto' },
  });
  assert.equal(invalido.status, 422);

  const vazio = await pedir(`/api/pedidos/${id}`, { metodo: 'PATCH', corpo: {} });
  assert.equal(vazio.status, 422);

  const passado = await pedir(`/api/pedidos/${id}`, {
    metodo: 'PATCH',
    corpo: { dataEntrega: '2020-01-01' },
  });
  assert.equal(passado.status, 422);
});

test('mudar a data para um dia cheio devolve 409', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const diaCheio = dataFutura(9);

  for (let indice = 0; indice < 5; indice += 1) {
    await criarPedido(pedir, {
      nomeCliente: `Cheio ${indice}`,
      telefone: `8399999200${indice}`,
      produto: `Bolo cheio ${indice}`,
      dataEntrega: diaCheio,
    });
  }

  const movel = await criarPedido(pedir, {
    nomeCliente: 'Mudança',
    telefone: '83999993000',
    produto: 'Bolo de mudança',
    dataEntrega: dataFutura(10),
  });

  const resposta = await pedir(`/api/pedidos/${movel.corpo.dados.id}`, {
    metodo: 'PATCH',
    corpo: { dataEntrega: diaCheio },
  });

  assert.equal(resposta.status, 409);
  assert.equal(resposta.corpo.erro.codigo, 'LIMITE_DIARIO');
});

test('PUT substitui o pedido inteiro e limpa a observação', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const criado = await criarPedido(pedir, { observacao: 'Sem cobertura' });
  const id = criado.corpo.dados.id;

  const substituto = {
    nomeCliente: 'Marta Souza',
    telefone: '83988887777',
    produto: 'Bolo de chocolate (inteiro)',
    dataEntrega: dataFutura(12),
    status: 'entregue',
  };

  const resposta = await pedir(`/api/pedidos/${id}`, { metodo: 'PUT', corpo: substituto });

  assert.equal(resposta.status, 200);
  assert.equal(resposta.corpo.dados.nomeCliente, 'Marta Souza');
  assert.equal(resposta.corpo.dados.status, 'entregue');
  assert.equal(resposta.corpo.dados.observacao, '');
  assert.equal(resposta.corpo.dados.criadoEm, criado.corpo.dados.criadoEm);

  const semProduto = await pedir(`/api/pedidos/${id}`, {
    metodo: 'PUT',
    corpo: { ...substituto, produto: '' },
  });
  assert.equal(semProduto.status, 422);
});

test('DELETE remove o pedido e devolve 404 na segunda tentativa', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const criado = await criarPedido(pedir);
  const id = criado.corpo.dados.id;

  const remocao = await pedir(`/api/pedidos/${id}`, { metodo: 'DELETE' });
  assert.equal(remocao.status, 204);

  const busca = await pedir(`/api/pedidos/${id}`);
  assert.equal(busca.status, 404);

  const segunda = await pedir(`/api/pedidos/${id}`, { metodo: 'DELETE' });
  assert.equal(segunda.status, 404);
});

/* -------------------------------------------------------------------------- */
/* Disponibilidade                                                            */
/* -------------------------------------------------------------------------- */

test('GET /api/disponibilidade informa as vagas restantes', async (t) => {
  const { pedir } = await criarAmbiente(t);
  const data = dataFutura(11);

  const antes = await pedir(`/api/disponibilidade?data=${data}`);
  assert.equal(antes.status, 200);
  assert.deepEqual(antes.corpo, {
    data,
    limite: 5,
    ocupadas: 0,
    restantes: 5,
    disponivel: true,
  });

  await criarPedido(pedir, { telefone: '83999990001', dataEntrega: data });
  await criarPedido(pedir, {
    telefone: '83999990002',
    produto: 'Bolo de laranja (inteiro)',
    dataEntrega: data,
  });

  const depois = await pedir(`/api/disponibilidade?data=${data}`);
  assert.equal(depois.corpo.ocupadas, 2);
  assert.equal(depois.corpo.restantes, 3);
  assert.equal(depois.corpo.disponivel, true);
});

test('disponibilidade sem data ou com data inválida devolve 422', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const semData = await pedir('/api/disponibilidade');
  assert.equal(semData.status, 422);

  const invalida = await pedir('/api/disponibilidade?data=31-12-2026');
  assert.equal(invalida.status, 422);
  assert.equal(invalida.corpo.erro.detalhes[0].campo, 'data');
});

/* -------------------------------------------------------------------------- */
/* Borda HTTP                                                                 */
/* -------------------------------------------------------------------------- */

test('preflight CORS, rota inexistente e método não permitido', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const preflight = await pedir('/api/pedidos', {
    metodo: 'OPTIONS',
    cabecalhos: {
      Origin: 'http://localhost:5500',
      'Access-Control-Request-Method': 'POST',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.cabecalhos.get('access-control-allow-origin'), '*');

  const inexistente = await pedir('/api/nao-existe');
  assert.equal(inexistente.status, 404);
  assert.equal(inexistente.corpo.erro.codigo, 'ROTA_NAO_ENCONTRADA');

  const metodo = await pedir('/api/pedidos', { metodo: 'PATCH', corpo: {} });
  assert.equal(metodo.status, 405);
  assert.equal(metodo.cabecalhos.get('allow'), 'GET, POST');
});

test('JSON inválido devolve 400', async (t) => {
  const { pedir } = await criarAmbiente(t);

  const invalido = await pedir('/api/pedidos', {
    metodo: 'POST',
    bruto: '{"nomeCliente": ',
  });

  assert.equal(invalido.status, 400);
  assert.equal(invalido.corpo.erro.codigo, 'JSON_INVALIDO');
});

test('as encomendas ficam gravadas no arquivo JSON', async (t) => {
  const { pedir, arquivo } = await criarAmbiente(t);

  const criado = await criarPedido(pedir);
  const conteudo = JSON.parse(await readFile(arquivo, 'utf8'));

  assert.equal(conteudo.pedidos.length, 1);
  assert.equal(conteudo.pedidos[0].id, criado.corpo.dados.id);
  assert.equal(conteudo.pedidos[0].nomeCliente, 'Marta Silva');
});
