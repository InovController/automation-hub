---
timestamp: 2026-07-01T17-18-27Z
slug: apps-web-src-pages-dashboard-page-tsx
---
Method: dual-agent (A: a9a5c7ffaf57a2903 · B: inline-bash-fallback — Assessment B sub-agent was interrupted; detector re-run in parent context with identical inputs)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Stats badges mostram estado, mas sem timestamp de atualização ou indicador live. Diferença entre "ocioso e saudável" e "quebrado e silencioso" é invisível. |
| 2 | Match System / Real World | 3 | Linguagem predominantemente natural. "Escopo" é jargão de dev. Datas em formato completo onde só hora seria suficiente. |
| 3 | User Control and Freedom | 2 | Busca global filtra execuções e robôs sem controle separado. Sem "limpar busca" na dashboard. |
| 4 | Consistency and Standards | 3 | Cards e badges internamente consistentes. Eyebrow label viola regra do DESIGN.md. Diacríticos ausentes inconsistentes com statusLabel(). `rounded-3xl` override inconsistente com `rounded-[22px]` do Card base. |
| 5 | Error Prevention | 1 | Busca única filtra silenciosamente três seções de conteúdo. Carmem pode esvaziar o painel inteiro sem perceber que foi a busca. |
| 6 | Recognition Rather Than Recall | 3 | Nomes e status visíveis. Único burden: lembrar o número da badge "2 em andamento" enquanto procura na tabela qual é qual. |
| 7 | Flexibility and Efficiency of Use | 1 | Zero keyboard shortcuts. Sem ação rápida (cancelar, re-executar) na tabela. Gestor não pode agir sem navegar a outra página. |
| 8 | Aesthetic and Minimalist Design | 3 | Página limpa, sem ruído visual. Violações: eyebrow + badge "Ambiente interno" + palavra colorida no título. |
| 9 | Error Recovery | 1 | Estado de erro não implementado. API falha → hub null → "Carregando painel..." indefinidamente. Sem retry, sem mensagem. |
| 10 | Help and Documentation | 2 | Micro-copy nas descrições de card ajuda. Sem tooltips, sem help contextual. "Ambiente interno" é decorativo, não informativo. |
| **Total** | | **21/40** | **Acceptable — melhorias significativas necessárias** |

## Anti-Patterns Verdict

**LLM assessment:** Mild — não é AI-slop óbvio. O sistema de cores de status é correto e deliberado. A estrutura de tabela + sidebar assimétrico é uma escolha sólida. As violações são sutis: o eyebrow "Painel" em `PageHeader` viola o DESIGN.md explicitamente; a palavra `<span className="text-sky-600">automacoes</span>` usa cor como decoração em vez de significado; o badge "Ambiente interno" é rótulo sem conteúdo.

**Deterministic scan:** CLI detector em `apps/web/src/pages/dashboard-page.tsx` → **0 findings**. CLI detector em `apps/web/src/components/` → **0 findings**. Scan ampliado em `apps/web/src/pages/` → **4 warnings** em outras páginas (auth, schedules, settings): `text-slate-950 on bg-sky-50` — contexto diferente do dashboard, mas problema sistêmico a resolver em `audit`.

O detector não capturou o eyebrow label nem o span colorido — estes são achados de revisão semântica, não de padrão textual. O LLM encontrou problemas que o detector perdeu; sem falsos positivos detectados.

## Overall Impression

A dashboard tem boa estrutura de informação (layout assimétrico correto, badge de status semântico, tabela de execuções no lugar certo) mas falha em sua missão central: um gestor não consegue saber em 5 segundos se há algo errado. O painel mostra dados, mas não prioriza. A maior oportunidade é transformar a visão de "resumo genérico" para "triagem de atenção" — tornar anomalias imediatamente visíveis e dar ação a partir dali.

## What's Working

**1. Layout assimétrico 3fr/1fr**
O split execuções/categorias dá à tabela de execuções a dominância correta. Proporções bem escolhidas, `items-start` evita esticamento artificial. Decisão composicional correta.

**2. Sistema de cores de status**
Emerald/amber/indigo/rose mapeados consistentemente para sucesso/erro/fila/cancelado na badge row E na tabela inline. Usuário aprende a linguagem uma vez e escaneia em velocidade. Serve diretamente o caso de uso de triagem visual da Carmem.

**3. Role-aware copy**
`CardDescription` alterna entre "suas últimas execuções" (employee) e "do seu escopo" (manager/admin). Intenção correta — mesmo que "escopo" seja jargão, o diferencial de perspectiva existe no lugar certo.

## Priority Issues

### [P0] Sem estado de erro — API falha → tela congelada em "Carregando"
**Arquivo:** `apps/web/src/pages/dashboard-page.tsx:17`
**Why it matters:** Quando `refreshHub()` lança erro, `hub` permanece null e a página trava em "Carregando painel..." sem mensagem, sem retry, sem timeout. Uma gestora que abre o hub antes de reunião com cliente vê tela em branco sem ter como agir.
**Fix:** Distinguir loading de error no contexto. Renderizar mensagem de erro em linguagem simples + botão de retry quando a chamada falhar. Skeleton de carregamento em vez de texto bare.
**Sugestão:** `/impeccable harden apps/web/src/pages/dashboard-page.tsx`

### [P1] Busca global filtra três seções silenciosamente sem feedback
**Arquivo:** `apps/web/src/pages/dashboard-page.tsx:19–53`
**Why it matters:** `search` de `hub-context` filtra `filteredRobots` (categorias + robôs prontos) E `recentExecutions` simultaneamente. Se Carmem digita "fiscal" para buscar um robô, a tabela de execuções esvazia. A mensagem "Nenhum resultado para a busca atual" aparece mas não explica o escopo nem a causa. Altíssima probabilidade de ser interpretado como erro do sistema.
**Fix:** Label visível acima da tabela quando busca está ativa ("Filtrando por: [termo] — limpar"). Ou separar escopo de busca de execuções e catálogo.
**Sugestão:** `/impeccable clarify apps/web/src/pages/dashboard-page.tsx`

### [P1] Linha de tabela tem hover mas só a primeira célula é clicável
**Arquivo:** `apps/web/src/pages/dashboard-page.tsx:123–153`
**Why it matters:** `TableRow` recebe `hover:bg-slate-50` (visual de linha clicável), mas o `<Link>` que navega para a execução está apenas dentro de `<TableCell>` na primeira coluna. Células de status, solicitante e data não navegam. Falsa affordance — especialmente em toque.
**Fix:** Mover o `<Link>` para envolver o `<TableRow>` (via `asChild` ou equivalente), ou usar `onClick={() => navigate(\`/executions/${execution.id}\`)}` no `<TableRow>` com `cursor-pointer`, ou remover o `hover` do row e deixar apenas o link explícito na primeira célula.
**Sugestão:** `/impeccable polish apps/web/src/pages/dashboard-page.tsx`

### [P2] Eyebrow label "Painel" viola DESIGN.md e não agrega informação
**Arquivo:** `apps/web/src/components/page-header.tsx:20`, usado em `dashboard-page.tsx:62`
**Why it matters:** DESIGN.md bane explicitamente eyebrow labels fora do sidebar. A palavra "Painel" não acrescenta nada que URL, nav ativa e título não já comunicam. Aumenta distância visual entre cabeçalho e conteúdo operacional. Padrão se repete em todas as páginas com `PageHeader`.
**Fix:** Remover prop `eyebrow` no dashboard. Avaliar se `PageHeader` deve suportar eyebrow dado o design system — ou pelo menos torná-lo opcional e não passar para nenhuma página.
**Sugestão:** `/impeccable clarify apps/web/src/components/page-header.tsx`

### [P2] Seção "Automações prontas" é catálogo de descoberta em painel de monitoramento
**Arquivo:** `apps/web/src/pages/dashboard-page.tsx:187–214`
**Why it matters:** Carmem já conhece seus robôs. A seção de robôs disponíveis serve usuário novo, não gestor repetido. Ocupa espaço abaixo do fold em página operacional, adiciona ruído cognitivo e dilui o sinal de monitoramento.
**Fix:** Remover da dashboard. Substituir por widget operacional: "Próximas execuções agendadas" ou "Robôs com erro recente". Alternativa: mover para tab/accordion separado com label clara.
**Sugestão:** `/impeccable distill apps/web/src/pages/dashboard-page.tsx`

## Persona Red Flags

**Alex (Power User):**
Sem keyboard shortcuts. Sem ação direta na tabela (cancelar, re-executar). Sem bulk action. O painel é read-only para Alex — toda ação exige navegação para outra página. Para um power user que monitora múltiplas execuções por dia, a dashboard é preview desnecessário de `/history`. Abandonment: Alex vai ao `/history` diretamente e ignora o dashboard.

**Jordan (First-Timer):**
As 4 badges de status (`X prontos`, `Y em andamento`, `Z concluídas`) parecem clicáveis — mesmo shape de chips interativos, mesma border, mesmo padding. Jordan vai clicar esperando filtrar os robôs e nada vai acontecer. Empty state quando busca está ativa diz "Nenhum resultado para a busca atual" mesmo sem Jordan ter digitado nada (estado inicial com zero execuções). "Abrir catálogo" como CTA primário é correto para Jordan — posição e hierarquia adequadas.

**Carmem (Gestora de Departamento — persona do projeto):**
Abre o hub às 8h para confirmar se o robô fiscal noturno rodou. Suas red flags:
1. Tabela mostra no máximo 6 execuções ordenadas por recência. Se a execução noturna foi a 7ª ou mais antiga, não está visível. Precisa ir para `/history` sem saber o porquê.
2. Badge "em andamento" (indigo) tem o mesmo peso visual que "concluídas" (emerald). Se um robô travou e está rodando desde ontem, Carmem não tem sinal de anomalia — só a badge de contagem no mesmo nível de importância.
3. Data/hora em formato completo (`01/07/2026, 07:45:32`) torna a coluna larga. Para execuções de hoje, apenas "07:45" seria suficiente e mais escaneável.
4. Badge "Ambiente interno" na header não diz nada para Carmem e consome atenção.

## Minor Observations

- `rounded-3xl` (24px) overrida em todos os cards do dashboard via `className="rounded-3xl"`, mas `Card` base usa `rounded-[22px]`. Inconsistência menor mas indica token não respeitado.
- `backdrop-blur` em `card.tsx` é dead code sobre fundo sólido branco — não causa problema mas confunde ao debugar.
- Diacríticos ausentes ("Operacao", "automacoes", "Execucoes") inconsistentes com `statusLabel()` que retorna "Concluído" corretamente. Problema sistêmico de copy.
- Detector encontrou `text-slate-950 on bg-sky-50` em 4 outras páginas (auth, schedules, settings x2) — problema sistêmico, não do dashboard, mas que merece `/impeccable audit apps/web/src/pages`.
- Tabela com `min-w-[720px]` cria scroll horizontal em viewports menores, mas sem indicador visual de overflow (sem fade, sem scrollbar hint).

## Questions to Consider

**1. A dashboard é de monitoramento ou de diretório?**
Atualmente faz três coisas: mostra stats, lista execuções recentes, e apresenta catálogo de robôs. Isso é um diretório com preview. Uma dashboard de monitoramento real para Carmem responderia: "O que precisa de atenção agora?" — uma visão de status centrada em anomalias, não em recência. O que seria diferente se o critério de ordenação fosse urgência em vez de data?

**2. O que acontece quando RUNNER_MAX_CONCURRENCY=1 e a fila tem 5 itens?**
"1 em andamento" e "4 na fila" aparecem com badges iguais no mesmo row, e nas mesmas linhas de tabela sem diferenciação visual de posição na fila. Carmem sabe quanto vai esperar? Posição de fila ou tempo estimado teria alto valor operacional aqui.

**3. Por que a dashboard existe como rota separada se renderiza preview de `/history` + preview de `/robots`?**
O que existe exclusivamente nesta página que não pode ser encontrado nas outras? Se a resposta é "nada", a dashboard precisa de uma razão genuína de existir — real-time status, visão de agendamentos próximos, ou detecção de anomalia. Sem isso é navegação extra sem valor único.
