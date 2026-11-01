# Direção visual — Café do Bairro

**Cliente:** Café do Bairro · Dona Marta
**Entrega:** TecnoJr · novembro/2026
**Escopo:** landing page mobile-first + formulário de encomenda + estados de confirmação

---

## 1. Frase-conceito

> **“O caderno de receitas da Dona Marta, aberto no balcão.”**

A página não é uma vitrine de confeitaria de shopping. É a cozinha dela: papel quente,
terracota de panela de barro, letra à mão na margem e um bolo que acabou de sair do forno.
O afeto vem da textura e da linguagem — não de ursinho, coração ou infantilização.

### Três pilares

1. **Afeto de casa de vó** — calor, imperfeição controlada, materiais naturais.
2. **Clareza de balcão** — preço, horário, endereço e “tem vaga?” respondidos sem esforço.
3. **Simplicidade radical** — parece fácil porque é fácil. Nada de jargão, nada de app.

### O que é / o que não é

| É | Não é |
| --- | --- |
| Papel, linho, madeira, café coado | Gradiente roxo, neon, glassmorphism |
| Terracota queimada e creme | Rosa bebê e dourado de luxo |
| Letra manuscrita em pequenas doses | Fonte cursiva em texto corrido ou formulário |
| Fotos reais com migalha e vapor | Banco de imagens com fundo branco infinito |
| Botão grande, uma ação por tela | Menu hambúrguer escondendo o essencial |

---

## 2. Personalidade e tom de voz

**Adjetivos:** acolhedora, direta, artesanal, confiável, discreta.

**Como escrever**

- Frases curtas. Uma ideia por linha.
- “A senhora” na conversa com a Marta; “você” na conversa com o cliente final.
- Nada de “plataforma”, “solução”, “experiência omnichannel”, “API”.
- Preço sempre visível; prazo sempre explícito.
- Chamada para ação no imperativo afetivo: “Quero encomendar”, “Ver cardápio”,
  “Enviar pelo WhatsApp”.
- Humor só se for gentil e curto: “Quando acaba, acabou.”

**Exemplo de tom**

> “Bolo de vó, café coado e encomenda sem correria.”
>
> “São só 5 encomendas por dia — porque bolo bom não tem pressa.”

---

## 3. Paleta

A paleta nasce de uma cozinha de bairro: creme do papel, terracota da panela, café do
coado, oliva do armário antigo e mel do panetone de dezembro.

### Tokens

| Token | Hex | Uso principal |
| --- | --- | --- |
| `--creme` | `#FBF6EE` | Fundo padrão da página. |
| `--papel` | `#F5EADA` | Seções alternadas (como funciona, Instagram). |
| `--papel-forte` | `#EFDFC8` | Blocos de apoio, hover de botão fantasma. |
| `--areia` | `#E6D3B8` | Bordas de cards, inputs e divisores. |
| `--areia-forte` | `#D8BE9C` | Bordas de ênfase e detalhes. |
| `--cafe-leite` | `#C9A57C` | Ilustrações, aspas, elementos decorativos. |
| `--canela` | `#8A5533` | Ícones, legendas, links secundários. |
| `--terracota` | `#B45434` | **Cor de ação:** botão principal, preço, foco. |
| `--terracota-escura` | `#974226` | Hover do botão principal; texto sobre creme. |
| `--terracota-suave` | `#F3DCCF` | Fundos de destaque suaves. |
| `--cafe` | `#3A2A20` | Texto principal. |
| `--cafe-suave` | `#6E5747` | Texto secundário, descrições. |
| `--oliva` | `#6F7A4E` | Pontos decorativos; **não usar em texto pequeno**. |
| `--oliva-escura` | `#4F5E38` | Sucesso, “disponível”, botão WhatsApp. |
| `--mel` | `#E2A94F` | Destaque de dezembro/panetone, selos. |
| `--mel-suave` | `#F7E3B8` | Seleção de texto, fundos quentes. |
| `--erro` | `#A03A2A` | Erros de formulário e dia lotado. |
| `--branco` | `#FFFCF7` | Superfície de cards e formulário. |

### Contrastes verificados (WCAG 2.1)

| Combinação | Razão | Resultado |
| --- | --- | --- |
| `--cafe` sobre `--creme` | **12,74:1** | AAA |
| `--cafe` sobre `--branco` | **13,39:1** | AAA |
| `--cafe` sobre `--papel` | **11,53:1** | AAA |
| `--cafe-suave` sobre `--creme` | **6,26:1** | AA |
| `--cafe-suave` sobre `--branco` | **6,58:1** | AA |
| `--terracota` sobre `--creme` | **4,58:1** | AA (texto normal) |
| `--branco` sobre `--terracota` | **4,82:1** | AA |
| `--canela` sobre `--creme` | **5,69:1** | AA |
| `--oliva-escura` sobre `--creme` | **6,53:1** | AA |
| `--branco` sobre `--oliva-escura` | **6,70:1** | AA |
| `--cafe` sobre `--mel` | **6,54:1** | AA |
| `--erro` sobre `--creme` | **6,23:1** | AA |

**Regras**

- Texto corrido nunca abaixo de 16 px.
- `--oliva` puro só em bolinha, borda ou ornamento. Para texto, `--oliva-escura`.
- `--terracota` em texto só a partir de 18 px ou em negrito; para corpo pequeno, prefira
  `--terracota-escura`.
- Nunca usar cor como único sinal de status: sempre acompanhar de palavra (“Disponível”,
  “Lotado”) ou ícone.
- Fundos claros com uma camada de calor (radial gradients suaves a 7–16% de opacidade),
  nunca blocos chapados de terracota em área grande.

---

## 4. Tipografia

### Famílias

| Papel | Fonte | Pesos | Por quê |
| --- | --- | --- | --- |
| Títulos | **Fraunces** (variable, opsz 9–144) | 400–700, usar 600 | Serifa com personalidade, parece impressa, mas é contemporânea. |
| Texto e interface | **Karla** | 400, 500, 600, 700 | Humanista, muito legível no celular, não parece “tech”. |
| Acento manuscrito | **Caveat** | 500, 600 | Letra de caderno de receita. Só em eyebrows e legendas curtas. |

**Fallbacks:** `Georgia, "Times New Roman", serif` · `"Segoe UI", system-ui, sans-serif` ·
`"Segoe Script", cursive`.

### Escala (mobile → desktop)

| Estilo | Tamanho | Linha | Peso | Uso |
| --- | --- | --- | --- | --- |
| Display / H1 | `clamp(2.1rem, 8.6vw, 4.15rem)` | 1,03 | 600 | Hero. |
| H2 | `clamp(1.75rem, 4.6vw, 2.7rem)` | 1,10 | 600 | Título de seção. |
| H3 | `1,3rem` | 1,25 | 600 | Título de card de informação. |
| H4 / item | `1,13rem` | 1,25 | 600 | Nome do produto. |
| Preço | `1,15rem` | 1,2 | 600 | Sempre em terracota. |
| Corpo | `1,0625rem` (17 px) | 1,65 | 400 | Texto padrão. |
| Apoio | `0,92rem` | 1,55 | 400 | Descrição de produto. |
| Micro | `0,78–0,82rem` | 1,5 | 500/600 | Notas, erros, legendas. |
| Rabisco | `1,62rem` | 1,1 | 500 | Eyebrow em Caveat, rotação −1,5°. |

**Detalhes**

- Títulos com `letter-spacing: -0.02em` a `-0.025em` e `text-wrap: balance`.
- Corpo com no máximo **62 caracteres** por linha (`62ch`).
- Manuscrito **nunca** em label de formulário, preço ou texto corrido.
- Não usar mais de três famílias na mesma tela (já são três no total).
- Números de preço sem centavos quando forem redondos: “R$ 55”, não “R$ 55,00”.

---

## 5. Grid, espaço e forma

### Layout

- **Mobile-first**, validado de 320 px a 1440 px.
- Container: largura máxima **1160 px**; padding lateral **20 px** (≥720 px: 32 px;
  ≥1080 px: 40 px).
- Grade mobile: 4 colunas, gutter 16 px, margem 20 px.
- Grade desktop: 12 colunas, gutter 24 px.
- Seções: padding vertical `clamp(56px, 8vw, 104px)`.
- Header fixo: 72–88 px; `scroll-padding-top: 88px` para âncoras não ficarem escondidas.
- Barra inferior mobile: 78 px + `env(safe-area-inset-bottom)`.

### Espaçamento

Base 4 px. Escala usada: **4, 8, 12, 16, 20, 24, 32, 42/44, 48, 56, 64, 104**.

- Entre label e input: 7 px.
- Entre campos do formulário: 16–20 px.
- Entre título e parágrafo: 12–14 px.
- Entre cards: 14–20 px.
- Entre blocos de uma seção: 28–52 px.

### Raios

| Token | Valor | Onde |
| --- | --- | --- |
| `--raio-p` | `12px` | Chips, avisos, itens pequenos. |
| Inputs | `14px` | Campos de formulário. |
| `--raio-m` | `20px` | Cards de cardápio. |
| `--raio-g` | `26px` | Formulário, cards de informação. |
| Pílula | `999px` | Botões, etiquetas, selos. |

### Sombras

```css
--sombra-card: 0 1px 0 rgba(58, 42, 32, .03),
               0 18px 38px -30px rgba(58, 42, 32, .55);
--sombra-alta: 0 2px 0 rgba(58, 42, 32, .03),
               0 28px 56px -34px rgba(58, 42, 32, .6);
```

Sombra é **contato**, não decoração: difusa, marrom, baixa opacidade. Nada de preto puro
com 40% de opacidade.

### Toque

- Alvo mínimo **52 px** de altura (acima dos 44 px recomendados).
- Botão principal ocupa a largura toda no mobile quando está dentro do formulário.
- Espaço entre alvos: no mínimo 8 px.
- Nada de hover como única affordance; estados de `:active` e foco são obrigatórios.

---

## 6. Componentes

### Botões

| Variante | Fundo | Texto | Borda | Quando |
| --- | --- | --- | --- | --- |
| Primário | `--terracota` | `#FFF8F0` | transparente | Ação principal: encomendar. |
| Fantasma | transparente | `--cafe` | `--areia` | Ação secundária: ver cardápio. |
| WhatsApp | `--oliva-escura` | `#FFF9EE` | transparente | Enviar resumo / fallback. |

- Altura 52 px; padding `13px 26px`; raio 999 px; peso 700.
- Ícone SVG 20 px, `gap` 8 px.
- Hover: escurece 1 tom e sobe 1 px.
- Foco: `outline: 3px solid var(--terracota); outline-offset: 3px`.
- Desabilitado: opacidade 0,55, cursor `not-allowed`, sem transformação.

### Campos

- Label acima, 0,9 rem, peso 700.
- Input com 52 px, raio 14 px, borda 1,5 px `--areia`, fundo `#FFFDF9`.
- Foco: borda terracota + anel `0 0 0 4px rgba(180,84,52,.14)`.
- Erro: borda `--erro`, anel `rgba(160,58,42,.1)`, mensagem de 0,82 rem em `--erro`,
  ligada por `aria-describedby` e `aria-live="polite"`.
- Placeholder `#A08B79` — nunca no lugar do label.
- `inputmode` correto: `tel` no telefone; date picker nativo no dia.

### Cards

- Cardápio: fundo `--branco`, borda `--areia`, raio 20 px, padding 20 px.
- Preço no topo direito, em terracota.
- Selo “mais pedido” em oliva escura; selo “dezembro” em mel.
- Card de informação: raio 26 px, padding 26 px.
- Destaque de dezembro: borda `--mel` e gradiente `#FFFBF2 → --branco`.

### Etiquetas e status

- Status da loja: pílula com bolinha; verde-oliva quando aberto, canela quando fechado.
- Vagas: “3 vagas neste dia” em oliva; “Dia completo” em erro; “Consultando…” em
  `--cafe-suave`.
- Sempre texto + cor; nunca só a bolinha.

### Assinaturas visuais

- **Rabisco** (Caveat, terracota, −1,5°) acima dos títulos.
- **Polaroid** com fita adesiva e legenda manuscrita no hero.
- **Selo circular** “5 bolos por dia” em mel.
- **Mapa desenhado** em CSS: ruas em areia, pino terracota.
- **Divisores** em areia com 55% de opacidade, nunca linhas pretas.

---

## 7. Direção de fotos

As ilustrações SVG são provisórias e funcionam sem internet. Quando a Marta liberar as
fotos do Instagram (ou autorizar uma sessão), substituir nesta ordem de prioridade.

### Briefing de captura

| # | Foto | Enquadramento | Uso |
| --- | --- | --- | --- |
| 1 | Bolo inteiro com uma fatia retirada | 4:5, 45°, bolo ocupando 70% | Hero / capa. |
| 2 | Mãos cortando a fatia | 1:1, close nas mãos e na faca | Seção “quem faz”. |
| 3 | Café sendo coado, vapor visível | 4:5, contraluz suave | Faixa de diferenciais. |
| 4 | Pão de queijo saindo do forno | 1:1, bandeja com metade comida | Galeria. |
| 5 | Retrato da Marta rindo, avental | 4:5, janela ao fundo | “Quem faz”. |
| 6 | Fachada / placa / balcão | 4:5, início da manhã | Endereço e Google Maps. |

### Regras

- **Luz natural** de janela, manhã (7h–10h). Sem flash direto.
- Balanço de branco quente, mas sem amarelar a comida.
- Paleta real: papel kraft, linho cru, madeira, louça branca com lasca, colher de pau.
- Composição com **imperfeição**: migalha na mesa, pano amassado, xícara fora do centro.
- Deixar **respiro** para texto no lado esquerdo do hero em desktop.
- Pessoas só com autorização escrita; evitar rosto de cliente.
- Não usar banco de imagens, filtro pesado, HDR, prato brilhante de estúdio.

### Especificação de arquivo

- Hero: 1600 × 2000 px (4:5), WebP qualidade 82, < 250 KB.
- Cards: 800 × 800 px (1:1), WebP, < 120 KB.
- Sempre exportar 1x e 2x; manter original em `assets/fotos/originais/` (fora do site).
- Nome: `bolo-cenoura-hero.webp`, `maos-cortando.webp`, `cafe-coado.webp`.
- `alt` descritivo e específico; foto decorativa com `alt=""`.

---

## 8. Movimento

- Duração 180–240 ms; `ease-out` para entrada, `ease-in` para saída.
- Revelação ao rolar: opacidade 0 → 1 e `translateY(12px)` → 0.
- Respeitar `prefers-reduced-motion`: desligar transformação e animação.
- Nada de parallax, carrossel automático, contador animado ou texto que digita.
- O movimento existe para orientar, não para entreter.

---

## 9. Acessibilidade

- Contraste mínimo AA em todo texto; AAA no corpo principal.
- Foco visível em todos os elementos interativos (3 px terracota, offset 3 px).
- Alvos de 52 px; barra inferior com `safe-area`.
- Formulário com label real, `aria-describedby`, `aria-invalid` e mensagens `aria-live`.
- Status da loja e vagas também em texto, não só cor.
- Skip link “Ir para o conteúdo” no topo.
- SVGs decorativos com `aria-hidden="true"` e `focusable="false"`.
- Ordem de tabulação natural; sem `tabindex` positivo.
- Testar em 200% de zoom e com fonte do sistema aumentada.
- Vídeos/áudio: não são necessários; se entrar, legenda e controle.

---

## 10. Montagem no Figma

O layout mobile foi montado pelo **plugin local de Figma** criado em
`figma-plugin/` (`manifest.json` + `code.js`). Ele gera automaticamente a capa,
as três telas (Home, Cardápio e Encomenda) e a prancha de tokens no Figma.

- **Capa** — nome do projeto, frase-conceito, versão, data.
- **Tokens** — cores, tipografia, grid, sombras.
- **Telas** — Home, Cardápio, Encomenda, com os textos e componentes definidos nos
  arquivos `frontend/` e nos tokens acima.

### Como rodar o plugin

1. Abra o **Figma Desktop** com o arquivo do projeto.
2. Menu **Plugins → Development → Import plugin from manifest…**.
3. Selecione `figma-plugin/manifest.json`.
4. Execute **Café do Bairro — Design**.

O plugin cria uma página nova chamada **“Café do Bairro — Mobile”** com a capa,
as telas em frames baseados em **390 × 844** e a prancha de tokens.

**Arquivo Figma final entregue:**  
[Café do Bairro — Design Mobile](https://www.figma.com/design/wwh9yCmSRvrumDjku9KyPp/Caf%C3%A9-do-Bairro---Design-Mobile?node-id=0-1&t=QR1sTnIkeueLE8M4-1)

> O mockup HTML (`design/mockup-mobile.html`) continua como **referência viva** da
> experiência mobile; o plugin é a **reconstrução para apresentação e handoff** no Figma.

### Frames

- Base: **390 × 844** (iPhone 14/15), com fallback **360 × 800** (Android).
- O mockup HTML usa viewport de **360 × 764** para caber em três colunas na apresentação;
  o plugin cria frames de **390 × 844** para as telas e **1200 × 520** para a capa.
- Conteúdo rolável: o plugin cria frame de 390 × 844 para cada tela pronta para scroll;
  a Home completa pode ser derivada depois com o frame longo.
- Grid: 4 colunas, margem 20, gutter 16; layout grid de 8 px.
- Safe areas: topo 47 px, base 34 px (indicativo; usar `env()` no código).

### Estilos

Nomear igual ao CSS para o handoff não perder informação:

```text
cor/creme            #FBF6EE
cor/papel            #F5EADA
cor/terracota        #B45434
cor/cafe             #3A2A20
texto/display        Fraunces 600 · 66/68 · -2,5%
texto/h2             Fraunces 600 · 43/47 · -2%
texto/corpo          Karla 400 · 17/28
texto/rabisco        Caveat 500 · 26/28 · -1,5°
sombra/card          0 18 38 -30 rgba(58,42,32,.55)
```

### Componentes e variantes

- **Botão:** `variante = primário | fantasma | whatsapp` × `estado = default | hover | foco |
  desabilitado` × `largura = auto | total`.
- **Campo:** `tipo = texto | telefone | select | data | textarea` × `estado = default |
  foco | erro | preenchido`.
- **Item de cardápio:** `destaque = não | dezembro` e `selo = nenhum | mais pedido`.
- **Etiqueta de status:** `estado = aberto | fechado`.
- **Vagas:** `estado = disponível | lotado | carregando | indefinido`.
- **Barra inferior:** 4 itens, item ativo e inativo.
- **Header:** padrão e compacto ao rolar.

Usar `Auto layout` em tudo, `Constraints` para o header e a barra, e `Component properties`
para texto. Não deixar texto “soltinho” fora de componente nas telas finais.

### Protótipo

- Fluxo principal: Home → Cardápio → Encomenda → Confirmação.
- Scroll vertical em cada frame; header e barra fixos.
- Botão “Encomendar” leva ao formulário; “Enviar” leva à confirmação.
- Criar um fluxo alternativo “Dia lotado” e outro “API offline”.
- Anotações de interação em roxo? Não — usar notas cinza fora do frame.

### Handoff

- Medidas em px iguais ao CSS; não usar escalas arbitrárias.
- Exportar ícones em SVG; fotos em WebP/JPEG 2x.
- Nomear layers em português, igual às classes: `hero`, `cardapio`, `formulario`.
- Entregar junto: `styles.css` (tokens reais) e este documento.

---

## 11. Do / Don't

| Faça | Evite |
| --- | --- |
| Uma ação principal por tela | Dois botões primários competindo |
| Preço e prazo visíveis | “Consulte valores” |
| Texto curto e concreto | Bloco de texto com jargão |
| Fotos com vapor, migalha e mão | Comida plastificada de banco de imagens |
| Terracota como acento | Terracota em blocos gigantes |
| Manuscrito em 1–2 pontos | Manuscrito em parágrafo |
| Sombra difusa marrom | Sombra preta dura |
| Estado de erro claro e educado | “Erro 422” na cara do cliente |
| WhatsApp como saída | Obrigar cadastro/login |

---

## 12. Checklist antes de mostrar à cliente

- [ ] Nenhum texto abaixo de 16 px no corpo.
- [ ] Contraste AA conferido nos textos e botões.
- [ ] Formulário testado no celular, com teclado aberto.
- [ ] Dia lotado, API offline e erro de campo têm tela/estado.
- [ ] Preços, horários, endereço e WhatsApp são os reais (ou estão marcados como exemplo).
- [ ] Fotos com autorização; ilustrações só como provisório.
- [ ] Botão de WhatsApp abre com mensagem preenchida.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] 200% de zoom sem quebra.
- [ ] Nenhuma promessa de “vender mais” no material.
