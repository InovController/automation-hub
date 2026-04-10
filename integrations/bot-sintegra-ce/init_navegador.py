import nodriver as nd
import asyncio

async def iniciar_navegador(headless=False):
    browser = await nd.start(headless=headless)
    
    page = await browser.get(
        "https://consultapublica.sefaz.ce.gov.br/sintegra/preparar-consultar"
    )
    
    await asyncio.sleep(4)
    return page   # ← Isso é o que seu main vai receber como "browser"
