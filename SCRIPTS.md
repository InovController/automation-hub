# Guia de automações — Automation HUB

Este documento explica como criar scripts de automação compatíveis com o hub. Qualquer linguagem que rode via linha de comando funciona — os exemplos aqui usam Python.

---

## 1. Estrutura do arquivo .zip

Envie um `.zip` (ou `.rar`) contendo todos os arquivos do projeto. O hub extrai tudo numa pasta dedicada ao robô e configura o comando de execução automaticamente.

```
minha-automacao.zip
├── main.py               ← script principal (informado no campo "Script principal")
├── requirements.txt      ← dependências Python (opcional, instalado automaticamente)
├── utils.py              ← outros módulos que main.py importa
└── ...
```

> **Importante:** todos os arquivos devem estar na **raiz** do zip, não dentro de subpastas.

### requirements.txt

Se o script depende de bibliotecas externas, inclua um `requirements.txt` padrão:

```
openpyxl==3.1.2
requests==2.31.0
pandas
```

O hub instala essas dependências automaticamente numa pasta isolada por robô. Não é necessário instalar nada no servidor manualmente.

---

## 2. Variáveis de ambiente

O hub injeta as seguintes variáveis de ambiente no processo do script a cada execução:

| Variável | O que contém |
|---|---|
| `AUTOMATION_EXECUTION_ID` | ID único da execução (UUID) |
| `AUTOMATION_INPUT_DIR` | Pasta com os arquivos enviados pelo usuário no formulário |
| `AUTOMATION_OUTPUT_DIR` | Pasta onde o script deve gravar os arquivos de saída |
| `AUTOMATION_METADATA_DIR` | Pasta com os arquivos `parameters.json` e `context.json` |
| `AUTOMATION_PARAMETERS_FILE` | Caminho direto para `parameters.json` |
| `AUTOMATION_CONTEXT_FILE` | Caminho direto para `context.json` |

### parameters.json

Contém os valores preenchidos pelo usuário no formulário de execução. O formato é um objeto JSON com os nomes dos campos como chaves:

```json
{
  "cnpj": "12345678000199",
  "competencia": "2024-01",
  "incluirAnexos": true
}
```

### context.json

Informações sobre o robô e os caminhos da execução:

```json
{
  "executionId": "abc-123",
  "robot": {
    "id": "uuid-do-robo",
    "slug": "consulta-sintegra",
    "name": "Consulta Sintegra CE"
  },
  "inputDir": "/caminho/para/input",
  "outputDir": "/caminho/para/output",
  "metadataDir": "/caminho/para/metadata"
}
```

---

## 3. Lendo parâmetros no script

```python
import os
import json

# Lê os parâmetros preenchidos pelo usuário
parameters_file = os.environ['AUTOMATION_PARAMETERS_FILE']
with open(parameters_file, 'r', encoding='utf-8') as f:
    params = json.load(f)

cnpj = params.get('cnpj', '')
competencia = params.get('competencia', '')
incluir_anexos = params.get('incluirAnexos', False)
```

---

## 4. Arquivos de entrada

Arquivos enviados pelo usuário ficam em `AUTOMATION_INPUT_DIR`. Para acessá-los:

```python
import os

input_dir = os.environ['AUTOMATION_INPUT_DIR']

# Lista todos os arquivos enviados
arquivos = os.listdir(input_dir)

# Acessa um arquivo específico por campo (nome configurado na automação)
planilha = os.path.join(input_dir, 'planilha_entrada.xlsx')
```

---

## 5. Arquivos de saída

Qualquer arquivo gravado em `AUTOMATION_OUTPUT_DIR` fica disponível para download no hub após a execução. Não há necessidade de nenhuma configuração extra.

```python
import os

output_dir = os.environ['AUTOMATION_OUTPUT_DIR']
caminho_saida = os.path.join(output_dir, 'resultado.xlsx')

# Grava o arquivo de saída
workbook.save(caminho_saida)
```

---

## 6. Comunicação com o hub (stdout)

O script se comunica com o hub imprimindo linhas no stdout com prefixos específicos. Qualquer linha que não corresponda a um prefixo vira um log automático visível na tela de execução.

### Progresso

Atualiza a barra de progresso e o passo atual visível no hub.

```
AH_PROGRESS|<0-100>|<mensagem>
```

```python
print("AH_PROGRESS|10|Iniciando consulta")
print("AH_PROGRESS|50|Processando CNPJs")
print("AH_PROGRESS|90|Gerando planilha")
```

### Logs

Grava uma mensagem no log da execução com nível de severidade.

```
AH_LOG|<info|warn|error>|<mensagem>
```

```python
print("AH_LOG|info|Conexão estabelecida")
print("AH_LOG|warn|CNPJ sem resultado, pulando")
print("AH_LOG|error|Timeout ao consultar o servidor")
```

### Métricas

Registra um valor numérico acumulado. Usado para calcular o tempo economizado na tela de relatórios.

```
AH_METRIC|<chave>|<valor>
```

A chave deve corresponder ao campo **"Chave da métrica no robô"** configurado nas definições da automação.

```python
# Incrementa a cada item processado
print(f"AH_METRIC|itens_processados|1")

# Ou registra o total de uma vez
total = 42
print(f"AH_METRIC|itens_processados|{total}")
```

> Valores com vírgula ou ponto decimal são aceitos: `AH_METRIC|tempo_total|1.5`

---

## 7. Código de saída

O hub usa o código de saída do processo para determinar o resultado da execução:

| Código | Resultado |
|---|---|
| `0` | ✅ Sucesso |
| qualquer outro | ❌ Erro |

Em Python, erros não capturados e `sys.exit(1)` resultam em erro. Finalizações normais retornam `0` automaticamente.

```python
import sys

try:
    # lógica da automação
    pass
except Exception as e:
    print(f"AH_LOG|error|Falha crítica: {e}")
    sys.exit(1)
```

---

## 8. Exemplo completo

```python
import os
import json
import sys

def main():
    # 1. Lê parâmetros
    with open(os.environ['AUTOMATION_PARAMETERS_FILE'], encoding='utf-8') as f:
        params = json.load(f)

    cnpjs = params.get('cnpjs', '').splitlines()
    if not cnpjs:
        print("AH_LOG|error|Nenhum CNPJ informado.")
        sys.exit(1)

    output_dir = os.environ['AUTOMATION_OUTPUT_DIR']
    total = len(cnpjs)

    print(f"AH_PROGRESS|10|Iniciando consulta de {total} CNPJs")

    for i, cnpj in enumerate(cnpjs, start=1):
        cnpj = cnpj.strip()
        if not cnpj:
            continue

        try:
            # ... lógica de consulta ...
            print(f"AH_LOG|info|CNPJ {cnpj} consultado com sucesso")
            print(f"AH_METRIC|itens_processados|1")
        except Exception as e:
            print(f"AH_LOG|warn|Erro ao consultar {cnpj}: {e}")

        progresso = int(10 + (i / total) * 80)
        print(f"AH_PROGRESS|{progresso}|Processando {i}/{total}")

    # Grava saída
    resultado_path = os.path.join(output_dir, 'resultado.txt')
    with open(resultado_path, 'w', encoding='utf-8') as f:
        f.write("Consulta finalizada.\n")

    print("AH_PROGRESS|100|Concluído")

if __name__ == '__main__':
    main()
```

---

## 9. Dicas e cuidados

- **Encoding:** sempre use `encoding='utf-8'` ao abrir arquivos para evitar erros com acentos
- **Caminhos:** nunca use caminhos fixos (`C:\...` ou `/home/...`). Use sempre as variáveis de ambiente
- **Logs vs prints:** prints simples viram logs automáticos — use os prefixos `AH_LOG` apenas quando quiser controlar o nível (info/warn/error)
- **Progresso:** envie atualizações de progresso regularmente para que o hub mostre andamento em tempo real
- **Saída vazia:** se nenhum arquivo for gravado em `AUTOMATION_OUTPUT_DIR`, a execução termina como sucesso mas sem arquivos para download — isso é válido para automações que não geram arquivos
- **Múltiplos arquivos de saída:** todos os arquivos dentro de `AUTOMATION_OUTPUT_DIR` ficam disponíveis para download, inclusive em subpastas
