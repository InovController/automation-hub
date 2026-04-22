import calendar
import datetime
import glob
import os
import shutil
import time


months = [
    "Janeiro", "Fevereiro", "Março", "Abril", 
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
]


def get_month(use_current_month: bool):
    today = datetime.date.today()

    if use_current_month:
        return months[today.month - 1]
    else:
        first_day_this_month = today.replace(day=1)
        last_day_previous_month = first_day_this_month - datetime.timedelta(days=1)
        return months[last_day_previous_month.month - 1]
    

def get_year(use_current_month: bool):
    today = datetime.date.today()

    if use_current_month:
        # Ano atual
        return today.year
    else:
        # Último ano fechado (ano anterior)
        first_day_this_month = today.replace(day=1)
        last_day_previous_month = first_day_this_month - datetime.timedelta(days=1)
        return last_day_previous_month.year


def get_last_day_of_month(use_current_month: bool):
    today = datetime.date.today()

    if use_current_month:
        return today.day

    first_day_this_month = today.replace(day=1)
    last_day_previous_month = first_day_this_month - datetime.timedelta(days=1)
    return last_day_previous_month.day

   
def wait_for_latest_excel_download(folder, timeout=60):
    print("    🔄 Aguardando o download do Excel...")
    end_time = time.time() + timeout

    while time.time() < end_time:
        excel_files = [
            f for f in glob.glob(os.path.join(folder, "*.csv*"))
            if not f.endswith(".crdownload")
        ]
        
        if excel_files:
            latest_file = max(excel_files, key=os.path.getctime)
            print("    ✅ Excel baixado")
            return latest_file

        time.sleep(1)

    print("  ❌ Timeout ao esperar o download do Excel.")
    raise TimeoutError("Timeout ao esperar o download do Excel.")


def move_archive_to_folder(archive_path, folder_path):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    nome_arquivo = os.path.basename(archive_path)
    destino = os.path.join(folder_path, nome_arquivo)

    base, ext = os.path.splitext(nome_arquivo)
    contador = 1
    while os.path.exists(destino):
        nome_arquivo = f"{base} ({contador}){ext}"
        destino = os.path.join(folder_path, nome_arquivo)
        contador += 1

    shutil.move(archive_path, destino)