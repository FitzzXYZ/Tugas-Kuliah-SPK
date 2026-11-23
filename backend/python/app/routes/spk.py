import time
from fastapi import APIRouter, HTTPException

from app.engine_bridge import find_rust_binary, run_calculation
from app.schemas import (
    Alternative,
    AlternativeCreate,
    CalculateRequest,
    Criterion,
    CriterionCreate,
    WeightsUpdate,
    WorkspaceState,
)
from app.storage import load_workspace_data, reset_workspace_data, save_workspace_data

router = APIRouter(prefix="/api", tags=["spk"])


@router.get("/health")
def health_check():
    rust_bin = find_rust_binary()
    return {
        "status": "ok",
        "engine": "rust" if rust_bin else "python-fallback",
        "rustBinaryFound": rust_bin is not None,
    }


@router.get("/workspace", response_model=WorkspaceState)
def get_workspace():
    return load_workspace_data()


@router.put("/workspace", response_model=WorkspaceState)
def put_workspace(payload: WorkspaceState):
    return save_workspace_data(payload.model_dump())


@router.post("/workspace/reset", response_model=WorkspaceState)
def post_workspace_reset():
    return reset_workspace_data()


@router.post("/criteria", response_model=Criterion, status_code=201)
def create_criterion(payload: CriterionCreate):
    ws = load_workspace_data()
    if any(c["kode"].upper() == payload.kode for c in ws["criteria"]):
        raise HTTPException(status_code=409, detail=f"Kode kriteria {payload.kode} sudah digunakan.")

    created = Criterion(id=f"c-{int(time.time() * 1000)}", **payload.model_dump()).model_dump()
    ws["criteria"].append(created)
    default_val = 7.0 if created["tipe"] == "cost" else 75.0
    for alt in ws["alternatives"]:
        alt["nilai"][created["id"]] = default_val
    save_workspace_data(ws)
    return created


@router.put("/criteria/{criterion_id}", response_model=Criterion)
def update_criterion(criterion_id: str, payload: CriterionCreate):
    ws = load_workspace_data()
    idx = next((i for i, c in enumerate(ws["criteria"]) if c["id"] == criterion_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Kriteria tidak ditemukan.")
    if any(c["kode"].upper() == payload.kode and c["id"] != criterion_id for c in ws["criteria"]):
        raise HTTPException(status_code=409, detail=f"Kode kriteria {payload.kode} sudah digunakan.")

    updated = Criterion(id=criterion_id, **payload.model_dump()).model_dump()
    ws["criteria"][idx] = updated
    save_workspace_data(ws)
    return updated


@router.delete("/criteria/{criterion_id}", status_code=204)
def delete_criterion(criterion_id: str):
    ws = load_workspace_data()
    if len(ws["criteria"]) <= 1:
        raise HTTPException(status_code=400, detail="Minimal satu kriteria harus tetap tersedia.")
    next_criteria = [c for c in ws["criteria"] if c["id"] != criterion_id]
    if len(next_criteria) == len(ws["criteria"]):
        raise HTTPException(status_code=404, detail="Kriteria tidak ditemukan.")
    ws["criteria"] = next_criteria
    for alt in ws["alternatives"]:
        alt["nilai"].pop(criterion_id, None)
    save_workspace_data(ws)


@router.post("/alternatives", response_model=Alternative, status_code=201)
def create_alternative(payload: AlternativeCreate):
    ws = load_workspace_data()
    if any(a["kode"].upper() == payload.kode for a in ws["alternatives"]):
        raise HTTPException(status_code=409, detail=f"Kode alternatif {payload.kode} sudah digunakan.")
    missing = [c["kode"] for c in ws["criteria"] if c["id"] not in payload.nilai]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Nilai kriteria belum lengkap: {', '.join(missing)}.",
        )
    created = Alternative(id=f"a-{int(time.time() * 1000)}", **payload.model_dump()).model_dump()
    ws["alternatives"].append(created)
    save_workspace_data(ws)
    return created


@router.put("/alternatives/{alt_id}", response_model=Alternative)
def update_alternative(alt_id: str, payload: AlternativeCreate):
    ws = load_workspace_data()
    idx = next((i for i, a in enumerate(ws["alternatives"]) if a["id"] == alt_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Alternatif tidak ditemukan.")
    if any(a["kode"].upper() == payload.kode and a["id"] != alt_id for a in ws["alternatives"]):
        raise HTTPException(status_code=409, detail=f"Kode alternatif {payload.kode} sudah digunakan.")
    updated = Alternative(id=alt_id, **payload.model_dump()).model_dump()
    ws["alternatives"][idx] = updated
    save_workspace_data(ws)
    return updated


@router.delete("/alternatives/{alt_id}", status_code=204)
def delete_alternative(alt_id: str):
    ws = load_workspace_data()
    next_alts = [a for a in ws["alternatives"] if a["id"] != alt_id]
    if len(next_alts) == len(ws["alternatives"]):
        raise HTTPException(status_code=404, detail="Alternatif tidak ditemukan.")
    ws["alternatives"] = next_alts
    save_workspace_data(ws)


@router.put("/weights", response_model=WorkspaceState)
def update_weights(payload: WeightsUpdate):
    ws = load_workspace_data()
    for c in ws["criteria"]:
        if c["id"] in payload.weights:
            val = float(payload.weights[c["id"]])
            if val <= 0 or val > 100:
                raise HTTPException(status_code=422, detail=f"Bobot {c['kode']} harus antara 0 sampai 100.")
            c["bobot"] = round(val, 2)
    return save_workspace_data(ws)


@router.post("/calculate")
def calculate_spk(payload: CalculateRequest):
    try:
        return run_calculation(
            [a.model_dump() for a in payload.alternatives],
            [c.model_dump() for c in payload.criteria],
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

