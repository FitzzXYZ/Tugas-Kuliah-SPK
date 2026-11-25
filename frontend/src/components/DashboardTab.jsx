import React, { useEffect, useState } from 'react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js';
import {
  DECISION_LABELS,
  METHOD_INFO,
  MIN_ALTERNATIVES,
  MIN_CRITERIA,
  VALID_DECISIONS,
  VALID_METHODS,
  WEIGHT_PRESETS,
  detectDataIssues,
  getCandidateStrengths,
  getInitials,
  getWeightSummary,
} from '../models/spkEngine.js';
import CandidateRadarChart from './CandidateRadarChart.jsx';
import { EmptyState, IconCheck, IconPrint, IconWarn } from './StateViews.jsx';

export default function DashboardTab({
  workspace,
  activeMethod,
  onSelectMethod,
  calcResult,
  calcError,
  onApplyPreset,
  onUpdateHumanDecision,
  onInspectCandidate,
  onNavigateTab,
}) {
  const { criteria, alternatives } = workspace;
  const activeData = calcResult?.[activeMethod];
  const rankings = activeData?.rankings || [];
  const leader = rankings[0] || null;
  const leaderPct = leader == null ? 0 : Math.round(leader.score * 1000) / 10;
  const animatedLeaderPct = useAnimatedNumber(leaderPct, 420);

  const [focusedId, setFocusedId] = useState(leader?.id || '');

  useEffect(() => {
    if (leader && (!focusedId || !rankings.some((r) => r.id === focusedId))) {
      setFocusedId(leader.id);
    }
  }, [leader, focusedId, rankings]);

  if (calcError || !calcResult || alternatives.length === 0 || !leader) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Dashboard menunggu data pelamar"
          description={
            calcError ||
            'Tambahkan minimal empat calon karyawan dan lima kriteria penilaian agar ringkasan dashboard aktif.'
          }
          actionLabel="Buka Isi data"
          onAction={() => onNavigateTab('data')}
        />
      </section>
    );
  }

  const maxScore = Math.max(...rankings.map((r) => r.score), 0.0001);
  const methodInfo = METHOD_INFO[activeMethod];
  const topThree = rankings.slice(0, 3);
  const focusedCandidate = rankings.find((r) => r.id === focusedId) || leader;

  const compById = Object.fromEntries(calcResult.comparison.map((row) => [row.id, row]));
  const leaderComp = compById[leader.id];
  const agreeCount = leaderComp
    ? [leaderComp.sawRank, leaderComp.wpRank, leaderComp.topsisRank].filter((r) => r === 1).length
    : 0;
  const leaderStrengths = getCandidateStrengths(leader.id, criteria, calcResult.saw, 2);

  const meterRatio = activeMethod === 'wp' ? leader.score / maxScore : leader.score;
  const litCells = Math.max(1, Math.min(50, Math.round(meterRatio * 50)));
  const meterPulseKey = `${activeMethod}-${leader.id}-${litCells}`;

  const weightSummary = getWeightSummary(criteria);
  const issues = detectDataIssues(alternatives, criteria);
  const benefitCount = criteria.filter((c) => c.tipe === 'benefit').length;
  const costCount = criteria.length - benefitCount;
  const lanjutCount = alternatives.filter((a) => a.keputusan === 'lanjut').length;
  const cadanganCount = alternatives.filter((a) => a.keputusan === 'cadangan').length;
  const belumCount = alternatives.filter((a) => !a.keputusan || a.keputusan === 'belum').length;

  const hasDefaultCodes = ['C1', 'C2', 'C3', 'C4', 'C5'].every((code) =>
    criteria.some((c) => c.kode.toUpperCase() === code),
  );

  return (
    <div className="stack-lg">
      {/* 1. Executive Command Band (Velvet Plum-Berry + Rose Glass Art + 50-Cell Meter) */}
      <section className="dash-hero" aria-label="Ringkasan kandidat teratas">
        <img
          className="dash-hero-art"
          src="/assets/hero-rose-glass.jpg"
          width="1376"
          height="768"
          alt=""
          aria-hidden="true"
        />

        <div className="dash-hero-copy">
          <h2 className="dash-hero-title">
            Peringkat #1: {leader.nama} ({leader.kode})
          </h2>
          <span className="dash-hero-role">
            {leader.posisi}, kandidat teratas metode {methodInfo.nama}
          </span>
          <p className="dash-hero-desc">
            {leaderStrengths.length > 0 && (
              <>Paling menonjol pada {leaderStrengths.map((s) => s.nama).join(' dan ')}. </>
            )}
            {agreeCount === 3
              ? 'Konsisten menempati peringkat pertama pada seluruh metode (SAW, WP, dan TOPSIS).'
              : `Memimpin pada ${agreeCount} dari 3 metode hitung; periksa perbandingan lintas metode.`}
          </p>

          <div className="dash-hero-controls">
            <div className="dash-method-group" role="group" aria-label="Ganti metode cepat">
              {VALID_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="dash-method-btn"
                  aria-pressed={activeMethod === m}
                  onClick={() => onSelectMethod(m)}
                >
                  {METHOD_INFO[m].nama}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="key key--primary key--sm"
              onClick={() => onInspectCandidate(leader.id)}
            >
              Tinjau profil #1
            </button>
            <button
              type="button"
              className="key key--ghost-dark key--sm"
              onClick={() => onNavigateTab('laporan')}
            >
              <IconPrint />
              <span>Cetak laporan</span>
            </button>
          </div>
        </div>

        <div className="dash-meter-box">
          <span key={`sheen-${meterPulseKey}`} className="dash-meter-sheen" aria-hidden="true" />
          <div className="dash-score-line">
            <div className="dash-score-main">
              <span className="dash-score-big">{animatedLeaderPct.toFixed(1)}</span>
              <span className="dash-score-unit">
                {activeMethod === 'wp' ? '% pangsa' : '/ 100'}
              </span>
            </div>
            <span className="dash-tri-label">Skor {methodInfo.nama}</span>
          </div>

          <div
            key={meterPulseKey}
            className="cell-meter"
            role="meter"
            aria-label={`Skor preferensi ${leader.nama}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(meterRatio * 100)}
          >
            {Array.from({ length: 50 }, (_, idx) => (
              <span
                key={idx}
                className={`cell-tick ${idx < litCells ? 'is-lit' : ''}`}
                style={{ '--i': idx }}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="meter-scale" aria-hidden="true">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>

          <div className="dash-tri-scores">
            <div className="dash-tri-item">
              <span className="dash-tri-label">SAW</span>
              <span className="dash-tri-val">
                {leaderComp ? leaderComp.sawScore.toFixed(4) : '-'} (#{leaderComp?.sawRank})
              </span>
            </div>
            <div className="dash-tri-item">
              <span className="dash-tri-label">WP</span>
              <span className="dash-tri-val">
                {leaderComp ? leaderComp.wpScore.toFixed(4) : '-'} (#{leaderComp?.wpRank})
              </span>
            </div>
            <div className="dash-tri-item">
              <span className="dash-tri-label">TOPSIS</span>
              <span className="dash-tri-val">
                {leaderComp ? leaderComp.topsisScore.toFixed(4) : '-'} (#{leaderComp?.topsisRank})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Ringkasan 4 Angka Kunci */}
      <section className="stat-strip" aria-label="Ringkasan angka seleksi" style={{ marginBottom: 0 }}>
        <div className="stat-cell">
          <span className="stat-label">Total pelamar</span>
          <span className="stat-figure">{alternatives.length}</span>
          <span className="stat-meta">
            {alternatives.length >= MIN_ALTERNATIVES
              ? `Memenuhi batas min. ${MIN_ALTERNATIVES}`
              : `Kurang ${MIN_ALTERNATIVES - alternatives.length} dari batas min.`}
          </span>
        </div>
        <div className="stat-cell">
          <span className="stat-label">Kriteria aktif</span>
          <span className="stat-figure">{criteria.length}</span>
          <span className="stat-meta">
            {benefitCount} benefit, {costCount} cost (min. {MIN_CRITERIA})
          </span>
        </div>
        <div className="stat-cell">
          <span className="stat-label">Konsistensi 3 metode</span>
          <span className="stat-figure">{agreeCount} / 3</span>
          <span className="stat-meta">
            {agreeCount === 3 ? 'Semua metode sepakat pada #1' : 'Perlu cek sensitivitas metode'}
          </span>
        </div>
        <div className="stat-cell">
          <span className="stat-label">Keputusan pengelola</span>
          <span className="stat-figure">{lanjutCount}</span>
          <span className="stat-meta">
            Lanjut ({cadanganCount} cadangan, {belumCount} belum)
          </span>
        </div>
      </section>

      {/* 3. Workspace Analitik Fokus 2 Kolom (Tanpa duplikasi kartu podium) */}
      <div className="dash-grid">
        <section className="cut-panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2 className="panel-title">Papan peringkat langsung ({methodInfo.nama})</h2>
              <p className="panel-subtitle">
                Klik nama pelamar untuk membuka rincian lengkap, atau tetapkan status keputusan langsung pada tabel ini.
              </p>
            </div>
            <button type="button" className="key key--sm" onClick={() => onNavigateTab('perhitungan')}>
              Audit rumus
            </button>
          </div>

          <div className="table-scroll">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Calon karyawan</th>
                  <th className="col-num">Skor</th>
                  <th className="col-num">3 metode</th>
                  <th>Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((item, rowIdx) => {
                  const cmp = compById[item.id];
                  const alt = alternatives.find((a) => a.id === item.id) || item.alternative;
                  const isTop = item.rank === 1;
                  const barPct = activeMethod === 'wp' ? (item.score / maxScore) * 100 : item.score * 100;
                  const readable =
                    activeMethod === 'wp'
                      ? `${(item.score * 100).toFixed(1)}%`
                      : `${(item.score * 100).toFixed(1)}`;
                  return (
                    <tr
                      key={item.id}
                      className={`anim-row ${isTop ? 'is-leader' : ''}`}
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
                          <span className={`monogram ${isTop ? 'is-leader' : ''}`} aria-hidden="true">
                            {getInitials(alt.nama)}
                          </span>
                          <span>
                            <span className="cell-primary">{alt.nama}</span>
                            <span className="cell-secondary">
                              {alt.kode}, {alt.posisi}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="col-num">
                        <div className="score-meter">
                          <span>{readable}</span>
                          <div className="score-bar-track" aria-hidden="true">
                            <div
                              className={`score-bar-fill anim-bar ${isTop ? 'is-top' : ''}`}
                              style={{
                                '--row-i': rowIdx,
                                width: `${Math.max(4, Math.min(100, barPct)).toFixed(1)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="col-num" title="Peringkat SAW / WP / TOPSIS">
                        #{cmp?.sawRank}/{cmp?.wpRank}/{cmp?.topsisRank}
                      </td>
                      <td style={{ minWidth: '10.5rem' }}>
                        <label className="visually-hidden" htmlFor={`dash-dec-${alt.id}`}>
                          Keputusan untuk {alt.nama}
                        </label>
                        <select
                          id={`dash-dec-${alt.id}`}
                          className={`select is-decision-${alt.keputusan || 'belum'}`}
                          value={alt.keputusan || 'belum'}
                          onChange={(e) =>
                            onUpdateHumanDecision(alt.id, { keputusan: e.target.value })
                          }
                        >
                          {VALID_DECISIONS.map((val) => (
                            <option key={val} value={val}>
                              {DECISION_LABELS[val]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="dash-quick-bar">
            <span className="cell-secondary">
              {issues.length > 0
                ? issues[0].message
                : 'Seluruh data pelamar, kriteria, dan bobot siap untuk keputusan akhir.'}
            </span>
            <div className="action-row">
              <button type="button" className="key key--sm" onClick={() => onNavigateTab('data')}>
                Kelola data
              </button>
              <button
                type="button"
                className="key key--sm"
                onClick={() => onNavigateTab('visualisasi')}
              >
                Buka grafik
              </button>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Radar 3 Besar + Simulasi Prioritas Bobot */}
        <div className="dash-side">
          <section className="cut-panel">
            <div className="panel-head">
              <div className="panel-head-text">
                <h2 className="panel-title">Profil kekuatan 3 besar</h2>
                <p className="panel-subtitle">
                  Bandingkan profil kandidat teratas terhadap rata-rata seluruh pelamar.
                </p>
              </div>
              <button
                type="button"
                className="key key--sm"
                onClick={() => onInspectCandidate(focusedCandidate.id)}
              >
                Detail
              </button>
            </div>

            <div className="filter-strip" role="group" aria-label="Pilih kandidat 3 besar untuk radar">
              {topThree.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="filter-chip"
                  aria-pressed={focusedCandidate.id === item.id}
                  onClick={() => setFocusedId(item.id)}
                >
                  #{item.rank} {item.nama.split(' ')[0]}
                </button>
              ))}
            </div>

            <CandidateRadarChart
              criteria={criteria}
              sawResult={calcResult.saw}
              candidateId={focusedCandidate.id}
              candidateName={focusedCandidate.nama}
            />
          </section>

          <section className="cut-panel">
            <div className="panel-head">
              <div className="panel-head-text">
                <h2 className="panel-title">Prioritas bobot dan simulasi cepat</h2>
                <p className="panel-subtitle">
                  Uji perubahan prioritas untuk melihat dampaknya pada peringkat teratas.
                </p>
              </div>
              <button
                type="button"
                className="key key--sm"
                onClick={() => onNavigateTab('bobot-metode')}
              >
                Ubah bobot
              </button>
            </div>

            <div className="stacked-bar" aria-hidden="true">
              {weightSummary.items.map((w, idx) => (
                <div
                  key={w.id}
                  className={`stacked-seg is-s${idx % 5}`}
                  style={{ width: `${Math.max(2, w.percent).toFixed(1)}%` }}
                  title={`${w.nama}: ${w.percent.toFixed(1)}%`}
                />
              ))}
            </div>

            <ul className="weight-legend">
              {weightSummary.items.map((w, idx) => (
                <li key={w.id} className="weight-legend-row">
                  <span className="weight-legend-left">
                    <span className={`swatch-dot is-s${idx % 5}`} aria-hidden="true" />
                    <span>{w.nama}</span>
                  </span>
                  <span className="col-num">{w.percent.toFixed(0)}%</span>
                </li>
              ))}
            </ul>

            {hasDefaultCodes && (
              <div className="preset-row" style={{ marginBottom: 0 }}>
                <span className="preset-label">Uji cepat:</span>
                {WEIGHT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="key key--sm"
                    onClick={() => onApplyPreset(preset.byCode)}
                  >
                    {preset.shortLabel}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
