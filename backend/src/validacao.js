/**
 * Validação e normalização dos dados de uma encomenda.
 * Funções puras, sem conhecimento de HTTP ou de armazenamento.
 */

export const STATUS = ['recebida', 'em_preparo', 'entregue'];

export const ROTULOS_STATUS = {
  recebida: 'Recebida',
  em_preparo: 'Em preparo',
  entregue: 'Entregue',
};

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Retorna a data de "hoje" (AAAA-MM-DD) no fuso da loja.
 * Evita o clássico bug de usar a data UTC e virar o dia às 21h no Brasil.
 */
export function hojeNoFuso(fuso = 'America/Sao_Paulo', agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);

  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

/**
 * Valida uma data no formato AAAA-MM-DD, incluindo meses de 30 dias e
 * anos bissextos. Não usa `new Date('2026-02-31')`, que "corrige" a data
 * silenciosamente e esconde o erro.
 */
export function dataValida(texto) {
  if (typeof texto !== 'string' || !FORMATO_DATA.test(texto)) return false;

  const [ano, mes, dia] = texto.split('-').map(Number);
  if (ano < 1900 || ano > 2200) return false;

  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

/** Aceita "em preparo", "Em Preparo", "em_preparo" e devolve o valor canônico. */
export function normalizarStatus(valor) {
  if (typeof valor !== 'string') return null;

  const normalizado = valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  return STATUS.includes(normalizado) ? normalizado : null;
}

/** Remove máscara, espaços e o código do país (+55), quando presente. */
export function normalizarTelefone(valor) {
  let digitos = String(valor ?? '').replace(/\D/g, '');
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  return digitos;
}

const texto = (valor) => {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
};

const textoLimpo = (valor) => texto(valor).replace(/\s+/g, ' ');

/**
 * Valida um pedido.
 *
 * @param {object} entrada corpo recebido
 * @param {object} opcoes
 * @param {boolean} opcoes.parcial  true para PATCH (só valida o que veio)
 * @param {string}  opcoes.hoje     data de referência (AAAA-MM-DD)
 * @param {boolean} opcoes.permitirDataPassada  usado em atualizações
 * @returns {{ dados: object, erros: Array<{campo: string, mensagem: string}> }}
 */
export function validarPedido(entrada, { parcial = false, hoje, permitirDataPassada = false } = {}) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    return {
      dados: {},
      erros: [{ campo: 'corpo', mensagem: 'Envie um objeto JSON com os dados da encomenda.' }],
    };
  }

  const erros = [];
  const dados = {};
  const tem = (campo) => Object.prototype.hasOwnProperty.call(entrada, campo);

  /* Nome */
  if (!parcial || tem('nomeCliente')) {
    const nome = textoLimpo(entrada.nomeCliente);
    if (nome.length < 2) {
      erros.push({ campo: 'nomeCliente', mensagem: 'Informe o nome do cliente (mínimo 2 letras).' });
    } else if (nome.length > 80) {
      erros.push({ campo: 'nomeCliente', mensagem: 'O nome pode ter no máximo 80 caracteres.' });
    } else {
      dados.nomeCliente = nome;
    }
  }

  /* Telefone */
  if (!parcial || tem('telefone')) {
    const telefone = normalizarTelefone(entrada.telefone);
    if (!telefone) {
      erros.push({ campo: 'telefone', mensagem: 'Informe o telefone com DDD.' });
    } else if (telefone.length < 10 || telefone.length > 11) {
      erros.push({
        campo: 'telefone',
        mensagem: 'O telefone deve ter 10 ou 11 dígitos, com DDD.',
      });
    } else {
      dados.telefone = telefone;
    }
  }

  /* Produto */
  if (!parcial || tem('produto')) {
    const produto = textoLimpo(entrada.produto);
    if (produto.length < 2) {
      erros.push({ campo: 'produto', mensagem: 'Informe o produto da encomenda.' });
    } else if (produto.length > 120) {
      erros.push({ campo: 'produto', mensagem: 'O produto pode ter no máximo 120 caracteres.' });
    } else {
      dados.produto = produto;
    }
  }

  /* Data de entrega */
  if (!parcial || tem('dataEntrega')) {
    const data = texto(entrada.dataEntrega);
    if (!dataValida(data)) {
      erros.push({
        campo: 'dataEntrega',
        mensagem: 'Use uma data válida no formato AAAA-MM-DD.',
      });
    } else if (!permitirDataPassada && hoje && data < hoje) {
      erros.push({
        campo: 'dataEntrega',
        mensagem: 'A data de entrega não pode estar no passado.',
      });
    } else {
      dados.dataEntrega = data;
    }
  }

  /* Status (opcional: o padrão é "recebida") */
  const statusEnviado = tem('status') ? texto(entrada.status) : '';
  if (statusEnviado) {
    const status = normalizarStatus(statusEnviado);
    if (!status) {
      erros.push({
        campo: 'status',
        mensagem: `Status inválido. Use um destes: ${STATUS.join(', ')}.`,
      });
    } else {
      dados.status = status;
    }
  }

  /* Observação (opcional) */
  if (tem('observacao')) {
    const observacao = texto(entrada.observacao);
    if (observacao.length > 300) {
      erros.push({
        campo: 'observacao',
        mensagem: 'A observação pode ter no máximo 300 caracteres.',
      });
    } else {
      dados.observacao = observacao;
    }
  } else if (!parcial) {
    dados.observacao = '';
  }

  return { dados, erros };
}
