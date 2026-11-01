import path from 'node:path';

/**
 * Lê as configurações do ambiente, com padrões pensados para rodar local.
 * Nenhuma dependência externa: só variáveis de ambiente.
 */
export function carregarConfig({ raiz = process.cwd(), env = process.env } = {}) {
  const inteiroPositivo = (valor, padrao) => {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : padrao;
  };

  return {
    porta: inteiroPositivo(env.PORT, 3000),
    limiteDiario: inteiroPositivo(env.LIMITE_DIARIO, 5),
    arquivoDados: path.resolve(raiz, env.DATA_FILE || 'data/pedidos.json'),
    origemPermitida: env.CORS_ORIGIN || '*',
    fusoHorario: env.FUSO_HORARIO || 'America/Sao_Paulo',
    servirFrontend: env.SERVE_FRONTEND !== 'false',
    raizFrontend: path.resolve(raiz, '..', 'frontend'),
    registrarRequisicoes: env.LOG_REQUISICOES !== 'false',
  };
}
