import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Armazenamento em arquivo JSON.
 *
 * Por que JSON e não banco? O volume da Dona Marta é de dezenas de pedidos
 * por mês. Um arquivo JSON versionado resolve, não exige instalação e é fácil
 * de abrir no bloco de notas se algo der errado.
 *
 * Todas as operações passam por uma fila (`executar`), então duas requisições
 * simultâneas não conseguem furar o limite de 5 encomendas por dia.
 * A gravação é atômica: escreve em `.tmp` e renomeia por cima do arquivo bom.
 */
export class PedidoStore {
  #arquivo;
  #fila = Promise.resolve();
  #dados = null;

  constructor(arquivo) {
    if (!arquivo) throw new Error('Informe o caminho do arquivo de dados.');
    this.#arquivo = arquivo;
  }

  get arquivo() {
    return this.#arquivo;
  }

  async #carregar() {
    if (this.#dados) return this.#dados;

    try {
      const bruto = await readFile(this.#arquivo, 'utf8');
      const conteudo = JSON.parse(bruto);

      if (!conteudo || !Array.isArray(conteudo.pedidos)) {
        throw new Error(`Formato inesperado em ${this.#arquivo}: esperado { "pedidos": [] }.`);
      }

      this.#dados = { versao: 1, pedidos: conteudo.pedidos };
    } catch (erro) {
      if (erro.code === 'ENOENT') {
        this.#dados = { versao: 1, pedidos: [] };
        await this.#persistir();
      } else if (erro instanceof SyntaxError) {
        throw new Error(`O arquivo de dados está corrompido: ${this.#arquivo}`);
      } else {
        throw erro;
      }
    }

    return this.#dados;
  }

  async #persistir() {
    const pasta = path.dirname(this.#arquivo);
    const temporario = `${this.#arquivo}.tmp`;

    await mkdir(pasta, { recursive: true });
    await writeFile(temporario, `${JSON.stringify(this.#dados, null, 2)}\n`, 'utf8');
    await rename(temporario, this.#arquivo);
  }

  /** Executa uma operação com acesso exclusivo aos dados. */
  executar(operacao) {
    const resultado = this.#fila.then(async () => {
      const dados = await this.#carregar();
      return operacao(dados);
    });

    // A fila segue mesmo se a operação falhar; o erro vai só para quem chamou.
    this.#fila = resultado.then(
      () => undefined,
      () => undefined
    );

    return resultado;
  }

  listar() {
    return this.executar((dados) => structuredClone(dados.pedidos));
  }

  buscarPorId(id) {
    return this.executar((dados) => {
      const pedido = dados.pedidos.find((item) => item.id === id);
      return pedido ? structuredClone(pedido) : null;
    });
  }

  /**
   * Cria um pedido. `verificar` roda dentro da fila, antes de gravar, e pode
   * lançar um erro para barrar a operação (limite diário, duplicidade...).
   */
  criar(pedido, { verificar } = {}) {
    return this.executar(async (dados) => {
      if (typeof verificar === 'function') verificar(dados);

      dados.pedidos.push(pedido);

      try {
        await this.#persistir();
      } catch (erro) {
        dados.pedidos.pop();
        throw erro;
      }

      return structuredClone(pedido);
    });
  }

  /** Substitui o pedido inteiro, mantendo a posição na lista. */
  substituir(id, pedido, { verificar } = {}) {
    return this.executar(async (dados) => {
      const indice = dados.pedidos.findIndex((item) => item.id === id);
      if (indice === -1) return null;

      if (typeof verificar === 'function') verificar(dados, indice);

      const anterior = dados.pedidos[indice];
      dados.pedidos[indice] = pedido;

      try {
        await this.#persistir();
      } catch (erro) {
        dados.pedidos[indice] = anterior;
        throw erro;
      }

      return structuredClone(pedido);
    });
  }

  remover(id) {
    return this.executar(async (dados) => {
      const indice = dados.pedidos.findIndex((item) => item.id === id);
      if (indice === -1) return false;

      const [removido] = dados.pedidos.splice(indice, 1);

      try {
        await this.#persistir();
      } catch (erro) {
        dados.pedidos.splice(indice, 0, removido);
        throw erro;
      }

      return true;
    });
  }
}
