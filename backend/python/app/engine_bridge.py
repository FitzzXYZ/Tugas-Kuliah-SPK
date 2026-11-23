import json
import os
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.spk_fallback import calculate_all

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def find_rust_binary() -> Optional[Path]:
    env_bin = os.environ.get("SPK_RUST_BIN", "").strip()
    if env_bin:
        p = Path(env_bin)
        return p if p.is_file() else None

    exe_name = "spk-engine.exe" if os.name == "nt" else "spk-engine"
    candidates = [
        BACKEND_ROOT / "rust" / "target" / "release" / exe_name,
        BACKEND_ROOT / "rust" / "target" / "debug" / exe_name,
    ]
    for path in candidates:
        if path.is_file():
            return path
    return None


def run_calculation(
    alternatives: List[Dict[str, Any]],
    criteria: List[Dict[str, Any]],
) -> Dict[str, Any]:
    rust_bin = find_rust_binary()
    if rust_bin is not None:
        payload = json.dumps({"alternatives": alternatives, "criteria": criteria})
        proc = subprocess.run(
            [str(rust_bin)],
            input=payload,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=10,
            check=False,
        )
        if proc.returncode != 0:
            err_msg = proc.stderr.strip() or "Rust spk-engine mengembalikan galat."
            raise ValueError(err_msg)
        result = json.loads(proc.stdout)
        return {**result, "engine": "rust"}

    # shortcut: fallback Python identik ketika binary Rust belum dikompilasi; otomatis beralih ke Rust setelah `cargo build --release`.
    result = calculate_all(alternatives, criteria)
    return {**result, "engine": "python-fallback"}

