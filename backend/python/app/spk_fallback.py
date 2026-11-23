import math
from typing import Any, Dict, List


def _assert_computable(alternatives: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> None:
    if not alternatives:
        raise ValueError("Minimal 1 alternatif diperlukan untuk perhitungan.")
    if not criteria:
        raise ValueError("Minimal 1 kriteria diperlukan untuk perhitungan.")
    total_weight = sum(float(c["bobot"]) for c in criteria)
    if total_weight <= 0:
        raise ValueError("Total bobot kriteria harus lebih dari 0.")
    for c in criteria:
        if float(c["bobot"]) <= 0:
            raise ValueError(f"Bobot kriteria {c['kode']} harus lebih dari 0.")
    for alt in alternatives:
        nilai = alt.get("nilai", {})
        for c in criteria:
            val = float(nilai.get(c["id"], 0))
            if not math.isfinite(val) or val <= 0:
                raise ValueError(f"Nilai {alt['kode']} pada kriteria {c['kode']} harus > 0.")


def _normalize_weights(criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    raw_total = sum(float(c["bobot"]) for c in criteria)
    items = []
    for c in criteria:
        raw = float(c["bobot"])
        weight = raw / raw_total
        items.append(
            {
                "id": c["id"],
                "kode": c["kode"],
                "nama": c["nama"],
                "tipe": c["tipe"],
                "raw": raw,
                "weight": weight,
                "percent": weight * 100.0,
            }
        )
    return items


def _avg_cost(alt: Dict[str, Any], criteria: List[Dict[str, Any]]) -> float:
    cost_ids = [c["id"] for c in criteria if c["tipe"] == "cost"]
    if not cost_ids:
        return 0.0
    return sum(float(alt["nilai"][cid]) for cid in cost_ids) / len(cost_ids)


def _sort_and_rank(rows: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ordered = sorted(
        rows,
        key=lambda r: (-round(r["score"], 12), _avg_cost(r["alternative"], criteria), r["kode"]),
    )
    return [{**row, "rank": idx + 1} for idx, row in enumerate(ordered)]


def _build_matrix_x(alternatives: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {
            "id": alt["id"],
            "kode": alt["kode"],
            "nama": alt["nama"],
            "values": {c["id"]: float(alt["nilai"][c["id"]]) for c in criteria},
        }
        for alt in alternatives
    ]


def calculate_saw(alternatives: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> Dict[str, Any]:
    _assert_computable(alternatives, criteria)
    weights = _normalize_weights(criteria)
    matrix_x = _build_matrix_x(alternatives, criteria)

    extrema = {}
    for c in criteria:
        vals = [float(a["nilai"][c["id"]]) for a in alternatives]
        extrema[c["id"]] = {"max": max(vals), "min": min(vals)}

    matrix_r = []
    for alt in alternatives:
        vals = {}
        for c in criteria:
            x = float(alt["nilai"][c["id"]])
            vals[c["id"]] = extrema[c["id"]]["min"] / x if c["tipe"] == "cost" else x / extrema[c["id"]]["max"]
        matrix_r.append({"id": alt["id"], "kode": alt["kode"], "nama": alt["nama"], "values": vals})

    matrix_weighted = []
    for row in matrix_r:
        vals = {}
        total = 0.0
        for w in weights:
            part = w["weight"] * row["values"][w["id"]]
            vals[w["id"]] = part
            total += part
        matrix_weighted.append(
            {"id": row["id"], "kode": row["kode"], "nama": row["nama"], "values": vals, "total": total}
        )

    raw_rows = [
        {
            "id": alt["id"],
            "kode": alt["kode"],
            "nama": alt["nama"],
            "posisi": alt["posisi"],
            "score": matrix_weighted[i]["total"],
            "alternative": alt,
        }
        for i, alt in enumerate(alternatives)
    ]

    return {
        "method": "saw",
        "weights": weights,
        "extrema": extrema,
        "matrixX": matrix_x,
        "matrixR": matrix_r,
        "matrixWeighted": matrix_weighted,
        "rankings": _sort_and_rank(raw_rows, criteria),
    }


def calculate_wp(alternatives: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> Dict[str, Any]:
    _assert_computable(alternatives, criteria)
    weights = _normalize_weights(criteria)
    signed_weights = [
        {**w, "signedWeight": -w["weight"] if w["tipe"] == "cost" else w["weight"]} for w in weights
    ]
    matrix_x = _build_matrix_x(alternatives, criteria)

    vector_s = []
    for alt in alternatives:
        log_sum = 0.0
        factors = {}
        for sw in signed_weights:
            x = float(alt["nilai"][sw["id"]])
            factors[sw["id"]] = x ** sw["signedWeight"]
            log_sum += sw["signedWeight"] * math.log(x)
        vector_s.append(
            {
                "id": alt["id"],
                "kode": alt["kode"],
                "nama": alt["nama"],
                "factors": factors,
                "sValue": math.exp(log_sum),
            }
        )

    sum_s = sum(item["sValue"] for item in vector_s)
    raw_rows = [
        {
            "id": alt["id"],
            "kode": alt["kode"],
            "nama": alt["nama"],
            "posisi": alt["posisi"],
            "sValue": vector_s[i]["sValue"],
            "score": vector_s[i]["sValue"] / sum_s if sum_s > 0 else 0.0,
            "alternative": alt,
        }
        for i, alt in enumerate(alternatives)
    ]

    return {
        "method": "wp",
        "weights": weights,
        "signedWeights": signed_weights,
        "matrixX": matrix_x,
        "vectorS": vector_s,
        "sumS": sum_s,
        "rankings": _sort_and_rank(raw_rows, criteria),
    }


def calculate_topsis(alternatives: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> Dict[str, Any]:
    _assert_computable(alternatives, criteria)
    weights = _normalize_weights(criteria)
    matrix_x = _build_matrix_x(alternatives, criteria)

    divisors = {
        c["id"]: math.sqrt(sum(float(a["nilai"][c["id"]]) ** 2 for a in alternatives)) for c in criteria
    }

    matrix_r = [
        {
            "id": alt["id"],
            "kode": alt["kode"],
            "nama": alt["nama"],
            "values": {c["id"]: float(alt["nilai"][c["id"]]) / divisors[c["id"]] for c in criteria},
        }
        for alt in alternatives
    ]

    matrix_y = [
        {
            "id": row["id"],
            "kode": row["kode"],
            "nama": row["nama"],
            "values": {w["id"]: w["weight"] * row["values"][w["id"]] for w in weights},
        }
        for row in matrix_r
    ]

    ideal_pos = {}
    ideal_neg = {}
    for c in criteria:
        col = [row["values"][c["id"]] for row in matrix_y]
        ideal_pos[c["id"]] = min(col) if c["tipe"] == "cost" else max(col)
        ideal_neg[c["id"]] = max(col) if c["tipe"] == "cost" else min(col)

    distances = []
    for row in matrix_y:
        d_pos = math.sqrt(sum((row["values"][c["id"]] - ideal_pos[c["id"]]) ** 2 for c in criteria))
        d_neg = math.sqrt(sum((row["values"][c["id"]] - ideal_neg[c["id"]]) ** 2 for c in criteria))
        score = 0.5 if (d_pos + d_neg) == 0 else d_neg / (d_pos + d_neg)
        distances.append(
            {
                "id": row["id"],
                "kode": row["kode"],
                "nama": row["nama"],
                "dPos": d_pos,
                "dNeg": d_neg,
                "score": score,
            }
        )

    raw_rows = [
        {
            "id": alt["id"],
            "kode": alt["kode"],
            "nama": alt["nama"],
            "posisi": alt["posisi"],
            "dPos": distances[i]["dPos"],
            "dNeg": distances[i]["dNeg"],
            "score": distances[i]["score"],
            "alternative": alt,
        }
        for i, alt in enumerate(alternatives)
    ]

    return {
        "method": "topsis",
        "weights": weights,
        "divisors": divisors,
        "matrixX": matrix_x,
        "matrixR": matrix_r,
        "matrixY": matrix_y,
        "idealPos": ideal_pos,
        "idealNeg": ideal_neg,
        "distances": distances,
        "rankings": _sort_and_rank(raw_rows, criteria),
    }


def calculate_all(alternatives: List[Dict[str, Any]], criteria: List[Dict[str, Any]]) -> Dict[str, Any]:
    saw = calculate_saw(alternatives, criteria)
    wp = calculate_wp(alternatives, criteria)
    topsis = calculate_topsis(alternatives, criteria)

    saw_map = {item["id"]: item for item in saw["rankings"]}
    wp_map = {item["id"]: item for item in wp["rankings"]}
    topsis_map = {item["id"]: item for item in topsis["rankings"]}

    comparison = []
    for alt in alternatives:
        s = saw_map[alt["id"]]
        w = wp_map[alt["id"]]
        t = topsis_map[alt["id"]]
        comparison.append(
            {
                "id": alt["id"],
                "kode": alt["kode"],
                "nama": alt["nama"],
                "posisi": alt["posisi"],
                "sawScore": s["score"],
                "sawRank": s["rank"],
                "wpScore": w["score"],
                "wpRank": w["rank"],
                "topsisScore": t["score"],
                "topsisRank": t["rank"],
                "avgRank": round((s["rank"] + w["rank"] + t["rank"]) / 3.0, 2),
            }
        )
    comparison.sort(key=lambda item: (item["avgRank"], item["sawRank"]))

    return {
        "saw": saw,
        "wp": wp,
        "topsis": topsis,
        "comparison": comparison,
    }

