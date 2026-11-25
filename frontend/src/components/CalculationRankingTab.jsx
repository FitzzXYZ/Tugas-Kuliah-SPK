import React, { useEffect, useState } from 'react';
import {
  DECISION_LABELS,
  METHOD_INFO,
  VALID_DECISIONS,
  VALID_METHODS,
  getCandidateStrengths,
  getInitials,
} from '../models/spkEngine.js';
import { EmptyState, IconCheck } from './StateViews.jsx';

function getStepTabs(method) {
  if (method === 'saw') {
    return [
      { id: 'x', label: '1. Data awal (Matriks X)' },
      { id: 'r', label: '2. Penyetaraan skala (R)' },
      { id: 'w', label: '3. Dikalikan bobot dan skor akhir' },
    ];
  }
  if (method === 'wp') {
    return [
      { id: 'x', label: '1. Data awal (Matriks X)' },
      { id: 's', label: '2. Perkalian berpangkat (Vektor S)' },
      { id: 'v', label: '3. Pangsa skor akhir (V)' },
    ];
  }
  return [
    { id: 'x', label: '1. Data awal (Matriks X)' },
    { id: 'r', label: '2. Penyetaraan skala (R)' },
    { id: 'y', label: '3. Profil ideal terbaik dan terburuk' },
    { id: 'd', label: '4. Jarak ke profil ideal dan skor' },
  ];
}

function formatReadableScore(score, method) {
  if (method === 'wp') {
    return `${(score * 100).toFixed(1)}% pangsa`;
  }
  return `${(score * 100).toFixed(1)} / 100`;
}

export default function CalculationRankingTab({
  criteria,
  alternatives,
  activeMethod,
  onSelectMethod,
  calcResult,
  calcError,
  onUpdateHumanDecision,
  onInspectCandidate,
  onGoToData,
  onNextTab,
}) {
  const [showAudit, setShowAudit] = useState(false);
  const [auditStep, setAuditStep] = useState('x');
  const [decisionFilter, setDecisionFilter] = useState('semua');

  useEffect(() => {
    setAuditStep('x');
  }, [activeMethod]);

  if (calcError) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Peringkat belum bisa dihitung"
          description={calcError}
          actionLabel="Periksa data pelamar"
          onAction={onGoToData}
        />
      </section>
    );
  }

  if (!calcResult || alternatives.length === 0) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Belum ada hasil peringkat"
          description="Isi data pelamar dan kriteria terlebih dahulu di tab Isi data agar sistem dapat menghitung peringkat."
          actionLabel="Buka halaman Isi data"
          onAction={onGoToData}
        />
      </section>
    );
  }

  const activeData = calcResult[activeMethod];
  const rankings = activeData.rankings;
  const leader = rankings[0];
  const runnerUp = rankings[1];
  const maxScore = Math.max(...rankings.map((r) => r.score), 0.0001);

  const compById = Object.fromEntries(calcResult.comparison.map((row) => [row.id, row]));
  const leaderComp = leader ? compById[leader.id] : null;
  const unanimousLeader =
    leaderComp && leaderComp.sawRank === 1 && leaderComp.wpRank === 1 && leaderComp.topsisRank === 1;
  const leaderStrengths = leader ? getCandidateStrengths(leader.id, criteria, calcResult.saw, 2) : [];

  const decidedCount = alternatives.filter((a) => a.keputusan === 'lanjut').length;
  const reserveCount = alternatives.filter((a) => a.keputusan === 'cadangan').length;
  const pendingCount = alternatives.filter((a) => !a.keputusan || a.keputusan === 'belum').length;
  const rejectedCount = alternatives.filter((a) => a.keputusan === 'tolak').length;
  const visibleRankings = rankings.filter((item) => {
    if (decisionFilter === 'semua') return true;
    const alt = alternatives.find((a) => a.id === item.id) || item.alternative;
    return (alt.keputusan || 'belum') === decisionFilter;
  });
  const stepTabs = getStepTabs(activeMethod);
  const methodInfo = METHOD_INFO[activeMethod];

  return (
    <div className="stack-lg">
      {/* Bagian 1: Ringkasan Rekomendasi Bahasa Awam + Tabel Peringkat (Fitur 6) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Hasil peringkat pelamar ({methodInfo.nama})</h2>
            <p className="panel-subtitle">
              Daftar diurutkan dari skor terbaik ke terendah. Pilih status keputusan Anda di kolom sebelah kanan untuk tiap pelamar.
            </p>
          </div>
          <div className="action-row">
            {VALID_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                className={`key key--sm ${activeMethod === m ? 'key--primary' : ''}`}
                onClick={() => onSelectMethod(m)}
              >
                {METHOD_INFO[m].nama}
              </button>
            ))}
            <button type="button" className="key" onClick={onNextTab}>
              Lihat grafik
            </button>
          </div>
        </div>

        {leader && (
          <div className="callout-lead">
            <div>
              <div className="callout-title">
                Rekomendasi teratas: {leader.nama} ({leader.kode}, {leader.posisi})
              </div>
              <p className="callout-body">
                {leaderStrengths.length > 0 && (
                  <>
                    Paling menonjol pada{' '}
                    <strong>{leaderStrengths.map((s) => s.nama).join(' dan ')}</strong>.{' '}
                  </>
                )}
                {unanimousLeader
                  ? 'Konsisten menempati Peringkat #1 di ketiga cara hitung (SAW, WP, dan TOPSIS).'
                  : 'Peringkat teratas sedikit berbeda antar metode. Cek kolom Posisi di 3 metode sebelum memutuskan.'}
              </p>
            </div>
            <div className="action-row">
              <button
                type="button"
                className="key key--sm"
                onClick={() => setShowAudit((prev) => !prev)}
                aria-expanded={showAudit}
              >
                {showAudit ? 'Sembunyikan cara hitung' : 'Lihat cara hitung detail'}
              </button>
            </div>
          </div>
        )}

        <div className="stat-strip">
          <div className="stat-cell">
            <span className="stat-label">Peringkat 1 saat ini</span>
            <span className="stat-figure">{leader ? leader.kode : '-'}</span>
            <span className="stat-meta">{leader ? leader.nama : ''}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">Nilai tertinggi ({methodInfo.nama})</span>
            <span className="stat-figure">
              {leader ? formatReadableScore(leader.score, activeMethod) : '-'}
            </span>
            <span className="stat-meta">
              Skor persis: {leader ? leader.score.toFixed(4) : '0.0000'}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">Peringkat 2</span>
            <span className="stat-figure">{runnerUp ? runnerUp.kode : '-'}</span>
            <span className="stat-meta">
              {runnerUp
                ? `${runnerUp.nama} (${formatReadableScore(runnerUp.score, activeMethod)})`
                : 'Hanya 1 pelamar'}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">Pilihan Anda sejauh ini</span>
            <span className="stat-figure">{decidedCount}</span>
            <span className="stat-meta">Lanjut wawancara ({reserveCount} cadangan)</span>
          </div>
        </div>

        <div className="decision-progress-wrap" aria-label="Progres penetapan keputusan pengelola">
          <div className="decision-progress-meta">
            <span>Progres keputusan pengelola</span>
            <span className="col-code">
              {alternatives.length - pendingCount} dari {alternatives.length} pelamar sudah ditetapkan
            </span>
          </div>
          <div className="decision-progress-bar" aria-hidden="true">
            {decidedCount > 0 && (
              <span
                className="dp-seg is-lanjut"
                style={{ width: `${(decidedCount / alternatives.length) * 100}%` }}
              />
            )}
            {reserveCount > 0 && (
              <span
                className="dp-seg is-cadangan"
                style={{ width: `${(reserveCount / alternatives.length) * 100}%` }}
              />
            )}
            {rejectedCount > 0 && (
              <span
                className="dp-seg is-tolak"
                style={{ width: `${(rejectedCount / alternatives.length) * 100}%` }}
              />
            )}
            {pendingCount > 0 && (
              <span
                className="dp-seg is-belum"
                style={{ width: `${(pendingCount / alternatives.length) * 100}%` }}
              />
            )}
          </div>
        </div>

        <div className="filter-strip" role="group" aria-label="Saring berdasarkan keputusan">
          {[
            { id: 'semua', label: `Semua (${rankings.length})` },
            { id: 'lanjut', label: `Lanjut (${decidedCount})` },
            { id: 'cadangan', label: `Cadangan (${reserveCount})` },
            { id: 'belum', label: `Belum diputuskan (${pendingCount})` },
            { id: 'tolak', label: `Tidak lolos (${rejectedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className="filter-chip"
              aria-pressed={decisionFilter === f.id}
              onClick={() => setDecisionFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="table-scroll">
          <table className="ledger-table">
            <thead>
              <tr>
                <th className="col-num">Urutan</th>
                <th>Calon karyawan</th>
                <th className="col-num">Nilai ({methodInfo.nama})</th>
                <th className="col-num">Posisi di 3 metode</th>
                <th>Keputusan Anda</th>
                <th>Catatan pertimbangan</th>
              </tr>
            </thead>
            <tbody>
              {visibleRankings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    <span className="cell-secondary">
                      Tidak ada pelamar dengan status pilihan ini.
                    </span>
                  </td>
                </tr>
              ) : (
                visibleRankings.map((item, rowIdx) => {
                  const cmp = compById[item.id];
                  const alt = alternatives.find((a) => a.id === item.id) || item.alternative;
                  const isLeader = item.rank === 1;
                  const meterPct = activeMethod === 'wp' ? (item.score / maxScore) * 100 : item.score * 100;
                  return (
                    <tr
                      key={item.id}
                      className={`anim-row ${isLeader ? 'is-leader' : ''}`}
                      style={{ '--row-i': rowIdx }}
                    >
                      <td className="col-num">
                        <span className={`rank-chip is-rank-${item.rank}`}>{item.rank}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="person-trigger"
                          onClick={() => onInspectCandidate(alt.id)}
                        >
                          <span className={`monogram ${isLeader ? 'is-leader' : ''}`} aria-hidden="true">
                            {getInitials(alt.nama)}
                          </span>
                          <span>
                            <span className="cell-primary">
                              {alt.nama} ({alt.kode})
                            </span>
                            <span className="cell-secondary">{alt.posisi}</span>
                          </span>
                        </button>
                      </td>
                      <td className="col-num">
                        <div className="score-meter">
                          <span style={{ fontWeight: 500 }}>
                            {formatReadableScore(item.score, activeMethod)}
                          </span>
                          <div className="score-bar-track" aria-hidden="true">
                            <div
                              className={`score-bar-fill ${isLeader ? 'is-top' : ''}`}
                              style={{ width: `${Math.max(4, Math.min(100, meterPct)).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="cell-secondary">Skor {item.score.toFixed(4)}</span>
                        </div>
                      </td>
                      <td className="col-num" title="Urutan pada SAW / WP / TOPSIS">
                        #{cmp?.sawRank} / #{cmp?.wpRank} / #{cmp?.topsisRank}
                        <span className="cell-secondary">SAW / WP / TOPSIS</span>
                      </td>
                      <td style={{ minWidth: '12rem' }}>
                        <label className="visually-hidden" htmlFor={`dec-${alt.id}`}>
                          Keputusan Anda untuk {alt.nama}
                        </label>
                        <select
                          id={`dec-${alt.id}`}
                          className={`select is-decision-${alt.keputusan || 'belum'}`}
                          value={alt.keputusan || 'belum'}
                          onChange={(e) => onUpdateHumanDecision(alt.id, { keputusan: e.target.value })}
                        >
                          {VALID_DECISIONS.map((val) => (
                            <option key={val} value={val}>
                              {DECISION_LABELS[val]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ minWidth: '14rem' }}>
                        <label className="visually-hidden" htmlFor={`note-${alt.id}`}>
                          Catatan pertimbangan untuk {alt.nama}
                        </label>
                        <input
                          id={`note-${alt.id}`}
                          className="input"
                          type="text"
                          defaultValue={alt.catatanManusia || ''}
                          key={`${alt.id}-${alt.catatanManusia || ''}`}
                          onBlur={(e) => {
                            if (e.target.value !== (alt.catatanManusia || '')) {
                              onUpdateHumanDecision(alt.id, { catatanManusia: e.target.value });
                            }
                          }}
                          placeholder="Alasan atau catatan wawancara"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bagian 2: Rincian Langkah Perhitungan Otomatis (Bisa dibuka/tutup agar ramah awam namun lengkap untuk audit/dosen) */}
      {showAudit && (
        <section className="graphite-ledger" aria-label="Rincian proses perhitungan otomatis">
          <div className="graphite-head">
            <div>
              <h2 className="graphite-title">Rincian langkah perhitungan otomatis ({methodInfo.namaLengkap})</h2>
              <p className="graphite-note">
                Seluruh angka dihitung otomatis oleh sistem ({calcResult.source || 'browser-js'}). Pilih tahap di bawah untuk memeriksa setiap langkah.
              </p>
            </div>
            <button
              type="button"
              className="graphite-tab"
              aria-pressed="false"
              onClick={() => setShowAudit(false)}
            >
              Tutup rincian
            </button>
          </div>

          <div className="graphite-formula">{methodInfo.rumus}</div>

          <div className="graphite-tabs" role="group" aria-label="Pilih langkah perhitungan">
            {stepTabs.map((st) => (
              <button
                key={st.id}
                type="button"
                className="graphite-tab"
                aria-pressed={auditStep === st.id}
                onClick={() => setAuditStep(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="table-scroll">
            {auditStep === 'x' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    {criteria.map((c) => (
                      <th key={c.id} className="col-num">
                        {c.kode} ({c.tipe})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeData.matrixX.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      {criteria.map((c) => (
                        <td key={c.id} className="col-num">
                          {row.values[c.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeMethod === 'saw' && auditStep === 'r' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    {criteria.map((c) => (
                      <th key={c.id} className="col-num">
                        {c.kode} ({c.tipe === 'cost' ? `min ${activeData.extrema[c.id].min}` : `max ${activeData.extrema[c.id].max}`})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeData.matrixR.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      {criteria.map((c) => (
                        <td key={c.id} className="col-num">
                          {row.values[c.id].toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeMethod === 'saw' && auditStep === 'w' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    {activeData.weights.map((w) => (
                      <th key={w.id} className="col-num">
                        {w.kode} ({w.percent.toFixed(0)}%)
                      </th>
                    ))}
                    <th className="col-num">Skor akhir (V)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.matrixWeighted.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      {criteria.map((c) => (
                        <td key={c.id} className="col-num">
                          {row.values[c.id].toFixed(4)}
                        </td>
                      ))}
                      <td className="col-highlight">{row.total.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeMethod === 'wp' && auditStep === 's' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    {activeData.signedWeights.map((sw) => (
                      <th key={sw.id} className="col-num">
                        {sw.kode} ({sw.signedWeight >= 0 ? '+' : ''}
                        {sw.signedWeight.toFixed(3)})
                      </th>
                    ))}
                    <th className="col-num">Nilai S</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.vectorS.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      {criteria.map((c) => (
                        <td key={c.id} className="col-num">
                          {row.factors[c.id].toFixed(4)}
                        </td>
                      ))}
                      <td className="col-highlight">{row.sValue.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeMethod === 'wp' && auditStep === 'v' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    <th className="col-num">Nilai S</th>
                    <th className="col-num">Total S</th>
                    <th className="col-num">Pangsa skor (V)</th>
                    <th className="col-num">Urutan</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.rankings.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      <td className="col-num">{row.sValue.toFixed(4)}</td>
                      <td className="col-num">{activeData.sumS.toFixed(4)}</td>
                      <td className="col-highlight">{row.score.toFixed(4)}</td>
                      <td className="col-num">#{row.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeMethod === 'topsis' && auditStep === 'r' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    {criteria.map((c) => (
                      <th key={c.id} className="col-num">
                        {c.kode} (pembagi {activeData.divisors[c.id].toFixed(2)})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeData.matrixR.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      {criteria.map((c) => (
                        <td key={c.id} className="col-num">
                          {row.values[c.id].toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeMethod === 'topsis' && auditStep === 'y' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Baris</th>
                    {criteria.map((c) => (
                      <th key={c.id} className="col-num">
                        {c.kode} ({c.tipe})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeData.matrixY.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      {criteria.map((c) => (
                        <td key={c.id} className="col-num">
                          {row.values[c.id].toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td>Profil ideal terbaik (A+)</td>
                    {criteria.map((c) => (
                      <td key={c.id} className="col-highlight">
                        {activeData.idealPos[c.id].toFixed(4)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Profil ideal terburuk (A-)</td>
                    {criteria.map((c) => (
                      <td key={c.id} className="col-highlight">
                        {activeData.idealNeg[c.id].toFixed(4)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}

            {activeMethod === 'topsis' && auditStep === 'd' && (
              <table className="graphite-table">
                <thead>
                  <tr>
                    <th>Pelamar</th>
                    <th className="col-num">Jarak ke terbaik (D+)</th>
                    <th className="col-num">Jarak ke terburuk (D-)</th>
                    <th className="col-num">Skor kedekatan (C)</th>
                    <th className="col-num">Urutan</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.rankings.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.kode} {row.nama}
                      </td>
                      <td className="col-num">{row.dPos.toFixed(4)}</td>
                      <td className="col-num">{row.dNeg.toFixed(4)}</td>
                      <td className="col-highlight">{row.score.toFixed(4)}</td>
                      <td className="col-num">#{row.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
