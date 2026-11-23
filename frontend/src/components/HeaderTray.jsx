import React from 'react';
import { MIN_ALTERNATIVES, MIN_CRITERIA } from '../models/spkEngine.js';
import { IconCheck, IconWarn } from './StateViews.jsx';

export const TABS = [
  { id: 'data', index: '01', label: 'Data dan kriteria' },
  { id: 'bobot-metode', index: '02', label: 'Bobot dan metode' },
  { id: 'perhitungan', index: '03', label: 'Hitung dan peringkat' },
  { id: 'visualisasi', index: '04', label: 'Visualisasi' },
  { id: 'laporan', index: '05', label: 'Laporan keputusan' },
];

export default function HeaderTray({
  activeTab,
  onSelectTab,
  altCount,
  critCount,
  weightTotal,
  isExact100,
  connectionLabel,
  engineSource,
}) {
  const altOk = altCount >= MIN_ALTERNATIVES;
  const critOk = critCount >= MIN_CRITERIA;

  return (
    <>
      <header className="app-header">
        <div className="container header-top">
          <div className="brand-mark">
            <span className="brand-bar" aria-hidden="true" />
            <div>
              <h1 className="brand-title">SPK Seleksi Calon Karyawan</h1>
              <p className="brand-sub">
                Dukungan keputusan berbasis SAW, WP, dan TOPSIS dengan pertimbangan akhir pengelola.
              </p>
            </div>
          </div>

          <div className="header-readouts" aria-label="Ringkasan status data">
            <span className={`readout-item ${altOk ? 'is-pass' : 'is-warn'}`}>
              {altOk ? <IconCheck /> : <IconWarn />}
              <span>Alternatif</span>
              <span className="readout-num">
                {altCount}/{MIN_ALTERNATIVES}
              </span>
            </span>

            <span className={`readout-item ${critOk ? 'is-pass' : 'is-warn'}`}>
              {critOk ? <IconCheck /> : <IconWarn />}
              <span>Kriteria</span>
              <span className="readout-num">
                {critCount}/{MIN_CRITERIA}
              </span>
            </span>

            <span className={`readout-item ${isExact100 ? 'is-pass' : 'is-warn'}`}>
              {isExact100 ? <IconCheck /> : <IconWarn />}
              <span>Bobot</span>
              <span className="readout-num">{weightTotal}%</span>
            </span>

            <span className="readout-item">
              <span>{connectionLabel}</span>
              {engineSource && <span className="readout-num">({engineSource})</span>}
            </span>
          </div>
        </div>
      </header>

      <nav className="tray-bar no-print" aria-label="Tahapan kerja SPK">
        <div className="container">
          <div className="step-tray" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className="step-key"
                onClick={() => onSelectTab(tab.id)}
              >
                <span className="step-idx">{tab.index}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

