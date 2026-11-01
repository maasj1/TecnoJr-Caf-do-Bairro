/* ==========================================================================
   Café do Bairro — comportamento da página
   Tudo aqui é melhoria progressiva: sem JS, o conteúdo continua visível
   e o contato pelo WhatsApp continua funcionando.
   ========================================================================== */

const CONFIG = {
  whatsapp: '5583999999999',
  antecedenciaDias: 2,
  api: window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api',
};

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const HORARIOS = {
  0: { abre: 7, fecha: 12 },
  1: null,
  2: { abre: 7, fecha: 18 },
  3: { abre: 7, fecha: 18 },
  4: { abre: 7, fecha: 18 },
  5: { abre: 7, fecha: 18 },
  6: { abre: 7, fecha: 13 },
};

const q = (seletor, escopo = document) => escopo.querySelector(seletor);
const qa = (seletor, escopo = document) => Array.from(escopo.querySelectorAll(seletor));

/* --------------------------------------------------------------------------
   Datas e telefone
   -------------------------------------------------------------------------- */
function paraISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function somarDias(data, dias) {
  const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function formatarData(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return iso || '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const texto = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataCurta(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return iso || '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function mascararTelefone(valor) {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function formatarTelefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return digitos;
}

function linkWhatsApp(texto) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

function montarMensagem(dados) {
  const linhas = ['Olá, Dona Marta! Quero encomendar pelo site:', ''];
  const quando = dados.dataEntrega ? ` para *${formatarData(dados.dataEntrega)}*` : '';
  linhas.push(`*${dados.produto}*${quando}`);
  linhas.push(`Nome: ${dados.nomeCliente}`);
  if (dados.telefone) linhas.push(`WhatsApp: ${formatarTelefone(dados.telefone)}`);
  if (dados.observacao) linhas.push(`Observação: ${dados.observacao}`);
  return linhas.join('\n');
}

/* --------------------------------------------------------------------------
   Cabeçalho: sombra ao rolar
   -------------------------------------------------------------------------- */
function iniciarTopo() {
  const topo = document.querySelector('[data-topo]');
  if (!topo) return;

  const atualizar = () => topo.classList.toggle('topo--rolado', window.scrollY > 8);
  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });
}

/* --------------------------------------------------------------------------
   Status "aberto agora" + destaque do dia na tabela
   -------------------------------------------------------------------------- */
function iniciarStatusLoja() {
  const caixa = document.querySelector('[data-status-loja]');
  const texto = document.getElementById('status-loja-texto');
  if (!caixa || !texto) return;

  const agora = new Date();
  const dia = agora.getDay();
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  const hoje = HORARIOS[dia];

  if (hoje && minutos >= hoje.abre * 60 && minutos < hoje.fecha * 60) {
    caixa.dataset.aberto = 'true';
    texto.textContent = `Aberto agora · até ${hoje.fecha}h`;
  } else {
    caixa.dataset.aberto = 'false';
    let mensagem = 'Fechado agora';

    for (let passo = 0; passo < 7; passo += 1) {
      const indice = (dia + passo) % 7;
      const horario = HORARIOS[indice];
      if (!horario) continue;
      if (passo === 0 && minutos >= horario.fecha * 60) continue;

      const quando = passo === 0 ? 'hoje' : passo === 1 ? 'amanhã' : DIAS_SEMANA[indice];
      mensagem = `Fechado agora · abre ${quando} às ${horario.abre}h`;
      break;
    }
    texto.textContent = mensagem;
  }

  const linhas = qa('#tabela-horarios tr');
  linhas.forEach((linha) => {
    const dias = (linha.dataset.dias || '').split(',').map(Number);
    if (dias.includes(dia)) linha.dataset.hoje = 'true';
  });
}

/* --------------------------------------------------------------------------
   Formulário de encomenda
   -------------------------------------------------------------------------- */
function iniciarFormulario() {
  const form = document.getElementById('form-encomenda');
  if (!form) return;

  const dataInput = document.getElementById('dataEntrega');
  const botao = document.getElementById('botao-enviar');
  const textoBotao = botao ? q('.botao__texto', botao) : null;
  const aviso = document.getElementById('aviso-form');
  const vagas = document.getElementById('vagas');
  const confirmacao = document.getElementById('confirmacao');
  const resumo = document.getElementById('resumo-pedido');
  const avisoOffline = document.getElementById('aviso-offline');
  const linkOffline = document.getElementById('link-offline');
  const linkConfirmacao = document.getElementById('confirmacao-whatsapp');
  const botaoNova = document.getElementById('nova-encomenda');

  const dataMinima = paraISO(somarDias(new Date(), CONFIG.antecedenciaDias));
  dataInput.min = dataMinima;

  let enviando = false;
  let controladorVagas = null;

  const marcarCampo = (nome, mensagem) => {
    const campo = form.elements[nome];
    const alvo = document.getElementById(`erro-${nome}`);
    if (campo) campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
    if (alvo) alvo.textContent = mensagem || '';
  };

  const limparErros = () => {
    ['nomeCliente', 'telefone', 'produto', 'dataEntrega'].forEach((nome) => marcarCampo(nome, ''));
    if (aviso) aviso.textContent = '';
  };

  const coletar = () => ({
    nomeCliente: form.nomeCliente.value.trim(),
    telefone: form.telefone.value.replace(/\D/g, ''),
    produto: form.produto.value,
    dataEntrega: form.dataEntrega.value,
    observacao: form.observacao.value.trim(),
  });

  const validar = (dados) => {
    const erros = {};

    if (dados.nomeCliente.length < 2) {
      erros.nomeCliente = 'Escreva seu nome, por favor.';
    }
    if (dados.telefone.length < 10) {
      erros.telefone = 'Informe o WhatsApp com DDD, só os números.';
    }
    if (!dados.produto) {
      erros.produto = 'Escolha o que você quer encomendar.';
    }
    if (!dados.dataEntrega) {
      erros.dataEntrega = 'Escolha o dia da retirada.';
    } else if (dados.dataEntrega < dataMinima) {
      erros.dataEntrega = `Escolha uma data a partir de ${formatarDataCurta(dataMinima)} (2 dias de antecedência).`;
    }

    return erros;
  };

  const aplicarErros = (erros) => {
    Object.entries(erros).forEach(([campo, mensagem]) => marcarCampo(campo, mensagem));
    const primeiro = Object.keys(erros)[0];
    if (primeiro && form.elements[primeiro]) form.elements[primeiro].focus();
  };

  const aplicarErrosDoServidor = (corpo) => {
    const detalhes = corpo && corpo.erro && corpo.erro.detalhes;
    if (Array.isArray(detalhes)) {
      const erros = {};
      detalhes.forEach((detalhe) => {
        if (detalhe.campo && detalhe.mensagem) erros[detalhe.campo] = detalhe.mensagem;
      });
      if (Object.keys(erros).length) {
        aplicarErros(erros);
        return;
      }
    }
    if (aviso) {
      aviso.textContent =
        (corpo && corpo.erro && corpo.erro.mensagem) || 'Confira os dados e tente de novo.';
    }
  };

  const definirEnviando = (estado) => {
    enviando = estado;
    if (botao) {
      botao.disabled = estado;
      botao.setAttribute('aria-busy', String(estado));
    }
    if (textoBotao) textoBotao.textContent = estado ? 'Enviando…' : 'Enviar encomenda';
  };

  const conferirVagas = async (data) => {
    if (!vagas) return;
    if (!data) {
      vagas.textContent = '';
      vagas.removeAttribute('data-estado');
      if (botao) botao.disabled = false;
      return;
    }

    if (controladorVagas) controladorVagas.abort();
    controladorVagas = new AbortController();

    vagas.dataset.estado = 'carregando';
    vagas.textContent = 'Conferindo as vagas do dia…';
    if (botao) botao.disabled = true;

    try {
      const resposta = await fetch(
        `${CONFIG.api}/disponibilidade?data=${encodeURIComponent(data)}`,
        { signal: controladorVagas.signal }
      );
      if (!resposta.ok) throw new Error('Não foi possível conferir as vagas.');

      const info = await resposta.json();
      const restantes = Number(info.restantes) || 0;

      if (restantes > 0) {
        vagas.dataset.estado = 'disponivel';
        vagas.textContent =
          restantes === 1 ? 'Última vaga desse dia!' : `Ainda tem ${restantes} vagas nesse dia.`;
        if (botao) botao.disabled = false;
      } else {
        vagas.dataset.estado = 'lotado';
        vagas.textContent = 'Esse dia já está completo. Escolha outra data, por favor.';
        if (botao) botao.disabled = true;
      }
    } catch (erro) {
      if (erro.name === 'AbortError') return;
      vagas.dataset.estado = 'indefinido';
      vagas.textContent = 'Não conseguimos conferir as vagas agora — dá para enviar pelo WhatsApp.';
      if (botao) botao.disabled = false;
    }
  };

  const enviar = async (payload) => {
    const resposta = await fetch(`${CONFIG.api}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let corpo = null;
    try {
      corpo = await resposta.json();
    } catch (erro) {
      corpo = null;
    }
    return { resposta, corpo };
  };

  const mostrarConfirmacao = (pedido) => {
    if (resumo) {
      resumo.replaceChildren();
      const linhas = [
        ['Produto', pedido.produto],
        ['Dia', formatarData(pedido.dataEntrega)],
        ['Nome', pedido.nomeCliente],
        ['WhatsApp', formatarTelefone(pedido.telefone)],
      ];
      if (pedido.observacao) linhas.push(['Observação', pedido.observacao]);

      linhas.forEach(([rotulo, valor]) => {
        const termo = document.createElement('dt');
        termo.textContent = rotulo;
        const descricao = document.createElement('dd');
        descricao.textContent = valor;
        resumo.append(termo, descricao);
      });
    }

    if (linkConfirmacao) {
      const linhas = [
        'Olá, Dona Marta! Acabei de fazer uma encomenda pelo site:',
        '',
        `*${pedido.produto}* para *${formatarData(pedido.dataEntrega)}*`,
        `Nome: ${pedido.nomeCliente}`,
        `WhatsApp: ${formatarTelefone(pedido.telefone)}`,
      ];
      if (pedido.observacao) linhas.push(`Observação: ${pedido.observacao}`);
      linhas.push('', 'Pode confirmar, por favor?');

      linkConfirmacao.href = linkWhatsApp(linhas.join('\n'));
    }

    if (avisoOffline) avisoOffline.hidden = true;
    form.hidden = true;
    if (confirmacao) {
      confirmacao.hidden = false;
      confirmacao.scrollIntoView({ behavior: 'smooth', block: 'center' });
      confirmacao.focus({ preventScroll: true });
    }
  };

  const mostrarSaidaPeloWhatsApp = (dados) => {
    if (!linkOffline) return;
    const mensagem = montarMensagem({
      produto: dados.produto || 'uma encomenda',
      nomeCliente: dados.nomeCliente || '(meu nome)',
      telefone: dados.telefone,
      dataEntrega: dados.dataEntrega,
      observacao: dados.observacao,
    });
    linkOffline.href = linkWhatsApp(mensagem);
    if (avisoOffline) avisoOffline.hidden = false;
  };

  /* Máscara do telefone */
  form.telefone.addEventListener('input', () => {
    form.telefone.value = mascararTelefone(form.telefone.value);
  });

  /* Limpa o erro do campo assim que a pessoa corrige */
  form.addEventListener('input', (evento) => {
    if (evento.target.name) marcarCampo(evento.target.name, '');
  });

  form.addEventListener('change', (evento) => {
    if (evento.target === form.dataEntrega) conferirVagas(form.dataEntrega.value);
    if (evento.target.name) marcarCampo(evento.target.name, '');
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    limparErros();
    const dados = coletar();
    const erros = validar(dados);

    if (Object.keys(erros).length) {
      aplicarErros(erros);
      return;
    }

    definirEnviando(true);

    try {
      let { resposta, corpo } = await enviar(dados);

      if (resposta.status === 409 && corpo?.erro?.codigo === 'PEDIDO_DUPLICADO') {
        const continuar = window.confirm(
          'Já existe uma encomenda igual para esse dia. Quer registrar mesmo assim?'
        );
        if (!continuar) return;
        ({ resposta, corpo } = await enviar({ ...dados, confirmarDuplicado: true }));
      }

      if (resposta.status === 201 && corpo && corpo.dados) {
        mostrarConfirmacao(corpo.dados);
        return;
      }

      if (resposta.status === 409 && corpo?.erro?.codigo === 'LIMITE_DIARIO') {
        marcarCampo('dataEntrega', 'Esse dia está completo. Escolha outra data, por favor.');
        if (aviso) aviso.textContent = corpo.erro.mensagem;
        conferirVagas(dados.dataEntrega);
        return;
      }

      if (resposta.status === 422) {
        aplicarErrosDoServidor(corpo);
        return;
      }

      throw new Error((corpo && corpo.erro && corpo.erro.mensagem) || 'Não foi possível enviar.');
    } catch (erro) {
      mostrarSaidaPeloWhatsApp(dados);
      if (aviso) {
        aviso.textContent =
          'Não conseguimos salvar no site agora. Use o WhatsApp abaixo — a Dona Marta anota do mesmo jeito.';
      }
    } finally {
      definirEnviando(false);
    }
  });

  if (botaoNova) {
    botaoNova.addEventListener('click', () => {
      if (confirmacao) confirmacao.hidden = true;
      form.hidden = false;
      form.reset();
      limparErros();
      if (aviso) aviso.textContent = '';
      if (avisoOffline) avisoOffline.hidden = true;
      if (vagas) {
        vagas.textContent = '';
        vagas.removeAttribute('data-estado');
      }
      if (botao) botao.disabled = false;
      dataInput.min = dataMinima;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.nomeCliente.focus({ preventScroll: true });
    });
  }
}

/* --------------------------------------------------------------------------
   Revelação suave
   -------------------------------------------------------------------------- */
function iniciarRevelacao() {
  const elementos = qa('.revelar');
  if (!elementos.length) return;

  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (semMovimento || !('IntersectionObserver' in window)) {
    elementos.forEach((elemento) => elemento.classList.add('visivel'));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      });
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
  );

  elementos.forEach((elemento) => observador.observe(elemento));

  /* Rede de segurança: se o observer não disparar (aba em segundo plano,
     impressão, extensão), nada fica invisível para sempre. */
  window.setTimeout(() => {
    elementos.forEach((elemento) => elemento.classList.add('visivel'));
  }, 4000);

  window.addEventListener('beforeprint', () => {
    elementos.forEach((elemento) => elemento.classList.add('visivel'));
  });
}

/* --------------------------------------------------------------------------
   Inicialização
   -------------------------------------------------------------------------- */
function iniciar() {
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  try {
    iniciarTopo();
    iniciarStatusLoja();
    iniciarFormulario();
    iniciarRevelacao();
  } catch (erro) {
    console.error('Falha ao iniciar o site:', erro);
    qa('.revelar').forEach((elemento) => elemento.classList.add('visivel'));
  }
}

document.documentElement.classList.add('js');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
