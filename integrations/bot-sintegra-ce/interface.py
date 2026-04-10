import sys
from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLineEdit, QTextBrowser, QFileDialog, QMessageBox, QLabel
from PyQt6.QtGui import QPalette, QColor
from PyQt6.QtCore import Qt, QThread, pyqtSignal
import os
        
from main import main

class ConsultaThread(QThread):
    log_signal = pyqtSignal(str)

    def __init__(self, interface, file_path):
        super().__init__()
        self.interface = interface
        self.file_path = file_path

    def run(self):
        main(self.interface, self.file_path)

class Interface(QWidget):

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Consulta Sintegra CE")
        self.setGeometry(100, 100, 600, 400)

        self.dark_mode = True
        self.setup_ui()
        self.apply_theme()
        

    def setup_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)

        login_layout = QHBoxLayout()
        layout.addLayout(login_layout)

        layout_line = QHBoxLayout()
        layout.addLayout(layout_line)

        self.arquivo = QLineEdit()
        self.arquivo.setPlaceholderText("Escolha arquivo Excel")
        layout_line.addWidget(self.arquivo)

        self.browse_button = QPushButton("Procurar")
        self.browse_button.clicked.connect(self.open_file_dialog)
        layout_line.addWidget(self.browse_button)

        self.send_button = QPushButton("Enviar")
        self.send_button.clicked.connect(self.send_data)
        layout_line.addWidget(self.send_button)

        self.toggle_theme_button = QPushButton("Alterar Tema")
        self.toggle_theme_button.clicked.connect(self.toggle_theme)
        layout.addWidget(self.toggle_theme_button)

        self.log_area = QTextBrowser()
        layout.addWidget(self.log_area)

    def open_file_dialog(self):
        file_dialog = QFileDialog()
        file_path, _ = file_dialog.getOpenFileName(self, "Escolha um arquivo Excel", "", "Excel Files (*.xls *.xlsx);;All Files (*)")
        if file_path:
            self.arquivo.setText(file_path)

    def toggle_theme(self):
        self.dark_mode = not self.dark_mode
        self.apply_theme()


    def apply_theme(self):
        if self.dark_mode:
            apply_dark_mode(app)
        else:
            apply_light_mode(app)

    
    def start_consultation(self):
        self.log('Iniciando consulta...')
        file_path = self.arquivo.text()

        if not os.path.isfile(file_path):
            self.log('Caminho inválido! Procure a pasta novamente.')
            QMessageBox.warning(self, "Erro", 'Caminho inválido!')
            return

        self.thread = ConsultaThread(self, file_path)
        self.thread.log_signal.connect(self.log)
        self.thread.start()

    def send_data(self):
        self.start_consultation()    

    def log(self, message):
        self.log_area.setText(f'<p>{message}</p>')
        self.log_area.update()


def apply_dark_mode(app):
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor(45, 45, 45))
    palette.setColor(QPalette.ColorRole.WindowText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.Base, QColor(35, 35, 35))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor(45, 45, 45))
    palette.setColor(QPalette.ColorRole.ToolTipBase, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.ToolTipText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.Text, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.Button, QColor(55, 55, 55))
    palette.setColor(QPalette.ColorRole.ButtonText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.BrightText, Qt.GlobalColor.red)
    palette.setColor(QPalette.ColorRole.Link, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.black)
    app.setPalette(palette)
    


def apply_light_mode(app):
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor(230, 230, 230))
    palette.setColor(QPalette.ColorRole.WindowText, Qt.GlobalColor.black)
    palette.setColor(QPalette.ColorRole.Base, QColor(250, 250, 250))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor(240, 240, 240))
    palette.setColor(QPalette.ColorRole.ToolTipBase, Qt.GlobalColor.black)
    palette.setColor(QPalette.ColorRole.ToolTipText, Qt.GlobalColor.black)
    palette.setColor(QPalette.ColorRole.Text, Qt.GlobalColor.black)
    palette.setColor(QPalette.ColorRole.Button, QColor(220, 220, 220))
    palette.setColor(QPalette.ColorRole.ButtonText, Qt.GlobalColor.black)
    palette.setColor(QPalette.ColorRole.BrightText, Qt.GlobalColor.red)
    palette.setColor(QPalette.ColorRole.Link, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.white)
    palette.setColor(QPalette.ColorRole.PlaceholderText, Qt.GlobalColor.darkGray)
    app.setPalette(palette)
    

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = Interface()
    window.show()
    sys.exit(app.exec())