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

## Infraestrutura e Deploy

### Repositório GitHub
- **URL:** https://github.com/InovController/automation-hub
- **Organização:** InovController (conta da Controller-RNC)
- **Visibilidade:** público
- **Branch principal:** `master`

### Autenticação GitHub
- Autenticado via **GitHub CLI (`gh`)** com a conta `InovController`
- Para verificar: `gh auth status`
- Para listar repos: `gh repo list`

### Git — situação importante
O repositório git local foi inicializado **dentro da pasta `automation-hub/`** (não na raiz do disco).
- Caminho correto do `.git`: `automation-hub/.git`
- Anteriormente havia um `.git` aninhado em `apps/api/` que foi removido
- O `.gitignore` exclui: `node_modules/`, `.env`, `dist/`, `apps/api/data/`, `.claude/`, `tmp/`, `logs/`

### Deploy — Oracle Cloud Free Tier (migração em andamento)

**Decisão (2026-06-26):** Migrar do Railway ($5/mês) para Oracle Cloud Free Tier (gratuito para sempre).

#### Por que Oracle Cloud e não outras alternativas
- **Render free:** dorme após 15min de inatividade — mata o queue runner de 3s
- **Fly.io free:** 256MB RAM — insuficiente para Chrome/Playwright
- **Oracle Cloud:** VM ARM com até 24GB RAM, sempre ligada, genuinamente gratuita para sempre
- O app precisa de servidor persistente (spawn de processos Python + Chrome)

#### Conta Oracle Cloud — configuração feita
- **Conta:** inovacao01@controller-rnc.com.br
- **Região home:** sa-saopaulo-1 (Brazil East — São Paulo)
- **VCN criada:** `automation-hub-vcn`
  - Public subnet: `public subnet-automation-hub-vcn`
  - Subnet OCID: `ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaaqp7jwln2pbnzqq2icesaaxsivhvtbmrlwhkcmejq74mbbbm325ga`
- **Tipo de autenticação:** IDCS federado — API key não funciona, usar sempre `oci session authenticate`
- **OCI CLI instalado em:** `C:\Users\davi.inov\AppData\Roaming\Python\Python313\Scripts\oci.exe`
- **Config OCI:** `C:\Users\davi.inov\.oci\config` (perfil: `automation-hub`, auth: security_token)
- **Chave SSH da VM:** `C:\Users\davi.inov\Downloads\ssh-key-2026-06-26.key` (privada) e `.key (1).pub` (pública)

#### Status atual (2026-06-29): aguardando capacidade ARM — possível mudança de plano
A VM ainda não foi criada — região São Paulo está sem slots disponíveis para `VM.Standard.A1.Flex`.
Script de retry em `infra/retry-create-instance.ps1` precisa ser rodado manualmente quando necessário (token expira em 1h).
**Alternativa sendo avaliada:** usar a VM Windows da própria empresa (ver seção abaixo).

**VM alvo:**
- Shape: `VM.Standard.A1.Flex` — 2 OCPUs, 12GB RAM
- Imagem: Ubuntu 22.04 ARM (`ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaemf52b7af7ncncxz6pdc6hrlkdmylvwejfzpwnpbuhlfxwhrno6a`)
- Availability Domain: `Dvuk:SA-SAOPAULO-1-AD-1`
- Tenancy/Compartment OCID: `ocid1.tenancy.oc1..aaaaaaaayxffp5rs7fca7efucwrxxf4hxtwmlzeqr26by42pmwwiitgp7qnq`

#### Scripts criados em `infra/`
| Arquivo | Descrição |
|---|---|
| `infra/setup.sh` | Roda 1x na VM após criação: instala Node.js, Python, PostgreSQL, Chromium, cria .env, builda o app, instala systemd service |
| `infra/deploy.sh` | Roda a cada deploy (GitHub Actions): pull, build, migrate, restart |
| `infra/automation-hub.service` | Serviço systemd que mantém o app rodando |
| `infra/sudoers-automation-hub` | Permite restart do serviço sem senha (necessário para deploy automático) |
| `infra/retry-create-instance.ps1` | Script PowerShell que fica tentando criar a VM até conseguir, com renovação automática de token e desligamento do PC ao terminar |
| `.github/workflows/deploy.yml` | GitHub Actions: deploy automático a cada push na master via SSH |

#### Como retomar quando a VM for criada
Quando o script conseguir criar a VM, ele:
1. Mostra um popup com o IP público
2. Salva o IP em `C:\Users\davi.inov\Desktop\oracle-vm-ip.txt`
3. Desliga o PC (pode cancelar com `shutdown /a`)

Com o IP em mãos, rodar o setup na VM:
```bash
ssh -i "Downloads\ssh-key-2026-06-26.key" ubuntu@SEU_IP
bash <(curl -s https://raw.githubusercontent.com/InovController/automation-hub/master/infra/setup.sh)
```

Depois configurar os 3 secrets no GitHub (Settings → Secrets → Actions):
- `SSH_HOST` → IP da VM
- `SSH_USER` → `ubuntu`
- `SSH_KEY` → conteúdo do arquivo `.key` (chave privada)

#### Como rodar o script de retry manualmente
Se o script tiver parado (PC reiniciou, etc.):
```powershell
# 1. Renovar token (abre browser)
oci session authenticate --region sa-saopaulo-1 --profile automation-hub

# 2. Rodar o script
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
& "C:\Users\davi.inov\Documents\automation-hub\infra\retry-create-instance.ps1"
```

#### Nota importante sobre autenticação Oracle
A conta usa **IDCS (Identity Cloud Service)** — autenticação por API key não funciona.
Sempre usar `--auth security_token --profile automation-hub` nos comandos OCI CLI.
O token dura 1h mas o script renova automaticamente a cada 50min via `oci session refresh`.

---

### Deploy — VM Windows da empresa (alternativa principal a partir de 2026-06-29)

**Contexto:** Oracle Cloud com capacidade indisponível + Railway custa $5/mês → avaliar uso da VM Windows interna da empresa.

**O que se sabe da VM:**
- Windows Server, acesso via Remote Desktop (RDP)
- RAM: 6.3GB total, 4.4GB em uso (~1.9GB livre) — pode ser limitado para Chrome/Playwright
- Já tem outros sites rodando (porta 80/443 ocupada por outro servidor web)
- Domínio disponível: provavelmente algo como `hub.controller-rnc.com.br`
- Gerenciada pelo próprio Davi (acesso total)

**Plano de deploy para Windows:**
- NestJS como serviço Windows via PM2
- PostgreSQL para Windows (ou usar instância já existente na VM)
- IIS ou Nginx como reverse proxy para o subdomínio → porta 3000
- Deploy via GitHub Actions + SSH/WinRM

**Status:** a ser configurado — clonar o repo na VM e abrir Claude Code lá para inspecionar o ambiente e configurar tudo.

---

### Deploy — Railway *(descartado)*
- Custo: $5/mês — substituído por alternativas gratuitas
- Arquivo de configuração legado: `railway.json` na raiz
- A `DATABASE_URL` muda entre dev e prod — nunca commitar o `.env` real
