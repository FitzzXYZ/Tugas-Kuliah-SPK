import React, { useEffect, useState } from 'react';
import {
  DECISION_LABELS,
  METHOD_INFO,
  VALID_DECISIONS,
  VALID_METHODS,
} from '../models/spkEngine.js';
import { EmptyState, IconCheck } from './StateViews.jsx';

function getStepTabs(method) {
  if (method === 'saw') {
    return [
      { id: 'x', label: '1. Matriks keputusan (X)' },
      { id: 'r', label: '2. Matriks normalisasi (R)' },
      { id: 'w', label: '3. Terbobot (w × r) dan skor V' },
    ];
  }
  if (method === 'wp') {
    return [
      { id: 'x', label: '1. Matriks keputusan (X)' },
      { id: 's', label: '2. Vektor S (Π x^±w)' },
      { id: 'v', label: '3. Preferensi relatif (V)' },
    ];
  }
  return [
    { id: 'x', label: '1. Matriks keputusan (X)' },
    { id: 'r', label: '2. Normalisasi Euclidean (R)' },
    { id: 'y', label: '3. Terbobot (Y) dan solusi ideal' },
    { id: 'd', label: '4. Jarak D+ / D- dan skor C' },
  ];
}

export default function CalculationRankingTab({
  criteria,
  alternatives,
  activeMethod,
  onSelectMethod,
  calcResult,
  calcError,
  onUpdateHumanDecision,
  onGoToData,
  onNextTab,
}) {
  const [auditStep, setAuditStep] = useState('x');

  useEffect(() => {
    setAuditStep('x');
  }, [activeMethod]);

  if (calcError) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Perhitungan belum dapat dijalankan"
          description={calcError}
          actionLabel="Periksa data dan kriteria"
          onAction={onGoToData}
        />
      </section>
    );
  }

  if (!calcResult || alternatives.length === 0) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Belum ada hasil perhitungan"
          description="Tambahkan data kriteria dan alternatif pada tab Data dan kriteria agar mesin SPK dapat menghitung peringkat."
          actionLabel="Buka data dan kriteria"
          onAction={onGoToData}
        />
      </section>
    );
  }

  const activeData = calcResult[activeMethod];
  const rankings = activeData.rankings;
  const leader = rankings[0];
  const runnerUp = rankings[1];
  const margin = leader && runnerUp ? leader.score - runnerUp.score : 0;

  const compById = Object.fromEntries(calcResult.comparison.map((row) => [row.id, row]));
  const decidedCount = alternatives.filter((a) => a.keputusan === 'lanjut').length;
  const reserveCount = alternatives.filter((a) => a.keputusan === 'cadangan').length;
  const stepTabs = getStepTabs(activeMethod);
  const methodInfo = METHOD_INFO[activeMethod];

  return (
    <div className="stack-lg">
      {/* Ringkasan & Tabel Perankingan (Fitur 6 + Prinsip MSS) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Hasil perankingan ({methodInfo.nama})</h2>
            <p className="panel-subtitle">
              Sistem menghitung skor preferensi secara otomatis. Pengelola menetapkan keputusan akhir dan catatan pertimbangan lapangan pada setiap kandidat.
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
              Buka grafik visualisasi
            </button>
          </div>
        </div>

        <div className="stat-strip">
          <div className="stat-cell">
            <span className="stat-label">Peringkat 1 ({methodInfo.nama})</span>
            <span className="stat-figure">{leader ? leader.kode : '-'}</span>
            <span className="stat-meta">{leader ? `${leader.nama} (${leader.posisi})` : ''}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">Skor preferensi tertinggi</span>
            <span className="stat-figure">{leader ? leader.score.toFixed(4) : '0.0000'}</span>
            <span className="stat-meta">Engine: {calcResult.source || 'browser-js'}</span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">Selisih ke peringkat 2</span>
            <span className="stat-figure">{margin.toFixed(4)}</span>
            <span className="stat-meta">
              {runnerUp ? `Dibanding ${runnerUp.kode} (${runnerUp.score.toFixed(4)})` : 'Hanya 1 kandidat'}
            </span>
          </div>
          <div className="stat-cell">
            <span className="stat-label">Keputusan pengelola</span>
            <span className="stat-figure">{decidedCount}</span>
            <span className="stat-meta">Lanjut akhir ({reserveCount} cadangan)</span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="ledger-table">
            <thead>
              <tr>
                <th className="col-num">Peringkat</th>
                <th>Calon karyawan</th>
                <th className="col-num">Skor {methodInfo.nama}</th>
                <th className="col-num">SAW</th>
                <th className="col-num">WP</th>
                <th className="col-num">TOPSIS</th>
                <th>Keputusan pengelola</th>
                <th>Catatan manusia</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((item) => {
                const cmp = compById[item.id];
                const alt = alternatives.find((a) => a.id === item.id) || item.alternative;
                const isLeader = item.rank === 1;
                return (
                  <tr key={item.id} className={isLeader ? 'is-leader' : ''}>
                    <td className="col-num">
                      {isLeader ? (
                        <span className="status-tag is-accent">
                          <IconCheck />
                          <span>#{item.rank}</span>
                        </span>
                      ) : (
                        `#${item.rank}`
                      )}
                    </td>
                    <td>
                      <span className="cell-primary">
                        {alt.kode} {alt.nama}
                      </span>
                      <span className="cell-secondary">{alt.posisi}</span>
                    </td>
                    <td className="col-num" style={{ fontWeight: 500 }}>
                      {item.score.toFixed(4)}
                    </td>
                    <td className="col-num">#{cmp?.sawRank}</td>
                    <td className="col-num">#{cmp?.wpRank}</td>
                    <td className="col-num">#{cmp?.topsisRank}</td>
                    <td style={{ minWidth: '12rem' }}>
                      <label className="visually-hidden" htmlFor={`dec-${alt.id}`}>
                        Keputusan pengelola untuk {alt.nama}
                      </label>
                      <select
                        id={`dec-${alt.id}`}
                        className="select"
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
                        Catatan manusia untuk {alt.nama}
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
                        placeholder="Pertimbangan lapangan..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel Audit Perhitungan Otomatis — Cobalt Graphite Ledger (Fitur 5) */}
      <section className="graphite-ledger" aria-label="Audit langkah perhitungan otomatis">
        <div className="graphite-head">
          <div>
            <h2 className="graphite-title">Audit proses perhitungan otomatis ({methodInfo.namaLengkap})</h2>
            <p className="graphite-note">
              Setiap nilai matriks dihitung otomatis secara langsung dari data dan bobot terbaru.
            </p>
          </div>
          <span className="graphite-note">Ketelitian 4 desimal (pembulatan tampilan)</span>
        </div>

        <div className="graphite-formula">{methodInfo.rumus}</div>

        <div className="graphite-tabs" role="group" aria-label="Langkah perhitungan">
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
                  <th>Alternatif</th>
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
                  <th>Alternatif</th>
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
                  <th>Alternatif</th>
                  {activeData.weights.map((w) => (
                    <th key={w.id} className="col-num">
                      {w.kode} (w={w.weight.toFixed(2)})
                    </th>
                  ))}
                  <th className="col-num">Skor V</th>
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
                  <th>Alternatif</th>
                  {activeData.signedWeights.map((sw) => (
                    <th key={sw.id} className="col-num">
                      {sw.kode} ({sw.signedWeight >= 0 ? '+' : ''}
                      {sw.signedWeight.toFixed(3)})
                    </th>
                  ))}
                  <th className="col-num">Vektor S</th>
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
                  <th>Alternatif</th>
                  <th className="col-num">Vektor S_i</th>
                  <th className="col-num">Total Σ S</th>
                  <th className="col-num">Preferensi V_i = S_i / Σ S</th>
                  <th className="col-num">Peringkat</th>
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
                  <th>Alternatif</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="col-num">
                      {c.kode} (√Σx²={activeData.divisors[c.id].toFixed(2)})
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
                  <td>Solusi ideal positif (A+)</td>
                  {criteria.map((c) => (
                    <td key={c.id} className="col-highlight">
                      {activeData.idealPos[c.id].toFixed(4)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Solusi ideal negatif (A-)</td>
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
                  <th>Alternatif</th>
                  <th className="col-num">Jarak ke A+ (D+)</th>
                  <th className="col-num">Jarak ke A- (D-)</th>
                  <th className="col-num">Kedekatan C = D- / (D+ + D-)</th>
                  <th className="col-num">Peringkat</th>
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
    </div>
  );
}

