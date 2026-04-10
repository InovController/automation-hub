import json
import os
import time
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

SPREADSHEET_NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def emit_log(level: str, message: str) -> None:
    print(f"AH_LOG|{level}|{message}", flush=True)


def emit_progress(value: int, message: str) -> None:
    print(f"AH_PROGRESS|{value}|{message}", flush=True)


def read_json(path_str: str) -> dict:
    path = Path(path_str)
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8-sig"))


def get_env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None:
        raise EnvironmentError(f"Variavel de ambiente obrigatoria ausente: {name}")
    return value


def load_parameters() -> dict:
    parameters_file = os.environ.get("AUTOMATION_PARAMETERS_FILE")
    if parameters_file:
        return read_json(parameters_file)

    metadata_dir = os.environ.get("AUTOMATION_METADATA_DIR")
    if metadata_dir:
        fallback_path = Path(metadata_dir) / "parameters.json"
        if fallback_path.exists():
            return read_json(str(fallback_path))

    return {}


def find_first_xlsx(input_dir: Path) -> Path:
    candidates = sorted(input_dir.glob("*.xlsx"))
    if not candidates:
        raise FileNotFoundError(
            "Nenhum arquivo .xlsx foi enviado. Envie uma planilha para a automacao."
        )
    return candidates[0]


def parse_first_sheet(workbook_path: Path) -> tuple[str, list[list[str]]]:
    with ZipFile(workbook_path) as archive:
        workbook_xml = ET.fromstring(archive.read("xl/workbook.xml"))
        workbook_rels_xml = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))

        sheets = workbook_xml.find("main:sheets", SPREADSHEET_NS)
        if sheets is None or not list(sheets):
            raise ValueError("A planilha nao possui abas.")

        first_sheet = list(sheets)[0]
        sheet_name = first_sheet.attrib.get("name", "Planilha1")
        relationship_id = first_sheet.attrib.get(
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        )
        if not relationship_id:
            raise ValueError("Nao foi possivel localizar a relacao da primeira aba.")

        relationship_map = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in workbook_rels_xml.findall("rel:Relationship", SPREADSHEET_NS)
        }
        target = relationship_map.get(relationship_id)
        if not target:
            raise ValueError("Nao foi possivel localizar o arquivo da primeira aba.")

        target = target.lstrip("/")
        if target.startswith("worksheets/"):
            target = f"xl/{target}"
        elif not target.startswith("xl/"):
            target = f"xl/{target}"

        shared_strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_xml = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_xml.findall("main:si", SPREADSHEET_NS):
                text_value = "".join(item.itertext()).strip()
                shared_strings.append(text_value)

        sheet_xml = ET.fromstring(archive.read(target))
        rows: list[list[str]] = []

        for row in sheet_xml.findall(".//main:sheetData/main:row", SPREADSHEET_NS):
            values: list[str] = []
            for cell in row.findall("main:c", SPREADSHEET_NS):
                cell_type = cell.attrib.get("t")
                value_node = cell.find("main:v", SPREADSHEET_NS)
                if value_node is None or value_node.text is None:
                    values.append("")
                    continue

                raw_value = value_node.text
                if cell_type == "s":
                    shared_index = int(raw_value)
                    values.append(shared_strings[shared_index] if shared_index < len(shared_strings) else "")
                else:
                    values.append(raw_value)

            rows.append(values)

    return sheet_name, rows


def main() -> int:
    execution_id = get_env("AUTOMATION_EXECUTION_ID", "execucao-sem-id")
    input_dir = Path(get_env("AUTOMATION_INPUT_DIR"))
    output_dir = Path(get_env("AUTOMATION_OUTPUT_DIR"))
    parameters = load_parameters()

    output_dir.mkdir(parents=True, exist_ok=True)

    emit_progress(5, "Iniciando automacao de teste")
    emit_log("info", f"Execucao recebida: {execution_id}")
    emit_log("info", f"Parametros recebidos: {json.dumps(parameters, ensure_ascii=False)}")
    time.sleep(0.5)

    emit_progress(15, "Procurando planilha de entrada")
    workbook_path = find_first_xlsx(input_dir)
    emit_log("info", f"Planilha localizada: {workbook_path.name}")
    time.sleep(0.5)

    emit_progress(35, "Abrindo planilha")
    sheet_name, rows = parse_first_sheet(workbook_path)
    emit_log("info", f"Aba principal identificada: {sheet_name}")
    time.sleep(0.5)

    emit_progress(60, "Lendo linhas preenchidas")
    filled_rows = [row for row in rows if any(cell not in (None, "") for cell in row)]
    max_columns = max((len([cell for cell in row if cell not in (None, "")]) for row in filled_rows), default=0)
    emit_log("info", f"Linhas com conteudo: {len(filled_rows)}")
    emit_log("info", f"Maior quantidade de colunas preenchidas em uma linha: {max_columns}")
    time.sleep(0.5)

    emit_progress(80, "Gerando arquivos de saida")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    summary_lines = [
        "AUTOMATION HUB - RESULTADO DE TESTE",
        f"Execucao: {execution_id}",
        f"Arquivo lido: {workbook_path.name}",
        f"Aba principal: {sheet_name}",
        f"Linhas preenchidas: {len(filled_rows)}",
        f"Maior quantidade de colunas preenchidas em uma linha: {max_columns}",
        f"Gerado em: {timestamp}",
        "",
        "Parametros recebidos do formulario:",
        json.dumps(parameters, indent=2, ensure_ascii=False),
    ]
    (output_dir / "resultado.txt").write_text("\n".join(summary_lines), encoding="utf-8")

    emit_log("info", "Arquivo resultado.txt gravado na pasta de output")
    emit_progress(100, "Execucao concluida")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # pragma: no cover - helper script
        emit_log("error", str(exc))
        raise SystemExit(1)
