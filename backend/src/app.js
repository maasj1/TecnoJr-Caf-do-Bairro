import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { ErroHttp } from './errors.js';

const LIMITE_CORPO = 100 * 1024; // 100 KB

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

const metodoNaoPermitido = (permitidos) => {
  const erro = new ErroHttp(
    405,
    'METODO_NAO_PERMITIDO',
    'Método não permitido para esta rota.'
  );
  erro.headers = { Allow: permitidos.join(', ') };
  return erro;
};

const aplicarCabecalhos = (res, origem) => {
  res.setHeader('Access-Control-Allow-Origin', origem);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
};

const enviarJson = (res, status, corpo, extras = {}) => {
  if (res.writableEnded || res.destroyed) return;

  const texto = JSON.stringify(corpo);

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
    ...extras,
  });
  res.end(texto);
};

const responderErro = (res, erro, req) => {
  if (res.writableEnded || res.destroyed) return;

  // Se ainda houver corpo não lido (ex.: 405), drena para não travar a conexão.
  if (req && !req.complete) req.resume();

  if (res.headersSent) {
    res.end();
    return;
  }

  if (erro instanceof ErroHttp) {
    enviarJson(
      res,
      erro.status,
      {
        erro: {
          codigo: erro.codigo,
          mensagem: erro.message,
          ...(erro.detalhes !== undefined ? { detalhes: erro.detalhes } : {}),
        },
      },
      erro.headers
    );
    return;
  }

  console.error('Erro inesperado na API:', erro);
  enviarJson(res, 500, {
    erro: {
      codigo: 'ERRO_INTERNO',
      mensagem: 'Algo deu errado aqui. Tente de novo em instantes.',
    },
  });
};

async function lerCorpo(req) {
  const tipo = String(req.headers['content-type'] || '').toLowerCase();
  if (tipo && !tipo.startsWith('application/json')) {
    throw new ErroHttp(
      415,
      'TIPO_NAO_SUPORTADO',
      'Envie o corpo da requisição como application/json.'
    );
  }

  const partes = [];
  let total = 0;

  for await (const parte of req) {
    total += parte.length;
    if (total > LIMITE_CORPO) {
      throw new ErroHttp(
        413,
        'CORPO_MUITO_GRANDE',
        'O corpo da requisição passou do limite de 100 KB.'
      );
    }
    partes.push(parte);
  }

  if (!total) return {};

  const texto = Buffer.concat(partes).toString('utf8');
  if (!texto.trim()) return {};

  try {
    return JSON.parse(texto);
  } catch (erro) {
    throw new ErroHttp(400, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.');
  }
}

async function servirEstatico(req, res, pathname, raizFrontend) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    throw metodoNaoPermitido(['GET', 'HEAD']);
  }
  if (!raizFrontend) {
    throw new ErroHttp(404, 'NAO_ENCONTRADO', 'Rota não encontrada.');
  }

  let relativo;
  try {
    relativo = decodeURIComponent(pathname);
  } catch (erro) {
    throw new ErroHttp(400, 'CAMINHO_INVALIDO', 'O caminho solicitado é inválido.');
  }

  if (relativo.includes('\0')) {
    throw new ErroHttp(404, 'NAO_ENCONTRADO', 'Arquivo não encontrado.');
  }
  if (relativo.endsWith('/')) relativo += 'index.html';

  const raiz = path.resolve(raizFrontend);
  const alvo = path.resolve(raiz, `.${relativo}`);

  if (alvo !== raiz && !alvo.startsWith(`${raiz}${path.sep}`)) {
    throw new ErroHttp(404, 'NAO_ENCONTRADO', 'Arquivo não encontrado.');
  }

  let info;
  try {
    info = await stat(alvo);
  } catch (erro) {
    throw new ErroHttp(404, 'NAO_ENCONTRADO', 'Arquivo não encontrado.');
  }

  if (!info.isFile()) {
    throw new ErroHttp(404, 'NAO_ENCONTRADO', 'Arquivo não encontrado.');
  }

  const extensao = path.extname(alvo).toLowerCase();
  const tipo = TIPOS[extensao] || 'application/octet-stream';
  const conteudo = await readFile(alvo);

  res.writeHead(200, {
    'Content-Type': tipo,
    'Content-Length': conteudo.length,
    'Cache-Control': tipo.startsWith('text/html')
      ? 'no-cache'
      : 'public, max-age=3600',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.end(conteudo);
}

/**
 * Cria o handler HTTP. Exportado separado do `server.js` para os testes
 * subirem um servidor real em uma porta efêmera.
 */
export function criarApp({ servico, config = {} } = {}) {
  if (!servico) throw new Error('A aplicação precisa de um serviço de pedidos.');

  const origem = config.origemPermitida || '*';
  const raizFrontend = config.servirFrontend === false ? null : config.raizFrontend;
  const registrar = config.registrarRequisicoes === true;

  return async function tratar(req, res) {
    const inicio = Date.now();
    res.on('error', () => {});

    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch (erro) {
      enviarJson(res, 400, {
        erro: { codigo: 'REQUISICAO_INVALIDA', mensagem: 'Requisição inválida.' },
      });
      return;
    }

    aplicarCabecalhos(res, origem);

    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const { pathname } = url;

      /* Raiz da API */
      if (pathname === '/api' || pathname === '/api/') {
        if (req.method !== 'GET') throw metodoNaoPermitido(['GET']);
        enviarJson(res, 200, {
          nome: 'Café do Bairro — API de encomendas',
          versao: '1.0.0',
          rotas: {
            pedidos: '/api/pedidos',
            pedido: '/api/pedidos/:id',
            disponibilidade: '/api/disponibilidade?data=AAAA-MM-DD',
            saude: '/api/health',
          },
        });
        return;
      }

      if (pathname === '/api/health') {
        if (req.method !== 'GET') throw metodoNaoPermitido(['GET']);
        enviarJson(res, 200, {
          status: 'ok',
          servico: 'cafe-do-bairro-api',
          versao: '1.0.0',
          hora: new Date().toISOString(),
          limiteDiario: servico.limiteDiario,
        });
        return;
      }

      if (pathname === '/api/disponibilidade') {
        if (req.method !== 'GET') throw metodoNaoPermitido(['GET']);
        const info = await servico.disponibilidade(url.searchParams.get('data'));
        enviarJson(res, 200, info);
        return;
      }

      if (pathname === '/api/pedidos' || pathname === '/api/pedidos/') {
        if (req.method === 'GET') {
          const resultado = await servico.listar(url.searchParams);
          enviarJson(res, 200, resultado);
          return;
        }

        if (req.method === 'POST') {
          const corpo = await lerCorpo(req);
          const pedido = await servico.criar(corpo);
          enviarJson(res, 201, { dados: pedido }, { Location: `/api/pedidos/${pedido.id}` });
          return;
        }

        throw metodoNaoPermitido(['GET', 'POST']);
      }

      const rotaPedido = /^\/api\/pedidos\/([^/]+)\/?$/.exec(pathname);
      if (rotaPedido) {
        let id;
        try {
          id = decodeURIComponent(rotaPedido[1]);
        } catch (erro) {
          throw new ErroHttp(400, 'ID_INVALIDO', 'Identificador inválido.');
        }

        if (req.method === 'GET') {
          const pedido = await servico.buscar(id);
          enviarJson(res, 200, { dados: pedido });
          return;
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
          const corpo = await lerCorpo(req);
          const pedido = await servico.atualizar(id, corpo, { parcial: req.method === 'PATCH' });
          enviarJson(res, 200, { dados: pedido });
          return;
        }

        if (req.method === 'DELETE') {
          await servico.remover(id);
          res.writeHead(204, { 'Cache-Control': 'no-store' });
          res.end();
          return;
        }

        throw metodoNaoPermitido(['GET', 'PUT', 'PATCH', 'DELETE']);
      }

      if (pathname.startsWith('/api/')) {
        throw new ErroHttp(404, 'ROTA_NAO_ENCONTRADA', 'Rota de API não encontrada.');
      }

      await servirEstatico(req, res, pathname, raizFrontend);
    } catch (erro) {
      responderErro(res, erro, req);
    } finally {
      if (registrar) {
        const duracao = Date.now() - inicio;
        console.log(`${req.method} ${url.pathname} → ${res.statusCode} (${duracao}ms)`);
      }
    }
  };
}
