from typing import Dict, List, Literal
from pydantic import BaseModel, Field, field_validator

CriterionType = Literal["benefit", "cost"]
DecisionType = Literal["belum", "lanjut", "cadangan", "tolak"]
MethodType = Literal["saw", "wp", "topsis", "all"]


class Metadata(BaseModel):
    judulSeleksi: str = Field(default="Seleksi Calon Karyawan Divisi Engineering", min_length=1)
    penanggungJawab: str = Field(default="Pengelola / Tim Rekrutmen")
    catatanUmum: str = Field(default="")


class Criterion(BaseModel):
    id: str = Field(..., min_length=1)
    kode: str = Field(..., min_length=2, max_length=10)
    nama: str = Field(..., min_length=2)
    tipe: CriterionType
    bobot: float = Field(..., gt=0, le=100)
    satuan: str = Field(..., min_length=1)

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
            if score <= 0:
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
            if score <= 0:
                raise ValueError(f"Nilai kriteria '{key}' harus lebih besar dari 0.")
        return value


class WorkspaceState(BaseModel):
    metadata: Metadata
    criteria: List[Criterion]
    alternatives: List[Alternative]


class WeightsUpdate(BaseModel):
    weights: Dict[str, float]


class CalculateRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]
    method: MethodType = "all"

