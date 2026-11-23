import React, { useState } from 'react';
import { METHOD_INFO, MIN_ALTERNATIVES, MIN_CRITERIA, VALID_METHODS } from '../models/spkEngine.js';
import {
  BrandLogo,
  IconAward,
  IconChart,
  IconCheck,
  IconClose,
  IconDoc,
  IconGrid,
  IconMenu,
  IconPlus,
  IconSliders,
  IconUsers,
  IconWarn,
} from './StateViews.jsx';

export const NAV_GROUPS = [
  {
    group: 'Ringkasan',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: IconGrid }],
  },
  {
    group: 'Proses seleksi',
    items: [
      { id: 'data', label: 'Data dan kriteria', icon: IconUsers },
      { id: 'bobot-metode', label: 'Prioritas dan metode', icon: IconSliders },
      { id: 'perhitungan', label: 'Peringkat dan keputusan', icon: IconAward },
    ],
  },
  {
    group: 'Analisis dan arsip',
    items: [
      { id: 'visualisasi', label: 'Grafik perbandingan', icon: IconChart },
      { id: 'laporan', label: 'Laporan keputusan', icon: IconDoc },
    ],
  },
];

export const TABS = NAV_GROUPS.flatMap((g) => g.items);

const TAB_DESCRIPTIONS = {
  dashboard: 'Ringkasan eksekutif, kandidat teratas, dan simulasi prioritas langsung.',
  data: 'Kelola daftar calon karyawan dan kriteria penilaian seleksi.',
  'bobot-metode': 'Atur bobot prioritas kriteria dan pilih metode perhitungan SPK.',
  perhitungan: 'Tinjau urutan peringkat, audit rumus, dan tetapkan keputusan pengelola.',
  visualisasi: 'Bandingkan skor pelamar dan profil kriteria secara visual.',
  laporan: 'Siapkan lembar hasil keputusan resmi untuk cetak PDF atau ekspor Excel.',
};

export default function AppShell({
  activeTab,
  onSelectTab,
  activeMethod,
  onSelectMethod,
  judulSeleksi,
  altCount,
  critCount,
  weightTotal,
  isExact100,
  isRemote,
  onQuickAddCandidate,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const altOk = altCount >= MIN_ALTERNATIVES;
  const critOk = critCount >= MIN_CRITERIA;
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  function handleNavClick(tabId) {
    onSelectTab(tabId);
    setMobileOpen(false);
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div
          className="sidebar-backdrop no-print"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar Navigation */}
      <aside
        className={`app-sidebar no-print ${mobileOpen ? 'is-open' : ''}`}
        aria-label="Navigasi utama"
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <BrandLogo />
            <div className="sidebar-brand-text">
              <span className="sidebar-app-name">SPK Seleksi</span>
              <span className="sidebar-app-role">Manajemen rekrutmen</span>
            </div>
          </div>
          <button
            type="button"
            className="icon-ctrl mobile-only"
            aria-label="Tutup menu navigasi"
            onClick={() => setMobileOpen(false)}
          >
            <IconClose />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Menu halaman">
          {NAV_GROUPS.map((section) => (
            <div key={section.group} className="nav-group">
              <span className="nav-group-label">{section.group}</span>
              <ul className="nav-list">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  const badge =
                    item.id === 'data' ? `${altCount}` : item.id === 'bobot-metode' ? `${weightTotal}%` : '';
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="nav-item"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => handleNavClick(item.id)}
                      >
                        <span className="nav-item-left">
                          <Icon />
                          <span>{item.label}</span>
                        </span>
                        {badge && <span className="nav-count">{badge}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-checks">
            <div className={`sidebar-check-row ${altOk ? 'is-ok' : 'is-warn'}`}>
              {altOk ? <IconCheck /> : <IconWarn />}
              <span>Pelamar</span>
              <span className="sidebar-check-num">
                {altCount}/{MIN_ALTERNATIVES}
              </span>
            </div>
            <div className={`sidebar-check-row ${critOk ? 'is-ok' : 'is-warn'}`}>
              {critOk ? <IconCheck /> : <IconWarn />}
              <span>Kriteria</span>
              <span className="sidebar-check-num">
                {critCount}/{MIN_CRITERIA}
              </span>
            </div>
            <div className={`sidebar-check-row ${isExact100 ? 'is-ok' : 'is-warn'}`}>
              {isExact100 ? <IconCheck /> : <IconWarn />}
              <span>Total bobot</span>
              <span className="sidebar-check-num">{weightTotal}%</span>
            </div>
          </div>
          <div className="sidebar-storage">
            <span>{isRemote ? 'Tersinkron ke server API' : 'Tersimpan di browser'}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="app-body">
        <header className="context-topbar no-print">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-ctrl mobile-only"
              aria-label="Buka menu navigasi"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </button>
            <div className="topbar-heading">
              <h1 className="topbar-title">{currentTab.label}</h1>
              <p className="topbar-desc">{judulSeleksi || TAB_DESCRIPTIONS[activeTab]}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-method-switch" role="group" aria-label="Metode aktif">
              {VALID_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="topbar-method-btn"
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
              onClick={onQuickAddCandidate}
            >
              <IconPlus />
              <span>Tambah pelamar</span>
            </button>
          </div>
        </header>

        <main id="main-content" className="shell-main">
          <div className="shell-container">{children}</div>
        </main>

        <footer className="app-footer no-print">
          <div className="shell-container footer-inner">
            <span>Sistem menyajikan analisis objektif; keputusan akhir tetap menjadi tanggung jawab pengelola.</span>
            <span>Data bawaan bersifat ilustrasi pembelajaran. Rujukan MSS: Sharda, Delen, dan Turban (2021).</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
