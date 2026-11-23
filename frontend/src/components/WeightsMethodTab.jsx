import React from 'react';
import { METHOD_INFO, VALID_METHODS, getWeightSummary } from '../models/spkEngine.js';
import { IconCheck, IconDown, IconUp, IconWarn } from './StateViews.jsx';

export default function WeightsMethodTab({
  criteria,
  activeMethod,
  onSelectMethod,
  onChangeWeight,
  onNormalizeWeights,
  onNextTab,
}) {
  const summary = getWeightSummary(criteria);
  const currentMethodInfo = METHOD_INFO[activeMethod];

  return (
    <div className="stack-lg">
      {/* Pemilihan Metode SPK (Fitur 4) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Pemilihan metode SPK</h2>
            <p className="panel-subtitle">
              Pilih metode perhitungan utama untuk tabel peringkat dan laporan. Ketiga metode tetap dihitung otomatis agar stabilitas peringkat dapat dibandingkan.
            </p>
          </div>
          <div className="action-row">
            <button type="button" className="key key--primary" onClick={onNextTab}>
              Lihat peringkat
            </button>
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
                <span className="method-name">{info.nama}</span>
                <span className="cell-secondary">{info.namaLengkap}</span>
                <span className="method-desc">{info.ringkas}</span>
              </button>
            );
          })}
        </div>

        <div className="graphite-ledger" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)' }}>
          <div className="graphite-note" style={{ marginBottom: 'var(--space-xs)' }}>
            Rumus aktif ({currentMethodInfo.namaLengkap})
          </div>
          <div className="graphite-formula" style={{ marginBottom: 0 }}>
            {currentMethodInfo.rumus}
          </div>
        </div>
      </section>

      {/* Pengaturan Bobot Kriteria (Fitur 3) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Pengaturan bobot kriteria</h2>
            <p className="panel-subtitle">
              Sesuaikan tingkat kepentingan tiap kriteria. Jika total belum tepat 100%, engine menormalisasi otomatis saat menghitung atau Anda dapat menyamakan total ke 100%.
            </p>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="key"
              disabled={summary.isExact100}
              onClick={onNormalizeWeights}
            >
              Normalisasi ke 100%
            </button>
          </div>
        </div>

        <div className={`status-bar ${summary.isExact100 ? 'is-pass' : 'is-warn'}`}>
          <span className="status-lead">
            {summary.isExact100 ? <IconCheck /> : <IconWarn />}
            <span>
              Total bobot input saat ini <strong>{summary.rawTotal}%</strong>{' '}
              {summary.isExact100
                ? '(proporsi bobot seimbang tepat 100%).'
                : '(belum 100%; bobot ternormalisasi w_j tetap berjumlah 1.0000 saat dihitung).'}
            </span>
          </span>
        </div>

        <div className="table-scroll">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Kriteria</th>
                <th>Tipe</th>
                <th style={{ minWidth: '13rem' }}>Pengatur bobot</th>
                <th className="col-num">Input (%)</th>
                <th className="col-num">Bobot w_j</th>
              </tr>
            </thead>
            <tbody>
              {summary.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="cell-primary">
                      {item.kode} {item.nama}
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
                      <span>{item.tipe === 'benefit' ? 'Benefit' : 'Cost'}</span>
                    </span>
                  </td>
                  <td>
                    <label className="visually-hidden" htmlFor={`slider-${item.id}`}>
                      Geser bobot {item.nama}
                    </label>
                    <input
                      id={`slider-${item.id}`}
                      className="range-input"
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={Math.min(60, Math.max(1, Number(item.raw) || 1))}
                      onChange={(e) => onChangeWeight(item.id, Number(e.target.value))}
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
                      value={item.raw}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (Number.isFinite(val) && val > 0) {
                          onChangeWeight(item.id, val);
                        }
                      }}
                    />
                  </td>
                  <td className="col-num">{item.weight.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
