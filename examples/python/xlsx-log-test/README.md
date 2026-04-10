# Automacao de teste XLSX

Esta automacao serve como exemplo de integracao com o Automation HUB.

## O que ela faz

1. Recebe um arquivo `.xlsx` enviado pelo formulario.
2. Abre a primeira aba da planilha.
3. Conta linhas preenchidas.
4. Escreve logs reais para o site.
5. Gera um arquivo de saida:
   - `resultado.txt`

## Como configurar no hub

- Nome: `Teste XLSX`
- Slug: `teste-xlsx`
- Categoria: `Utilitarios`
- Icone: `sheet`
- Comando: `python automation.py`
- Pasta de execucao: `C:\Users\davi.inov\Documents\automation-hub\examples\python\xlsx-log-test`

## Exemplo de formulario

Campos:

- `referencia`
  - tipo: `text`
  - label: `Referencia`
  - obrigatorio: `sim`
- `observacao`
  - tipo: `textarea`
  - label: `Observacao`

Upload:

- `planilha`
  - label: `Planilha XLSX`
  - accept: `.xlsx`
  - multiple: `nao`
  - required: `sim`

## Gerar uma planilha de teste

Se quiser criar um arquivo `.xlsx` rapidamente:

```bash
python create_sample_input.py
```

Isso vai gerar o arquivo `sample_input.xlsx` na mesma pasta.

## Observacao

Os logs que aparecem no site saem do `stdout` do processo, usando o formato:

```text
AH_LOG|info|Mensagem
AH_PROGRESS|50|Etapa atual
```
