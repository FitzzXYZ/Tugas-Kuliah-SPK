import React, { useEffect, useState } from 'react';
import { METHOD_INFO } from '../models/spkEngine.js';
import CandidateRadarChart from './CandidateRadarChart.jsx';
import CriteriaHeatmap from './CriteriaHeatmap.jsx';
import { EmptyState } from './StateViews.jsx';

export default function VisualizationTab({
  criteria,
  alternatives,
  activeMethod,
  calcResult,
  calcError,
  onInspectCandidate,
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
          title="Grafik belum dapat ditampilkan"
          description={calcError || 'Isi data pelamar dan kriteria di tab Isi data agar grafik perbandingan dapat digambar.'}
          actionLabel="Buka Isi data"
          onAction={onGoToData}
        />
      </section>
    );
  }

  const methodInfo = METHOD_INFO[activeMethod];
  const maxActiveScore = Math.max(...activeRankings.map((r) => r.score), 0.0001);
  const axisMax = activeMethod === 'wp' ? Math.ceil(maxActiveScore * 10) / 10 : 1.0;

  const rRowH = 42;
  const rLabelW = 170;
  const rBarW = 450;
  const rSvgW = 720;
  const rSvgH = 34 + activeRankings.length * rRowH + 24;
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  const comparison = calcResult.comparison;
  const wpMax = Math.max(...comparison.map((c) => c.wpScore), 0.0001);
  const cRowH = 54;
  const cSvgH = 26 + comparison.length * cRowH + 24;

  const sawMatrixR = Object.fromEntries(calcResult.saw.matrixR.map((row) => [row.id, row]));
  const rowA = sawMatrixR[compareA];
  const rowB = sawMatrixR[compareB];
  const pRowH = 48;
  const pSvgH = 24 + criteria.length * pRowH + 20;

  return (
    <div className="stack-lg">
      <section className="editorial-banner" aria-label="Ringkasan halaman visualisasi">
        <img
          className="editorial-banner-art"
          src="/assets/rose-prism-banner.jpg"
          width="1376"
          height="768"
          alt=""
          aria-hidden="true"
        />
        <div className="editorial-banner-copy">
          <h2 className="panel-title">Grafik dan peta panas perbandingan pelamar</h2>
          <p className="panel-subtitle">
            Bandingkan urutan skor, konsistensi 3 metode, profil radar, dan peta panas seluruh kriteria secara visual dalam satu ruang analisis.
          </p>
          <div className="action-row" style={{ marginTop: 'var(--space-sm)' }}>
            <button type="button" className="key key--primary key--sm" onClick={onNextTab}>
              Lanjut: Laporan
            </button>
          </div>
        </div>
      </section>

      <section className="cut-panel">
        <div className="chart-grid">
        {/* Grafik 1 */}
        <div className="chart-block chart-block-full">
          <h3 className="chart-title">Urutan nilai akhir pelamar ({methodInfo.nama})</h3>
          <p className="chart-caption">
            Cara membaca: batang merah-mawar tua adalah pelamar peringkat pertama. Semua batang diukur dari angka 0 agar adil.
          </p>
          <svg
            className="svg-chart"
            viewBox={`0 0 ${rSvgW} ${rSvgH}`}
            role="img"
            aria-label={`Grafik urutan skor pelamar metode ${methodInfo.nama}`}
          >
            {gridSteps.map((ratio) => {
              const x = rLabelW + ratio * rBarW;
              return (
                <g key={ratio}>
                  <line x1={x} y1={14} x2={x} y2={rSvgH - 22} stroke="var(--color-rule)" strokeWidth="1" />
                  <text
                    x={x}
                    y={rSvgH - 6}
                    textAnchor="middle"
                    fill="var(--color-muted)"
                    fontSize="11"
                    fontFamily="var(--font-outlier)"
                  >
                    {activeMethod === 'wp'
                      ? `${Math.round(ratio * axisMax * 100)}%`
                      : `${Math.round(ratio * 100)}`}
                  </text>
                </g>
              );
            })}

            {activeRankings.map((item, idx) => {
              const y = 24 + idx * rRowH;
              const width = Math.max(0, Math.min(1, item.score / axisMax)) * rBarW;
              const label = `${item.nama}`;
              const shortLabel = label.length > 18 ? `${label.slice(0, 17)}…` : label;
              const scoreLabel =
                activeMethod === 'wp'
                  ? `${(item.score * 100).toFixed(1)}%`
                  : `${(item.score * 100).toFixed(1)} / 100`;
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
                  <rect x={rLabelW} y="2" width={rBarW} height="18" rx="2" fill="var(--color-chart-track)" />
                  <rect
                    className="anim-bar"
                    style={{ '--row-i': idx }}
                    x={rLabelW}
                    y="2"
                    width={width.toFixed(1)}
                    height="18"
                    rx="3"
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
                    {scoreLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Grafik 2 */}
        <div className="chart-block">
          <h3 className="chart-title">Apakah urutan konsisten di 3 metode?</h3>
          <p className="chart-caption">
            Cara membaca: jika ketiga batang sama-sama panjang untuk satu pelamar, artinya pelamar tersebut kuat di semua metode hitung.
          </p>
          <div className="chart-legend" aria-hidden="true">
            <span className="legend-item">
              <span className="legend-swatch is-c1" />
              SAW
            </span>
            <span className="legend-item">
              <span className="legend-swatch is-c2" />
              WP (relatif)
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
            aria-label="Grafik konsistensi skor pelamar pada metode SAW, WP, dan TOPSIS"
          >
            {[0, 0.5, 1].map((ratio) => {
              const x = 115 + ratio * 345;
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
                    {Math.round(ratio * 100)}%
                  </text>
                </g>
              );
            })}

            {comparison.map((row, idx) => {
              const y = 18 + idx * cRowH;
              const wSaw = Math.max(0, Math.min(1, row.sawScore)) * 345;
              const wWp = Math.max(0, Math.min(1, row.wpScore / wpMax)) * 345;
              const wTopsis = Math.max(0, Math.min(1, row.topsisScore)) * 345;
              return (
                <g key={row.id} transform={`translate(0, ${y})`}>
                  <text x="0" y="14" fill="var(--color-ink)" fontSize="12" fontWeight="600">
                    {row.nama.length > 14 ? `${row.nama.slice(0, 13)}…` : row.nama}
                  </text>
                  <text x="0" y="29" fill="var(--color-muted)" fontSize="11">
                    {row.kode}
                  </text>

                  <rect x="115" y="2" width={wSaw.toFixed(1)} height="9" rx="1.5" fill="var(--color-chart-1)" />
                  <rect x="115" y="14" width={wWp.toFixed(1)} height="9" rx="1.5" fill="var(--color-chart-2)" />
                  <rect x="115" y="26" width={wTopsis.toFixed(1)} height="9" rx="1.5" fill="var(--color-chart-3)" />

                  <text x="470" y="22" fill="var(--color-muted)" fontSize="11" fontFamily="var(--font-outlier)">
                    #{row.sawRank}/{row.wpRank}/{row.topsisRank}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Grafik 3 */}
        <div className="chart-block">
          <h3 className="chart-title">Bandingkan 2 pelamar secara langsung</h3>
          <p className="chart-caption">
            Cara membaca: 100% berarti terbaik di antara seluruh pelamar untuk syarat tersebut (gaji lebih hemat juga bernilai lebih tinggi).
          </p>

          <div className="form-grid" style={{ marginBottom: 'var(--space-sm)' }}>
            <div className="field">
              <label className="field-label" htmlFor="cmp-a">
                Pelamar pertama
              </label>
              <select
                id="cmp-a"
                className="select"
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
              >
                {alternatives.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} ({a.kode})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="cmp-b">
                Pelamar pembanding
              </label>
              <select
                id="cmp-b"
                className="select"
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
              >
                {alternatives.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} ({a.kode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-legend" aria-hidden="true">
            <span className="legend-item">
              <span className="legend-swatch is-c1" />
              {rowA ? rowA.nama : 'Pelamar 1'}
            </span>
            <span className="legend-item">
              <span className="legend-swatch is-c2" />
              {rowB ? rowB.nama : 'Pelamar 2'}
            </span>
          </div>

          <svg
            className="svg-chart"
            viewBox={`0 0 540 ${pSvgH}`}
            role="img"
            aria-label="Grafik perbandingan keunggulan per syarat antara dua pelamar"
          >
            {criteria.map((c, idx) => {
              const y = 14 + idx * pRowH;
              const valA = rowA ? rowA.values[c.id] : 0;
              const valB = rowB ? rowB.values[c.id] : 0;
              const barW = 300;
              return (
                <g key={c.id} transform={`translate(0, ${y})`}>
                  <text x="0" y="14" fill="var(--color-ink)" fontSize="12" fontWeight="600">
                    {c.nama.length > 18 ? `${c.nama.slice(0, 17)}…` : c.nama}
                  </text>
                  <text x="0" y="29" fill="var(--color-muted)" fontSize="11">
                    {c.tipe === 'cost' ? 'Lebih hemat lebih baik' : 'Lebih tinggi lebih baik'}
                  </text>

                  <rect x="155" y="2" width={barW} height="11" rx="1.5" fill="var(--color-chart-track)" />
                  <rect
                    x="155"
                    y="2"
                    width={(valA * barW).toFixed(1)}
                    height="11"
                    rx="1.5"
                    fill="var(--color-chart-1)"
                  />
                  <text x="466" y="12" fill="var(--color-ink)" fontSize="11" fontFamily="var(--font-outlier)">
                    {Math.round(valA * 100)}%
                  </text>

                  <rect x="155" y="17" width={barW} height="11" rx="1.5" fill="var(--color-chart-track)" />
                  <rect
                    x="155"
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

        {/* Grafik 4: Diagram Radar Profil Pelamar vs Rata-rata */}
        <div className="chart-block chart-block-full">
          <h3 className="chart-title">
            Peta kekuatan menyeluruh: {rowA ? rowA.nama : 'Pelamar pilihan'} vs rata-rata pelamar
          </h3>
          <p className="chart-caption">
            Cara membaca: makin luas area berwarna rose dibanding garis putus-putus, makin unggul pelamar di syarat tersebut. Ganti Pelamar pertama di atas untuk mengubah peta ini.
          </p>
          <CandidateRadarChart
            criteria={criteria}
            sawResult={calcResult.saw}
            candidateId={compareA}
            candidateName={rowA ? rowA.nama : ''}
          />
        </div>

        {/* Grafik 5: Peta Panas (Heatmap) Semua Pelamar × Semua Kriteria */}
        <div className="chart-block chart-block-full">
          <h3 className="chart-title">Peta panas performa seluruh pelamar pada semua kriteria</h3>
          <p className="chart-caption">
            Cara membaca: sel berwarna rose makin pekat berarti nilai pelamar makin mendekati yang terbaik (100%). Klik nama pelamar untuk membuka profil lengkapnya.
          </p>
          <CriteriaHeatmap
            criteria={criteria}
            sawResult={calcResult.saw}
            onInspectCandidate={onInspectCandidate}
          />
        </div>
      </div>
      </section>
    </div>
  );
}
