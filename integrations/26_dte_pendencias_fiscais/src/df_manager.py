from datetime import datetime
import pandas as pd

class DataProcessor:
    def __init__(self, excel_path):
        self.excel_path = excel_path
        self.df = pd.read_excel(excel_path, dtype=self.get_dtypes())

        
    def get_dtypes(self):
        return {
            'Nome': str,
            'CNPJ': str,
        }
    
    
    def get_na_status_quantity(self):
        return self.df.shape[0]


    def create_status_columns(self, column):
        if column not in self.df.columns:
            self.df[column] = ''
            self.save_excel(self.excel_path)


    def add_status(self, index, status, column):
        self.df.at[index, column] = status
        self.save_excel(self.excel_path)


    def save_excel(self, path):
        self.df.to_excel(path, index=False, engine='openpyxl', float_format="%.2f")