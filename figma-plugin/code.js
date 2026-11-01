/* Café do Bairro — layout mobile para Figma
   Gera: capa, 3 telas (390 × 844) e prancha de tokens.
   Rode em: Plugins → Development → Café do Bairro — Layout Mobile. */

const COR = {
  creme: '#FBF6EE',
  papel: '#F5EADA',
  papelForte: '#EFDFC8',
  areia: '#E6D3B8',
  areiaForte: '#D8BE9C',
  cafeLeite: '#C9A57C',
  canela: '#8A5533',
  terracota: '#B45434',
  terracotaEscura: '#974226',
  terracotaSuave: '#F3DCCF',
  cafe: '#3A2A20',
  cafeSuave: '#6E5747',
  oliva: '#6F7A4E',
  olivaEscura: '#4F5E38',
  mel: '#E2A94F',
  melSuave: '#F7E3B8',
  erro: '#A03A2A',
  branco: '#FFFCF7',
  campo: '#FFFDF9',
  placeholder: '#A08B79'
};

let F = {};

function hexParaRgb(hex) {
  const limpo = hex.replace('#', '');
  return {
    r: parseInt(limpo.slice(0, 2), 16) / 255,
    g: parseInt(limpo.slice(2, 4), 16) / 255,
    b: parseInt(limpo.slice(4, 6), 16) / 255
  };
}

function solid(hex, alpha) {
  const a = alpha === undefined ? 1 : alpha;
  return [{ type: 'SOLID', color: Object.assign(hexParaRgb(hex), { a: a }) }];
}

async function carregarFontes() {
  const disponiveis = await figma.listAvailableFontsAsync();
  const normalizar = (texto) => texto.toLowerCase().replace(/[\s\-_]/g, '');

  const achar = (familia, estilos) => {
    const lista = disponiveis.filter((f) => f.fontName.family.toLowerCase() === familia.toLowerCase());
    for (const estilo of estilos) {
      const alvo = normalizar(estilo);
      const encontrado = lista.find((f) => normalizar(f.fontName.style) === alvo);
      if (encontrado) return encontrado.fontName;
    }
    return lista[0] ? lista[0].fontName : null;
  };

  const fallback = achar('Inter', ['Regular']) || { family: 'Inter', style: 'Regular' };
  const fallbackForte = achar('Inter', ['Bold', 'SemiBold']) || fallback;

  const escolhidas = {
    titulo: achar('Fraunces', ['SemiBold', 'Semi Bold', 'Bold', 'Regular']) || achar('Georgia', ['Bold', 'Regular']) || fallbackForte,
    tituloRegular: achar('Fraunces', ['Regular', 'Medium']) || achar('Georgia', ['Regular']) || fallback,
    texto: achar('Karla', ['Regular', 'Medium']) || fallback,
    textoMedio: achar('Karla', ['Medium', 'SemiBold', 'Regular']) || fallback,
    textoForte: achar('Karla', ['Bold', 'SemiBold', 'Medium']) || fallbackForte,
    manuscrito: achar('Caveat', ['Medium', 'SemiBold', 'Regular']) || achar('Segoe Script', ['Regular']) || fallback
  };

  for (const chave of Object.keys(escolhidas)) {
    try {
      await figma.loadFontAsync(escolhidas[chave]);
      F[chave] = escolhidas[chave];
    } catch (erro) {
      await figma.loadFontAsync(fallback);
      F[chave] = fallback;
    }
  }
}

function txt(parent, conteudo, x, y, largura, opcoes) {
  const o = opcoes || {};
  const t = figma.createText();
  t.name = o.nome || ('Texto — ' + String(conteudo).slice(0, 28));
  t.fontName = o.fonte || F.texto;
  t.fontSize = o.tamanho || 14;
  t.fills = solid(o.cor || COR.cafe);
  t.characters = String(conteudo);
  t.textAutoResize = 'HEIGHT';
  t.lineHeight = { unit: 'PIXELS', value: o.entrelinha || Math.round((o.tamanho || 14) * 1.5) };
  if (o.espacamento !== undefined) t.letterSpacing = { unit: 'PERCENT', value: o.espacamento };
  if (o.alinhamento) t.textAlignHorizontal = o.alinhamento;
  if (o.uppercase) t.textCase = 'UPPER';
  parent.appendChild(t);
  t.resize(largura, t.height);
  t.x = x;
  t.y = y;
  return t;
}

function rect(parent, x, y, w, h, opcoes) {
  const o = opcoes || {};
  const r = figma.createRectangle();
  r.name = o.nome || 'Retângulo';
  r.resize(w, h);
  r.x = x;
  r.y = y;
  r.fills = o.fill ? solid(o.fill) : [];
  if (o.raio !== undefined) r.cornerRadius = o.raio;
  if (o.borda) {
    r.strokes = solid(o.borda);
    r.strokeWeight = o.peso || 1;
    r.strokeAlign = 'INSIDE';
  }
  parent.appendChild(r);
  return r;
}

function frame(parent, nome, x, y, w, h, opcoes) {
  const o = opcoes || {};
  const f = figma.createFrame();
  f.name = nome;
  f.resize(w, h);
  f.x = x;
  f.y = y;
  f.fills = o.fill ? solid(o.fill) : [];
  f.clipsContent = Boolean(o.clip);
  if (o.raio !== undefined) f.cornerRadius = o.raio;
  if (o.borda) {
    f.strokes = solid(o.borda);
    f.strokeWeight = o.peso || 1;
    f.strokeAlign = 'INSIDE';
  }
  if (o.sombra) {
    f.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0.23, g: 0.16, b: 0.12, a: 0.12 },
      offset: { x: 0, y: 10 },
      radius: 24,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL'
    }];
  }
  parent.appendChild(f);
  return f;
}

function botao(parent, x, y, w, h, label, fundo, corTexto, borda, tamanho) {
  const f = frame(parent, 'Botão — ' + label, x, y, w, h, {
    fill: fundo || undefined,
    raio: h / 2,
    borda: borda || undefined,
    clip: false
  });
  const t = txt(f, label, 0, 0, w, {
    fonte: F.textoForte,
    tamanho: tamanho || 14,
    cor: corTexto || COR.branco,
    alinhamento: 'CENTER'
  });
  t.y = Math.round((h - t.height) / 2);
  return f;
}

function pilula(parent, x, y, label, fundo, cor, borda) {
  const f = figma.createFrame();
  f.name = 'Etiqueta — ' + label;
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.primaryAxisAlignItems = 'CENTER';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12;
  f.paddingRight = 12;
  f.paddingTop = 6;
  f.paddingBottom = 6;
  f.itemSpacing = 7;
  f.cornerRadius = 999;
  f.fills = solid(fundo);
  if (borda) {
    f.strokes = solid(borda);
    f.strokeWeight = 1;
    f.strokeAlign = 'INSIDE';
  }
  parent.appendChild(f);

  const ponto = figma.createEllipse();
  ponto.resize(7, 7);
  ponto.fills = solid(cor);
  f.appendChild(ponto);

  const t = figma.createText();
  t.fontName = F.textoForte;
  t.characters = label;
  t.fontSize = 11;
  t.fills = solid(cor);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  f.appendChild(t);

  f.x = x;
  f.y = y;
  return f;
}

function campo(parent, label, placeholder, x, y, w) {
  txt(parent, label, x, y, w, { fonte: F.textoForte, tamanho: 10.5 });
  rect(parent, x, y + 18, w, 42, { fill: COR.campo, borda: COR.areia, raio: 12 });
  if (placeholder) {
    txt(parent, placeholder, x + 12, y + 30, w - 24, {
      tamanho: 10.5,
      cor: COR.placeholder
    });
  }
}

function cartaoProduto(parent, x, y, w, h, dados) {
  const c = frame(parent, 'Produto — ' + dados.nome, x, y, w, h, {
    fill: COR.branco,
    raio: 18,
    borda: COR.areia,
    clip: true
  });

  if (dados.selo) {
    const s = frame(c, 'Selo — ' + dados.selo, 12, 12, 78, 21, {
      fill: dados.seloFundo || COR.olivaEscura,
      raio: 999,
      clip: true
    });
    txt(s, dados.selo, 0, 4, 78, {
      fonte: F.textoForte,
      tamanho: 7.5,
      cor: dados.seloCor || '#FFF9EE',
      alinhamento: 'CENTER',
      espacamento: 7,
      uppercase: true
    });
  }

  const yNome = dados.selo ? 42 : 14;
  txt(c, dados.nome, 14, yNome, 87, {
    fonte: F.titulo,
    tamanho: 16,
    entrelinha: 19
  });
  txt(c, 'R$ ' + dados.preco, 109, yNome, 44, {
    fonte: F.titulo,
    tamanho: 16,
    cor: COR.terracota,
    alinhamento: 'RIGHT'
  });
  txt(c, dados.descricao, 14, yNome + 42, w - 28, {
    tamanho: 10.5,
    entrelinha: 15,
    cor: COR.cafeSuave
  });
  txt(c, dados.detalhe, 14, h - 26, w - 28, {
    fonte: F.textoForte,
    tamanho: 8.5,
    cor: COR.canela,
    uppercase: true,
    espacamento: 5
  });
  return c;
}

function cartaoCompacto(parent, x, y, w, h, dados) {
  const c = frame(parent, 'Item — ' + dados.nome, x, y, w, h, {
    fill: COR.branco,
    raio: 16,
    borda: COR.areia,
    clip: true
  });
  txt(c, dados.nome, 12, 12, w - 70, {
    fonte: F.textoForte,
    tamanho: 12
  });
  txt(c, 'R$ ' + dados.preco, w - 58, 12, 46, {
    fonte: F.textoForte,
    tamanho: 12,
    cor: COR.terracota,
    alinhamento: 'RIGHT'
  });
  txt(c, dados.detalhe, 12, 36, w - 24, {
    tamanho: 9.5,
    cor: COR.cafeSuave
  });
  return c;
}

function cabecalho(tela) {
  rect(tela, 0, 0, 390, 72, { fill: COR.creme });
  rect(tela, 0, 71, 390, 1, { fill: COR.areia });

  rect(tela, 20, 24, 24, 18, { fill: COR.cafeLeite, raio: 4 });
  const alca = figma.createEllipse();
  alca.resize(10, 12);
  alca.fills = [];
  alca.strokes = solid(COR.cafe);
  alca.strokeWeight = 2;
  alca.strokeAlign = 'CENTER';
  tela.appendChild(alca);
  alca.x = 42;
  alca.y = 27;

  txt(tela, 'Café do Bairro', 58, 18, 190, {
    fonte: F.titulo,
    tamanho: 18,
    entrelinha: 20
  });
  txt(tela, 'BOLOS CASEIROS & CAFÉ COADO', 58, 41, 230, {
    fonte: F.textoForte,
    tamanho: 7,
    cor: COR.canela,
    espacamento: 12,
    uppercase: true
  });
  botao(tela, 296, 22, 74, 30, 'Encomendar', COR.terracota, '#FFF8F0', null, 9.5);
}

function icone(parent, tipo, x, y, cor) {
  const g = figma.createFrame();
  g.name = 'Ícone — ' + tipo;
  g.resize(18, 18);
  g.fills = [];
  g.clipsContent = false;
  parent.appendChild(g);
  g.x = x;
  g.y = y;

  if (tipo === 'cardapio') {
    rect(g, 1, 4, 16, 2, { fill: cor, raio: 1 });
    rect(g, 1, 9, 12, 2, { fill: cor, raio: 1 });
    rect(g, 1, 14, 8, 2, { fill: cor, raio: 1 });
  } else if (tipo === 'encomenda') {
    rect(g, 2, 5, 14, 12, { fill: cor, raio: 3 });
    rect(g, 6, 1, 6, 2, { fill: cor, raio: 1 });
  } else if (tipo === 'horario') {
    const c = figma.createEllipse();
    c.resize(16, 16);
    c.fills = [];
    c.strokes = solid(cor);
    c.strokeWeight = 1.8;
    g.appendChild(c);
    c.x = 1;
    c.y = 1;
    rect(g, 8, 5, 2, 5, { fill: cor, raio: 1 });
    rect(g, 8, 9, 5, 2, { fill: cor, raio: 1 });
  } else {
    const c = figma.createEllipse();
    c.resize(10, 10);
    c.fills = [];
    c.strokes = solid(cor);
    c.strokeWeight = 1.8;
    g.appendChild(c);
    c.x = 4;
    c.y = 2;
    rect(g, 8, 10, 2, 6, { fill: cor, raio: 1 });
  }
  return g;
}

function navInferior(tela) {
  rect(tela, 0, 766, 390, 78, { fill: COR.branco });
  rect(tela, 0, 766, 390, 1, { fill: COR.areia });
  const itens = [
    ['cardapio', 'Cardápio', 20],
    ['encomenda', 'Encomendar', 116],
    ['horario', 'Horário', 216],
    ['local', 'Onde fica', 310]
  ];
  itens.forEach((item) => {
    const tipo = item[0];
    const label = item[1];
    const x = item[2];
    const ativo = tipo === 'encomenda';
    icone(tela, tipo, x, 789, ativo ? COR.terracota : COR.cafeSuave);
    txt(tela, label, x - 12, 811, 70, {
      fonte: F.textoForte,
      tamanho: 8.5,
      cor: ativo ? COR.terracota : COR.cafeSuave,
      alinhamento: 'CENTER'
    });
  });
}

function telaBase(nome, x, y) {
  return frame(figma.currentPage, 'Tela — ' + nome, x, y, 390, 844, {
    fill: COR.creme,
    clip: true
  });
}

function criarHome(x, y) {
  const tela = telaBase('Home', x, y);
  cabecalho(tela);

  pilula(tela, 20, 96, 'Aberto de terça a domingo', '#EAF0E3', COR.olivaEscura);

  txt(tela, 'Bolo de vó, café coado e encomenda sem correria.', 20, 138, 350, {
    fonte: F.titulo,
    tamanho: 38,
    entrelinha: 40,
    espacamento: -2
  });
  txt(tela, 'O Café do Bairro é da Dona Marta. Bolo caseiro, café passado na hora e aquele atendimento de casa de vó — agora com encomenda organizada.', 20, 304, 330, {
    tamanho: 13,
    entrelinha: 20,
    cor: COR.cafeSuave
  });

  botao(tela, 20, 392, 350, 52, 'Quero encomendar', COR.terracota, '#FFF8F0');
  botao(tela, 20, 456, 350, 52, 'Ver cardápio', null, COR.cafe, COR.areia);
  txt(tela, 'Encomendas com 2 dias de antecedência', 20, 524, 300, {
    fonte: F.textoMedio,
    tamanho: 10.5,
    cor: COR.canela
  });

  const arte = frame(tela, 'Ilustração — bolo e café', 20, 560, 350, 180, {
    fill: COR.papel,
    raio: 20,
    clip: true
  });

  const prato = figma.createEllipse();
  prato.resize(220, 38);
  prato.fills = solid(COR.areiaForte);
  arte.appendChild(prato);
  prato.x = 65;
  prato.y = 120;

  rect(arte, 105, 70, 140, 70, { fill: COR.cafeLeite, raio: 12 });
  rect(arte, 98, 56, 154, 26, { fill: COR.terracota, raio: 12 });
  [110, 138, 166, 194, 222].forEach((dx) => {
    rect(arte, dx, 78, 10, 14, { fill: COR.terracota, raio: 5 });
  });

  rect(arte, 275, 105, 42, 34, { fill: COR.branco, raio: 6, borda: COR.cafe });
  const alca = figma.createEllipse();
  alca.resize(14, 18);
  alca.fills = [];
  alca.strokes = solid(COR.cafe);
  alca.strokeWeight = 2;
  arte.appendChild(alca);
  alca.x = 314;
  alca.y = 112;

  [0, 9, 18].forEach((dx, i) => {
    rect(arte, 286 + dx, 84 + (i === 1 ? -4 : 0), 2, 12, {
      fill: COR.areiaForte,
      raio: 1
    });
  });

  txt(arte, 'feito hoje, com carinho', 0, 150, 350, {
    fonte: F.manuscrito,
    tamanho: 20,
    cor: COR.canela,
    alinhamento: 'CENTER'
  });

  const selo = figma.createEllipse();
  selo.resize(84, 84);
  selo.fills = solid(COR.mel);
  tela.appendChild(selo);
  selo.x = 286;
  selo.y = 525;

  txt(tela, '5 bolos\npor dia', 286, 543, 84, {
    fonte: F.manuscrito,
    tamanho: 18,
    entrelinha: 18,
    cor: COR.cafe,
    alinhamento: 'CENTER'
  });

  navInferior(tela);
  return tela;
}

function criarCardapio(x, y) {
  const tela = telaBase('Cardápio', x, y);
  cabecalho(tela);

  txt(tela, 'cardápio', 20, 94, 200, {
    fonte: F.manuscrito,
    tamanho: 22,
    cor: COR.terracota
  });
  txt(tela, 'O que sai da cozinha da Dona Marta', 20, 120, 350, {
    fonte: F.titulo,
    tamanho: 28,
    entrelinha: 30,
    espacamento: -1.5
  });
  txt(tela, 'Tudo feito no dia, com receita de família. Bolos inteiros são por encomenda.', 20, 192, 330, {
    tamanho: 11,
    entrelinha: 16,
    cor: COR.cafeSuave
  });
  txt(tela, 'Bolos por encomenda', 20, 232, 250, {
    fonte: F.textoForte,
    tamanho: 11.5,
    cor: COR.cafe
  });

  cartaoProduto(tela, 20, 256, 167, 176, {
    nome: 'Bolo de cenoura',
    preco: '55',
    descricao: 'Massa fofinha com cobertura de chocolate meio amargo.',
    detalhe: 'inteiro · 12 fatias',
    selo: 'mais pedido'
  });
  cartaoProduto(tela, 203, 256, 167, 176, {
    nome: 'Bolo de chocolate',
    preco: '65',
    descricao: 'Recheio de brigadeiro caseiro e cobertura cremosa.',
    detalhe: 'inteiro · 12 fatias'
  });
  cartaoProduto(tela, 20, 444, 167, 176, {
    nome: 'Bolo de fubá',
    preco: '50',
    descricao: 'Cremoso, para comer quentinho com café coado.',
    detalhe: 'inteiro · 10 fatias'
  });
  cartaoProduto(tela, 203, 444, 167, 176, {
    nome: 'Panetone caseiro',
    preco: '45',
    descricao: 'Fruta cristalizada, muito recheio e cheirinho de Natal.',
    detalhe: '500 g · 5 dias',
    selo: 'dezembro',
    seloFundo: COR.mel,
    seloCor: COR.cafe
  });

  txt(tela, 'Para beliscar', 20, 640, 250, {
    fonte: F.textoForte,
    tamanho: 11.5
  });
  cartaoCompacto(tela, 20, 664, 167, 82, {
    nome: 'Café coado',
    preco: '6',
    detalhe: 'xícara · 200 ml'
  });
  cartaoCompacto(tela, 203, 664, 167, 82, {
    nome: 'Fatia de bolo',
    preco: '12',
    detalhe: 'do dia · escolha na hora'
  });

  navInferior(tela);
  return tela;
}

function criarEncomenda(x, y) {
  const tela = telaBase('Encomenda', x, y);
  cabecalho(tela);

  txt(tela, 'encomenda', 20, 94, 200, {
    fonte: F.manuscrito,
    tamanho: 22,
    cor: COR.terracota
  });
  txt(tela, 'Reserve seu bolo', 20, 120, 350, {
    fonte: F.titulo,
    tamanho: 30,
    entrelinha: 32,
    espacamento: -1.5
  });
  txt(tela, 'Preencha os dados e a Dona Marta confirma pelo WhatsApp.', 20, 164, 330, {
    tamanho: 11,
    entrelinha: 16,
    cor: COR.cafeSuave
  });

  const form = frame(tela, 'Formulário', 20, 206, 350, 514, {
    fill: COR.branco,
    raio: 24,
    borda: COR.areia,
    clip: true
  });

  campo(form, 'Seu nome', 'Como a Dona Marta te chama?', 20, 20, 310);
  campo(form, 'WhatsApp com DDD', '(83) 9 9999-9999', 20, 88, 310);
  campo(form, 'O que você quer encomendar?', 'Escolha no cardápio', 20, 156, 310);
  campo(form, 'Dia da retirada', 'dd/mm/aaaa', 20, 224, 310);

  txt(form, 'Alguma observação? (opcional)', 20, 292, 310, {
    fonte: F.textoForte,
    tamanho: 10.5
  });
  rect(form, 20, 312, 310, 64, {
    fill: COR.campo,
    borda: COR.areia,
    raio: 12
  });
  txt(form, 'Ex.: sem cobertura, retirar às 16h…', 32, 324, 286, {
    tamanho: 10.5,
    cor: COR.placeholder
  });

  botao(form, 20, 396, 310, 48, 'Enviar encomenda', COR.terracota, '#FFF8F0');
  txt(form, 'Você não paga nada aqui. A Dona Marta confirma pelo WhatsApp.', 20, 456, 310, {
    tamanho: 9,
    entrelinha: 13,
    cor: COR.cafeSuave,
    alinhamento: 'CENTER'
  });

  txt(tela, 'Só 5 encomendas por dia · 2 dias de antecedência', 20, 732, 350, {
    tamanho: 9,
    cor: COR.canela,
    alinhamento: 'CENTER'
  });

  navInferior(tela);
  return tela;
}

function criarCapa(x, y) {
  const capa = frame(figma.currentPage, 'Capa — Café do Bairro', x, y, 1200, 520, {
    fill: COR.cafe,
    clip: true
  });

  const c1 = figma.createEllipse();
  c1.resize(460, 460);
  c1.fills = solid(COR.mel, 0.14);
  capa.appendChild(c1);
  c1.x = 860;
  c1.y = -160;

  const c2 = figma.createEllipse();
  c2.resize(320, 320);
  c2.fills = solid(COR.terracota, 0.22);
  capa.appendChild(c2);
  c2.x = -120;
  c2.y = 300;

  txt(capa, 'TECNOJR · DIREÇÃO VISUAL · NOVEMBRO 2026', 48, 44, 700, {
    fonte: F.textoForte,
    tamanho: 10,
    cor: COR.mel,
    espacamento: 14,
    uppercase: true
  });
  txt(capa, 'Café do Bairro', 48, 84, 900, {
    fonte: F.titulo,
    tamanho: 76,
    entrelinha: 78,
    cor: COR.creme,
    espacamento: -3
  });
  txt(capa, 'O caderno de receitas da Dona Marta, aberto no balcão.', 48, 206, 820, {
    fonte: F.tituloRegular,
    tamanho: 26,
    entrelinha: 32,
    cor: COR.melSuave
  });
  txt(capa, 'Site mobile-first para vender bolo caseiro, panetone e café coado sem perder encomenda no WhatsApp.', 48, 306, 620, {
    tamanho: 14,
    entrelinha: 22,
    cor: '#D9CFC4'
  });

  txt(capa, 'MOBILE-FIRST', 48, 410, 200, {
    fonte: F.textoForte,
    tamanho: 9,
    cor: COR.mel,
    espacamento: 12,
    uppercase: true
  });
  txt(capa, '390 × 844', 48, 432, 200, {
    tamanho: 13,
    cor: COR.creme
  });
  txt(capa, '3 telas + tokens', 220, 432, 220, {
    tamanho: 13,
    cor: COR.creme
  });
  txt(capa, 'feito com carinho, como o bolo dela', 820, 430, 330, {
    fonte: F.manuscrito,
    tamanho: 26,
    cor: COR.melSuave,
    alinhamento: 'RIGHT'
  });
}

function criarPranchaTokens(x, y) {
  const p = frame(figma.currentPage, 'Prancha — Tokens', x, y, 1200, 900, {
    fill: COR.creme,
    clip: true
  });

  txt(p, 'direção visual', 40, 34, 400, {
    fonte: F.manuscrito,
    tamanho: 30,
    cor: COR.terracota
  });
  txt(p, 'Tokens do Café do Bairro', 40, 74, 800, {
    fonte: F.titulo,
    tamanho: 44,
    entrelinha: 48,
    espacamento: -2
  });
  txt(p, 'Cores quentes, tipografia com alma e componentes simples de tocar.', 40, 132, 700, {
    tamanho: 13,
    cor: COR.cafeSuave
  });

  const cores = [
    ['Creme', COR.creme],
    ['Papel', COR.papel],
    ['Areia', COR.areia],
    ['Café com leite', COR.cafeLeite],
    ['Terracota', COR.terracota],
    ['Canela', COR.canela],
    ['Café', COR.cafe],
    ['Café suave', COR.cafeSuave],
    ['Oliva escura', COR.olivaEscura],
    ['Mel', COR.mel],
    ['Terracota suave', COR.terracotaSuave],
    ['Erro', COR.erro]
  ];

  cores.forEach((cor, i) => {
    const coluna = i % 6;
    const linha = Math.floor(i / 6);
    const x0 = 40 + coluna * 188;
    const y0 = 190 + linha * 150;

    rect(p, x0, y0, 170, 76, {
      fill: cor[1],
      borda: COR.areia,
      raio: 12
    });
    txt(p, cor[0], x0, y0 + 84, 170, {
      fonte: F.textoForte,
      tamanho: 11
    });
    txt(p, cor[1], x0, y0 + 100, 170, {
      fonte: F.textoMedio,
      tamanho: 10,
      cor: COR.terracotaEscura
    });
  });

  const yt = 510;
  txt(p, 'Tipografia', 40, yt, 300, {
    fonte: F.textoForte,
    tamanho: 11,
    uppercase: true,
    espacamento: 8,
    cor: COR.canela
  });
  txt(p, 'Bolo de vó, café coado', 40, yt + 26, 600, {
    fonte: F.titulo,
    tamanho: 42,
    entrelinha: 46,
    espacamento: -2
  });
  txt(p, 'Fraunces · títulos', 40, yt + 84, 300, {
    tamanho: 10.5,
    cor: COR.cafeSuave
  });
  txt(p, 'Karla · texto e interface', 40, yt + 116, 500, {
    fonte: F.texto,
    tamanho: 17,
    entrelinha: 27,
    cor: COR.cafeSuave
  });
  txt(p, 'cardápio', 40, yt + 166, 300, {
    fonte: F.manuscrito,
    tamanho: 32,
    cor: COR.terracota
  });
  txt(p, 'Caveat · acentos', 40, yt + 208, 300, {
    tamanho: 10.5,
    cor: COR.cafeSuave
  });

  botao(p, 660, yt + 20, 220, 52, 'Quero encomendar', COR.terracota, '#FFF8F0');
  botao(p, 660, yt + 86, 220, 52, 'Ver cardápio', null, COR.cafe, COR.areia);
  botao(p, 660, yt + 152, 220, 52, 'Enviar pelo WhatsApp', COR.olivaEscura, '#FFF9EE');

  txt(p, 'Contraste AA · alvos de 52 px · foco visível de 3 px', 40, 850, 800, {
    tamanho: 10,
    cor: COR.cafeSuave
  });
}

function rotuloTela(x, y, numero, nome) {
  txt(figma.currentPage, numero, x, y, 40, {
    fonte: F.textoForte,
    tamanho: 10,
    cor: COR.terracota,
    espacamento: 8
  });
  txt(figma.currentPage, nome, x + 30, y - 4, 250, {
    fonte: F.titulo,
    tamanho: 20,
    entrelinha: 22
  });
}

(async () => {
  try {
    await carregarFontes();

    const page = figma.currentPage;
    page.name = 'Café do Bairro — Mobile';

    criarCapa(0, 0);
    rotuloTela(0, 586, '01', 'Home');
    rotuloTela(440, 586, '02', 'Cardápio');
    rotuloTela(880, 586, '03', 'Encomenda');

    const home = criarHome(0, 620);
    criarCardapio(440, 620);
    criarEncomenda(880, 620);
    criarPranchaTokens(0, 1520);

    figma.viewport.scrollAndZoomIntoView([home]);
    figma.closePlugin('Layout criado: capa, 3 telas e prancha de tokens.');
  } catch (erro) {
    console.error(erro);
    figma.closePlugin('Erro ao criar o layout: ' + (erro && erro.message ? erro.message : erro));
  }
})();
