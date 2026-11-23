import test from 'node:test';
import assert from 'node:assert/strict';

import { SAMPLE_WORKSPACE } from '../src/data/sampleWorkspace.js';
import {
  buildDecisionCsv,
  calculateAllMethods,
  calculateSAW,
  calculateTOPSIS,
  calculateWP,
  detectDataIssues,
  normalizeCriteriaWeightsTo100,
  syncAlternativesWithCriteria,
  validateAlternative,
  validateCriterion,
} from '../src/models/spkEngine.js';

const { alternatives, criteria } = SAMPLE_WORKSPACE;

test('SAW computes accurate linear normalization for benefit and cost criteria', () => {
  const saw = calculateSAW(alternatives, criteria);
  assert.equal(saw.rankings.length, 6);
  // Verifikasi manual A6 (Farhan): C1=82/90, C2=84/86, C3=4/4, C4=88/88, C5=6.2/8.5
  const expectedA6 =
    0.3 * (82 / 90) + 0.2 * (84 / 86) + 0.2 * (4 / 4) + 0.15 * (88 / 88) + 0.15 * (6.2 / 8.5);
  const a6 = saw.rankings.find((r) => r.kode === 'A6');
  assert.ok(Math.abs(a6.score - expectedA6) < 1e-6);
  assert.equal(saw.rankings[0].kode, 'A6');
});

test('WP computes signed power vector S and normalized preference V summing to 1', () => {
  const wp = calculateWP(alternatives, criteria);
  const sumV = wp.rankings.reduce((s, r) => s + r.score, 0);
  assert.ok(Math.abs(sumV - 1) < 1e-9);
  assert.equal(wp.rankings[0].kode, 'A6');
  // Verifikasi A6 S_i secara langsung
  const expectedS6 =
    82 ** 0.3 * 84 ** 0.2 * 4 ** 0.2 * 88 ** 0.15 * 8.5 ** -0.15;
  const row6 = wp.vectorS.find((r) => r.kode === 'A6');
  assert.ok(Math.abs(row6.sValue - expectedS6) < 1e-6);
});

test('TOPSIS computes Euclidean normalization, ideal solutions, and closeness in [0, 1]', () => {
  const topsis = calculateTOPSIS(alternatives, criteria);
  assert.equal(topsis.rankings.length, 6);
  for (const r of topsis.rankings) {
    assert.ok(r.score >= 0 && r.score <= 1);
    assert.ok(Number.isFinite(r.score));
  }
  assert.equal(topsis.rankings[0].kode, 'A6');
});

test('TOPSIS handles identical alternatives without NaN', () => {
  const identical = [
    { id: '1', kode: 'A1', nama: 'Satu', posisi: 'Dev', nilai: { c1: 80, c2: 80 }, keputusan: 'belum' },
    { id: '2', kode: 'A2', nama: 'Dua', posisi: 'Dev', nilai: { c1: 80, c2: 80 }, keputusan: 'belum' },
  ];
  const twoCrit = [
    { id: 'c1', kode: 'C1', nama: 'Tes', tipe: 'benefit', bobot: 50, satuan: 'poin' },
    { id: 'c2', kode: 'C2', nama: 'Gaji', tipe: 'cost', bobot: 50, satuan: 'juta' },
  ];
  const topsis = calculateTOPSIS(identical, twoCrit);
  assert.equal(topsis.rankings[0].score, 0.5);
  assert.equal(topsis.rankings[1].score, 0.5);
  assert.equal(topsis.rankings[0].kode, 'A1');
});

test('calculateAllMethods returns cross-method rankings for every alternative', () => {
  const all = calculateAllMethods(alternatives, criteria);
  assert.equal(all.comparison.length, 6);
  assert.equal(all.comparison[0].kode, 'A6');
  assert.equal(all.comparison[0].sawRank, 1);
  assert.equal(all.comparison[0].wpRank, 1);
  assert.equal(all.comparison[0].topsisRank, 1);
});

test('validation rejects non-positive values, duplicate codes, and flags minimum thresholds', () => {
  const badCrit = validateCriterion({ kode: 'C1', nama: 'X', tipe: 'benefit', satuan: '', bobot: 0 }, criteria);
  assert.equal(badCrit.valid, false);
  assert.ok(badCrit.errors.kode);
  assert.ok(badCrit.errors.bobot);

  const badAlt = validateAlternative(
    { kode: 'A7', nama: 'Budi', posisi: 'QA', nilai: { c1: 80, c2: 75, c3: 0, c4: 70, c5: 7 } },
    criteria,
    alternatives,
  );
  assert.equal(badAlt.valid, false);
  assert.ok(badAlt.errors['nilai.c3']);

  const issues = detectDataIssues(alternatives.slice(0, 3), criteria.slice(0, 4));
  assert.ok(issues.some((i) => i.message.includes('minimal') || i.message.includes('minimum')));
});

test('normalizeCriteriaWeightsTo100 sums to exactly 100 and syncAlternativesWithCriteria updates keys', () => {
  const skewed = criteria.map((c, idx) => ({ ...c, bobot: (idx + 1) * 7 }));
  const normalized = normalizeCriteriaWeightsTo100(skewed);
  const sum = normalized.reduce((s, c) => s + c.bobot, 0);
  assert.ok(Math.abs(sum - 100) < 1e-6);

  const newCrit = { id: 'c6', kode: 'C6', nama: 'Sertifikasi', tipe: 'benefit', bobot: 10, satuan: 'poin' };
  const synced = syncAlternativesWithCriteria(alternatives, [...criteria, newCrit], newCrit);
  assert.equal(synced[0].nilai.c6, 75);
});

test('buildDecisionCsv generates valid BOM-prefixed CSV with headers and rows', () => {
  const saw = calculateSAW(alternatives, criteria);
  const csv = buildDecisionCsv(SAMPLE_WORKSPACE, saw, 'saw');
  assert.ok(csv.startsWith('\uFEFFPeringkat,Kode,Nama Calon Karyawan'));
  assert.equal(csv.split('\r\n').length, 7);
});

