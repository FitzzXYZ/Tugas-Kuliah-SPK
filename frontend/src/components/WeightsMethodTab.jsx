import React, { useState } from 'react';
import {
  METHOD_INFO,
  VALID_METHODS,
  WEIGHT_PRESETS,
  getWeightSummary,
} from '../models/spkEngine.js';
import MethodDiagram from './MethodDiagrams.jsx';
import { IconCheck, IconDown, IconUp, IconWarn } from './StateViews.jsx';

export default function WeightsMethodTab({
  criteria,
  activeMethod,
  onSelectMethod,
  onChangeWeight,
  onApplyPreset,
  onNormalizeWeights,
  onNextTab,
}) {
  const [weightDrafts, setWeightDrafts] = useState({});
  const summary = getWeightSummary(criteria);
  const currentMethodInfo = METHOD_INFO[activeMethod];
  const hasDefaultCodes = ['C1', 'C2', 'C3', 'C4', 'C5'].every((code) =>
    criteria.some((c) => c.kode.toUpperCase() === code),
  );

  function clearDraft(id) {
    setWeightDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <div className="stack-lg">
      {/* Bagian 1: Pengaturan Bobot Prioritas (Fitur 3) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Atur prioritas penilaian (bobot kriteria)</h2>
            <p className="panel-subtitle">
              Geser pengatur di bawah untuk memberi bobot lebih besar pada kriteria yang paling penting bagi tim Anda. Usahakan total mendekati 100%.
            </p>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="key"
              disabled={summary.isExact100}
              onClick={() => {
                setWeightDrafts({});
                onNormalizeWeights();
              }}
            >
              Samakan ke 100%
            </button>
            <button type="button" className="key key--primary" onClick={onNextTab}>
              Lihat peringkat
            </button>
          </div>
        </div>

        {hasDefaultCodes && (
          <div className="preset-row" role="group" aria-label="Pilihan cepat prioritas">
            <span className="preset-label">Pilihan cepat:</span>
            {WEIGHT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="key key--sm"
                onClick={() => {
                  setWeightDrafts({});
                  onApplyPreset(preset.byCode);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        <div className={`status-bar ${summary.isExact100 ? 'is-pass' : 'is-warn'}`}>
          <span className="status-lead">
            {summary.isExact100 ? <IconCheck /> : <IconWarn />}
            <span>
              Total bobot saat ini <strong>{summary.rawTotal}%</strong>.{' '}
              {summary.isExact100
                ? 'Sudah pas 100% dan siap dihitung.'
                : 'Belum pas 100%. Klik tombol Samakan ke 100% agar proporsi otomatis disesuaikan.'}
            </span>
          </span>
        </div>

        <div className="table-scroll">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Kriteria penilaian</th>
                <th>Arah nilai</th>
                <th style={{ minWidth: '13rem' }}>Geser prioritas</th>
                <th className="col-num">Bobot (%)</th>
                <th className="col-num">Porsi akhir</th>
              </tr>
            </thead>
            <tbody>
              {summary.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="cell-primary">
                      {item.nama} ({item.kode})
                    </span>
                    <div className="weight-bar-track" style={{ marginTop: 'var(--space-2xs)' }}>
                      <div
                        className={`weight-bar-fill ${summary.isExact100 ? '' : 'is-warn'}`}
                        style={{ width: `${Math.min(100, Math.max(0, item.percent)).toFixed(1)}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`status-tag ${item.tipe === 'benefit' ? 'is-benefit' : 'is-cost'}`}>
                      {item.tipe === 'benefit' ? <IconUp /> : <IconDown />}
                      <span>{item.tipe === 'benefit' ? 'Makin besar makin baik' : 'Makin kecil makin baik'}</span>
                    </span>
                  </td>
                  <td>
                    <label className="visually-hidden" htmlFor={`slider-${item.id}`}>
                      Geser prioritas {item.nama}
                    </label>
                    <input
                      id={`slider-${item.id}`}
                      className="range-input"
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={Math.min(60, Math.max(1, Number(item.raw) || 1))}
                      onChange={(e) => {
                        clearDraft(item.id);
                        onChangeWeight(item.id, Number(e.target.value));
                      }}
                    />
                  </td>
                  <td className="col-num" style={{ width: '7.5rem' }}>
                    <label className="visually-hidden" htmlFor={`num-${item.id}`}>
                      Angka bobot {item.nama}
                    </label>
                    <input
                      id={`num-${item.id}`}
                      className="input input--mono"
                      type="number"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={weightDrafts[item.id] ?? String(item.raw)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setWeightDrafts((prev) => ({ ...prev, [item.id]: raw }));
                        const val = Number(raw);
                        if (raw.trim() !== '' && Number.isFinite(val) && val > 0 && val <= 100) {
                          onChangeWeight(item.id, val);
                        }
                      }}
                      onBlur={() => clearDraft(item.id)}
                    />
                  </td>
                  <td className="col-num">{item.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bagian 2: Pemilihan Metode SPK (Fitur 4) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Pilih cara perhitungan (metode SPK)</h2>
            <p className="panel-subtitle">
              Jika baru pertama kali memakai aplikasi ini, pilih SAW karena paling mudah dibaca. Ketiga metode tetap dihitung otomatis agar Anda bisa membandingkan hasilnya.
            </p>
          </div>
        </div>

        <div className="method-tray" role="group" aria-label="Pilih metode perhitungan SPK">
          {VALID_METHODS.map((key) => {
            const info = METHOD_INFO[key];
            const selected = activeMethod === key;
            return (
              <button
                key={key}
                type="button"
                className="method-option"
                aria-pressed={selected}
                onClick={() => onSelectMethod(key)}
              >
                <div className="method-option-head">
                  <div>
                    <span className="method-name">
                      {info.nama}: {info.namaAwam}
                    </span>
                    <span className="cell-secondary">{info.namaLengkap}</span>
                  </div>
                  <MethodDiagram method={key} />
                </div>
                <span className="method-desc">{info.ringkas}</span>
              </button>
            );
          })}
        </div>

        <details className="disclosure-box">
          <summary>Lihat rumus matematika metode {currentMethodInfo.nama} (opsional)</summary>
          <div className="disclosure-body">
            <div className="graphite-ledger" style={{ padding: 'var(--space-md)' }}>
              <div className="graphite-note" style={{ marginBottom: 'var(--space-xs)' }}>
                Formula {currentMethodInfo.namaLengkap}
              </div>
              <div className="graphite-formula" style={{ marginBottom: 0 }}>
                {currentMethodInfo.rumus}
              </div>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
