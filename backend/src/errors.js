/**
 * Erro com status HTTP e código legível por máquina.
 * A API sempre responde no formato:
 *   { erro: { codigo, mensagem, detalhes? } }
 */
export class ErroHttp extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = 'ErroHttp';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export const naoEncontrado = (mensagem = 'Pedido não encontrado.') =>
  new ErroHttp(404, 'NAO_ENCONTRADO', mensagem);

export const validacao = (detalhes, mensagem = 'Confira os dados enviados.') =>
  new ErroHttp(422, 'VALIDACAO', mensagem, detalhes);

export const conflito = (codigo, mensagem, detalhes) =>
  new ErroHttp(409, codigo, mensagem, detalhes);
