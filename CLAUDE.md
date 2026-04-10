# Automation Hub — Contexto do Projeto

## O que é este projeto

Hub de automação interno usado por gestores para monitorar funcionários executando robôs RPA. Permite visualizar execuções em tempo real, ver quem está rodando o quê, quanto tempo o robô economizou e gerar relatórios de ganho para a diretoria.

## Estrutura do monorepo

```
automation-hub/
├── apps/
│   ├── api/          # Backend NestJS (porta 3000)
│   ├── web/          # Frontend React + Vite (porta 5173 em dev)
│   └── worker/       # Worker service (não utilizado ativamente)
├── integrations/
│   └── bot-sintegra-ce/   # Exemplo de robô Python (Playwright + Behave)
└── examples/
    └── python/
        └── xlsx-log-test/ # Exemplo de robô Python simples
```

## Stack

### Backend (`apps/api`)
- **NestJS 11** com Express
- **PostgreSQL 15+** via **Prisma 7** (adapter pg)
- **TypeScript 5.7**, CommonJS
- Porta padrão: `3000`
- Serve o frontend React em produção (pasta `../web/dist`)
- Serve arquivos estáticos em `/storage/` (protegido por sessão)

### Frontend (`apps/web`)
- **React 19** + **Vite 8** + **TypeScript 5.9**
- **TailwindCSS 3** + **Radix UI** (Dialog, Slot)
- **React Router 7**, **Lucide React**
- Porta de dev: `5173` (proxy `/api` e `/storage` para porta 3000)
- **Build obrigatório** para refletir mudanças quando servido pelo backend:
  ```bash
  cd apps/web && npm run build
  ```

## Comandos principais

### API
```bash
cd apps/api
npm run start:dev   # desenvolvimento com watch
npm run build       # compilar
npm run start:prod  # produção (node dist/main)
```

### Web
```bash
cd apps/web
npm run dev         # servidor de desenvolvimento Vite
npm run build       # gerar dist/ para produção
```

## Variáveis de ambiente (`apps/api/.env`)

```
DATABASE_URL=postgresql://hub:hub123@localhost:5433/hub?schema=public
RUNNER_MAX_CONCURRENCY=2
RUNNER_MEMORY_THRESHOLD_PERCENT=90
ALLOWED_ORIGIN=http://localhost:5173
PORT=3000  # opcional
```

## Banco de dados

### Modelos principais

| Modelo | Descrição |
|---|---|
| `User` | Usuários com role e departamentos |
| `Session` | Sessões de 7 dias (token hasheado com SHA-256) |
| `Robot` | Definição dos robôs (schema, comando, departamentos permitidos) |
| `Execution` | Cada execução de um robô (status, progresso, logs, arquivos) |
| `ExecutionLog` | Logs em tempo real de cada execução |
| `ExecutionFile` | Arquivos de entrada/saída de cada execução |
| `ScheduledTask` | Agendamentos recorrentes (once/daily/weekly/monthly) |
| `RobotInputExample` | Arquivos de exemplo para download pelo usuário |

### Enums importantes

**UserRole:** `admin` | `manager` | `employee`

**Department:** `pessoal` | `fiscal` | `contabil` | `tecnologia` | `inovacao` | `legalizacao` | `certificacao` | `auditoria` | `rh`

**ExecutionStatus:** `queued` | `running` | `success` | `error` | `canceled`

**ScheduleFrequency:** `once` | `daily` | `weekly` | `monthly`

### Migrações
```bash
cd apps/api
npx prisma migrate dev    # criar migração em dev
npx prisma migrate deploy # aplicar em produção
npx prisma studio         # UI visual do banco
```

## Controle de acesso

| Role | O que vê/pode fazer |
|---|---|
| `admin` | Tudo — CRUD de robôs, todos os usuários, todas as execuções |
| `manager` | Execuções do próprio departamento, agendamentos do departamento |
| `employee` | Apenas as próprias execuções e agendamentos |

Robôs com `allowedDepartments` vazio são acessíveis por todos. Se preenchido, só usuários dos departamentos listados podem executar.

## Arquitetura do runner de execuções

O `ExecutionRunnerService` processa uma fila a cada 3 segundos:
1. Verifica slots disponíveis (`RUNNER_MAX_CONCURRENCY`)
2. Verifica memória do servidor (`RUNNER_MEMORY_THRESHOLD_PERCENT`)
3. Verifica `conflictKeys` — robôs com mesma chave não rodam em paralelo
4. Spawna o processo do robô com `shell: true`
5. Passa variáveis de ambiente ao processo filho:
   - `AUTOMATION_EXECUTION_ID`
   - `AUTOMATION_INPUT_DIR`
   - `AUTOMATION_OUTPUT_DIR`
   - `AUTOMATION_METADATA_DIR`
   - `AUTOMATION_PARAMETERS_FILE`
   - `AUTOMATION_CONTEXT_FILE`

### Protocolo de comunicação robô → hub (stdout)

| Prefixo | Exemplo | Efeito |
|---|---|---|
| `AH_PROGRESS\|N\|mensagem` | `AH_PROGRESS\|75\|Processando linhas` | Atualiza barra de progresso |
| `AH_LOG\|level\|mensagem` | `AH_LOG\|info\|Arquivo lido` | Grava log com nível |
| `AH_METRIC\|chave\|valor` | `AH_METRIC\|itens_processados\|42` | Registra métrica (usada para calcular tempo economizado) |

Qualquer linha que não case com os prefixos vira log automático.

## APIs principais

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

GET  /api/robots/hub          # visão geral do dashboard
GET  /api/robots
GET  /api/robots/:id
POST /api/robots              # admin only
DELETE /api/robots/:id        # admin only

GET  /api/executions
GET  /api/executions/:id
POST /api/executions          # multipart: parameters + arquivos
POST /api/executions/:id/cancel

GET  /api/scheduled-tasks
POST /api/scheduled-tasks
DELETE /api/scheduled-tasks/:id

GET  /api/users               # admin only
PATCH /api/users/:id          # admin only

GET  /api/reports/time-savings

GET  /storage/*               # arquivos estáticos (requer autenticação)
```

## Páginas do frontend

| Rota | Página | Acesso |
|---|---|---|
| `/` | Dashboard | Todos |
| `/robots` | Catálogo de robôs | Todos |
| `/robots/:id` | Detalhe + formulário de execução | Todos |
| `/executions/:id` | Monitoramento de execução | Todos |
| `/history` | Histórico de execuções | Todos |
| `/schedules` | Agendamentos | Todos |
| `/time-savings` | Relatório de tempo economizado | Todos |
| `/settings` | Gerenciar robôs e usuários | Admin only |

## Decisões de design relevantes

- **Token de sessão** nunca é armazenado em banco — apenas o SHA-256 hash
- **Senha** usa scrypt com salt aleatório e `timingSafeEqual` na comparação
- **Arquivos de output** em `/storage/` são protegidos por middleware de sessão (não são públicos)
- **CORS** restrito à origem configurada em `ALLOWED_ORIGIN`
- **Rate limiting** in-memory em `/auth/login` e `/auth/register`: 10 tentativas por IP por minuto
- **Logs** não são carregados na listagem de execuções — apenas no detalhe individual
- `terminateProcessTree` usa `taskkill` no Windows e `process.kill(-pid)` no Linux/Mac
- O frontend em produção é servido pelo próprio NestJS a partir de `apps/web/dist`

## Integração de novos robôs

Para adicionar um novo robô:
1. Criar o robô via `POST /api/robots` (admin) com `command` e `workingDirectory`
2. O script deve ler parâmetros de `AUTOMATION_PARAMETERS_FILE` (JSON)
3. Arquivos de entrada ficam em `AUTOMATION_INPUT_DIR/`
4. Arquivos de saída devem ser gravados em `AUTOMATION_OUTPUT_DIR/`
5. Usar os prefixos `AH_PROGRESS`, `AH_LOG`, `AH_METRIC` no stdout para comunicar progresso
6. Retornar exit code `0` para sucesso, qualquer outro para erro

Veja o exemplo em `integrations/bot-sintegra-ce/` para referência Python.
