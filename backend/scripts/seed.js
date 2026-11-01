/**
 * Popula o arquivo de dados com encomendas de exemplo para testar o site
 * e a API. Uso:
 *
 *   npm run seed
 *   npm run seed -- --limpar   (apaga o que existe antes)
 */
import path from 'node:path';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { carregarConfig } from '../src/config.js';
import { PedidoStore } from '../src/store.js';
import { criarServico } from '../src/pedidos.js';
import { hojeNoFuso } from '../src/validacao.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = carregarConfig({ raiz });

const limpar = process.argv.includes('--limpar');
if (limpar) {
  await rm(config.arquivoDados, { force: true });
  console.log('Dados anteriores removidos.');
}

const store = new PedidoStore(config.arquivoDados);
const servico = criarServico({
  store,
  limiteDiario: config.limiteDiario,
  fusoHorario: config.fusoHorario,
});

function dataFutura(dias) {
  const hoje = hojeNoFuso(config.fusoHorario);
  const [ano, mes, dia] = hoje.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return data.toISOString().slice(0, 10);
}

const encomendas = [
  // Dia cheio: serve para ver o bloqueio das 5 vagas no site.
  { nomeCliente: 'Ana Clara', telefone: '83999990001', produto: 'Bolo de cenoura (inteiro)', dataEntrega: dataFutura(3), status: 'recebida' },
  { nomeCliente: 'Seu José', telefone: '83999990002', produto: 'Bolo de chocolate (inteiro)', dataEntrega: dataFutura(3), status: 'em_preparo' },
  { nomeCliente: 'Bia do mercado', telefone: '83999990003', produto: 'Bolo de fubá cremoso (inteiro)', dataEntrega: dataFutura(3), status: 'recebida' },
  { nomeCliente: 'Rafael', telefone: '83999990004', produto: 'Bolo de laranja (inteiro)', dataEntrega: dataFutura(3), status: 'recebida' },
  { nomeCliente: 'Dona Lúcia', telefone: '83999990005', produto: 'Panetone caseiro (500 g)', dataEntrega: dataFutura(3), status: 'em_preparo' },

  // Dia com vagas.
  { nomeCliente: 'Carlos', telefone: '83999990006', produto: 'Bolo de cenoura (inteiro)', dataEntrega: dataFutura(4), status: 'recebida', observacao: 'Sem cobertura' },
  { nomeCliente: 'Marina', telefone: '83999990007', produto: 'Pão de queijo (6 unidades)', dataEntrega: dataFutura(4), status: 'recebida' },

  // Encomenda mais para frente.
  { nomeCliente: 'Pedro', telefone: '83999990008', produto: 'Bolo de milho verde (inteiro)', dataEntrega: dataFutura(7), status: 'recebida', observacao: 'Retirar às 16h' },
];

for (const encomenda of encomendas) {
  try {
    const pedido = await servico.criar(encomenda);
    console.log(`✓ ${pedido.dataEntrega} · ${pedido.produto} · ${pedido.nomeCliente}`);
  } catch (erro) {
    console.log(`· ignorado (${encomenda.nomeCliente}): ${erro.message}`);
  }
}

const info = await servico.disponibilidade(dataFutura(3));
console.log('');
console.log(`Dia ${info.data}: ${info.ocupadas}/${info.limite} encomendas (${info.restantes} vagas).`);
console.log('Pronto. Rode "npm start" e abra o site.');
