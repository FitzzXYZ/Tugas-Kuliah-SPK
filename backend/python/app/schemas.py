import math
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

CriterionType = Literal["benefit", "cost"]
DecisionType = Literal["belum", "lanjut", "cadangan", "tolak"]
MethodType = Literal["saw", "wp", "topsis", "all"]


class CriterionOption(BaseModel):
    label: str = Field(..., min_length=1)
    nilai: float = Field(..., gt=0)


class Metadata(BaseModel):
    judulSeleksi: str = Field(default="Seleksi Calon Karyawan Divisi Engineering")
    penanggungJawab: str = Field(default="Pengelola / Tim Rekrutmen")
    catatanUmum: str = Field(default="")


class Criterion(BaseModel):
    id: str = Field(..., min_length=1)
    kode: str = Field(..., min_length=2, max_length=10)
    nama: str = Field(..., min_length=2)
    tipe: CriterionType
    bobot: float = Field(..., gt=0, le=100)
    satuan: str = Field(..., min_length=1)
    opsi: Optional[List[CriterionOption]] = None

    @field_validator("kode")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class CriterionCreate(BaseModel):
    kode: str = Field(..., min_length=2, max_length=10)
    nama: str = Field(..., min_length=2)
    tipe: CriterionType
    bobot: float = Field(..., gt=0, le=100)
    satuan: str = Field(..., min_length=1)
    opsi: Optional[List[CriterionOption]] = None

    @field_validator("kode")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class Alternative(BaseModel):
    id: str = Field(..., min_length=1)
    kode: str = Field(..., min_length=2, max_length=10)
    nama: str = Field(..., min_length=2)
    posisi: str = Field(..., min_length=2)
    nilai: Dict[str, float]
    keputusan: DecisionType = "belum"
    catatanManusia: str = ""

    @field_validator("kode")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("nilai")
    @classmethod
    def validate_positive_scores(cls, value: Dict[str, float]) -> Dict[str, float]:
        for key, score in value.items():
            if not math.isfinite(score) or score <= 0:
                raise ValueError(f"Nilai kriteria '{key}' harus lebih besar dari 0.")
        return value


class AlternativeCreate(BaseModel):
    kode: str = Field(..., min_length=2, max_length=10)
    nama: str = Field(..., min_length=2)
    posisi: str = Field(..., min_length=2)
    nilai: Dict[str, float]
    keputusan: DecisionType = "belum"
    catatanManusia: str = ""

    @field_validator("kode")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("nilai")
    @classmethod
    def validate_positive_scores(cls, value: Dict[str, float]) -> Dict[str, float]:
        for key, score in value.items():
            if not math.isfinite(score) or score <= 0:
                raise ValueError(f"Nilai kriteria '{key}' harus lebih besar dari 0.")
        return value


def _validate_workspace_integrity(criteria: List[Criterion], alternatives: List[Alternative]) -> None:
    seen_crit_ids = set()
    seen_crit_codes = set()
    for c in criteria:
        if c.id in seen_crit_ids:
            raise ValueError(f"ID kriteria '{c.id}' duplikat.")
        if c.kode in seen_crit_codes:
            raise ValueError(f"Kode kriteria '{c.kode}' duplikat.")
        seen_crit_ids.add(c.id)
        seen_crit_codes.add(c.kode)

    seen_alt_ids = set()
    seen_alt_codes = set()
    for alt in alternatives:
        if alt.id in seen_alt_ids:
            raise ValueError(f"ID alternatif '{alt.id}' duplikat.")
        if alt.kode in seen_alt_codes:
            raise ValueError(f"Kode alternatif '{alt.kode}' duplikat.")
        seen_alt_ids.add(alt.id)
        seen_alt_codes.add(alt.kode)
        for c in criteria:
            if c.id not in alt.nilai:
                raise ValueError(f"Nilai kriteria {c.kode} belum diisi untuk {alt.kode}.")
            if c.opsi and not any(abs(opt.nilai - alt.nilai[c.id]) < 1e-9 for opt in c.opsi):
                raise ValueError(
                    f"Nilai {alt.kode} pada kriteria {c.kode} harus sesuai opsi skala yang tersedia."
                )


class WorkspaceState(BaseModel):
    metadata: Metadata
    criteria: List[Criterion] = Field(..., min_length=1)
    alternatives: List[Alternative]

    @model_validator(mode="after")
    def validate_integrity(self) -> "WorkspaceState":
        _validate_workspace_integrity(self.criteria, self.alternatives)
        return self


class WeightsUpdate(BaseModel):
    weights: Dict[str, float]


class CalculateRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]
    method: MethodType = "all"

    @model_validator(mode="after")
    def validate_integrity(self) -> "CalculateRequest":
        _validate_workspace_integrity(self.criteria, self.alternatives)
        return self

