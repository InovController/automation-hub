# Integração externa — SSO (entrar direto a partir do hub)

Este documento é para times donos de um site/sistema já cadastrado na aba **Sites** do Automation HUB, que querem que o usuário, ao clicar em **"Abrir"** no hub, **já entre logado** no sistema de destino — sem digitar login e senha de novo.

O hub não guarda nem repassa senha nenhuma. O que ele faz é: gerar um **token de uso único, válido por 30 segundos**, que o site de destino troca por `{ nome, email, login do Athenas }` do usuário que clicou. A partir desses dados, o site de destino cria a própria sessão local.

---

## Passo 1 — Habilitar no cadastro do site

No hub, em **Configurações → Sites**, edite (ou crie) o site e ative a opção **"SSO habilitado"**.

Isso muda o comportamento do botão "Abrir" daquele site no catálogo: em vez de um link direto para `site.url`, o hub passa a gerar um token e montar uma URL especial (ver Passo 2).

O campo **URL** do cadastro do site é a base usada para montar essa URL — não existe um campo separado de "URL de SSO".

---

## Passo 2 — O fluxo completo

```
1. Usuário clica em "Abrir" no hub
2. Hub (frontend) chama GET /api/auth/sso, autenticado com a sessão do usuário
3. Hub recebe um token de 30s e abre uma nova aba:
     {site.url}/hub-sso/?token=<token>&hub=<origem do hub>
4. O SEU sistema precisa implementar essa rota "/hub-sso/"
5. Do lado do servidor, o seu sistema chama:
     GET {hub}/api/auth/sso-verify?token=<token>
6. O hub responde com { athenasLogin, name, email } (uma única vez — o token já
   é invalidado nesse instante) ou 401 se o token for inválido/expirado
7. O seu sistema cria a própria sessão local para esse usuário e redireciona
   para dentro da aplicação
```

O parâmetro `hub` na URL do passo 3 é a origem do hub (ex.: `http://10.100.1.18:3000`) — use-o para montar a chamada do passo 5, em vez de fixar a URL do hub no seu código, já que ele pode variar entre ambientes.

---

## Contrato dos endpoints

### 1. Gerar o token (chamado pelo hub, não pelo seu sistema)

```
GET /api/auth/sso
Authorization: Bearer <sessão do usuário no hub>
```

Resposta:

```json
{ "token": "9f3a...64 caracteres hex..." }
```

Isso é interno ao hub — o seu sistema nunca chama essa rota, só recebe o token pronto via query string na URL de redirecionamento.

### 2. Trocar o token pelos dados do usuário (chamado pelo seu sistema)

```
GET {hub}/api/auth/sso-verify?token=<token>
```

Sem autenticação adicional — a única "chave" é o próprio token. Chame essa rota **do backend do seu sistema**, não do navegador do usuário (não é uma chamada pensada para JavaScript client-side).

Resposta em caso de sucesso (`200`):

```json
{
  "athenasLogin": "JOAO.SILVA",
  "name": "João da Silva",
  "email": "joao.silva@empresa.com.br"
}
```

- `athenasLogin` pode vir `null` se o usuário não tiver login do Athenas vinculado (contas criadas com email/senha direto no hub).
- Use `athenasLogin` (quando presente) ou `email` como chave para casar com o usuário no seu sistema.

Resposta em caso de erro (`401`):

```json
{ "message": "Token inválido ou expirado.", "statusCode": 401 }
```

Acontece se: o token nunca existiu, já foi usado antes, passou de 30 segundos, ou o usuário foi desativado no hub entre o clique e a verificação.

---

## Exemplo de implementação do lado do site de destino

Pseudo-código de uma rota `/hub-sso/` (adapte pro seu framework):

```python
# FastAPI, por exemplo
import httpx
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/hub-sso/")
async def hub_sso(token: str = Query(...), hub: str = Query(...)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{hub}/api/auth/sso-verify", params={"token": token}, timeout=5)

    if resp.status_code != 200:
        return RedirectResponse("/login?erro=sso_invalido")

    dados = resp.json()
    # localizar/criar o usuário local por athenasLogin (ou email) e
    # criar a sessão da SUA aplicação aqui (cookie, JWT, o que o seu
    # sistema já usa hoje)
    criar_sessao_local(login=dados["athenasLogin"], nome=dados["name"], email=dados["email"])

    return RedirectResponse("/")
```

O ponto importante: a troca do token por dados (passo 5 do fluxo) acontece **servidor a servidor**, e só depois disso você cria a sessão do seu próprio sistema — o hub nunca cria sessão nenhuma no site de destino, só entrega "quem é o usuário".

---

## Segurança — o que saber antes de usar

- **Token de uso único**: a primeira chamada a `sso-verify` com um token consome ele — uma segunda tentativa com o mesmo token sempre recebe `401`, mesmo dentro da janela de 30s.
- **Expira em 30 segundos**: gerado no clique do botão, precisa ser trocado quase imediatamente. Não dá para guardar o token e usar depois.
- **Não existe chave de API nem segredo compartilhado nessa troca** — diferente da integração de [tempo economizado](./integracao-tempo-economizado.md), que exige uma chave por automação, aqui a única proteção é o próprio token aleatório (256 bits) mais o TTL curto e o uso único. Isso é aceitável porque o token só existe depois que o usuário já se autenticou no hub e viaja só dentro do redirecionamento do navegador — mas, na prática, **qualquer sistema que conseguir capturar esse token dentro da janela de 30s consegue trocar por nome, email e login do usuário**, mesmo sem estar cadastrado como Site no hub. Trate a URL de redirecionamento (com o token na query string) como informação sensível: não logue essa URL completa em sistemas de log, não a exponha em redirects intermediários de terceiros.
- **Guardado em memória, não no banco**: os tokens ficam num mapa em memória do processo da API. Isso tem duas consequências práticas: um restart do hub invalida qualquer token gerado e ainda não trocado (irrelevante na prática, já que o TTL é de só 30s); e se o hub algum dia rodar em mais de um processo/instância simultânea atrás de um balanceador, um token gerado em uma instância pode não ser encontrado se a verificação cair em outra.
- **Sempre HTTPS em produção externa**: se o seu sistema não estiver na mesma rede interna do hub, garanta que a chamada do passo 5 (`sso-verify`) e o próprio redirecionamento aconteçam por HTTPS, já que o token trafega em texto claro na URL.

## Quando isso não é a ferramenta certa

Se o seu sistema precisa de uma integração contínua (não só "abrir e entrar"), como sincronizar usuários em lote, consultar permissões periodicamente, ou qualquer chamada que não seja disparada por um clique real de um usuário no hub, esse fluxo de SSO não é o ideal — ele foi desenhado para uma única troca pontual, de curta duração, iniciada pelo usuário.
