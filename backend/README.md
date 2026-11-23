# Backend SPK Seleksi Calon Karyawan (Python + Rust)

Backend terpisah penuh dari `frontend/` dengan dua lapisan:

- `python/` (**FastAPI**): REST API, validasi skema Pydantic, persistensi atomik JSON (`data/workspace.json` dari seed `data/workspace.sample.json`), dan jembatan pemanggilan engine komputasi.
- `rust/` (**Rust `spk-engine`**): crate komputasi deterministik untuk metode **SAW**, **WP**, dan **TOPSIS** yang menerima JSON via `stdin` dan mengembalikan matriks langkah + ranking via `stdout`.
- `data/`: berkas seed `workspace.sample.json` (data ilustrasi pembelajaran).

> Jika binary Rust (`rust/target/release/spk-engine(.exe)`) belum dikompilasi, `python/app/engine_bridge.py` otomatis memakai `spk_fallback.py` dengan rumus yang identik dan melaporkan `"engine": "python-fallback"`. Begitu binary Rust dibangun, engine otomatis beralih ke `"engine": "rust"`.

## Endpoint REST API (`/api`)

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/api/health` | Status API & ketersediaan binary Rust |
| `GET` | `/api/workspace` | Ambil metadata, kriteria, dan alternatif |
| `PUT` | `/api/workspace` | Simpan perubahan penuh workspace secara atomik |
| `POST` | `/api/workspace/reset` | Kembalikan workspace ke `data/workspace.sample.json` |
| `POST/PUT/DELETE` | `/api/criteria` | Kelola kriteria (otomatis sinkron ke semua alternatif) |
| `POST/PUT/DELETE` | `/api/alternatives` | Kelola alternatif (validasi nilai positif `> 0`) |
| `PUT` | `/api/weights` | Perbarui bobot kriteria |
| `POST` | `/api/calculate` | Hitung SAW, WP, TOPSIS lengkap dengan matriks langkah & perbandingan |

## Menjalankan Backend Python (FastAPI)

```powershell
cd backend\python
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Menjalankan pengujian API:

```powershell
cd backend\python
uv run pytest -v
```

## Membangun & Menguji Engine Rust (`spk-engine`)

Setelah `rustup` (beserta Visual Studio C++ Build Tools di Windows) terpasang:

```powershell
cd backend\rust
cargo test
cargo build --release
```

Setelah `cargo build --release` selesai, `GET /api/health` dan `POST /api/calculate` pada FastAPI otomatis menggunakan `"engine": "rust"`.
