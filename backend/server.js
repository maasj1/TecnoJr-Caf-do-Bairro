import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { carregarConfig } from './src/config.js';
import { PedidoStore } from './src/store.js';
import { criarServico } from './src/pedidos.js';
import { criarApp } from './src/app.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const config = carregarConfig({ raiz });

const store = new PedidoStore(config.arquivoDados);
const servico = criarServico({
  store,
  limiteDiario: config.limiteDiario,
  fusoHorario: config.fusoHorario,
});
const tratar = criarApp({ servico, config });

const servidor = createServer(tratar);

servidor.listen(config.porta, () => {
  console.log('');
  console.log('  Café do Bairro — API de encomendas');
  console.log('  ------------------------------------------------');
  console.log(`  Site:    http://localhost:${config.porta}/`);
  console.log(`  API:     http://localhost:${config.porta}/api/pedidos`);
  console.log(`  Saúde:   http://localhost:${config.porta}/api/health`);
  console.log(`  Dados:   ${config.arquivoDados}`);
  console.log(`  Limite:  ${config.limiteDiario} encomendas por dia`);
  console.log(`  Fuso:    ${config.fusoHorario}`);
  console.log('  ------------------------------------------------');
  console.log('  Ctrl+C para parar.');
  console.log('');
});

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(
      `A porta ${config.porta} já está em uso. ` +
        'Pare o outro processo ou rode com PORT=3001 npm start.'
    );
  } else {
    console.error('Não foi possível iniciar o servidor:', erro);
  }
  process.exitCode = 1;
});

const encerrar = (sinal) => {
  console.log(`\n${sinal} recebido. Encerrando...`);
  servidor.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));
