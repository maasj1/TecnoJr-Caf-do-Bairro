import { randomUUID } from 'node:crypto';
import { conflito, naoEncontrado, validacao } from './errors.js';
import {
  dataValida,
  hojeNoFuso,
  normalizarStatus,
  validarPedido,
} from './validacao.js';

const ORDENACOES = ['dataEntrega', 'criadoEm', 'nomeCliente'];

const normalizarBusca = (valor) =>
  String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Regras de negócio das encomendas.
 * Recebe o armazenamento por injeção para ficar testável sem HTTP.
 */
export function criarServico({
  store,
  limiteDiario = 5,
  fusoHorario = 'America/Sao_Paulo',
  agora = () => new Date(),
} = {}) {
  if (!store) throw new Error('O serviço de pedidos precisa de um store.');

  const hoje = () => hojeNoFuso(fusoHorario, agora());

  const contarNoDia = (pedidos, data, ignorarId = null) =>
    pedidos.filter((pedido) => pedido.dataEntrega === data && pedido.id !== ignorarId).length;

  const acharDuplicado = (pedidos, candidato, ignorarId = null) =>
    pedidos.find(
      (pedido) =>
        pedido.id !== ignorarId &&
        pedido.dataEntrega === candidato.dataEntrega &&
        pedido.telefone === candidato.telefone &&
        normalizarBusca(pedido.produto) === normalizarBusca(candidato.produto)
    );

  const erroLimite = (data, ocupadas) =>
    conflito(
      'LIMITE_DIARIO',
      `A Dona Marta produz no máximo ${limiteDiario} encomendas por dia. Escolha outra data.`,
      { data, limite: limiteDiario, ocupadas }
    );

  const erroDuplicado = (pedido) =>
    conflito(
      'PEDIDO_DUPLICADO',
      'Já existe uma encomenda desse produto para essa data com o mesmo telefone. ' +
        'Se for outra encomenda, confirme o envio.',
      {
        produto: pedido.produto,
        dataEntrega: pedido.dataEntrega,
        pedidoExistenteId: pedido.id,
      }
    );

  /* ------------------------------------------------------------------------
     Listagem com filtros e paginação
     ------------------------------------------------------------------------ */
  const normalizarFiltros = (params) => {
    const erros = [];

    let status = null;
    const statusBruto = params.get('status');
    if (statusBruto) {
      status = normalizarStatus(statusBruto);
      if (!status) {
        erros.push({
          campo: 'status',
          mensagem: 'Status inválido. Use recebida, em_preparo ou entregue.',
        });
      }
    }

    let data = null;
    const dataBruta = params.get('data');
    if (dataBruta) {
      if (!dataValida(dataBruta)) {
        erros.push({ campo: 'data', mensagem: 'Use uma data válida no formato AAAA-MM-DD.' });
      } else {
        data = dataBruta;
      }
    }

    if (erros.length) throw validacao(erros);

    const busca = (params.get('busca') || '').trim();
    const ordenarBruto = params.get('ordenar') || 'dataEntrega';
    const ordenar = ORDENACOES.includes(ordenarBruto) ? ordenarBruto : 'dataEntrega';
    const ordem = params.get('ordem') === 'desc' ? 'desc' : 'asc';

    const pagina = Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1);
    const porPagina = Math.min(
      100,
      Math.max(1, Number.parseInt(params.get('porPagina'), 10) || 50)
    );

    return { status, data, busca, ordenar, ordem, pagina, porPagina };
  };

  const listar = async (params) => {
    const filtros = normalizarFiltros(params);
    let pedidos = await store.listar();

    if (filtros.status) {
      pedidos = pedidos.filter((pedido) => pedido.status === filtros.status);
    }
    if (filtros.data) {
      pedidos = pedidos.filter((pedido) => pedido.dataEntrega === filtros.data);
    }
    if (filtros.busca) {
      const termo = normalizarBusca(filtros.busca);
      pedidos = pedidos.filter((pedido) =>
        [pedido.nomeCliente, pedido.telefone, pedido.produto, pedido.observacao].some((valor) =>
          normalizarBusca(valor).includes(termo)
        )
      );
    }

    const direcao = filtros.ordem === 'desc' ? -1 : 1;
    pedidos.sort((a, b) => {
      let comparacao;
      if (filtros.ordenar === 'nomeCliente') {
        comparacao = a.nomeCliente.localeCompare(b.nomeCliente, 'pt-BR');
      } else {
        const valorA = a[filtros.ordenar] || '';
        const valorB = b[filtros.ordenar] || '';
        comparacao = valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
      }

      if (comparacao !== 0) return comparacao * direcao;

      // Desempate estável: pedido mais antigo primeiro.
      return String(a.criadoEm).localeCompare(String(b.criadoEm));
    });

    const total = pedidos.length;
    const inicio = (filtros.pagina - 1) * filtros.porPagina;
    const dados = pedidos.slice(inicio, inicio + filtros.porPagina);

    return {
      dados,
      paginacao: {
        pagina: filtros.pagina,
        porPagina: filtros.porPagina,
        total,
        totalPaginas: Math.ceil(total / filtros.porPagina),
      },
    };
  };

  /* ------------------------------------------------------------------------
     Leitura, criação, atualização e remoção
     ------------------------------------------------------------------------ */
  const buscar = async (id) => {
    const pedido = await store.buscarPorId(id);
    if (!pedido) throw naoEncontrado();
    return pedido;
  };

  const criar = async (entrada) => {
    const { dados, erros } = validarPedido(entrada, { hoje: hoje() });
    if (erros.length) throw validacao(erros);

    const instante = agora().toISOString();
    const pedido = {
      id: randomUUID(),
      nomeCliente: dados.nomeCliente,
      telefone: dados.telefone,
      produto: dados.produto,
      dataEntrega: dados.dataEntrega,
      status: dados.status || 'recebida',
      observacao: dados.observacao || '',
      criadoEm: instante,
      atualizadoEm: instante,
    };

    const confirmarDuplicado = entrada.confirmarDuplicado === true;

    return store.criar(pedido, {
      verificar: (todos) => {
        const ocupadas = contarNoDia(todos.pedidos, pedido.dataEntrega);
        if (ocupadas >= limiteDiario) throw erroLimite(pedido.dataEntrega, ocupadas);

        if (!confirmarDuplicado) {
          const repetido = acharDuplicado(todos.pedidos, pedido);
          if (repetido) throw erroDuplicado(repetido);
        }
      },
    });
  };

  /**
   * @param {string} id
   * @param {object} entrada
   * @param {{ parcial: boolean }} opcoes  PATCH usa parcial = true
   */
  const atualizar = async (id, entrada, { parcial = false } = {}) => {
    const atual = await store.buscarPorId(id);
    if (!atual) throw naoEncontrado();

    const { dados, erros } = validarPedido(entrada, {
      parcial,
      hoje: hoje(),
      permitirDataPassada: true,
    });

    if (!erros.length && dados.dataEntrega && dados.dataEntrega !== atual.dataEntrega) {
      if (dados.dataEntrega < hoje()) {
        erros.push({
          campo: 'dataEntrega',
          mensagem: 'A nova data de entrega não pode estar no passado.',
        });
      }
    }

    if (erros.length) throw validacao(erros);

    if (parcial && Object.keys(dados).length === 0) {
      throw validacao([
        { campo: 'corpo', mensagem: 'Informe ao menos um campo para atualizar.' },
      ]);
    }

    const atualizado = {
      ...atual,
      ...dados,
      atualizadoEm: agora().toISOString(),
    };

    const confirmarDuplicado = entrada.confirmarDuplicado === true;
    const mudouData = atualizado.dataEntrega !== atual.dataEntrega;
    const mudouIdentidade =
      mudouData ||
      atualizado.telefone !== atual.telefone ||
      normalizarBusca(atualizado.produto) !== normalizarBusca(atual.produto);

    const salvo = await store.substituir(id, atualizado, {
      verificar: (todos) => {
        if (mudouData) {
          const ocupadas = contarNoDia(todos.pedidos, atualizado.dataEntrega, id);
          if (ocupadas >= limiteDiario) throw erroLimite(atualizado.dataEntrega, ocupadas);
        }

        if (!confirmarDuplicado && mudouIdentidade) {
          const repetido = acharDuplicado(todos.pedidos, atualizado, id);
          if (repetido) throw erroDuplicado(repetido);
        }
      },
    });

    if (!salvo) throw naoEncontrado();
    return salvo;
  };

  const remover = async (id) => {
    const removido = await store.remover(id);
    if (!removido) throw naoEncontrado();
  };

  /* ------------------------------------------------------------------------
     Disponibilidade do dia (usada pelo site)
     ------------------------------------------------------------------------ */
  const disponibilidade = async (data) => {
    const alvo = String(data ?? '').trim();

    if (!dataValida(alvo)) {
      throw validacao([
        { campo: 'data', mensagem: 'Informe uma data válida no formato AAAA-MM-DD.' },
      ]);
    }

    const pedidos = await store.listar();
    const ocupadas = contarNoDia(pedidos, alvo);
    const restantes = Math.max(0, limiteDiario - ocupadas);

    return {
      data: alvo,
      limite: limiteDiario,
      ocupadas,
      restantes,
      disponivel: restantes > 0,
    };
  };

  return {
    listar,
    buscar,
    criar,
    atualizar,
    remover,
    disponibilidade,
    // Expostos para facilitar testes e integrações futuras.
    limiteDiario,
    fusoHorario,
  };
}
