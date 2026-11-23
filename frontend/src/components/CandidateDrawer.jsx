import React, { useEffect, useRef } from 'react';
import {
  DECISION_LABELS,
  METHOD_INFO,
  VALID_DECISIONS,
} from '../models/spkEngine.js';
import CandidateRadarChart from './CandidateRadarChart.jsx';
import { IconClose } from './StateViews.jsx';

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function CandidateDrawer({
  candidate,
  criteria,
  calcResult,
  activeMethod,
  onClose,
  onUpdateDecision,
  onEditCandidate,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (candidate) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [candidate]);

  if (!candidate) {
    return <dialog ref={dialogRef} className="candidate-drawer" aria-label="Detail pelamar" />;
  }

  const sawRow = calcResult?.saw?.matrixR?.find((r) => r.id === candidate.id);
  const cmpRow = calcResult?.comparison?.find((r) => r.id === candidate.id);
  const activeRank = calcResult?.[activeMethod]?.rankings?.find((r) => r.id === candidate.id);
  const methodInfo = METHOD_INFO[activeMethod];

  return (
    <dialog
      ref={dialogRef}
      className="candidate-drawer"
      aria-labelledby="drawer-cand-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="drawer-inner">
        <header className="drawer-head">
          <div className="person-cell">
            <span
              className={`monogram ${activeRank?.rank === 1 ? 'is-leader' : ''}`}
              aria-hidden="true"
            >
              {getInitials(candidate.nama)}
            </span>
            <div>
              <h2 id="drawer-cand-title" className="drawer-title">
                {candidate.nama}
              </h2>
              <span className="cell-secondary">
                {candidate.kode}, {candidate.posisi}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="icon-ctrl"
            aria-label="Tutup panel detail pelamar"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </header>

        <div className="drawer-body stack-md">
          {/* Ringkasan peringkat lintas 3 metode */}
          {cmpRow && (
            <div className="drawer-rank-grid">
              <div className="drawer-rank-cell">
                <span className="stat-label">SAW</span>
                <span className="drawer-rank-num">#{cmpRow.sawRank}</span>
                <span className="cell-secondary">{cmpRow.sawScore.toFixed(4)}</span>
              </div>
              <div className="drawer-rank-cell">
                <span className="stat-label">WP</span>
                <span className="drawer-rank-num">#{cmpRow.wpRank}</span>
                <span className="cell-secondary">{cmpRow.wpScore.toFixed(4)}</span>
              </div>
              <div className="drawer-rank-cell">
                <span className="stat-label">TOPSIS</span>
                <span className="drawer-rank-num">#{cmpRow.topsisRank}</span>
                <span className="cell-secondary">{cmpRow.topsisScore.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Rincian nilai per kriteria */}
          <div>
            <h3 className="drawer-section-title">Rincian nilai per kriteria</h3>
            <ul className="drawer-crit-list">
              {criteria.map((c) => {
                const rawVal = candidate.nilai?.[c.id];
                const normPct = Math.round((sawRow?.values?.[c.id] ?? 0) * 100);
                return (
                  <li key={c.id} className="drawer-crit-row">
                    <div className="drawer-crit-top">
                      <span className="cell-primary">
                        {c.nama} ({c.kode})
                      </span>
                      <span className="col-num">
                        {rawVal} {c.satuan}
                      </span>
                    </div>
                    <div className="drawer-crit-bar">
                      <div className="podium-bar-track" aria-hidden="true">
                        <div
                          className="score-bar-fill is-top"
                          style={{ width: `${Math.max(4, Math.min(100, normPct))}%` }}
                        />
                      </div>
                      <span className="col-code">{normPct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Radar profil kekuatan */}
          {calcResult?.saw && criteria.length >= 3 && (
            <div>
              <h3 className="drawer-section-title">Peta kekuatan dibanding rata-rata</h3>
              <CandidateRadarChart
                criteria={criteria}
                sawResult={calcResult.saw}
                candidateId={candidate.id}
                candidateName={candidate.nama}
              />
            </div>
          )}

          {/* Keputusan & Catatan Pengelola langsung dari drawer */}
          <div className="drawer-decision-box">
            <h3 className="drawer-section-title">Keputusan pengelola ({methodInfo.nama})</h3>
            <div className="stack-sm">
              <div className="field">
                <label className="field-label" htmlFor="drawer-decision-select">
                  Status pilihan Anda
                </label>
                <select
                  id="drawer-decision-select"
                  className={`select is-decision-${candidate.keputusan || 'belum'}`}
                  value={candidate.keputusan || 'belum'}
                  onChange={(e) =>
                    onUpdateDecision(candidate.id, { keputusan: e.target.value })
                  }
                >
                  {VALID_DECISIONS.map((val) => (
                    <option key={val} value={val}>
                      {DECISION_LABELS[val]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="drawer-notes-input">
                  Catatan wawancara atau pertimbangan lapangan
                </label>
                <textarea
                  id="drawer-notes-input"
                  className="textarea"
                  key={`${candidate.id}-${candidate.catatanManusia || ''}`}
                  defaultValue={candidate.catatanManusia || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (candidate.catatanManusia || '')) {
                      onUpdateDecision(candidate.id, { catatanManusia: e.target.value });
                    }
                  }}
                  placeholder="Tulis alasan pemilihan, catatan negosiasi gaji, atau kesiapan mulai kerja..."
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="drawer-foot">
          <button
            type="button"
            className="key key--sm"
            onClick={() => {
              onClose();
              onEditCandidate(candidate.id);
            }}
          >
            Ubah angka pelamar
          </button>
          <button type="button" className="key key--primary key--sm" onClick={onClose}>
            Selesai
          </button>
        </footer>
      </div>
    </dialog>
  );
}
