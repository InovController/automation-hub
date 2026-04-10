# Consulta Sintegra CE no Automation HUB

Esta pasta contem a integracao do robo para execucao pelo site.

## Arquivo principal do hub

- `hub_runner.py`

## Como funciona

1. O usuario envia um `.xlsx` pelo site.
2. O hub salva o arquivo na pasta `input` da execucao.
3. O `hub_runner.py` copia esse arquivo para a pasta `output`.
4. O robo consulta cada CNPJ no portal do Sintegra CE.
5. O resultado final fica salvo em `consulta_sintegra_ce.xlsx`.
6. Os logs aparecem em tempo real no site.

## Parametros esperados no formulario

- `mostrarNavegador`
  - tipo: `checkbox`
  - opcional
  - quando marcado, abre o navegador visivelmente

## Upload esperado

- um arquivo `.xlsx`
