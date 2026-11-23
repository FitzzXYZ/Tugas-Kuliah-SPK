import React, { useEffect, useState } from 'react';
import { METHOD_INFO } from '../models/spkEngine.js';
import { EmptyState } from './StateViews.jsx';

export default function VisualizationTab({
  criteria,
  alternatives,
  activeMethod,
  calcResult,
  calcError,
  onGoToData,
  onNextTab,
}) {
  const activeRankings = calcResult?.[activeMethod]?.rankings || [];
  const [compareA, setCompareA] = useState(activeRankings[0]?.id || '');
  const [compareB, setCompareB] = useState(activeRankings[1]?.id || activeRankings[0]?.id || '');

  useEffect(() => {
    if (activeRankings.length > 0) {
      if (!activeRankings.some((r) => r.id === compareA)) {
        setCompareA(activeRankings[0].id);
      }
      if (!activeRankings.some((r) => r.id === compareB)) {
        setCompareB(activeRankings[1]?.id || activeRankings[0].id);
      }
    }
  }, [activeRankings, compareA, compareB]);

  if (calcError || !calcResult || activeRankings.length === 0) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Grafik belum tersedia"
          description={calcError || 'Lengkapi data kriteria dan alternatif agar grafik perankingan dan profil kriteria dapat digambar.'}
          actionLabel="Buka data dan kriteria"
          onAction={onGoToData}
        />
      </section>
    );
  }

  const methodInfo = METHOD_INFO[activeMethod];
  const maxActiveScore = Math.max(...activeRankings.map((r) => r.score), 0.0001);
  // Gunakan batas sumbu 1.0 untuk SAW/TOPSIS agar jujur terhadap rentang 0..1; untuk WP gunakan skala proporsional dari 0.
  const axisMax = activeMethod === 'wp' ? Math.ceil(maxActiveScore * 10) / 10 : 1.0;

  // Dimensi Grafik 1 (Batang Horizontal Skor Peringkat)
  const rRowH = 42;
  const rLabelW = 165;
  const rBarW = 460;
  const rSvgW = 720;
  const rSvgH = 34 + activeRankings.length * rRowH + 24;
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  // Dimensi Grafik 2 (Perbandingan Lintas Metode: SAW, WP ternormalisasi ke max=1 utk skala sejajar, TOPSIS)
  const comparison = calcResult.comparison;
  const wpMax = Math.max(...comparison.map((c) => c.wpScore), 0.0001);
  const cRowH = 54;
  const cSvgH = 26 + comparison.length * cRowH + 24;

  // Dimensi Grafik 3 (Profil Kriteria Ternormalisasi SAW 0..100% antara 2 Kandidat)
  const sawMatrixR = Object.fromEntries(calcResult.saw.matrixR.map((row) => [row.id, row]));
  const rowA = sawMatrixR[compareA];
  const rowB = sawMatrixR[compareB];
  const pRowH = 48;
  const pSvgH = 24 + criteria.length * pRowH + 20;

  return (
    <section className="cut-panel">
      <div className="panel-head">
        <div className="panel-head-text">
          <h2 className="panel-title">Grafik visualisasi hasil SPK</h2>
          <p className="panel-subtitle">
            Seluruh grafik dimulai dari sumbu nol dengan angka tabular tanpa dekorasi berlebih agar perbandingan antar kandidat terbaca objektif.
          </p>
        </div>
        <div className="action-row">
          <button type="button" className="key key--primary" onClick={onNextTab}>
            Susun laporan keputusan
          </button>
        </div>
      </div>

      <div className="chart-grid">
        {/* Grafik 1: Peringkat Metode Aktif */}
        <div className="chart-block chart-block-full">
          <h3 className="chart-title">Peringkat skor preferensi ({methodInfo.nama})</h3>
          <p className="chart-caption">
            Sumbu dimulai dari 0 hingga {axisMax.toFixed(2)}. Warna aksen cobalt menandai kandidat peringkat teratas.
          </p>
          <svg
            className="svg-chart"
            viewBox={`0 0 ${rSvgW} ${rSvgH}`}
            role="img"
            aria-label={`Grafik batang peringkat skor preferensi metode ${methodInfo.nama} untuk ${activeRankings.length} calon karyawan`}
          >
            {gridSteps.map((ratio) => {
              const x = rLabelW + ratio * rBarW;
              return (
                <g key={ratio}>
                  <line
                    x1={x}
                    y1={14}
                    x2={x}
                    y2={rSvgH - 22}
                    stroke="var(--color-rule)"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={rSvgH - 6}
                    textAnchor="middle"
                    fill="var(--color-muted)"
                    fontSize="11"
                    fontFamily="var(--font-outlier)"
                  >
                    {(ratio * axisMax).toFixed(2)}
                  </text>
                </g>
              );
            })}

            {activeRankings.map((item, idx) => {
              const y = 24 + idx * rRowH;
              const width = Math.max(0, Math.min(1, item.score / axisMax)) * rBarW;
              const label = `${item.kode} ${item.nama}`;
              const shortLabel = label.length > 20 ? `${label.slice(0, 19)}…` : label;
              return (
                <g key={item.id} transform={`translate(0, ${y})`}>
                  <text
                    x="0"
                    y="15"
                    fill="var(--color-ink)"
                    fontSize="13"
                    fontWeight={item.rank === 1 ? '600' : '400'}
                  >
                    #{item.rank} {shortLabel}
                  </text>
                  <rect
                    x={rLabelW}
                    y="2"
                    width={rBarW}
                    height="18"
                    rx="2"
                    fill="var(--color-chart-track)"
                  />
                  <rect
                    x={rLabelW}
                    y="2"
                    width={width.toFixed(1)}
                    height="18"
                    rx="2"
                    fill={item.rank === 1 ? 'var(--color-chart-1)' : 'var(--color-chart-2)'}
                  />
                  <text
                    x={rLabelW + rBarW + 12}
                    y="15"
                    fill="var(--color-ink)"
                    fontSize="12"
                    fontFamily="var(--font-outlier)"
                    fontWeight={item.rank === 1 ? '600' : '400'}
                  >
                    {item.score.toFixed(4)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Grafik 2: Perbandingan 3 Metode (SAW, WP relatif, TOPSIS) */}
        <div className="chart-block">
          <h3 className="chart-title">Perbandingan 3 metode (SAW, WP, TOPSIS)</h3>
          <p className="chart-caption">
            Skor WP diskalakan relatif terhadap kandidat tertinggi WP ({wpMax.toFixed(4)}) agar dapat dibaca pada rentang 0 sampai 1 bersama SAW dan TOPSIS.
          </p>
          <div className="chart-legend" aria-hidden="true">
            <span className="legend-item">
              <span className="legend-swatch is-c1" />
              SAW
            </span>
            <span className="legend-item">
              <span className="legend-swatch is-c2" />
              WP (skala relatif)
            </span>
            <span className="legend-item">
              <span className="legend-swatch is-c3" />
              TOPSIS
            </span>
          </div>
          <svg
            className="svg-chart"
            viewBox={`0 0 540 ${cSvgH}`}
            role="img"
            aria-label="Grafik perbandingan skor metode SAW, WP, dan TOPSIS antar alternatif"
          >
            {[0, 0.5, 1].map((ratio) => {
              const x = 110 + ratio * 360;
              return (
                <g key={ratio}>
                  <line x1={x} y1={10} x2={x} y2={cSvgH - 22} stroke="var(--color-rule)" strokeWidth="1" />
                  <text
                    x={x}
                    y={cSvgH - 6}
                    textAnchor="middle"
                    fill="var(--color-muted)"
                    fontSize="11"
                    fontFamily="var(--font-outlier)"
                  >
                    {ratio.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {comparison.map((row, idx) => {
              const y = 18 + idx * cRowH;
              const wSaw = Math.max(0, Math.min(1, row.sawScore)) * 360;
              const wWp = Math.max(0, Math.min(1, row.wpScore / wpMax)) * 360;
              const wTopsis = Math.max(0, Math.min(1, row.topsisScore)) * 360;
              return (
                <g key={row.id} transform={`translate(0, ${y})`}>
                  <text x="0" y="14" fill="var(--color-ink)" fontSize="12" fontWeight="600">
                    {row.kode}
                  </text>
                  <text x="0" y="30" fill="var(--color-muted)" fontSize="11">
                    {row.nama.length > 13 ? `${row.nama.slice(0, 12)}…` : row.nama}
                  </text>

                  <rect x="110" y="2" width={wSaw.toFixed(1)} height="9" rx="1.5" fill="var(--color-chart-1)" />
                  <rect x="110" y="14" width={wWp.toFixed(1)} height="9" rx="1.5" fill="var(--color-chart-2)" />
                  <rect x="110" y="26" width={wTopsis.toFixed(1)} height="9" rx="1.5" fill="var(--color-chart-3)" />

                  <text x="480" y="22" fill="var(--color-muted)" fontSize="11" fontFamily="var(--font-outlier)">
                    #{row.sawRank}/{row.wpRank}/{row.topsisRank}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Grafik 3: Profil Skor per Kriteria antara 2 Kandidat */}
        <div className="chart-block">
          <h3 className="chart-title">Profil keunggulan per kriteria</h3>
          <p className="chart-caption">
            Nilai ternormalisasi per kriteria (0% sampai 100%, sudah memperhitungkan arah benefit dan cost).
          </p>

          <div className="toolbar-controls" style={{ marginBottom: 'var(--space-sm)' }}>
            <label className="visually-hidden" htmlFor="cmp-a">
              Kandidat pertama
            </label>
            <select
              id="cmp-a"
              className="select"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            >
              {alternatives.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kode} {a.nama}
                </option>
              ))}
            </select>

            <label className="visually-hidden" htmlFor="cmp-b">
              Kandidat kedua
            </label>
            <select
              id="cmp-b"
              className="select"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            >
              {alternatives.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kode} {a.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="chart-legend" aria-hidden="true">
            <span className="legend-item">
              <span className="legend-swatch is-c1" />
              {rowA ? `${rowA.kode} ${rowA.nama}` : 'Kandidat A'}
            </span>
            <span className="legend-item">
              <span className="legend-swatch is-c2" />
              {rowB ? `${rowB.kode} ${rowB.nama}` : 'Kandidat B'}
            </span>
          </div>

          <svg
            className="svg-chart"
            viewBox={`0 0 540 ${pSvgH}`}
            role="img"
            aria-label="Grafik perbandingan profil skor per kriteria antara dua kandidat pilihan"
          >
            {criteria.map((c, idx) => {
              const y = 14 + idx * pRowH;
              const valA = rowA ? rowA.values[c.id] : 0;
              const valB = rowB ? rowB.values[c.id] : 0;
              const barW = 310;
              return (
                <g key={c.id} transform={`translate(0, ${y})`}>
                  <text x="0" y="14" fill="var(--color-ink)" fontSize="12" fontWeight="600">
                    {c.kode} ({c.tipe})
                  </text>
                  <text x="0" y="29" fill="var(--color-muted)" fontSize="11">
                    {c.nama.length > 18 ? `${c.nama.slice(0, 17)}…` : c.nama}
                  </text>

                  <rect x="145" y="2" width={barW} height="11" rx="1.5" fill="var(--color-chart-track)" />
                  <rect
                    x="145"
                    y="2"
                    width={(valA * barW).toFixed(1)}
                    height="11"
                    rx="1.5"
                    fill="var(--color-chart-1)"
                  />
                  <text x="466" y="12" fill="var(--color-ink)" fontSize="11" fontFamily="var(--font-outlier)">
                    {Math.round(valA * 100)}%
                  </text>

                  <rect x="145" y="17" width={barW} height="11" rx="1.5" fill="var(--color-chart-track)" />
                  <rect
                    x="145"
                    y="17"
                    width={(valB * barW).toFixed(1)}
                    height="11"
                    rx="1.5"
                    fill="var(--color-chart-2)"
                  />
                  <text x="466" y="27" fill="var(--color-muted)" fontSize="11" fontFamily="var(--font-outlier)">
                    {Math.round(valB * 100)}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}

