import math
from fastapi.testclient import TestClient

from app.main import app


def make_client(tmp_path, monkeypatch):
    monkeypatch.setenv("SPK_DATA_FILE", str(tmp_path / "workspace.test.json"))
    return TestClient(app)


def test_health_and_seed_workspace(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    ws = client.get("/api/workspace")
    assert ws.status_code == 200
    data = ws.json()
    assert len(data["criteria"]) == 5
    assert [c["nama"] for c in data["criteria"]] == [
        "Pendidikan",
        "Pengalaman",
        "Nilai Tes Tulis",
        "Nilai Wawancara",
        "Gaji",
    ]
    assert [o["label"] for o in data["criteria"][0]["opsi"]] == ["D3", "S1", "S2"]
    assert len(data["alternatives"]) == 6


def test_crud_criteria_syncs_alternatives_and_rejects_invalid_scores(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)

    # Tambah kriteria baru C6 -> otomatis terisi di semua alternatif
    created = client.post(
        "/api/criteria",
        json={
            "kode": "C6",
            "nama": "Sertifikasi Relevan",
            "tipe": "benefit",
            "bobot": 10,
            "satuan": "poin",
        },
    )
    assert created.status_code == 201
    crit_id = created.json()["id"]

    ws = client.get("/api/workspace").json()
    assert len(ws["criteria"]) == 6
    assert all(crit_id in alt["nilai"] for alt in ws["alternatives"])

    # Validasi skor <= 0 ditolak 422
    bad_alt = client.post(
        "/api/alternatives",
        json={
            "kode": "A7",
            "nama": "Test Invalid",
            "posisi": "QA",
            "nilai": {c["id"]: 0 for c in ws["criteria"]},
        },
    )
    assert bad_alt.status_code == 422

    # Hapus kriteria C6 -> bersih dari seluruh alternatif
    deleted = client.delete(f"/api/criteria/{crit_id}")
    assert deleted.status_code == 204
    ws_after = client.get("/api/workspace").json()
    assert len(ws_after["criteria"]) == 5
    assert all(crit_id not in alt["nilai"] for alt in ws_after["alternatives"])


def test_calculate_matches_exact_saw_wp_topsis_reference(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    ws = client.get("/api/workspace").json()

    resp = client.post(
        "/api/calculate",
        json={
            "criteria": ws["criteria"],
            "alternatives": ws["alternatives"],
            "method": "all",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["engine"] in ("rust", "python-fallback")
    assert body["saw"]["rankings"][0]["kode"] == "A6"
    assert body["wp"]["rankings"][0]["kode"] == "A6"
    assert body["topsis"]["rankings"][0]["kode"] == "A6"

    expected_a6_saw = (
        0.20 * (3 / 3)
        + 0.20 * (4 / 4)
        + 0.25 * (82 / 90)
        + 0.20 * (84 / 86)
        + 0.15 * (6.2 / 8.5)
    )
    assert math.isclose(body["saw"]["rankings"][0]["score"], expected_a6_saw, rel_tol=1e-6)
    assert math.isclose(sum(r["score"] for r in body["wp"]["rankings"]), 1.0, rel_tol=1e-9)

