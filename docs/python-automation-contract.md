# Contrato de automacoes Python

Este hub executa cada automacao como um processo do sistema operacional. O padrao recomendado e:

1. Cada automacao fica em uma pasta propria no servidor.
2. O hub chama um comando configurado no cadastro da automacao.
3. O script le arquivos de entrada da pasta `input`.
4. O script grava arquivos finais na pasta `output`.
5. O script escreve logs em `stdout` para aparecerem no site em tempo real.

## Configuracao no hub

No cadastro da automacao, preencha:

- `Comando de execucao`: exemplo `python automation.py`
- `Pasta de execucao`: caminho da pasta do projeto Python

Exemplo:

- Comando: `python automation.py`
- Pasta: `C:\Users\davi.inov\Documents\automation-hub\examples\python\xlsx-log-test`

## Variaveis de ambiente enviadas pelo hub

Durante a execucao, o processo recebe:

- `AUTOMATION_EXECUTION_ID`
- `AUTOMATION_EXECUTION_DIR`
- `AUTOMATION_INPUT_DIR`
- `AUTOMATION_OUTPUT_DIR`
- `AUTOMATION_METADATA_DIR`
- `AUTOMATION_PARAMETERS_FILE`
- `AUTOMATION_CONTEXT_FILE`

## Arquivos gerados pelo hub antes da execucao

Na pasta `metadata`, o hub cria:

- `parameters.json`: parametros preenchidos no formulario
- `context.json`: contexto basico da execucao

## Como mandar logs reais para o site

O site entende duas formas de linha em `stdout`:

### Log estruturado

```text
AH_LOG|info|Arquivo de entrada encontrado
AH_LOG|warn|Planilha sem aba secundaria
AH_LOG|error|Falha ao abrir arquivo
```

Niveis aceitos:

- `info`
- `warn`
- `error`

### Progresso estruturado

```text
AH_PROGRESS|10|Validando arquivo de entrada
AH_PROGRESS|40|Lendo planilha
AH_PROGRESS|90|Gerando arquivos de saida
```

Formato:

- `AH_PROGRESS|<0 a 100>|<mensagem>`

Quando voce envia progresso:

- a barra da tela e atualizada
- a mensagem atual da execucao e atualizada
- o texto tambem entra no log

## Como gravar outputs

Todo arquivo final deve ser salvo em `AUTOMATION_OUTPUT_DIR`.

Exemplos:

- `.txt`
- `.xlsx`
- `.csv`
- `.pdf`
- `.zip`

Ao final da execucao:

- o hub lista os arquivos da pasta `output`
- registra cada arquivo no historico
- gera um `.zip` com tudo para download

## Recomendacao de mercado

O padrao mais saudavel para as automacoes e:

1. O hub faz autenticacao, auditoria, fila e armazenamento.
2. Cada automacao Python fica em uma pasta propria, de preferencia com um `venv` proprio.
3. O script Python faz apenas a regra de negocio.
4. O script le parametros de `parameters.json`.
5. O script le insumos do `input`.
6. O script grava resultados no `output`.
7. O script escreve logs estruturados em `stdout`.

Evite como padrao:

- subir `.exe` pelo site
- escrever arquivo fora da pasta da execucao
- logs apenas em arquivo sem mandar nada para `stdout`
- depender de caminho fixo fora do projeto

## Recomendacao para dependencias

Se voce tiver mais de uma automacao Python no mesmo servidor, prefira:

1. Uma pasta por automacao
2. Um `requirements.txt` por automacao
3. Um ambiente virtual por automacao

Exemplo de comando no cadastro:

```text
C:\Robos\meu-robo\.venv\Scripts\python.exe automation.py
```

## Exemplo minimo em Python

```python
import json
import os
from pathlib import Path

parameters = json.loads(Path(os.environ["AUTOMATION_PARAMETERS_FILE"]).read_text(encoding="utf-8"))
input_dir = Path(os.environ["AUTOMATION_INPUT_DIR"])
output_dir = Path(os.environ["AUTOMATION_OUTPUT_DIR"])

print("AH_PROGRESS|10|Validando entradas", flush=True)
arquivos = list(input_dir.glob("*"))

print(f"AH_LOG|info|{len(arquivos)} arquivo(s) encontrado(s)", flush=True)

(output_dir / "resultado.txt").write_text("Tudo certo", encoding="utf-8")

print("AH_PROGRESS|100|Execucao concluida", flush=True)
```
