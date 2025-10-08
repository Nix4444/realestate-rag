import io
import csv
import json
from typing import List


def extract_texts_from_file(filename: str, content_type: str, raw_bytes: bytes) -> List[str]:
    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    if ctype in ("text/csv", "application/csv", "application/vnd.ms-excel") or name.endswith(".csv"):
        stream = io.StringIO(raw_bytes.decode("utf-8"))
        reader = csv.reader(stream)
        texts: List[str] = []
        for row in reader:
            joined = " ".join(str(cell) for cell in row if cell is not None).strip()
            if joined:
                texts.append(joined)
        return texts

    try:
        data = json.loads(raw_bytes.decode("utf-8"))
    except Exception as e:
        raise ValueError("Unsupported or invalid file. Provide CSV or JSON.") from e

    texts: List[str] = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                texts.append(item)
            elif isinstance(item, dict):
                texts.append(" ".join(str(v) for v in item.values()))
            else:
                texts.append(str(item))
        return texts

    if isinstance(data, dict) and isinstance(data.get("items"), list):
        for item in data["items"]:
            if isinstance(item, str):
                texts.append(item)
            elif isinstance(item, dict):
                texts.append(" ".join(str(v) for v in item.values()))
            else:
                texts.append(str(item))
        return texts

    return [str(data)]


