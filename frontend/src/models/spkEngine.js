// Engine komputasi SPK murni (tanpa ketergantungan DOM) untuk SAW, WP, dan TOPSIS.
// Rumus dan aturan pengurutan dibuat identik dengan backend/python dan backend/rust.

export const MIN_ALTERNATIVES = 4;
export const MIN_CRITERIA = 5;

export const VALID_METHODS = ['saw', 'wp', 'topsis'];
export const VALID_TYPES = ['benefit', 'cost'];
export const VALID_DECISIONS = ['belum', 'lanjut', 'cadangan', 'tolak'];

export const METHOD_INFO = {
  saw: {
    id: 'saw',
    nama: 'SAW',
    namaAwam: 'Penjumlahan Nilai (Disarankan)',
    namaLengkap: 'Simple Additive Weighting',
    ringkas: 'Membandingkan nilai tiap pelamar dengan nilai terbaik lalu mengalikan dengan bobot prioritas. Paling mudah dipahami untuk seleksi umum.',
    rumus: 'r_ij = x_ij / max(x_j) [benefit] | min(x_j) / x_ij [cost];  V_i = Σ (w_j × r_ij)',
  },
  wp: {
    id: 'wp',
    nama: 'WP',
    namaAwam: 'Perkalian Berbobot',
    namaLengkap: 'Weighted Product',
    ringkas: 'Menggabungkan nilai dengan perkalian berpangkat bobot. Pelamar yang punya satu nilai jauh tertinggal akan lebih mudah terlihat turun.',
    rumus: 'S_i = Π (x_ij ^ ±w_j) = exp(Σ (±w_j × ln(x_ij)));  V_i = S_i / Σ S_k',
  },
  topsis: {
    id: 'topsis',
    nama: 'TOPSIS',
    namaAwam: 'Jarak ke Profil Ideal',
    namaLengkap: 'Technique for Order Preference by Similarity to Ideal Solution',
    ringkas: 'Mengukur seberapa dekat pelamar dengan profil ideal terbaik sekaligus seberapa jauh dari profil terburuk.',
    rumus: 'r_ij = x_ij / √Σx²;  y_ij = w_j × r_ij;  C_i = D-_i / (D+_i + D-_i)',
  },
};

export const DECISION_LABELS = {
  belum: 'Belum diputuskan',
  lanjut: 'Lanjut wawancara akhir',
  cadangan: 'Cadangan',
  tolak: 'Tidak lolos',
};

export function roundNum(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export function formatCriterionValue(criterion, value) {
  if (Array.isArray(criterion?.opsi) && criterion.opsi.length > 0) {
    const num = Number(value);
    const found = criterion.opsi.find((opt) => Number(opt.nilai) === num);
    if (found) return found.label;
  }
  return String(value ?? '-');
}

export function formatCriterionDisplay(criterion, value) {
  if (Array.isArray(criterion?.opsi) && criterion.opsi.length > 0) {
    const label = formatCriterionValue(criterion, value);
    return `${label} (${value})`;
  }
  return `${value ?? '-'} ${criterion?.satuan || ''}`.trim();
}

export function validateCriterion(input, existingCriteria = [], editingId = null) {
  const errors = {};
  const kode = String(input?.kode ?? '').trim().toUpperCase();
  const nama = String(input?.nama ?? '').trim();
  const tipe = VALID_TYPES.includes(input?.tipe) ? input.tipe : '';
  const satuan = String(input?.satuan ?? '').trim();
  const bobot = Number(input?.bobot);

  if (kode.length < 2 || kode.length > 10) {
    errors.kode = 'Kode kriteria 2 sampai 10 karakter (mis. C6).';
  } else {
    const duplicate = existingCriteria.some(
      (c) => c.kode.toUpperCase() === kode && c.id !== editingId,
    );
    if (duplicate) errors.kode = `Kode ${kode} sudah dipakai kriteria lain.`;
  }

  if (nama.length < 2) errors.nama = 'Nama kriteria minimal 2 karakter.';
  if (!tipe) errors.tipe = 'Pilih tipe benefit atau cost.';
  if (satuan.length < 1) errors.satuan = 'Satuan nilai wajib diisi (mis. poin, tahun, juta Rp).';
  if (!Number.isFinite(bobot) || bobot <= 0 || bobot > 100) {
    errors.bobot = 'Bobot harus lebih besar dari 0 hingga 100.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    criterion: {
      id: input?.id ? String(input.id) : '',
      kode,
      nama,
      tipe: tipe || 'benefit',
      satuan,
      bobot: roundNum(bobot, 2),
      ...(Array.isArray(input?.opsi) && input.opsi.length > 0 ? { opsi: input.opsi } : {}),
    },
  };
}

export function validateAlternative(input, criteria, existingAlternatives = [], editingId = null) {
  const errors = {};
  const kode = String(input?.kode ?? '').trim().toUpperCase();
  const nama = String(input?.nama ?? '').trim();
  const posisi = String(input?.posisi ?? '').trim();
  const keputusan = VALID_DECISIONS.includes(input?.keputusan) ? input.keputusan : 'belum';
  const catatanManusia = String(input?.catatanManusia ?? '').trim();

  if (kode.length < 2 || kode.length > 10) {
    errors.kode = 'Kode alternatif 2 sampai 10 karakter (mis. A7).';
  } else {
    const duplicate = existingAlternatives.some(
      (a) => a.kode.toUpperCase() === kode && a.id !== editingId,
    );
    if (duplicate) errors.kode = `Kode ${kode} sudah dipakai alternatif lain.`;
  }

  if (nama.length < 2) errors.nama = 'Nama calon karyawan minimal 2 karakter.';
  if (posisi.length < 2) errors.posisi = 'Posisi yang dilamar wajib diisi.';

  const nilai = {};
  for (const c of criteria) {
    const raw = input?.nilai?.[c.id];
    const num = Number(raw);
    if (raw === '' || raw === null || raw === undefined || !Number.isFinite(num) || num <= 0) {
      errors[`nilai.${c.id}`] = `Nilai ${c.kode} (${c.nama}) harus angka positif lebih dari 0.`;
    } else {
      nilai[c.id] = roundNum(num, 4);
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    alternative: {
      id: input?.id ? String(input.id) : '',
      kode,
      nama,
      posisi,
      nilai,
      keputusan,
      catatanManusia,
    },
  };
}

export function syncAlternativesWithCriteria(alternatives, criteria, newCriterion = null) {
  const validIds = new Set(criteria.map((c) => c.id));
  return alternatives.map((alt) => {
    const nextNilai = {};
    for (const c of criteria) {
      const existing = alt.nilai?.[c.id];
      if (Number.isFinite(Number(existing)) && Number(existing) > 0) {
        nextNilai[c.id] = Number(existing);
      } else if (newCriterion && c.id === newCriterion.id) {
        nextNilai[c.id] = newCriterion.tipe === 'cost' ? 7 : 75;
      } else {
        nextNilai[c.id] = c.tipe === 'cost' ? 7 : 75;
      }
    }
    // Pastikan kunci kriteria lama yang sudah dihapus tidak tersisa.
    for (const key of Object.keys(nextNilai)) {
      if (!validIds.has(key)) delete nextNilai[key];
    }
    return { ...alt, nilai: nextNilai };
  });
}

export function normalizeCriteriaWeightsTo100(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0) return [];
  const total = criteria.reduce((sum, c) => sum + (Number(c.bobot) > 0 ? Number(c.bobot) : 0), 0);
  if (total <= 0) {
    const equal = roundNum(100 / criteria.length, 2);
    const list = criteria.map((c) => ({ ...c, bobot: equal }));
    const drift = roundNum(100 - list.reduce((s, c) => s + c.bobot, 0), 2);
    list[0].bobot = roundNum(list[0].bobot + drift, 2);
    return list;
  }

  const normalized = criteria.map((c) => ({
    ...c,
    bobot: roundNum((Number(c.bobot) / total) * 100, 2),
  }));
  const sumAfter = normalized.reduce((s, c) => s + c.bobot, 0);
  const drift = roundNum(100 - sumAfter, 2);
  if (Math.abs(drift) > 0 && normalized.length > 0) {
    normalized[0].bobot = roundNum(normalized[0].bobot + drift, 2);
  }
  return normalized;
}

export function getWeightSummary(criteria) {
  const list = Array.isArray(criteria) ? criteria : [];
  const rawTotal = list.reduce((sum, c) => sum + (Number(c.bobot) || 0), 0);
  const items = list.map((c) => {
    const raw = Number(c.bobot) || 0;
    const weight = rawTotal > 0 ? raw / rawTotal : 0;
    return {
      id: c.id,
      kode: c.kode,
      nama: c.nama,
      tipe: c.tipe,
      raw,
      weight,
      percent: weight * 100,
    };
  });
  return {
    rawTotal: roundNum(rawTotal, 2),
    isExact100: Math.abs(rawTotal - 100) <= 0.05,
    items,
  };
}

export function detectDataIssues(alternatives, criteria) {
  const issues = [];
  const alts = Array.isArray(alternatives) ? alternatives : [];
  const crits = Array.isArray(criteria) ? criteria : [];

  if (alts.length < MIN_ALTERNATIVES) {
    issues.push({
      level: 'warn',
      message: `Jumlah alternatif saat ini ${alts.length} orang (ketentuan minimum proyek: ${MIN_ALTERNATIVES} alternatif).`,
    });
  }
  if (crits.length < MIN_CRITERIA) {
    issues.push({
      level: 'warn',
      message: `Jumlah kriteria saat ini ${crits.length} buah (ketentuan minimum proyek: ${MIN_CRITERIA} kriteria).`,
    });
  }

  const weightSummary = getWeightSummary(crits);
  if (crits.length > 0 && !weightSummary.isExact100) {
    issues.push({
      level: 'warn',
      message: `Total bobot input ${weightSummary.rawTotal}% (belum 100%). Perhitungan tetap menormalisasi bobot otomatis, atau gunakan tombol Normalisasi ke 100%.`,
    });
  }

  const missingNotes = alts.filter((a) => !String(a.catatanManusia ?? '').trim());
  if (missingNotes.length > 0) {
    issues.push({
      level: 'info',
      message: `${missingNotes.length} alternatif belum memiliki catatan pertimbangan manusia (${missingNotes.map((a) => a.kode).join(', ')}).`,
    });
  }

  return issues;
}

function assertComputable(alternatives, criteria) {
  if (!Array.isArray(alternatives) || alternatives.length === 0) {
    throw new Error('Minimal 1 alternatif diperlukan untuk menjalankan perhitungan.');
  }
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error('Minimal 1 kriteria diperlukan untuk menjalankan perhitungan.');
  }
  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.bobot), 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error('Total bobot kriteria harus lebih dari 0.');
  }
  for (const c of criteria) {
    if (!Number.isFinite(Number(c.bobot)) || Number(c.bobot) <= 0) {
      throw new Error(`Bobot kriteria ${c.kode} harus lebih dari 0.`);
    }
  }
  for (const alt of alternatives) {
    for (const c of criteria) {
      const val = Number(alt.nilai?.[c.id]);
      if (!Number.isFinite(val) || val <= 0) {
        throw new Error(`Nilai ${alt.kode} pada kriteria ${c.kode} harus angka positif (> 0).`);
      }
    }
  }
}

function averageCostValue(alt, criteria) {
  const costCriteria = criteria.filter((c) => c.tipe === 'cost');
  if (costCriteria.length === 0) return 0;
  const total = costCriteria.reduce((sum, c) => sum + Number(alt.nilai[c.id]), 0);
  return total / costCriteria.length;
}

function sortAndRank(rows, criteria) {
  const sorted = [...rows].sort((a, b) => {
    if (Math.abs(b.score - a.score) > 1e-12) return b.score - a.score;
    const costDiff = averageCostValue(a.alternative, criteria) - averageCostValue(b.alternative, criteria);
    if (Math.abs(costDiff) > 1e-12) return costDiff;
    return a.alternative.kode.localeCompare(b.alternative.kode);
  });
  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export function calculateSAW(alternatives, criteria) {
  assertComputable(alternatives, criteria);
  const weightSummary = getWeightSummary(criteria);
  const weights = weightSummary.items;

  const extrema = {};
  for (const c of criteria) {
    const vals = alternatives.map((a) => Number(a.nilai[c.id]));
    extrema[c.id] = {
      max: Math.max(...vals),
      min: Math.min(...vals),
    };
  }

  const matrixX = alternatives.map((alt) => ({
    id: alt.id,
    kode: alt.kode,
    nama: alt.nama,
    values: Object.fromEntries(criteria.map((c) => [c.id, Number(alt.nilai[c.id])])),
  }));

  const matrixR = alternatives.map((alt) => {
    const values = {};
    for (const c of criteria) {
      const x = Number(alt.nilai[c.id]);
      values[c.id] = c.tipe === 'cost' ? extrema[c.id].min / x : x / extrema[c.id].max;
    }
    return { id: alt.id, kode: alt.kode, nama: alt.nama, values };
  });

  const matrixWeighted = matrixR.map((row) => {
    const values = {};
    let total = 0;
    for (const w of weights) {
      const part = w.weight * row.values[w.id];
      values[w.id] = part;
      total += part;
    }
    return { id: row.id, kode: row.kode, nama: row.nama, values, total };
  });

  const rawRows = alternatives.map((alt, i) => ({
    id: alt.id,
    kode: alt.kode,
    nama: alt.nama,
    posisi: alt.posisi,
    score: matrixWeighted[i].total,
    alternative: alt,
  }));

  const rankings = sortAndRank(rawRows, criteria);

  return {
    method: 'saw',
    weights,
    extrema,
    matrixX,
    matrixR,
    matrixWeighted,
    rankings,
  };
}

export function calculateWP(alternatives, criteria) {
  assertComputable(alternatives, criteria);
  const weightSummary = getWeightSummary(criteria);
  const weights = weightSummary.items;
  const signedWeights = weights.map((w) => ({
    ...w,
    signedWeight: w.tipe === 'cost' ? -w.weight : w.weight,
  }));

  const matrixX = alternatives.map((alt) => ({
    id: alt.id,
    kode: alt.kode,
    nama: alt.nama,
    values: Object.fromEntries(criteria.map((c) => [c.id, Number(alt.nilai[c.id])])),
  }));

  const vectorS = alternatives.map((alt) => {
    let logSum = 0;
    const factors = {};
    for (const sw of signedWeights) {
      const x = Number(alt.nilai[sw.id]);
      const term = x ** sw.signedWeight;
      factors[sw.id] = term;
      logSum += sw.signedWeight * Math.log(x);
    }
    return {
      id: alt.id,
      kode: alt.kode,
      nama: alt.nama,
      factors,
      sValue: Math.exp(logSum),
    };
  });

  const sumS = vectorS.reduce((sum, item) => sum + item.sValue, 0);

  const rawRows = alternatives.map((alt, i) => ({
    id: alt.id,
    kode: alt.kode,
    nama: alt.nama,
    posisi: alt.posisi,
    sValue: vectorS[i].sValue,
    score: sumS > 0 ? vectorS[i].sValue / sumS : 0,
    alternative: alt,
  }));

  const rankings = sortAndRank(rawRows, criteria);

  return {
    method: 'wp',
    weights,
    signedWeights,
    matrixX,
    vectorS,
    sumS,
    rankings,
  };
}

export function calculateTOPSIS(alternatives, criteria) {
  assertComputable(alternatives, criteria);
  const weightSummary = getWeightSummary(criteria);
  const weights = weightSummary.items;

  const matrixX = alternatives.map((alt) => ({
    id: alt.id,
    kode: alt.kode,
    nama: alt.nama,
    values: Object.fromEntries(criteria.map((c) => [c.id, Number(alt.nilai[c.id])])),
  }));

  const divisors = {};
  for (const c of criteria) {
    const sumSq = alternatives.reduce((sum, a) => sum + Number(a.nilai[c.id]) ** 2, 0);
    divisors[c.id] = Math.sqrt(sumSq);
  }

  const matrixR = alternatives.map((alt) => {
    const values = {};
    for (const c of criteria) {
      values[c.id] = Number(alt.nilai[c.id]) / divisors[c.id];
    }
    return { id: alt.id, kode: alt.kode, nama: alt.nama, values };
  });

  const matrixY = matrixR.map((row) => {
    const values = {};
    for (const w of weights) {
      values[w.id] = w.weight * row.values[w.id];
    }
    return { id: row.id, kode: row.kode, nama: row.nama, values };
  });

  const idealPos = {};
  const idealNeg = {};
  for (const c of criteria) {
    const col = matrixY.map((row) => row.values[c.id]);
    const maxVal = Math.max(...col);
    const minVal = Math.min(...col);
    idealPos[c.id] = c.tipe === 'cost' ? minVal : maxVal;
    idealNeg[c.id] = c.tipe === 'cost' ? maxVal : minVal;
  }

  const distances = matrixY.map((row) => {
    let sumPos = 0;
    let sumNeg = 0;
    for (const c of criteria) {
      sumPos += (row.values[c.id] - idealPos[c.id]) ** 2;
      sumNeg += (row.values[c.id] - idealNeg[c.id]) ** 2;
    }
    const dPos = Math.sqrt(sumPos);
    const dNeg = Math.sqrt(sumNeg);
    // Guard: bila seluruh kandidat identik (dPos + dNeg == 0), berikan skor netral 0.5 alih-alih NaN.
    const score = dPos + dNeg === 0 ? 0.5 : dNeg / (dPos + dNeg);
    return {
      id: row.id,
      kode: row.kode,
      nama: row.nama,
      dPos,
      dNeg,
      score,
    };
  });

  const rawRows = alternatives.map((alt, i) => ({
    id: alt.id,
    kode: alt.kode,
    nama: alt.nama,
    posisi: alt.posisi,
    dPos: distances[i].dPos,
    dNeg: distances[i].dNeg,
    score: distances[i].score,
    alternative: alt,
  }));

  const rankings = sortAndRank(rawRows, criteria);

  return {
    method: 'topsis',
    weights,
    divisors,
    matrixX,
    matrixR,
    matrixY,
    idealPos,
    idealNeg,
    distances,
    rankings,
  };
}

export function calculateAllMethods(alternatives, criteria) {
  const saw = calculateSAW(alternatives, criteria);
  const wp = calculateWP(alternatives, criteria);
  const topsis = calculateTOPSIS(alternatives, criteria);

  const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));
  const sawMap = byId(saw.rankings);
  const wpMap = byId(wp.rankings);
  const topsisMap = byId(topsis.rankings);

  const comparison = alternatives.map((alt) => {
    const s = sawMap[alt.id];
    const w = wpMap[alt.id];
    const t = topsisMap[alt.id];
    const avgRank = roundNum((s.rank + w.rank + t.rank) / 3, 2);
    return {
      id: alt.id,
      kode: alt.kode,
      nama: alt.nama,
      posisi: alt.posisi,
      sawScore: s.score,
      sawRank: s.rank,
      wpScore: w.score,
      wpRank: w.rank,
      topsisScore: t.score,
      topsisRank: t.rank,
      avgRank,
    };
  });

  comparison.sort((a, b) => a.avgRank - b.avgRank || a.sawRank - b.sawRank);

  return { saw, wp, topsis, comparison };
}

export function buildDecisionCsv(workspace, methodResult, activeMethod) {
  const esc = (v) => {
    const text = String(v ?? '');
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const criteriaHeaders = workspace.criteria.map((c) => `${c.kode} ${c.nama} (${c.tipe})`);
  const header = [
    'Peringkat',
    'Kode',
    'Nama Calon Karyawan',
    'Posisi',
    ...criteriaHeaders,
    `Skor ${activeMethod.toUpperCase()}`,
    'Keputusan Pengelola',
    'Catatan Manusia',
  ];

  const rows = methodResult.rankings.map((item) => {
    const alt = item.alternative;
    const vals = workspace.criteria.map((c) => formatCriterionValue(c, alt.nilai[c.id]));
    return [
      item.rank,
      alt.kode,
      alt.nama,
      alt.posisi,
      ...vals,
      item.score.toFixed(4),
      DECISION_LABELS[alt.keputusan] || alt.keputusan,
      alt.catatanManusia || '',
    ];
  });

  const lines = [header, ...rows].map((r) => r.map(esc).join(','));
  // Tambahkan UTF-8 BOM agar Excel di Windows membaca karakter dengan bersih.
  return `\uFEFF${lines.join('\r\n')}`;
}

export function getCandidateStrengths(altId, criteria, sawResult, limit = 2) {
  const row = sawResult?.matrixR?.find((r) => r.id === altId);
  if (!row || !Array.isArray(criteria) || criteria.length === 0) return [];
  return [...criteria]
    .map((c) => ({ nama: c.nama, kode: c.kode, norm: row.values[c.id] ?? 0 }))
    .sort((a, b) => b.norm - a.norm)
    .slice(0, limit);
}

