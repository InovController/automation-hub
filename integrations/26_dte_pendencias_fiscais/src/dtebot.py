from botcity.web import WebBot, By
from botcity.web.browsers.chrome import default_options
from botcity.web.util import element_as_select
from webdriver_manager.chrome import ChromeDriverManager
import os
import sys
import utils

from df_manager import DataProcessor


class DteBot(WebBot):
    MAX_ATTEMPTS = 3
    URL = 'https://portal-dte.sefaz.ce.gov.br/#/certificado'
    FILEPATH = r''
    DOWNLOAD_FOLDER = os.path.dirname(FILEPATH)
    
    def action(self, execution=None):
        try:
            df_manager = DataProcessor(self.FILEPATH)
            df_manager.create_status_columns('Status CT-e')
            df_manager.create_status_columns('Status NF-e')
            df_manager.create_status_columns('Status NFC-e/CF-e')

            self.chromedriver_settings()
            self.open_website()
            self.login()
            for index, row in df_manager.df.iterrows():
                try:
                    status_cte_value = str(row['Status CT-e'])
                    status_nfe_value = str(row['Status NF-e'])
                    status_nfce_cfe_value = str(row['Status NFC-e/CF-e'])

                    if (status_cte_value != '' and status_cte_value != 'nan') and (status_nfe_value != '' and status_nfe_value != 'nan') and (status_nfce_cfe_value != '' and status_nfce_cfe_value != 'nan'):
                        continue
                    
                    print(f"🔄 Iniciando processamento de empresa com CNPJ: {row['CNPJ']}")
                    self.cnpj = row['CNPJ'].zfill(14)
                    self.choose_company()
                    self.enter_portal_siget()
                    self.change_tab(2)
                    self.accept_js_dialog(2)
                
                    if status_cte_value == '' or status_cte_value == 'nan':
                        status_cte = self.enter_cte_menu()
                        df_manager.add_status(index, status_cte, 'Status CT-e')

                    if status_nfe_value == '' or status_nfe_value == 'nan':
                        status_nfe = self.enter_nfe_menus()
                        df_manager.add_status(index, status_nfe, 'Status NF-e')

                    if status_nfce_cfe_value == '' or status_nfce_cfe_value == 'nan':
                        status_nfce_cfe = self.enter_nfce_cfe_menu()
                        df_manager.add_status(index, status_nfce_cfe, 'Status NFC-e/CF-e')
                        
                    self.close_page()
                    change_company = self.find_element('/html/body/my-app/header/div/div/nav/ul/li[1]/button', By.XPATH, waiting_time=60000)
                    change_company.click()
                    self.wait(500)
                    yes_button = self.find_element('/html/body/div[2]/div/div[3]/button[1]', By.XPATH, waiting_time=60000)
                    yes_button.click()
                    self.wait(500)

                except Exception as e:
                    status_cte_value = str(row['Status CT-e'])
                    status_nfe_value = str(row['Status NF-e'])
                    status_nfce_cfe_value = str(row['Status NFC-e/CF-e'])

                    if status_cte_value == '':
                        df_manager.add_status(index, f'ERRO: {e}', 'Status CT-e')

                    if status_nfe_value == '':
                        df_manager.add_status(index, f'ERRO: {e}', 'Status NF-e')

                    if status_nfce_cfe_value == '':
                        df_manager.add_status(index, f'ERRO: {e}', 'Status NFC-e/CF-e')
                    sys.exit()

        except Exception as e:
            print(e)
        finally:
            self.stop_browser()
        

    def chromedriver_settings(self):
        self.driver_path = ChromeDriverManager().install()
        self.driver_path = os.path.join(os.path.dirname(self.driver_path), 'chromedriver.exe')

        local_appdata = os.getenv("LOCALAPPDATA")

        user_data_path = os.path.join(local_appdata, "BotCityChromeProfile")
        os.makedirs(user_data_path, exist_ok=True)

        dev_options = default_options(
            headless=False,
            download_folder_path=self.DOWNLOAD_FOLDER,
            user_data_dir=user_data_path,
            page_load_strategy='normal'
        )
        
        extension_path = os.path.join(
            user_data_path,
            r"Default\Extensions\dcngeagmmhegagicpcmpinaoklddcgon\2.17.0_0"
        )

        if os.path.exists(extension_path):
            dev_options.add_argument(f'--load-extension={extension_path}')
        else:
            print(f"Aviso: Extensão não encontrada em: {extension_path}")
        
        self.options = dev_options


    def open_website(self):
        self.browse(self.URL)
        self.maximize_window()
    
    
    def login(self):
        try:
            while True:
                try:
                    selecionar_certificado = self.find_element(
                        '/html/body/my-app/div/div/div/app-certificado/div/ul/li/button',
                        By.XPATH, waiting_time=1500
                    )
                    if selecionar_certificado:
                        selecionar_certificado.click()
                        break
                except:
                    pass

                try:
                    acesso_certificado_digital = self.find_element(
                        '/html/body/my-app/div/div/div/app-index/div/div/div[2]/div[1]/div/div/a[1]',
                        By.XPATH, waiting_time=1500
                    )
                    if acesso_certificado_digital:
                        acesso_certificado_digital.click()
                        break
                except:
                    pass

                self.wait(1000)
                
            selecionar_perfil = self.find_element('/html/body/my-app/div/div/div/app-perfil/div/div[1]/table/tbody/tr', By.XPATH, waiting_time=20000)
            selecionar_perfil.click()
            proximo = self.find_element('/html/body/my-app/div/div/div/app-perfil/div/div[2]/button[2]', By.XPATH, waiting_time=20000)
            proximo.click()

        except Exception as e:
            raise Exception(f'Tentativa falha de login: {e}')
        
        
    def choose_company(self):
        count = 0
        while count < 3:
            try:
                print('  🔄 Trocando empresa de acesso')
                primeira_celula_tabela = self.find_element('/html/body/my-app/div/div/div/app-procuracao/div/div[2]/table/tbody/tr[1]/td[1]', By.XPATH, waiting_time=60000)
                self.wait_for_element_visibility(primeira_celula_tabela, visible=True, waiting_time=20000)
                
                self.wait(250)
                pesquisar_cnpj = self.find_element('/html/body/my-app/div/div/div/app-procuracao/div/form/div/div[1]/input', By.XPATH, waiting_time=60000)
                pesquisar_cnpj.send_keys(self.cnpj)
                
                self.wait(250)
                primeira_celula_tabela = self.find_element('/html/body/my-app/div/div/div/app-procuracao/div/div[2]/table/tbody/tr[1]/td[1]', By.XPATH, waiting_time=60000)
                primeira_celula_tabela.click()
                
                self.wait(250)
                confirmar = self.find_element('/html/body/my-app/div/div/div/app-procuracao/div/div[3]/button[2]', By.XPATH, waiting_time=60000)
                confirmar.click()

                excesso_de_tentativas = self.find_element('/html/body/div[2]/div/div[1]', By.XPATH, waiting_time=2500)
                if excesso_de_tentativas is not None:
                    print('  ❌ Falha ao trocar empresa de acesso. Tentando novamente...')
                    count += 1
                    continue
                
                print('  ✅ Empresa trocada com sucesso')
                return
            except:
                print('  ❌ Falha ao trocar empresa de acesso. Tentando novamente...')
                self.wait(30000)
                count += 1
    

    def enter_portal_siget(self):
        try:
            print('  🔄 Navegando para portal Siget...')
            modal = self.find_element('//*[@id="exampleModal"]', By.XPATH, waiting_time=2000)
            if modal:
                self.execute_javascript("""
                    const m = document.querySelector('#exampleModal');
                    if (m) m.remove();
                    document.body.classList.remove('modal-open');
                    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                """)
            portal_siget = self.find_element('/html/body/my-app/div/div/div/app-home/section/div/div[2]/div/ul/li[1]', By.XPATH, waiting_time=60000)
            portal_siget.click()
            print('  ✅ Entrou no portal Siget com sucesso')
        except:
            print('  ❌ Falha ao entrar no portal Siget')
            raise Exception('Erro ao entrar no portal Siget')

        
    def change_tab(self, value):
        try:
            # print('  🔄 Trocando aba...')
            while True:
                handles = self.get_tabs()
                if len(handles) > 1:
                    break
            self.activate_tab(handles[value - 1])
            # print('  ✅ Trocou aba com sucesso')
        except:
            # print('  ❌ Falha ao trocar aba')
            raise Exception('Erro ao trocar aba')


    def accept_js_dialog(self, qtd):
        try:
            # print('  🔄 Aceitando diálogo JS...')
            for _ in range(qtd):
                while True:
                    if (self.get_js_dialog() != None):
                        self.handle_js_dialog(accept=True)
                        break
            print('  ✅ Aceitou diálogo JS com sucesso')
            # alert = self.find_element('//*[@id="modalMensagem"]/div/div', By.XPATH, waiting_time=1000)
            # self.wait_for_element_visibility(alert, visible=True, waiting_time=5000)
            # if alert is not None:
            #     close_alert = self.find_element('//*[@id="modalMensagem"]/div/div/div[2]/div/div[2]/div/div/label', By.XPATH, waiting_time=5000)
            #     close_alert.click()
        except:
            print('  ❌ Falha ao aceitar diálogo JS')
            raise Exception('Erro ao aceitar diálogo JS')

        
    def enter_cte_menu(self):
        try:
            print('  🔄 Navegando para menu CT-e...')

            resumo_pendencias_nav = self.find_element('//*[@id="menu_home_resumo"]', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(resumo_pendencias_nav, visible=True, waiting_time=20000)
            resumo_pendencias_nav.click()

            search_button = self.find_element('/html/body/app-root/div/app-home/app-resumo-indicadores/div[1]/section[2]/div/div[2]/div/div[1]/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(search_button, visible=True, waiting_time=20000)
            search_button.click()

            year_select = self.find_element('//*[@id="ano_select"]', By.XPATH, waiting_time=60000)
            year_select = element_as_select(year_select)
            year_select.select_by_visible_text(str(utils.get_year(self.USE_CURRENT_MONTH)))

            search_button = self.find_element('//*[@id="tab_tomador"]/div[1]/div[1]/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(search_button, visible=True, waiting_time=20000)
            search_button.click()
        
            self.loading()
            
            first_cell_tr = self.find_element('//*[@id="tab_tomador"]/table/tbody/tr[1]', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(first_cell_tr, visible=True, waiting_time=20000)

            index = ((utils.months.index(utils.get_month(self.USE_CURRENT_MONTH)) + 1) * 4) - 3
            loading = self.find_element(f'//*[@id="tab_tomador"]/table/tbody/tr[1]', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(loading, visible=True, waiting_time=20000)
            
            self.expand_all_trs(index)
            status_interna = self.month_options(index, 1)
            status_interestadual = self.month_options(index, 2)
            status_externa = self.month_options(index, 3)

            if status_interna == 'OK' and status_interestadual == 'OK' and status_externa == 'OK':
                print('  ✅ Processo de baixar CT-e finalizado')
                return '✅ Processo de baixar CT-e finalizado'
            
            elif status_interna != 'OK' and status_interestadual == 'OK' and status_externa == 'OK':
                print('  🔄 CT-e foram baixadas, mas arquivo interno não foi encontrado')
                return '🔄 CT-e foram baixadas, mas arquivo interna não foi encontrada'
            
            elif status_interna == 'OK' and status_interestadual == 'OK' and status_externa != 'OK':
                print('  🔄 CT-e foram baixadas, mas arquivo externo não foi encontrado')
                return '🔄 CT-e foram baixadas, mas arquivo externa não foi encontrado'
            
            elif status_interna == 'OK' and status_interestadual != 'OK' and status_externa == 'OK':
                print('  🔄 CT-e foram baixadas, mas arquivo interestadual não foi encontrado')
                return '🔄 CT-e foram baixadas, mas arquivo interestadual não foi encontrado'
            
            else:
                print('  ✅ Finalizando processo, CT-e não se encontram no DTE')
                return '🔄 CT-e não se encontra no DTE'
            
        except Exception as e:
            print(f'  ❌ Erro ao navegar para area do tomador: {e}')
            return (f'  ❌ Erro ao navegar para area do tomador: {e}')


    def month_options(self, index, value):
        try:
            option = self.find_element(f'//*[@id="tab_tomador"]/table/tbody/tr[{index+value}]/td[2]/span/div/a', By.XPATH, waiting_time=1000)
            self.wait_for_element_visibility(option, visible=True, waiting_time=10000)
            option.click()

            download_button = self.find_element(f'//*[@id="Modal"]/div/div/div[2]/div/div/div/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(download_button, visible=True, waiting_time=10000)
            download_button.click()

            download_csv_button = self.find_element(f'//*[@id="Modal"]/div/div/div[2]/div/div/div/ul/li[2]/a', By.XPATH, waiting_time=15000)
            self.wait_for_element_visibility(download_csv_button, visible=True, waiting_time=10000)
            download_csv_button.click()

            latest_csv = utils.wait_for_latest_excel_download(self.DOWNLOAD_FOLDER, timeout=60)
            utils.move_archive_to_folder(latest_csv, os.path.join(self.DOWNLOAD_FOLDER, 'output', self.cnpj))

            close_modal = self.find_element(f'//*[@id="Modal"]/div/div/div[1]/button/span', By.XPATH, waiting_time=10000)
            self.wait_for_element_visibility(close_modal, visible=True, waiting_time=20000)
            close_modal.click()
            return 'OK'

        except:
            return('ERRO')
        
        
    def expand_all_trs(self, index):
        spans = self.driver.find_elements(
            By.XPATH, '//*[@id="tab_tomador"]/table/tbody/tr/td[1]/div/span'
        )

        for idx, span in enumerate(spans):
            if(idx < index - 1):
                continue

            try:
                self.driver.execute_script("arguments[0].scrollIntoView(true);", span)
                self.wait(300)

                self.driver.execute_script("""
                    var evt = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    arguments[0].dispatchEvent(evt);
                """, span)

                self.wait(500)
                return

            except Exception as e:
                print(f"Erro ao expandir TR {idx}: {e}")

    
    def enter_nfe_menus(self):
        try:
            print('  🔄 Navegando para menu NF-e...')
            nfe_menu_button = self.find_element('//*[@id="menu_indicadores_nfe"]', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(nfe_menu_button, visible=True, waiting_time=20000)
            nfe_menu_button.click()
            self.wait(1000)
            
            status_recebidas = self.nfe_options(nfe_menu_xpath='/html/body/app-root/div/app-nfe/div/div/section[2]/div/div/div/ul/li[5]/a')
            self.wait(1000)
            status_emitidas = self.nfe_options(nfe_menu_xpath='/html/body/app-root/div/app-nfe/div/div/section[2]/div/div/div/ul/li[6]/a')
            self.wait(1000)

            if status_recebidas == 'OK' and status_emitidas == 'OK':
                print('  ✅ Processo de baixar NF-e finalizado')
                return '✅ Processo de baixar NF-e finalizado'
            
            if status_recebidas == 'OK' and status_emitidas == 'NÃO ENCONTRADA':
                print('  🔄 NF-e recebidas foram baixadas, mas NF-e emitidas não se encontram no DTE')
                return '🔄 NF-e recebidas foram baixadas, mas NF-e emitidas não se encontram no DTE'
            
            if status_recebidas == 'NÃO ENCONTRADA' and status_emitidas == 'OK':
                print('  🔄 NF-e emitidas foram baixadas, mas NF-e recebidas não se encontram no DTE')
                return '🔄 NF-e emitidas foram baixadas, mas NF-e recebidas não se encontram no DTE'
            
            if status_recebidas == 'NÃO ENCONTRADA' and status_emitidas == 'NÃO ENCONTRADA':
                print('  ✅ Finalizando processo, NF-e nao se encontram no DTE')
                return '🔄 NF-e não se encontram no DTE'
            
            if status_recebidas == 'OK' and status_emitidas == 'ERRO':
                print('  🔄 NF-e recebidas foram baixadas, mas NF-e emitidas falharam')
                return '🔄 NF-e recebidas foram baixadas, mas NF-e emitidas falharam'
            
            if status_recebidas == 'ERRO' and status_emitidas == 'OK':
                print('  🔄 NF-e emitidas foram baixadas, mas NF-e recebidas falharam')
                return '🔄 NF-e emitidas foram baixadas, mas NF-e recebidas falharam'
            
            if status_recebidas == 'ERRO' and status_emitidas == 'ERRO':
                print('  ❌ Processo de baixar NF-e falhou')
                return '❌ Processo de baixar NF-e falhou'
            
            if status_recebidas == 'ERRO' and status_emitidas == 'NÃO ENCONTRADA':
                print('  🔄 NF-e recebidas deram erro e NF-e emitidas não se encontram')
                return '🔄 NF-e recebidas deram erro e NF-e emitidas não se encontram'
            
            if status_recebidas == 'NÃO ENCONTRADA' and status_emitidas == 'ERRO':
                print('  🔄 NF-e emitidas deram erro e NF-e recebidas não se encontram')
                return '🔄 NF-e emitidas deram erro e NF-e recebidas não se encontram'
            
            print('  ❌ Erro desconhecido')
            return('❌ Erro desconhecido')
            
        except:
            print('  ❌ Processo de baixar NF-e falhou')
            return '❌ Processo de baixar NF-e falhou'
        
                
    def nfe_options(self, nfe_menu_xpath):
        try:
            nfe_options_menu_button = self.find_element(nfe_menu_xpath, By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(nfe_options_menu_button, visible=True, waiting_time=20000)
            nfe_options_menu_button.click()

            year_select = self.find_element('//*[@id="ano_select"]', By.XPATH, waiting_time=60000)
            year_select = element_as_select(year_select)
            year_select.select_by_visible_text(str(utils.get_year(self.USE_CURRENT_MONTH)))

            calender_select = self.find_element('//*[@id="mes_select"]', By.XPATH, waiting_time=60000)
            calender_select = element_as_select(calender_select)
            calender_select.select_by_visible_text(utils.get_month(self.USE_CURRENT_MONTH))
            
            search_button = self.find_element('//*[@id="tab_relacao_recebidas"]/div[2]/div/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(search_button, visible=True, waiting_time=20000)
            search_button.click()
            
            self.loading()

            first_table_row = self.find_element('//*[@id="tab_relacao_recebidas"]/table/tbody/tr[1]', By.XPATH, waiting_time=1000)
            if first_table_row is None:
                return 'NÃO ENCONTRADA'
            
            download_button = self.find_element('//*[@id="tab_relacao_recebidas"]/div[3]/div/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(download_button, visible=True, waiting_time=20000)
            download_button.click()

            download_csv_button = self.find_element(f'//*[@id="tab_relacao_recebidas"]/div[3]/div/ul/li[2]/a', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(download_csv_button, visible=True, waiting_time=20000)
            download_csv_button.click()

            latest_csv = utils.wait_for_latest_excel_download(self.DOWNLOAD_FOLDER, timeout=60)
            utils.move_archive_to_folder(latest_csv, os.path.join(self.DOWNLOAD_FOLDER, 'output', self.cnpj))

            return 'OK'
        except:
            return 'ERRO'

    
    def enter_nfce_cfe_menu(self):
        try:
            print('  🔄 Navegando para menu NFC-e/CF-e...')
            nfce_cfe_menu_button = self.find_element('//*[@id="menu_indicadores_nfce"]', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(nfce_cfe_menu_button, visible=True, waiting_time=20000)
            nfce_cfe_menu_button.click()
            
            nfce_cfe_option_button = self.find_element('/html/body/app-root/div/app-nfce/div/div/section[2]/div/div/div/ul/li[3]/a', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(nfce_cfe_option_button, visible=True, waiting_time=20000)
            nfce_cfe_option_button.click()
            
            initial_month_calendar_select = self.find_element('//*[@id="tab_relacao"]/div[1]/div[1]/div[1]/input', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(initial_month_calendar_select, visible=True, waiting_time=20000)
            initial_month_calendar_select.click()
            
            if not self.USE_CURRENT_MONTH:
                prev_month_button = self.find_element('/html/body/bs-datepicker-container/div/div/div/div/bs-days-calendar-view/bs-calendar-layout/div[1]/bs-datepicker-navigation-view/button[1]', By.XPATH, waiting_time=60000)
                self.wait_for_element_visibility(prev_month_button, visible=True, waiting_time=20000)
                prev_month_button.click()

            calendar_days = self.find_elements("//bs-datepicker-container//bs-days-calendar-view//table/tbody/tr/td", By.XPATH, waiting_time=60000)
            first_cell = True
            for day in calendar_days:
                if first_cell == True:
                    first_cell = False
                    continue
                    
                if day.text == '1':
                    day.click()
                    break

            final_month_calendar_select = self.find_element('//*[@id="tab_relacao"]/div[1]/div[1]/div[2]/input', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(final_month_calendar_select, visible=True, waiting_time=20000)
            final_month_calendar_select.click()
            
            if not self.USE_CURRENT_MONTH:
                prev_month_button = self.find_element('/html/body/bs-datepicker-container/div/div/div/div/bs-days-calendar-view/bs-calendar-layout/div[1]/bs-datepicker-navigation-view/button[1]', By.XPATH, waiting_time=60000)
                self.wait_for_element_visibility(prev_month_button, visible=True, waiting_time=20000)
                prev_month_button.click()

            calendar_days = self.find_elements("//bs-datepicker-container//bs-days-calendar-view//table/tbody/tr/td", By.XPATH, waiting_time=60000)
            last_day = utils.get_last_day_of_month(self.USE_CURRENT_MONTH)

            valid_date = False
            for day in calendar_days:
                if day.text == '20':
                    valid_date = True
                    continue

                if valid_date == True and day.text == str(last_day):
                    day.click()
                    break

            search_button = self.find_element('//*[@id="tab_relacao"]/div[1]/div[1]/div[3]/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(search_button, visible=True, waiting_time=20000)
            search_button.click()
            
            self.loading()

            first_table_row= self.find_element('//*[@id="tab_relacao"]/table/tbody/tr[1]/td[1]', By.XPATH, waiting_time=1000)
            if first_table_row is None:
                print('  ✅ Finalizando processo, NFC-e/CF-e não encontrado.')
                return '🔄 NFC-e/CF-e não encontrado.'

            download_button = self.find_element('//*[@id="tab_relacao"]/div[1]/div[2]/div/button', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(download_button, visible=True, waiting_time=20000)
            download_button.click()

            download_csv_button = self.find_element('//*[@id="tab_relacao"]/div[1]/div[2]/div/ul/li[2]/a', By.XPATH, waiting_time=60000)
            self.wait_for_element_visibility(download_csv_button, visible=True, waiting_time=20000)
            download_csv_button.click()

            latest_csv = utils.wait_for_latest_excel_download(self.DOWNLOAD_FOLDER, timeout=60)
            utils.move_archive_to_folder(latest_csv, os.path.join(self.DOWNLOAD_FOLDER, 'output', self.cnpj))

            print('  ✅ Processo de baixar NFCE/CF-e concluido')
            return '✅ Processo de baixar NFCE/CFE concluido'
        except:
            print('  ❌ Processo de baixar NFC-e/CF-e falhou')
            return '❌ Processo de baixar NFCE/CFE falhou'
   

    def loading(self):
        try:
            print('  🔄 Aguardando carregamento...')
            carregando = self.find_element('//*[@id="carregando"]', By.XPATH, waiting_time=120000)
            self.wait_for_element_visibility(carregando, visible=True, waiting_time=240000)
            self.wait_for_element_visibility(carregando, visible=False, waiting_time=240000)
            print('  ✅ Carregamento concluido')
        except:
            print('  ❌ Carregamento falhou')
            raise Exception('  ❌ Carregamento falhou')


    def verify_divs(self):
        print('  ✅ Verificando quantidade de divs...')
        base_xpath = r'/html/body/app-root/div/app-home/app-resumo-indicadores/div[1]/section[2]/div/div[5]/div/div'
        div = self.find_elements(base_xpath, By.XPATH, waiting_time=10000)
        qtd_div = len(div)
        return qtd_div


    def spans_is_valid(self, div_value, div_qtd=1):
        print('  ✅ Verificando se os spans estao corretos...')
        base_xpath = f'/html/body/app-root/div/app-home/app-resumo-indicadores/div[1]/section[2]/div/div[5]/div/div/div/div/div[2]/span'
        if div_qtd > 1:
            base_xpath = f'/html/body/app-root/div/app-home/app-resumo-indicadores/div[1]/section[2]/div/div[5]/div/div[{div_value + 1}]/div/div/div[2]/span'

        spans = self.find_elements(base_xpath, By.XPATH, waiting_time=10000)
        qtd_spans = len(spans)
        if qtd_spans == 1:
            texto = spans[0].get_attribute('textContent').strip()
            if ('R$' not in texto):
                return False
        return True


    def not_found(self, label):
        print(f"Element not found: {label}")

    
if __name__ == '__main__':
    bot = DteBot()
    bot.action()