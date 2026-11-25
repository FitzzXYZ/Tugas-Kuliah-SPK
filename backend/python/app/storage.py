import json
import os
import threading
from pathlib import Path
from typing import Any, Dict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_FILE = BACKEND_ROOT / "data" / "workspace.sample.json"
DEFAULT_DATA_FILE = BACKEND_ROOT / "data" / "workspace.json"
_WRITE_LOCK = threading.Lock()


def get_data_file() -> Path:
    override = os.environ.get("SPK_DATA_FILE", "").strip()
    return Path(override) if override else DEFAULT_DATA_FILE


def read_sample_workspace() -> Dict[str, Any]:
    return json.loads(SAMPLE_FILE.read_text(encoding="utf-8"))


def save_workspace_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    data_file = get_data_file()
    data_file.parent.mkdir(parents=True, exist_ok=True)
    tmp_file = data_file.with_name(f"{data_file.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    with _WRITE_LOCK:
        try:
            tmp_file.write_text(serialized, encoding="utf-8")
            os.replace(tmp_file, data_file)
        except Exception:
            tmp_file.unlink(missing_ok=True)
            raise
    return payload


def load_workspace_data() -> Dict[str, Any]:
    data_file = get_data_file()
    if not data_file.exists():
        seed = read_sample_workspace()
        return save_workspace_data(seed)
    return json.loads(data_file.read_text(encoding="utf-8"))


def reset_workspace_data() -> Dict[str, Any]:
    seed = read_sample_workspace()
    return save_workspace_data(seed)

