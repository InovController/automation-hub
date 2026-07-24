# Integração externa — registrar tempo economizado

Este documento é para times que já têm um sistema de automação pronto, rodando fora do Automation HUB, e querem que o **tempo economizado** dessas automações apareça nos relatórios do hub (dashboard, relatório de tempo ganho, etc.) — sem precisar migrar o robô para rodar por aqui.

O fluxo é simples: você cadastra sua automação como **"externa"** no hub (uma vez), gera uma chave de API, e a cada execução completa do seu sistema, ele faz **uma chamada HTTP** informando quanto tempo foi economizado. O hub cria o registro já como concluído e ele entra automaticamente em todos os relatórios existentes.

---

## Passo 1 — Cadastrar a automação no hub

Isso é feito uma única vez, por um administrador do hub.

1. Entre no hub e vá em **Configurações → Automações**.
2. Clique em **Nova automação** (ou selecione uma existente para editar).
3. Preencha os campos normais: nome, categoria, resumo, departamentos com acesso, etc.
4. No campo **Tipo de automação**, selecione **"Externa (reportada via API)"**.
   - Isso esconde os campos de comando/pasta de execução (não se aplicam) — o hub nunca tenta rodar essa automação, ele só recebe os resultados.
5. Salve a automação.
6. Depois de salva, aparece a seção **"Integração externa"**. Clique em **"Gerar chave de API"**.
7. **Copie a chave exibida na hora.** Ela não é mostrada de novo — o hub guarda só um hash dela, igual a uma senha. Se perder, gere uma nova (a antiga para de funcionar).

Guarde essa chave como um segredo de aplicação (variável de ambiente, cofre de segredos, etc.), nunca em código versionado.

Se a chave vazar ou o sistema for descontinuado, volte nessa mesma tela e clique em **"Revogar"** — a chave para de funcionar imediatamente.

---

## Passo 2 — Chamar o endpoint ao final de cada execução

Chame o endpoint **uma vez por execução completa**, quando seu sistema já souber o tempo total economizado daquela execução. Não é necessário (nem recomendado) chamar por item/unidade processada individualmente.

### Endpoint

```
POST http://10.100.1.18:3000/api/integrations/time-savings
```

> Uso interno na rede da empresa. Se o seu sistema já roda na mesma rede, use o IP acima. Se preferir o domínio (`https://hubcontroller.com.br`), o certificado é autoassinado — seu sistema precisa confiar nele ou desabilitar a validação de certificado para esse host específico.

### Autenticação

Envie a chave gerada no Passo 1 no header `Authorization`:

```
Authorization: Bearer ahk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Cada automação externa tem sua própria chave — uma chamada só é atribuída à automação dona daquela chave, não é possível reportar em nome de outra.

### Corpo da requisição (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `secondsSaved` | número | **sim** | Tempo total economizado nessa execução, **em segundos**. Deve ser positivo (máximo 30 dias em segundos). |
| `userLogin` | texto | **sim** | Login de quem "recebe o crédito" pela execução (aparece nos relatórios). O hub procura o usuário por esse login. |
| `unitsProcessed` | número | não | Quantidade de itens/unidades processadas (ex: 42 notas, 10 empresas). Só para exibição — não afeta o cálculo do tempo. |
| `notes` | texto | não | Observação livre sobre a execução. |
| `externalId` | texto | não | Um identificador único seu para essa execução (ex: o ID do lote no seu sistema). Ver seção de idempotência abaixo. |

### Exemplo de requisição

```bash
curl -X POST http://10.100.1.18:3000/api/integrations/time-savings \
  -H "Authorization: Bearer ahk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "secondsSaved": 1800,
    "userLogin": "FULANO",
    "unitsProcessed": 42,
    "notes": "Lote de 42 notas fiscais",
    "externalId": "lote-2026-07-21-01"
  }'
```

Em Python:

```python
import requests

response = requests.post(
    "http://10.100.1.18:3000/api/integrations/time-savings",
    headers={"Authorization": "Bearer ahk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"},
    json={
        "secondsSaved": 1800,
        "userLogin": "FULANO",
        "unitsProcessed": 42,
        "externalId": "lote-2026-07-21-01",
    },
    timeout=10,
)
response.raise_for_status()
print(response.json())
```

### Resposta de sucesso

```json
{
  "success": true,
  "executionId": "cmruq2gju0000o0cbxb2gwhbc",
  "deduplicated": false
}
```

`deduplicated: true` significa que esse `externalId` já tinha sido reportado antes — o hub não criou um registro novo, devolveu o mesmo de antes (ver abaixo).

### Erros possíveis

| Status | Motivo | O que fazer |
|---|---|---|
| `401` | Chave ausente, incorreta ou revogada | Confira o header `Authorization` e se a chave ainda está ativa na tela de Configurações. |
| `400` | Campo obrigatório faltando ou `secondsSaved` inválido | Confira o corpo da requisição contra a tabela acima. |

---

## Idempotência — evitando registrar a mesma execução duas vezes

Se o seu sistema pode reenviar a mesma chamada por causa de timeout, retry automático, etc., envie sempre o mesmo `externalId` para a mesma execução (por exemplo, o ID do lote/job no seu sistema).

- Na primeira chamada com aquele `externalId`, o hub cria a execução normalmente.
- Em qualquer chamada seguinte com o **mesmo `externalId`**, o hub não cria nada novo — devolve o registro já existente (`deduplicated: true`).

Se você não enviar `externalId`, cada chamada sempre cria um registro novo — só deixe de enviar se tiver certeza de que seu sistema nunca reenvia a mesma execução.

---

## Perguntas frequentes

**Minha automação processa itens em lote ao longo do dia. Chamo o endpoint a cada item?**
Não — chame uma vez por execução/lote completo, com o `secondsSaved` já somado de tudo que aquele lote economizou. Use `unitsProcessed` para registrar quantos itens entraram nesse total.

**Preciso que o usuário tenha conta no hub?**
Sim. O hub usa `userLogin` para localizar o usuário cadastrado e atribuir o crédito à pessoa certa nos relatórios.

**Minha automação some — não é um valor fixo por unidade. Preciso configurar isso no hub?**
Não. Ao contrário das automações que rodam pelo hub, aqui é você quem calcula e envia o `secondsSaved` já pronto — o hub não faz nenhuma conta em cima disso.
