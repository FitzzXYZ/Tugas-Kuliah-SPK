import React, { useEffect, useState } from 'react';
import {
  MIN_ALTERNATIVES,
  MIN_CRITERIA,
  validateAlternative,
  validateCriterion,
} from '../models/spkEngine.js';
import { EmptyState, IconDown, IconUp, IconWarn } from './StateViews.jsx';

function nextCode(prefix, list) {
  let maxNum = 0;
  for (const item of list) {
    const match = String(item.kode || '').match(/\d+$/);
    if (match) maxNum = Math.max(maxNum, Number(match[0]));
  }
  return `${prefix}${maxNum + 1}`;
}

function createEmptyAltForm(criteria, alternatives) {
  const nilai = {};
  for (const c of criteria) {
    nilai[c.id] = '';
  }
  return {
    id: '',
    kode: nextCode('A', alternatives),
    nama: '',
    posisi: '',
    nilai,
    catatanManusia: '',
    keputusan: 'belum',
  };
}

function createEmptyCritForm(criteria) {
  return {
    id: '',
    kode: nextCode('C', criteria),
    nama: '',
    tipe: 'benefit',
    satuan: 'poin',
    bobot: '10',
  };
}

export default function DataManagementTab({
  criteria,
  alternatives,
  quickAddSignal,
  requestedEdit,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
  onAddAlternative,
  onUpdateAlternative,
  onDeleteAlternative,
  onInspectCandidate,
  onResetWorkspace,
  onNextTab,
}) {
  const [showAltForm, setShowAltForm] = useState(false);
  const [altForm, setAltForm] = useState(() => createEmptyAltForm(criteria, alternatives));
  const [editingAltId, setEditingAltId] = useState(null);
  const [altErrors, setAltErrors] = useState({});

  const [showCritForm, setShowCritForm] = useState(false);
  const [critForm, setCritForm] = useState(() => createEmptyCritForm(criteria));
  const [editingCritId, setEditingCritId] = useState(null);
  const [critErrors, setCritErrors] = useState({});

  const [search, setSearch] = useState('');
  const [posisiFilter, setPosisiFilter] = useState('semua');

  useEffect(() => {
    setAltForm((prev) => {
      const nextNilai = {};
      for (const c of criteria) {
        nextNilai[c.id] = prev.nilai?.[c.id] ?? '';
      }
      return { ...prev, nilai: nextNilai };
    });
  }, [criteria]);

  useEffect(() => {
    if (!editingCritId) {
      setCritForm((prev) => ({ ...prev, kode: prev.nama ? prev.kode : nextCode('C', criteria) }));
    }
  }, [criteria, editingCritId]);

  useEffect(() => {
    if (!editingAltId) {
      setAltForm((prev) => ({
        ...prev,
        kode: prev.nama ? prev.kode : nextCode('A', alternatives),
      }));
    }
  }, [alternatives, editingAltId]);

  useEffect(() => {
    if (quickAddSignal > 0) {
      setEditingAltId(null);
      setAltErrors({});
      setAltForm(createEmptyAltForm(criteria, alternatives));
      setShowAltForm(true);
    }
  }, [quickAddSignal]);

  useEffect(() => {
    if (requestedEdit?.id && requestedEdit.seq > 0) {
      const target = alternatives.find((a) => a.id === requestedEdit.id);
      if (target) {
        handleEditAlt(target);
      }
    }
  }, [requestedEdit?.seq]);

  function handleAltSubmit(e) {
    e.preventDefault();
    const existing = editingAltId ? alternatives.find((a) => a.id === editingAltId) : null;
    const res = validateAlternative(
      {
        ...altForm,
        keputusan: existing ? existing.keputusan : 'belum',
      },
      criteria,
      alternatives,
      editingAltId,
    );
    if (!res.valid) {
      setAltErrors(res.errors);
      return;
    }
    setAltErrors({});
    if (editingAltId) {
      onUpdateAlternative(editingAltId, res.alternative);
      setEditingAltId(null);
    } else {
      onAddAlternative(res.alternative);
    }
    setAltForm(createEmptyAltForm(criteria, [...alternatives, res.alternative]));
    setShowAltForm(false);
  }

  function handleEditAlt(item) {
    setEditingAltId(item.id);
    setAltErrors({});
    const nilaiStrings = {};
    for (const c of criteria) {
      nilaiStrings[c.id] = String(item.nilai?.[c.id] ?? '');
    }
    setAltForm({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      posisi: item.posisi,
      nilai: nilaiStrings,
      catatanManusia: item.catatanManusia || '',
      keputusan: item.keputusan || 'belum',
    });
    setShowAltForm(true);
  }

  function handleCancelAlt() {
    setEditingAltId(null);
    setAltErrors({});
    setAltForm(createEmptyAltForm(criteria, alternatives));
    setShowAltForm(false);
  }

  function handleCritSubmit(e) {
    e.preventDefault();
    const res = validateCriterion(critForm, criteria, editingCritId);
    if (!res.valid) {
      setCritErrors(res.errors);
      return;
    }
    setCritErrors({});
    if (editingCritId) {
      onUpdateCriterion(editingCritId, res.criterion);
      setEditingCritId(null);
    } else {
      onAddCriterion(res.criterion);
    }
    setCritForm(createEmptyCritForm([...criteria, res.criterion]));
    setShowCritForm(false);
  }

  function handleEditCrit(item) {
    setEditingCritId(item.id);
    setCritErrors({});
    setCritForm({
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      tipe: item.tipe,
      satuan: item.satuan,
      bobot: String(item.bobot),
    });
    setShowCritForm(true);
  }

  function handleCancelCrit() {
    setEditingCritId(null);
    setCritErrors({});
    setCritForm(createEmptyCritForm(criteria));
    setShowCritForm(false);
  }

  const positions = [...new Set(alternatives.map((a) => a.posisi))].sort();
  const q = search.trim().toLowerCase();
  const filteredAlternatives = alternatives.filter((a) => {
    const matchText =
      !q ||
      a.kode.toLowerCase().includes(q) ||
      a.nama.toLowerCase().includes(q) ||
      a.posisi.toLowerCase().includes(q);
    const matchPosisi = posisiFilter === 'semua' || a.posisi === posisiFilter;
    return matchText && matchPosisi;
  });

  return (
    <div className="stack-lg">
      {/* Panduan 4 Langkah Singkat untuk Pengguna Baru */}
      <section className="guide-strip" aria-label="Panduan cepat penggunaan">
        <div className="guide-step">
          <span className="guide-step-num">Langkah 1</span>
          <span className="guide-step-title">Periksa data pelamar</span>
          <span className="guide-step-text">
            Data contoh sudah siap dipakai. Anda bisa langsung lanjut atau menambah pelamar sendiri.
          </span>
        </div>
        <div className="guide-step">
          <span className="guide-step-num">Langkah 2</span>
          <span className="guide-step-title">Atur bobot prioritas</span>
          <span className="guide-step-text">
            Tentukan syarat mana yang paling penting bagi tim Anda (misalnya tes teknis atau gaji).
          </span>
        </div>
        <div className="guide-step">
          <span className="guide-step-num">Langkah 3</span>
          <span className="guide-step-title">Lihat hasil peringkat</span>
          <span className="guide-step-text">
            Sistem menghitung urutan terbaik otomatis, lalu Anda memilih kandidat yang lanjut.
          </span>
        </div>
        <div className="guide-step">
          <span className="guide-step-num">Langkah 4</span>
          <span className="guide-step-title">Cetak laporan</span>
          <span className="guide-step-text">
            Simpan hasil akhir ke PDF atau Excel (CSV) sebagai dokumentasi seleksi.
          </span>
        </div>
      </section>

      {/* Bagian 1: Daftar Calon Karyawan (Alternatif, minimal 4) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Daftar calon karyawan (minimal {MIN_ALTERNATIVES} pelamar)</h2>
            <p className="panel-subtitle">
              Masukkan nilai tiap pelamar sesuai kriteria penilaian. Klik Tambah pelamar jika ingin memasukkan data baru.
            </p>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="key"
              onClick={() => {
                if (showAltForm && !editingAltId) {
                  setShowAltForm(false);
                } else {
                  setEditingAltId(null);
                  setAltErrors({});
                  setAltForm(createEmptyAltForm(criteria, alternatives));
                  setShowAltForm(true);
                }
              }}
            >
              {showAltForm && !editingAltId ? 'Tutup formulir' : 'Tambah pelamar'}
            </button>
            <button type="button" className="key" onClick={onResetWorkspace}>
              Reset contoh
            </button>
            <button type="button" className="key key--primary" onClick={onNextTab}>
              Lanjut: Atur prioritas
            </button>
          </div>
        </div>

        {alternatives.length < MIN_ALTERNATIVES && (
          <div className="status-bar is-warn" role="alert">
            <span className="status-lead">
              <IconWarn />
              <span>
                Baru ada {alternatives.length} pelamar. Tambahkan minimal {MIN_ALTERNATIVES} pelamar agar perbandingan seimbang.
              </span>
            </span>
          </div>
        )}

        {showAltForm && (
          <form
            className="form-section"
            style={{ marginBottom: 'var(--space-md)' }}
            onSubmit={handleAltSubmit}
            noValidate
          >
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>
              {editingAltId ? `Ubah data pelamar (${altForm.kode})` : 'Formulir tambah calon karyawan'}
            </h3>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="alt-kode">
                  Kode pelamar (wajib)
                </label>
                <input
                  id="alt-kode"
                  className="input input--mono"
                  type="text"
                  value={altForm.kode}
                  aria-required="true"
                  aria-invalid={Boolean(altErrors.kode)}
                  aria-describedby="alt-kode-help"
                  onChange={(e) => setAltForm({ ...altForm, kode: e.target.value })}
                  placeholder="A7"
                />
                <span id="alt-kode-help" className={`field-helper ${altErrors.kode ? 'is-error' : ''}`}>
                  {altErrors.kode || 'Otomatis terisi, contoh: A7.'}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="alt-nama">
                  Nama lengkap (wajib)
                </label>
                <input
                  id="alt-nama"
                  className="input"
                  type="text"
                  value={altForm.nama}
                  aria-required="true"
                  aria-invalid={Boolean(altErrors.nama)}
                  aria-describedby="alt-nama-help"
                  onChange={(e) => setAltForm({ ...altForm, nama: e.target.value })}
                  placeholder="Rina Wijaya"
                />
                <span id="alt-nama-help" className={`field-helper ${altErrors.nama ? 'is-error' : ''}`}>
                  {altErrors.nama || 'Nama calon karyawan.'}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="alt-posisi">
                  Posisi dilamar (wajib)
                </label>
                <input
                  id="alt-posisi"
                  className="input"
                  type="text"
                  value={altForm.posisi}
                  aria-required="true"
                  aria-invalid={Boolean(altErrors.posisi)}
                  aria-describedby="alt-posisi-help"
                  onChange={(e) => setAltForm({ ...altForm, posisi: e.target.value })}
                  placeholder="Frontend Developer"
                />
                <span id="alt-posisi-help" className={`field-helper ${altErrors.posisi ? 'is-error' : ''}`}>
                  {altErrors.posisi || 'Jabatan yang dilamar.'}
                </span>
              </div>

              {criteria.map((c) => {
                const errKey = `nilai.${c.id}`;
                return (
                  <div className="field" key={c.id}>
                    <label className="field-label" htmlFor={`alt-val-${c.id}`}>
                      {c.nama}{' '}
                      <span className="field-unit">
                        ({c.satuan})
                      </span>
                    </label>
                    <input
                      id={`alt-val-${c.id}`}
                      className="input input--mono"
                      type="number"
                      min="0.01"
                      step="any"
                      value={altForm.nilai?.[c.id] ?? ''}
                      aria-required="true"
                      aria-invalid={Boolean(altErrors[errKey])}
                      aria-describedby={`alt-val-${c.id}-help`}
                      onChange={(e) =>
                        setAltForm({
                          ...altForm,
                          nilai: { ...altForm.nilai, [c.id]: e.target.value },
                        })
                      }
                      placeholder={c.tipe === 'cost' ? '7.5' : '80'}
                    />
                    <span
                      id={`alt-val-${c.id}-help`}
                      className={`field-helper ${altErrors[errKey] ? 'is-error' : ''}`}
                    >
                      {altErrors[errKey] ||
                        (c.tipe === 'cost'
                          ? 'Makin kecil makin baik (angka > 0).'
                          : 'Makin besar makin baik (angka > 0).')}
                    </span>
                  </div>
                );
              })}

              <div className="field field-full">
                <label className="field-label" htmlFor="alt-catatan">
                  Catatan wawancara atau observasi (opsional)
                </label>
                <input
                  id="alt-catatan"
                  className="input"
                  type="text"
                  value={altForm.catatanManusia}
                  onChange={(e) => setAltForm({ ...altForm, catatanManusia: e.target.value })}
                  placeholder="Contoh: Komunikasi jelas, siap bergabung bulan depan"
                />
                <span className="field-helper">
                  Catatan singkat ini membantu Anda saat memilih keputusan akhir nanti.
                </span>
              </div>
            </div>

            <div className="action-row" style={{ marginTop: 'var(--space-sm)' }}>
              <button type="submit" className="key key--primary">
                {editingAltId ? 'Simpan perubahan' : 'Simpan pelamar'}
              </button>
              <button type="button" className="key" onClick={handleCancelAlt}>
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="toolbar">
          <h3>Tabel nilai pelamar ({alternatives.length} orang)</h3>
          <div className="toolbar-controls">
            <label htmlFor="search-alt" className="visually-hidden">
              Cari calon karyawan
            </label>
            <input
              id="search-alt"
              className="input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau posisi"
            />
            <label htmlFor="filter-pos" className="visually-hidden">
              Filter posisi
            </label>
            <select
              id="filter-pos"
              className="select"
              value={posisiFilter}
              onChange={(e) => setPosisiFilter(e.target.value)}
            >
              <option value="semua">Semua posisi</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {alternatives.length === 0 ? (
          <EmptyState
            title="Belum ada data pelamar"
            description="Tambahkan minimal empat calon karyawan atau muat ulang data contoh agar peringkat dapat dihitung."
            actionLabel="Muat data contoh"
            onAction={onResetWorkspace}
          />
        ) : filteredAlternatives.length === 0 ? (
          <EmptyState
            title="Pelamar tidak ditemukan"
            description="Tidak ada nama atau posisi yang cocok dengan pencarian Anda."
            actionLabel="Tampilkan semua"
            onAction={() => {
              setSearch('');
              setPosisiFilter('semua');
            }}
          />
        ) : (
          <div className="table-scroll">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Calon karyawan</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="col-num" title={`${c.nama} (${c.satuan})`}>
                      {c.nama}
                    </th>
                  ))}
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlternatives.map((alt) => (
                  <tr key={alt.id}>
                    <td className="col-code">{alt.kode}</td>
                    <td>
                      <button
                        type="button"
                        className="person-trigger"
                        onClick={() => onInspectCandidate(alt.id)}
                      >
                        <span>
                          <span className="cell-primary">{alt.nama}</span>
                          <span className="cell-secondary">{alt.posisi}</span>
                        </span>
                      </button>
                    </td>
                    {criteria.map((c) => (
                      <td key={c.id} className="col-num">
                        {alt.nilai?.[c.id]}
                      </td>
                    ))}
                    <td>
                      <div className="action-row">
                        <button type="button" className="key key--sm" onClick={() => handleEditAlt(alt)}>
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="key key--sm key--danger"
                          onClick={() => onDeleteAlternative(alt.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bagian 2: Syarat / Kriteria Penilaian (minimal 5) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Kriteria penilaian (minimal {MIN_CRITERIA} syarat)</h2>
            <p className="panel-subtitle">
              Daftar aspek yang dinilai untuk setiap pelamar. Anda dapat memakai 5 kriteria bawaan ini atau mengubahnya sesuai kebutuhan lowongan.
            </p>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="key"
              onClick={() => {
                if (showCritForm && !editingCritId) {
                  setShowCritForm(false);
                } else {
                  setEditingCritId(null);
                  setCritErrors({});
                  setCritForm(createEmptyCritForm(criteria));
                  setShowCritForm(true);
                }
              }}
            >
              {showCritForm && !editingCritId ? 'Tutup formulir' : 'Tambah kriteria'}
            </button>
          </div>
        </div>

        {criteria.length < MIN_CRITERIA && (
          <div className="status-bar is-warn" role="alert">
            <span className="status-lead">
              <IconWarn />
              <span>
                Baru ada {criteria.length} kriteria. Tambahkan hingga minimal {MIN_CRITERIA} kriteria sesuai ketentuan proyek.
              </span>
            </span>
          </div>
        )}

        {showCritForm && (
          <form
            className="form-section"
            style={{ marginBottom: 'var(--space-md)' }}
            onSubmit={handleCritSubmit}
            noValidate
          >
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>
              {editingCritId ? `Ubah kriteria (${critForm.kode})` : 'Formulir tambah kriteria penilaian'}
            </h3>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="crit-kode">
                  Kode (wajib)
                </label>
                <input
                  id="crit-kode"
                  className="input input--mono"
                  type="text"
                  value={critForm.kode}
                  aria-required="true"
                  aria-invalid={Boolean(critErrors.kode)}
                  aria-describedby="crit-kode-help"
                  onChange={(e) => setCritForm({ ...critForm, kode: e.target.value })}
                  placeholder="C6"
                />
                <span id="crit-kode-help" className={`field-helper ${critErrors.kode ? 'is-error' : ''}`}>
                  {critErrors.kode || 'Otomatis terisi, contoh: C6.'}
                </span>
              </div>

              <div className="field field-span-2">
                <label className="field-label" htmlFor="crit-nama">
                  Nama syarat penilaian (wajib)
                </label>
                <input
                  id="crit-nama"
                  className="input"
                  type="text"
                  value={critForm.nama}
                  aria-required="true"
                  aria-invalid={Boolean(critErrors.nama)}
                  aria-describedby="crit-nama-help"
                  onChange={(e) => setCritForm({ ...critForm, nama: e.target.value })}
                  placeholder="Contoh: Kemampuan Komunikasi"
                />
                <span id="crit-nama-help" className={`field-helper ${critErrors.nama ? 'is-error' : ''}`}>
                  {critErrors.nama || 'Aspek yang dibandingkan antar pelamar.'}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="crit-tipe">
                  Arah penilaian
                </label>
                <select
                  id="crit-tipe"
                  className="select"
                  value={critForm.tipe}
                  aria-invalid={Boolean(critErrors.tipe)}
                  aria-describedby="crit-tipe-help"
                  onChange={(e) => setCritForm({ ...critForm, tipe: e.target.value })}
                >
                  <option value="benefit">Makin besar makin baik (Benefit)</option>
                  <option value="cost">Makin kecil makin baik (Cost)</option>
                </select>
                <span id="crit-tipe-help" className={`field-helper ${critErrors.tipe ? 'is-error' : ''}`}>
                  {critErrors.tipe || 'Pilih Cost untuk biaya atau ekspektasi gaji.'}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="crit-satuan">
                  Satuan angka (wajib)
                </label>
                <input
                  id="crit-satuan"
                  className="input"
                  type="text"
                  value={critForm.satuan}
                  aria-required="true"
                  aria-invalid={Boolean(critErrors.satuan)}
                  aria-describedby="crit-satuan-help"
                  onChange={(e) => setCritForm({ ...critForm, satuan: e.target.value })}
                  placeholder="poin"
                />
                <span id="crit-satuan-help" className={`field-helper ${critErrors.satuan ? 'is-error' : ''}`}>
                  {critErrors.satuan || 'Misalnya: poin, tahun, atau juta Rp.'}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="crit-bobot">
                  Bobot prioritas (%)
                </label>
                <input
                  id="crit-bobot"
                  className="input input--mono"
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={critForm.bobot}
                  aria-required="true"
                  aria-invalid={Boolean(critErrors.bobot)}
                  aria-describedby="crit-bobot-help"
                  onChange={(e) => setCritForm({ ...critForm, bobot: e.target.value })}
                />
                <span id="crit-bobot-help" className={`field-helper ${critErrors.bobot ? 'is-error' : ''}`}>
                  {critErrors.bobot || 'Bisa diatur ulang nanti dengan slider.'}
                </span>
              </div>
            </div>

            <div className="action-row" style={{ marginTop: 'var(--space-sm)' }}>
              <button type="submit" className="key key--primary">
                {editingCritId ? 'Simpan kriteria' : 'Tambah kriteria'}
              </button>
              <button type="button" className="key" onClick={handleCancelCrit}>
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="table-scroll">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Syarat penilaian</th>
                <th>Arah penilaian</th>
                <th>Satuan</th>
                <th className="col-num">Bobot</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id}>
                  <td className="col-code">{c.kode}</td>
                  <td className="cell-primary">{c.nama}</td>
                  <td>
                    <span className={`status-tag ${c.tipe === 'benefit' ? 'is-benefit' : 'is-cost'}`}>
                      {c.tipe === 'benefit' ? <IconUp /> : <IconDown />}
                      <span>
                        {c.tipe === 'benefit' ? 'Makin besar makin baik (Benefit)' : 'Makin kecil makin baik (Cost)'}
                      </span>
                    </span>
                  </td>
                  <td>{c.satuan}</td>
                  <td className="col-num">{c.bobot}%</td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="key key--sm" onClick={() => handleEditCrit(c)}>
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="key key--sm key--danger"
                        disabled={criteria.length <= 1}
                        onClick={() => onDeleteCriterion(c.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
