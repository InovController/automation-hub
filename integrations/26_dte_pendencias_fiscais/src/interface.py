import sys
import threading
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton,
    QTextEdit, QLabel, QHBoxLayout, QCheckBox, QFileDialog, QLineEdit
)
from PyQt5.QtCore import Qt, pyqtSignal, QObject

from dtebot import DteBot


class WorkerSignals(QObject):
    log = pyqtSignal(str)
    finished = pyqtSignal()


class Interface(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Automação SPED GOV - DTE")
        self.setGeometry(300, 150, 550, 400)

        main_layout = QVBoxLayout()

        # Cabeçalho
        header_layout = QHBoxLayout()
        self.label = QLabel("Automação de Baixas no Portal DTE")
        self.label.setAlignment(Qt.AlignCenter)
        self.label.setStyleSheet("font-size:18px; font-weight:bold;")
        header_layout.addWidget(self.label)

        self.theme_switch = QCheckBox("🌙 Modo Escuro")
        self.theme_switch.stateChanged.connect(self.toggle_theme)
        header_layout.addWidget(self.theme_switch, alignment=Qt.AlignRight)
        main_layout.addLayout(header_layout)

        # Seletor de Excel
        file_layout = QHBoxLayout()
        self.file_input = QLineEdit()
        self.file_input.setPlaceholderText("Selecione o arquivo Excel...")
        self.file_input.setReadOnly(True)
        file_layout.addWidget(self.file_input)

        self.select_file_button = QPushButton("📂 Selecionar Excel")
        self.select_file_button.clicked.connect(self.select_excel_file)
        file_layout.addWidget(self.select_file_button)

        main_layout.addLayout(file_layout)

        # Botão principal
        self.start_button = QPushButton("▶ Iniciar Processo")
        self.start_button.clicked.connect(self.run_bot)
        self.start_button.setEnabled(False)  # só libera após selecionar Excel
        main_layout.addWidget(self.start_button)

        self.use_current_month_checkbox = QCheckBox("Usar mês atual")
        self.use_current_month_checkbox.setChecked(False)
        main_layout.addWidget(self.use_current_month_checkbox)

        # Área de log
        self.log_area = QTextEdit()
        self.log_area.setReadOnly(True)
        main_layout.addWidget(self.log_area, 4)

        self.setLayout(main_layout)

        # Conexões
        self.signals = WorkerSignals()
        self.signals.log.connect(self.update_log)
        self.signals.finished.connect(self.process_finished)

        # Tema inicial
        self.apply_light_theme()

    def update_log(self, text):
        self.log_area.append(text)

    def select_excel_file(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self, "Selecione o Excel", "", "Arquivos Excel (*.xlsx *.xls)"
        )
        if filepath:
            self.file_input.setText(filepath)
            self.start_button.setEnabled(True)

    def run_bot(self):
        self.start_button.setEnabled(False)
        self.log_area.clear()
        self.log_area.append("🚀 Iniciando automação...")
        thread = threading.Thread(target=self.execute_bot, daemon=True)
        thread.start()
        
    def execute_bot(self):
        try:
            excel_path = self.file_input.text().strip()
            use_current_month = self.use_current_month_checkbox.isChecked()

            bot = DteBot()
            bot.FILEPATH = excel_path
            bot.USE_CURRENT_MONTH = use_current_month

            # Redirecionar print -> QTextEdit
            import builtins
            original_print = builtins.print

            def custom_print(*args, **kwargs):
                msg = " ".join(str(a) for a in args)
                self.signals.log.emit(msg)
                original_print(*args, **kwargs)  # ainda mostra no console também

            builtins.print = custom_print

            bot.action()

            # Restaurar print
            builtins.print = original_print

            self.signals.finished.emit()

        except Exception as e:
            self.signals.log.emit(f"❌ Erro inesperado: {e}")
            self.signals.finished.emit()

    def process_finished(self):
        self.log_area.append("✅ Processo finalizado.")
        self.start_button.setEnabled(True)

    # ------------------- TEMAS -------------------
    def toggle_theme(self, state):
        if state == Qt.Checked:
            self.apply_dark_theme()
        else:
            self.apply_light_theme()

    def apply_light_theme(self):
        self.setStyleSheet("""
            QWidget { background-color: #f8f9fa; font-family: Segoe UI, Arial; }
            QPushButton {
                background-color: #0078d7; color: white;
                padding: 12px; border-radius: 8px; font-size: 15px;
            }
            QPushButton:hover { background-color: #005a9e; }
            QLineEdit {
                background-color: #ffffff; border: 1px solid #ced4da;
                border-radius: 6px; padding: 6px; font-size: 13px;
            }
            QTextEdit {
                background-color: #ffffff; border: 1px solid #ced4da;
                border-radius: 6px; padding: 8px; font-size: 13px;
            }
        """)

    def apply_dark_theme(self):
        self.setStyleSheet("""
            QWidget { background-color: #2b2b2b; color: #e6e6e6; font-family: Segoe UI, Arial; }
            QPushButton {
                background-color: #3c7dd9; color: white;
                padding: 12px; border-radius: 8px; font-size: 15px;
            }
            QPushButton:hover { background-color: #2a5dab; }
            QLineEdit {
                background-color: #1e1e1e; border: 1px solid #444;
                border-radius: 6px; padding: 6px; font-size: 13px; color: #e6e6e6;
            }
            QTextEdit {
                background-color: #1e1e1e; border: 1px solid #444;
                border-radius: 6px; padding: 8px; font-size: 13px; color: #e6e6e6;
            }
        """)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ui = Interface()
    ui.show()
    sys.exit(app.exec_())
