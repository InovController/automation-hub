---
name: Automation HUB
description: Hub interno de monitoramento de robôs RPA para gestores e funcionários da Controller-RNC.
colors:
  accent: "#0ea5e9"
  accent-hover: "#0284c7"
  accent-light: "#e0f2fe"
  accent-text: "#0369a1"
  ink: "#0f172a"
  ink-muted: "#64748b"
  ink-faint: "#94a3b8"
  surface: "#ffffff"
  surface-subtle: "#f8fafc"
  surface-hover: "#f1f5f9"
  border: "#cbd5e1"
  border-subtle: "#e2e8f0"
  bg: "#f8fafc"
  bg-deep: "#09090b"
  surface-deep: "#111113"
  border-deep: "#27272a"
  border-deep-soft: "#2b2b31"
  surface-deep-hover: "#18181b"
  status-success: "#10b981"
  status-success-bg: "#d1fae5"
  status-success-text: "#065f46"
  status-error: "#f59e0b"
  status-error-bg: "#fef3c7"
  status-error-text: "#92400e"
  status-queued: "#6366f1"
  status-queued-bg: "#e0e7ff"
  status-queued-text: "#4338ca"
  status-canceled: "#f43f5e"
  status-canceled-bg: "#ffe4e6"
  status-canceled-text: "#be123c"
  status-danger: "#f43f5e"
typography:
  display:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#1e293b"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface-hover}"
    textColor: "#1e293b"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "#334155"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-danger:
    backgroundColor: "{colors.status-danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "8px 16px"
---

# Design System: Automation HUB

## 1. Overview

**Creative North Star: "A Sala de Operações"**

O Automation HUB é o centro de controle de uma operação real. Gestores abrem o painel durante o expediente, em salas com luz de escritório, procurando respostas rápidas: o que está rodando, quem solicitou, deu certo? O design serve essa pergunta. Cada tela tem uma resposta principal — tudo que não ajuda a respondê-la é ruído e deve ser removido.

O sistema é neutro por padrão. Fundo off-white, texto quase-preto, superfícies brancas, bordas discretas para separar sem gritar. A cor entra apenas quando tem significado: azul operacional para ações e status ativos, verde para sucesso, âmbar para falha, índigo para fila, rosa para cancelado. Uma tela colorida é uma tela com problemas — o estado calmo do sistema é cinza.

O vocabulário visual é familiar deliberadamente. Tabelas, cards, formulários, sidebar — padrões que qualquer funcionário de escritório reconhece sem treinamento. Familiaridade é respeito pelo tempo do usuário. Componentes não têm opinião visual própria: hierarquia clara, espaçamento generoso, fácil de escanear para o leitor que está com pressa.

Este sistema rejeita explicitamente: visual de marketing SaaS (gradientes, glows, animações decorativas); a pesadez cinza de ERPs antiquados; exuberância de consumer apps (excesso de cor, bubble UI); e a complexidade de dashboards que impressionam mas não informam.

**Key Characteristics:**
- Neutro por padrão — cor carrega significado, nunca decoração
- Uma pergunta por tela — hierarquia de conteúdo, não de decoração
- Familiaridade primeiro — padrões que o não-técnico reconhece
- Densidade sem ruído — informação compacta, não espaço vazio nem sobrecarga
- Flat por eleição — bordas fazem o trabalho de separação, sombras são exceção

## 2. Colors: A Paleta Operacional

Paleta restrita: um acento operacional, uma família neutra de slate para tudo mais, e um conjunto semântico de status. A riqueza está na precisão, não na variedade.

### Primary

- **Azul Operacional** (#0ea5e9 / sky-500): Cor de ação e de vida. Usado no botão primário em dark mode, badges de status "rodando", barra de progresso, foco de input, notificações. Sinaliza "isso está acontecendo ou pode acontecer." Limitado a ≤15% de qualquer tela.
- **Azul Operacional Fundo** (#e0f2fe / sky-100): Fundo de badges sky e avatar em light mode. Nunca como fundo de superfície completa.
- **Azul Operacional Texto** (#0369a1 / sky-700): Texto dentro de badges sky em light mode. Garante contraste sobre sky-100.

### Neutral

- **Tinta** (#0f172a / slate-950): Cor do texto principal em light mode, botão primário light. O mais escuro da família — reservado para headings e rótulos críticos.
- **Tinta Suave** (#64748b / slate-500): Texto secundário, descrições, datas, solicitantes. Não usar para texto importante — pode falhar em contextos de baixa luminosidade.
- **Tinta Fantasma** (#94a3b8 / slate-400): Texto de placeholder, ícones em repouso. Apenas para elementos decorativos ou placeholders — nunca para conteúdo real.
- **Superfície** (#ffffff): Cards, sidebar, inputs, dropdowns. Fundo de toda superfície elevada em light mode.
- **Fundo** (#f8fafc / slate-50): Page background. Off-white puro — cria contraste mínimo com as superfícies brancas dos cards.
- **Hover** (#f1f5f9 / slate-100): Fundo de hover em linhas de tabela, botões ghost, nav items. Feedback visual discreto.
- **Borda** (#cbd5e1 / slate-300): Borda principal dos cards. Visível sem chamar atenção.
- **Borda Sutil** (#e2e8f0 / slate-200): Inputs, separadores internos, elementos de menor hierarquia.

**Dark mode — família zinc/quase-black:**
- **Fundo Profundo** (#09090b): Page background em dark.
- **Superfície Profunda** (#111113): Cards, sidebar, inputs em dark.
- **Borda Profunda** (#27272a): Borda principal em dark.
- **Borda Profunda Suave** (#2b2b31): Inputs e elementos internos em dark.
- **Hover Profundo** (#18181b): Hover de linhas e nav items em dark.

### Tertiary — Status Semânticos

Cada status tem trio próprio (texto / fundo / borda). Nunca misturar trios:

- **Sucesso** — texto #065f46 · fundo #d1fae5 · borda #6ee7b7 (emerald)
- **Erro** — texto #92400e · fundo #fef3c7 · borda #fcd34d (amber — atenção, não pânico)
- **Fila** — texto #4338ca · fundo #e0e7ff · borda #a5b4fc (indigo)
- **Cancelado** — texto #be123c · fundo #ffe4e6 · borda #fda4af (rose)
- **Perigo** (#f43f5e): Botão de ação destrutiva. Exclusivo para "cancelar execução" e equivalentes.

### Named Rules

**The Signal Rule.** Cor carrega significado operacional. Uma tela com muito azul ou verde não é uma tela bem projetada — é uma tela cheia de eventos inesperados. O estado calmo do sistema é cinza.

**The Status Trio Rule.** Cada status usa seu trio completo (texto / fundo / borda). Nunca use o texto de sucesso no fundo de erro. Os trios são autocontidos.

## 3. Typography

**Fonte principal:** DM Sans (fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)

**Caráter:** Família humanista única em múltiplos pesos. Não há segundo tipo — a hierarquia é feita por peso, tamanho e cor, não por confronto tipográfico. DM Sans é legível em densidades altas, carrega seriedade sem rigidez, e funciona igualmente bem em tabelas, formulários e números de KPI.

### Hierarchy

- **Display** (semibold 600, 2.1rem, lh 1.1, tracking -0.02em): Números de KPI nas StatCards. Único uso de display type — aparece apenas em valores numéricos que resumem o estado do sistema. Máximo 2-3 por tela.
- **Title** (semibold 600, 1.125rem/18px, lh 1.3, tracking -0.01em): Títulos de cards e seções. Separa blocos de conteúdo sem precisar de espaço excessivo.
- **Body** (regular 400, 0.875rem/14px, lh 1.5): Conteúdo principal — células de tabela, descrições, formulários. Texto de trabalho. Comprimento máximo de linha: 70ch.
- **Label** (medium 500, 0.75rem/12px, tracking 0.02em): Cabeçalhos de tabela, rótulos de campo, badges, metadados. Distingue-se de body por peso e tamanho, não por maiúsculas excessivas.
- **Badge** (medium 500, 11px, tracking 0.02em): Exclusivo para componentes Badge de status. O menor texto do sistema — nunca abaixo de 11px.

### Named Rules

**The Weight Rule.** A hierarquia é estabelecida por peso (400/500/600) e tamanho, nesta ordem. Não adicionar novo peso ou família para criar contraste — se a hierarquia não funciona com DM Sans em 400/500/600, o problema é de layout, não de tipografia.

**The Legibility Rule.** Nenhum texto de conteúdo real usa tinta-fantasma (#94a3b8) como cor. Tinta-suave (#64748b) é o limite inferior para texto secundário em light mode — qualquer coisa mais clara viola contraste mínimo de 4.5:1 contra o fundo #f8fafc.

## 4. Elevation

Este é um sistema flat por eleição, não por omissão. Superfícies são separadas por bordas, não por sombras. A escolha é deliberada: sombras criam hierarquia percebida (este elemento está "acima" de outro), o que em um tool de monitoramento significa ruído — o gestor lê profundidade como importância, e nenhuma superfície do sistema tem mais importância que outra.

Cards usam `shadow-none` com borda sutil (slate-300 light / #27272a dark). Sidebar usa borda direita. Inputs usam borda + ring de foco. Nenhum card tem sombra em repouso.

**A única exceção:** overlays flutuantes (dropdown de perfil, futuros modais/dialogs) usam `shadow-xl` para comunicar que estão fora do flow normal. Sombra como sinal de camada, não como decoração.

### Named Rules

**The Border Rule.** Separação entre superfícies é feita por bordas. Sombra é reservada para elementos que literalmente estão em cima de outros (overlays, popovers). Se você sente vontade de adicionar `box-shadow` a um card, o problema é provavelmente falta de borda, espaçamento errado, ou cores de fundo próximas demais.

## 5. Components

### Buttons

Hierarquia de 5 variantes, sempre `rounded-xl` (12px). Transição de cor apenas, sem transform nem shadow em hover. Focus ring: `ring-4 ring-sky-500/15`.

- **Primário** (bg tinta #0f172a · texto branco · hover #1e293b): Ação principal da tela. Máximo 1 por viewport. Em dark, se inverte: bg branco · texto dark.
- **Secundário** (bg slate-100 · texto slate-800 · hover slate-200): Ação complementar. Pode aparecer múltiplas vezes.
- **Outline** (borda slate-200 · texto slate-700 · hover bg slate-100): Ação terciária. Comum em "Ver histórico", "Cancelar", "Baixar".
- **Ghost** (sem bg · texto slate-600 · hover bg slate-100): Ação discreta — ícones de toggle (tema, sidebar, menu). Só ícone ou texto muito curto.
- **Danger** (bg rose-500 · texto branco · hover rose-400): Ações destrutivas exclusivamente. Nunca usar para ações não-destrutivas mesmo que urgentes.

### Cards / Containers

Componente mais usado. Hierarquia de três camadas de radius:

- **Card padrão**: `rounded-[22px]` (22px) — todos os cards de conteúdo principal.
- **Linha de categoria / robot**: `rounded-2xl` (16px) — elementos clicáveis dentro de cards.
- **Badge / chip**: `rounded-lg` (8px) — menor granularidade.

Cards usam `border border-slate-300 bg-white shadow-none` (light) / `border-[#27272a] bg-[#111113]` (dark). Padding interno: `p-6` (24px). Header e content são componentes separados — CardHeader com `p-6 pb-0`, CardContent com `p-6`.

**Nota:** Linhas interativas dentro de cards (categorias, robots prontos) têm `hover:bg-slate-50` (light) / `hover:bg-[#18181b]` (dark) sem borda adicional — usam a borda do card pai para separação do fundo da página.

### Inputs / Fields

- **Base**: `h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm`
- **Focus**: `focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15` — o Azul Operacional aparece aqui como sinal de "campo ativo"
- **Dark**: `border-[#2b2b31] bg-[#0f0f10] text-zinc-100 placeholder:text-zinc-500`
- Sem estados de erro definidos em CSS ainda — oportunidade para `harden`.

### Badges (Status)

Sistema de 7 variantes para comunicar estado de execução. Tamanho `text-[11px]` com `tracking-[0.02em]`, `rounded-lg` (8px), `px-2.5 py-1`. Cada variante é um trio fechado:

| Variante | Fundo (light) | Texto (light) | Borda (light) |
|---|---|---|---|
| `default` / `running` | sky-100 | sky-700 | sky-200 |
| `success` | emerald-100 | emerald-700 | emerald-200 |
| `queued` | indigo-100 | indigo-700 | indigo-200 |
| `error` | amber-100 | amber-700 | amber-200 |
| `canceled` | rose-100 | rose-700 | rose-200 |
| `muted` | slate-100 | slate-700 | slate-200 |

**Nota de nomenclatura:** `error` usa âmbar, não vermelho — é falha técnica, não perigo. `canceled` usa rose — cancelamento ativo. `danger` (botão) usa rose-500 — destruição irreversível.

### Progress

Barra de progresso com fundo `bg-slate-100 dark:bg-[#10192a]`, preenchimento com gradiente `from-sky-500 to-cyan-400`. `h-4 rounded-full`. O gradiente é a única exceção à proibição de gradientes — aqui é funcional (indica direção de progresso) e confinado a um componente específico.

### Navigation (Sidebar)

Sidebar colapsável com dois estados: expandido (272px) e colapsado (88px). Transição `duration-200` na largura.

- **Logo/ícone**: `h-11 w-11 rounded-2xl bg-slate-950` (light) — âncora de identidade visual da Controller.
- **Nav items**: `rounded-xl px-3 py-2.5 text-sm font-medium` — active: `bg-slate-100 text-slate-950`; hover: `hover:bg-slate-100`; rest: `text-slate-600`.
- **Eyebrow de grupo** (único uso legítimo): `text-xs uppercase tracking-[0.18em] text-slate-400` — aparece apenas nos dois grupos do sidebar ("Geral" e "Administração"), não em páginas.
- **Profile button**: `rounded-2xl` com Avatar `h-11 w-11 rounded-2xl bg-sky-100 text-sky-700`.

### Avatar

`h-11 w-11 rounded-2xl border bg-sky-100 text-sky-700` (light) / `bg-sky-500/20 text-white` (dark). Iniciais geradas automaticamente. O único lugar onde o Azul Operacional aparece como fundo de superfície — contexto pessoal/identidade, não status.

## 6. Do's and Don'ts

### Do:

- **Do** reservar cor para significado: Azul Operacional para ações e status "rodando", trios semânticos para cada ExecutionStatus. Uma tela com paleta em repouso é uma tela sem problemas.
- **Do** usar bordas para separação de superfícies — `border-slate-300` (light) / `border-[#27272a]` (dark). Cards sem sombra, com borda.
- **Do** manter `rounded-[22px]` (22px) em cards de conteúdo principal e `rounded-xl` (12px) em botões e inputs. A diferença de radius cria hierarquia visual sem tipografia adicional.
- **Do** usar tabelas para listagens de mais de 3-4 itens. São o componente de informação densa mais legível que existe. Evitar substitutos de card-grid quando uma tabela serve.
- **Do** aplicar `text-wrap: balance` em títulos de cards e headings de página para linhas equilibradas.
- **Do** garantir que texto em `text-slate-500` (#64748b) seja sempre secundário — rótulos, datas, emails — nunca o dado principal que o usuário precisa ler primeiro.

### Don't:

- **Don't** usar gradientes decorativos, glows, ou `background-clip: text`. O único gradiente aceito é o da barra de progresso (`from-sky-500 to-cyan-400`), que é funcional e confinado. Qualquer outro gradiente é SaaS excessivo e proibido.
- **Don't** criar card-grids com ícone + título + texto idênticos repetidos. Use tabelas ou listas com hierarquia clara — não o padrão de "identical card grids" do template SaaS.
- **Don't** usar `border-left` ou `border-right` maior que 1px como acento colorido em cards ou alertas. Reescrever com fundo tintado, borda completa, ou ícone leading.
- **Don't** adicionar sombra a cards em repouso. `shadow-none` é a intenção, não um esquecimento. Sombra entra apenas em overlays flutuantes (popover, modal).
- **Don't** usar o Azul Operacional como fundo de superfície ampla ou como cor decorativa. Ele é reservado para ações, foco, e status de execução ativa.
- **Don't** criar efeitos glassmorphism (blur + transparência em cards, sidebars). O sistema é opaco e sólido por escolha.
- **Don't** reproduzir a estética ERP antiquada: avoid cinzas sem saturação, botões sem border-radius, fontes system-default sem cuidado, espaçamento mínimo.
- **Don't** criar dashboards de KPI com múltiplas métricas, gráficos, e números por toda parte. StatCards são usadas para 3-4 métricas máximo e apenas onde o número resumo tem valor real para o gestor.
- **Don't** usar eyebrow labels (`text-xs uppercase tracking-wide`) fora do sidebar. Aquele padrão aparece exatamente uma vez no sistema — nos grupos de navegação. Em qualquer outra tela, é AI grammar.
