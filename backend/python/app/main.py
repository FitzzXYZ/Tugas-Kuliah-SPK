from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.spk import router as spk_router

app = FastAPI(
    title="SPK Seleksi Calon Karyawan API",
    version="1.0.0",
    description="Backend FastAPI dengan jembatan engine komputasi Rust untuk metode SAW, WP, dan TOPSIS.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spk_router)

