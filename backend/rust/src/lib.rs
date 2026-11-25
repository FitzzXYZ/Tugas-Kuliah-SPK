use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CriterionOption {
    pub label: String,
    pub nilai: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Criterion {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub tipe: String, // "benefit" | "cost"
    pub bobot: f64,
    pub satuan: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub opsi: Option<Vec<CriterionOption>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Alternative {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub posisi: String,
    pub nilai: BTreeMap<String, f64>,
    #[serde(default = "default_decision")]
    pub keputusan: String,
    #[serde(default)]
    pub catatan_manusia: String,
}

fn default_decision() -> String {
    "belum".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeightItem {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub tipe: String,
    pub raw: f64,
    pub weight: f64,
    pub percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedWeightItem {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub tipe: String,
    pub raw: f64,
    pub weight: f64,
    pub percent: f64,
    pub signed_weight: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatrixRow {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub values: BTreeMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeightedRow {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub values: BTreeMap<String, f64>,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Extrema {
    pub max: f64,
    pub min: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VectorSRow {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub factors: BTreeMap<String, f64>,
    pub s_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DistanceRow {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub d_pos: f64,
    pub d_neg: f64,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RankingRow {
    pub rank: usize,
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub posisi: String,
    pub score: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub s_value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub d_pos: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub d_neg: Option<f64>,
    pub alternative: Alternative,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SawResult {
    pub method: String,
    pub weights: Vec<WeightItem>,
    pub extrema: BTreeMap<String, Extrema>,
    pub matrix_x: Vec<MatrixRow>,
    pub matrix_r: Vec<MatrixRow>,
    pub matrix_weighted: Vec<WeightedRow>,
    pub rankings: Vec<RankingRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WpResult {
    pub method: String,
    pub weights: Vec<WeightItem>,
    pub signed_weights: Vec<SignedWeightItem>,
    pub matrix_x: Vec<MatrixRow>,
    pub vector_s: Vec<VectorSRow>,
    pub sum_s: f64,
    pub rankings: Vec<RankingRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TopsisResult {
    pub method: String,
    pub weights: Vec<WeightItem>,
    pub divisors: BTreeMap<String, f64>,
    pub matrix_x: Vec<MatrixRow>,
    pub matrix_r: Vec<MatrixRow>,
    pub matrix_y: Vec<MatrixRow>,
    pub ideal_pos: BTreeMap<String, f64>,
    pub ideal_neg: BTreeMap<String, f64>,
    pub distances: Vec<DistanceRow>,
    pub rankings: Vec<RankingRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComparisonRow {
    pub id: String,
    pub kode: String,
    pub nama: String,
    pub posisi: String,
    pub saw_score: f64,
    pub saw_rank: usize,
    pub wp_score: f64,
    pub wp_rank: usize,
    pub topsis_score: f64,
    pub topsis_rank: usize,
    pub avg_rank: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllMethodsResult {
    pub saw: SawResult,
    pub wp: WpResult,
    pub topsis: TopsisResult,
    pub comparison: Vec<ComparisonRow>,
}

fn validate_inputs(alternatives: &[Alternative], criteria: &[Criterion]) -> Result<(), String> {
    if alternatives.is_empty() {
        return Err("Minimal 1 alternatif diperlukan untuk perhitungan.".to_string());
    }
    if criteria.is_empty() {
        return Err("Minimal 1 kriteria diperlukan untuk perhitungan.".to_string());
    }
    let total_w: f64 = criteria.iter().map(|c| c.bobot).sum();
    if !total_w.is_finite() || total_w <= 0.0 {
        return Err("Total bobot kriteria harus lebih dari 0.".to_string());
    }
    for c in criteria {
        if !c.bobot.is_finite() || c.bobot <= 0.0 {
            return Err(format!("Bobot kriteria {} harus lebih dari 0.", c.kode));
        }
    }
    for alt in alternatives {
        for c in criteria {
            let val = alt.nilai.get(&c.id).copied().unwrap_or(0.0);
            if !val.is_finite() || val <= 0.0 {
                return Err(format!(
                    "Nilai {} pada kriteria {} harus angka positif (> 0).",
                    alt.kode, c.kode
                ));
            }
        }
    }
    Ok(())
}

fn normalize_weights(criteria: &[Criterion]) -> Vec<WeightItem> {
    let raw_total: f64 = criteria.iter().map(|c| c.bobot).sum();
    criteria
        .iter()
        .map(|c| {
            let weight = c.bobot / raw_total;
            WeightItem {
                id: c.id.clone(),
                kode: c.kode.clone(),
                nama: c.nama.clone(),
                tipe: c.tipe.clone(),
                raw: c.bobot,
                weight,
                percent: weight * 100.0,
            }
        })
        .collect()
}

fn build_matrix_x(alternatives: &[Alternative], criteria: &[Criterion]) -> Vec<MatrixRow> {
    alternatives
        .iter()
        .map(|alt| {
            let mut values = BTreeMap::new();
            for c in criteria {
                values.insert(c.id.clone(), *alt.nilai.get(&c.id).unwrap());
            }
            MatrixRow {
                id: alt.id.clone(),
                kode: alt.kode.clone(),
                nama: alt.nama.clone(),
                values,
            }
        })
        .collect()
}

fn avg_cost(alt: &Alternative, criteria: &[Criterion]) -> f64 {
    let cost_vals: Vec<f64> = criteria
        .iter()
        .filter(|c| c.tipe == "cost")
        .filter_map(|c| alt.nilai.get(&c.id).copied())
        .collect();
    if cost_vals.is_empty() {
        0.0
    } else {
        cost_vals.iter().sum::<f64>() / (cost_vals.len() as f64)
    }
}

fn rank_rows(mut rows: Vec<RankingRow>, criteria: &[Criterion]) -> Vec<RankingRow> {
    rows.sort_by(|a, b| {
        let sb = (b.score * 1e12).round();
        let sa = (a.score * 1e12).round();
        sb.total_cmp(&sa)
            .then_with(|| {
                let ca = (avg_cost(&a.alternative, criteria) * 1e12).round();
                let cb = (avg_cost(&b.alternative, criteria) * 1e12).round();
                ca.total_cmp(&cb)
            })
            .then_with(|| a.kode.cmp(&b.kode))
    });
    for (idx, row) in rows.iter_mut().enumerate() {
        row.rank = idx + 1;
    }
    rows
}

pub fn calculate_saw(
    alternatives: &[Alternative],
    criteria: &[Criterion],
) -> Result<SawResult, String> {
    validate_inputs(alternatives, criteria)?;
    let weights = normalize_weights(criteria);
    let matrix_x = build_matrix_x(alternatives, criteria);

    let mut extrema = BTreeMap::new();
    for c in criteria {
        let mut max_v = f64::NEG_INFINITY;
        let mut min_v = f64::INFINITY;
        for alt in alternatives {
            let v = *alt.nilai.get(&c.id).unwrap();
            if v > max_v {
                max_v = v;
            }
            if v < min_v {
                min_v = v;
            }
        }
        extrema.insert(c.id.clone(), Extrema { max: max_v, min: min_v });
    }

    let matrix_r: Vec<MatrixRow> = alternatives
        .iter()
        .map(|alt| {
            let mut values = BTreeMap::new();
            for c in criteria {
                let x = *alt.nilai.get(&c.id).unwrap();
                let ex = &extrema[&c.id];
                let norm = if c.tipe == "cost" { ex.min / x } else { x / ex.max };
                values.insert(c.id.clone(), norm);
            }
            MatrixRow {
                id: alt.id.clone(),
                kode: alt.kode.clone(),
                nama: alt.nama.clone(),
                values,
            }
        })
        .collect();

    let matrix_weighted: Vec<WeightedRow> = matrix_r
        .iter()
        .map(|row| {
            let mut values = BTreeMap::new();
            let mut total = 0.0;
            for w in &weights {
                let part = w.weight * row.values[&w.id];
                values.insert(w.id.clone(), part);
                total += part;
            }
            WeightedRow {
                id: row.id.clone(),
                kode: row.kode.clone(),
                nama: row.nama.clone(),
                values,
                total,
            }
        })
        .collect();

    let raw_rows: Vec<RankingRow> = alternatives
        .iter()
        .enumerate()
        .map(|(i, alt)| RankingRow {
            rank: 0,
            id: alt.id.clone(),
            kode: alt.kode.clone(),
            nama: alt.nama.clone(),
            posisi: alt.posisi.clone(),
            score: matrix_weighted[i].total,
            s_value: None,
            d_pos: None,
            d_neg: None,
            alternative: alt.clone(),
        })
        .collect();

    Ok(SawResult {
        method: "saw".to_string(),
        weights,
        extrema,
        matrix_x,
        matrix_r,
        matrix_weighted,
        rankings: rank_rows(raw_rows, criteria),
    })
}

pub fn calculate_wp(
    alternatives: &[Alternative],
    criteria: &[Criterion],
) -> Result<WpResult, String> {
    validate_inputs(alternatives, criteria)?;
    let weights = normalize_weights(criteria);
    let signed_weights: Vec<SignedWeightItem> = weights
        .iter()
        .map(|w| SignedWeightItem {
            id: w.id.clone(),
            kode: w.kode.clone(),
            nama: w.nama.clone(),
            tipe: w.tipe.clone(),
            raw: w.raw,
            weight: w.weight,
            percent: w.percent,
            signed_weight: if w.tipe == "cost" { -w.weight } else { w.weight },
        })
        .collect();
    let matrix_x = build_matrix_x(alternatives, criteria);

    let vector_s: Vec<VectorSRow> = alternatives
        .iter()
        .map(|alt| {
            let mut log_sum = 0.0;
            let mut factors = BTreeMap::new();
            for sw in &signed_weights {
                let x = *alt.nilai.get(&sw.id).unwrap();
                factors.insert(sw.id.clone(), x.powf(sw.signed_weight));
                log_sum += sw.signed_weight * x.ln();
            }
            VectorSRow {
                id: alt.id.clone(),
                kode: alt.kode.clone(),
                nama: alt.nama.clone(),
                factors,
                s_value: log_sum.exp(),
            }
        })
        .collect();

    let sum_s: f64 = vector_s.iter().map(|r| r.s_value).sum();
    let raw_rows: Vec<RankingRow> = alternatives
        .iter()
        .enumerate()
        .map(|(i, alt)| RankingRow {
            rank: 0,
            id: alt.id.clone(),
            kode: alt.kode.clone(),
            nama: alt.nama.clone(),
            posisi: alt.posisi.clone(),
            score: if sum_s > 0.0 { vector_s[i].s_value / sum_s } else { 0.0 },
            s_value: Some(vector_s[i].s_value),
            d_pos: None,
            d_neg: None,
            alternative: alt.clone(),
        })
        .collect();

    Ok(WpResult {
        method: "wp".to_string(),
        weights,
        signed_weights,
        matrix_x,
        vector_s,
        sum_s,
        rankings: rank_rows(raw_rows, criteria),
    })
}

pub fn calculate_topsis(
    alternatives: &[Alternative],
    criteria: &[Criterion],
) -> Result<TopsisResult, String> {
    validate_inputs(alternatives, criteria)?;
    let weights = normalize_weights(criteria);
    let matrix_x = build_matrix_x(alternatives, criteria);

    let mut divisors = BTreeMap::new();
    for c in criteria {
        let sum_sq: f64 = alternatives
            .iter()
            .map(|a| {
                let v = *a.nilai.get(&c.id).unwrap();
                v * v
            })
            .sum();
        divisors.insert(c.id.clone(), sum_sq.sqrt());
    }

    let matrix_r: Vec<MatrixRow> = alternatives
        .iter()
        .map(|alt| {
            let mut values = BTreeMap::new();
            for c in criteria {
                values.insert(c.id.clone(), *alt.nilai.get(&c.id).unwrap() / divisors[&c.id]);
            }
            MatrixRow {
                id: alt.id.clone(),
                kode: alt.kode.clone(),
                nama: alt.nama.clone(),
                values,
            }
        })
        .collect();

    let matrix_y: Vec<MatrixRow> = matrix_r
        .iter()
        .map(|row| {
            let mut values = BTreeMap::new();
            for w in &weights {
                values.insert(w.id.clone(), w.weight * row.values[&w.id]);
            }
            MatrixRow {
                id: row.id.clone(),
                kode: row.kode.clone(),
                nama: row.nama.clone(),
                values,
            }
        })
        .collect();

    let mut ideal_pos = BTreeMap::new();
    let mut ideal_neg = BTreeMap::new();
    for c in criteria {
        let mut max_v = f64::NEG_INFINITY;
        let mut min_v = f64::INFINITY;
        for row in &matrix_y {
            let v = row.values[&c.id];
            if v > max_v {
                max_v = v;
            }
            if v < min_v {
                min_v = v;
            }
        }
        if c.tipe == "cost" {
            ideal_pos.insert(c.id.clone(), min_v);
            ideal_neg.insert(c.id.clone(), max_v);
        } else {
            ideal_pos.insert(c.id.clone(), max_v);
            ideal_neg.insert(c.id.clone(), min_v);
        }
    }

    let distances: Vec<DistanceRow> = matrix_y
        .iter()
        .map(|row| {
            let d_pos = criteria
                .iter()
                .map(|c| {
                    let diff = row.values[&c.id] - ideal_pos[&c.id];
                    diff * diff
                })
                .sum::<f64>()
                .sqrt();
            let d_neg = criteria
                .iter()
                .map(|c| {
                    let diff = row.values[&c.id] - ideal_neg[&c.id];
                    diff * diff
                })
                .sum::<f64>()
                .sqrt();
            let score = if (d_pos + d_neg) == 0.0 {
                0.5
            } else {
                d_neg / (d_pos + d_neg)
            };
            DistanceRow {
                id: row.id.clone(),
                kode: row.kode.clone(),
                nama: row.nama.clone(),
                d_pos,
                d_neg,
                score,
            }
        })
        .collect();

    let raw_rows: Vec<RankingRow> = alternatives
        .iter()
        .enumerate()
        .map(|(i, alt)| RankingRow {
            rank: 0,
            id: alt.id.clone(),
            kode: alt.kode.clone(),
            nama: alt.nama.clone(),
            posisi: alt.posisi.clone(),
            score: distances[i].score,
            s_value: None,
            d_pos: Some(distances[i].d_pos),
            d_neg: Some(distances[i].d_neg),
            alternative: alt.clone(),
        })
        .collect();

    Ok(TopsisResult {
        method: "topsis".to_string(),
        weights,
        divisors,
        matrix_x,
        matrix_r,
        matrix_y,
        ideal_pos,
        ideal_neg,
        distances,
        rankings: rank_rows(raw_rows, criteria),
    })
}

pub fn calculate_all(
    alternatives: &[Alternative],
    criteria: &[Criterion],
) -> Result<AllMethodsResult, String> {
    let saw = calculate_saw(alternatives, criteria)?;
    let wp = calculate_wp(alternatives, criteria)?;
    let topsis = calculate_topsis(alternatives, criteria)?;

    let saw_map: BTreeMap<&str, &RankingRow> = saw.rankings.iter().map(|r| (r.id.as_str(), r)).collect();
    let wp_map: BTreeMap<&str, &RankingRow> = wp.rankings.iter().map(|r| (r.id.as_str(), r)).collect();
    let topsis_map: BTreeMap<&str, &RankingRow> =
        topsis.rankings.iter().map(|r| (r.id.as_str(), r)).collect();

    let mut comparison: Vec<ComparisonRow> = alternatives
        .iter()
        .map(|alt| {
            let s = saw_map[alt.id.as_str()];
            let w = wp_map[alt.id.as_str()];
            let t = topsis_map[alt.id.as_str()];
            let avg = ((s.rank + w.rank + t.rank) as f64 / 3.0 * 100.0).round() / 100.0;
            ComparisonRow {
                id: alt.id.clone(),
                kode: alt.kode.clone(),
                nama: alt.nama.clone(),
                posisi: alt.posisi.clone(),
                saw_score: s.score,
                saw_rank: s.rank,
                wp_score: w.score,
                wp_rank: w.rank,
                topsis_score: t.score,
                topsis_rank: t.rank,
                avg_rank: avg,
            }
        })
        .collect();

    comparison.sort_by(|a, b| {
        a.avg_rank
            .partial_cmp(&b.avg_rank)
            .unwrap_or(Ordering::Equal)
            .then(a.saw_rank.cmp(&b.saw_rank))
    });

    Ok(AllMethodsResult {
        saw,
        wp,
        topsis,
        comparison,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_data() -> (Vec<Alternative>, Vec<Criterion>) {
        let json_str = include_str!("../../data/workspace.sample.json");
        let parsed: serde_json::Value = serde_json::from_str(json_str).unwrap();
        let criteria: Vec<Criterion> = serde_json::from_value(parsed["criteria"].clone()).unwrap();
        let alternatives: Vec<Alternative> =
            serde_json::from_value(parsed["alternatives"].clone()).unwrap();
        (alternatives, criteria)
    }

    #[test]
    fn saw_wp_topsis_rank_a6_first() {
        let (alts, crits) = sample_data();
        let res = calculate_all(&alts, &crits).unwrap();
        assert_eq!(res.saw.rankings[0].kode, "A6");
        assert_eq!(res.wp.rankings[0].kode, "A6");
        assert_eq!(res.topsis.rankings[0].kode, "A6");

        let expected_a6_saw = 0.20 * (5.0 / 5.0)
            + 0.20 * (4.0 / 4.0)
            + 0.25 * (82.0 / 90.0)
            + 0.20 * (84.0 / 86.0)
            + 0.15 * (6.2 / 8.5);
        assert!((res.saw.rankings[0].score - expected_a6_saw).abs() < 1e-6);

        let sum_wp: f64 = res.wp.rankings.iter().map(|r| r.score).sum();
        assert!((sum_wp - 1.0).abs() < 1e-9);
    }

    #[test]
    fn topsis_handles_identical_alternatives() {
        let crits = vec![
            Criterion {
                id: "c1".into(),
                kode: "C1".into(),
                nama: "Tes".into(),
                tipe: "benefit".into(),
                bobot: 50.0,
                satuan: "poin".into(),
                opsi: None,
            },
            Criterion {
                id: "c2".into(),
                kode: "C2".into(),
                nama: "Gaji".into(),
                tipe: "cost".into(),
                bobot: 50.0,
                satuan: "juta".into(),
                opsi: None,
            },
        ];
        let mut nilai = BTreeMap::new();
        nilai.insert("c1".into(), 80.0);
        nilai.insert("c2".into(), 7.0);
        let alts = vec![
            Alternative {
                id: "a1".into(),
                kode: "A1".into(),
                nama: "Satu".into(),
                posisi: "Dev".into(),
                nilai: nilai.clone(),
                keputusan: "belum".into(),
                catatan_manusia: String::new(),
            },
            Alternative {
                id: "a2".into(),
                kode: "A2".into(),
                nama: "Dua".into(),
                posisi: "Dev".into(),
                nilai,
                keputusan: "belum".into(),
                catatan_manusia: String::new(),
            },
        ];
        let topsis = calculate_topsis(&alts, &crits).unwrap();
        assert_eq!(topsis.rankings[0].score, 0.5);
        assert_eq!(topsis.rankings[1].score, 0.5);
    }
}

