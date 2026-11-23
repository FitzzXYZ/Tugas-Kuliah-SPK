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
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
  onAddAlternative,
  onUpdateAlternative,
  onDeleteAlternative,
  onResetWorkspace,
  onNextTab,
}) {
  const [critForm, setCritForm] = useState(() => createEmptyCritForm(criteria));
  const [editingCritId, setEditingCritId] = useState(null);
  const [critErrors, setCritErrors] = useState({});

  const [altForm, setAltForm] = useState(() => createEmptyAltForm(criteria, alternatives));
  const [editingAltId, setEditingAltId] = useState(null);
  const [altErrors, setAltErrors] = useState({});

  const [search, setSearch] = useState('');
  const [posisiFilter, setPosisiFilter] = useState('semua');

  // Sinkronkan form nilai kandidat saat daftar kriteria berubah.
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
  }

  function handleCancelCrit() {
    setEditingCritId(null);
    setCritErrors({});
    setCritForm(createEmptyCritForm(criteria));
  }

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
  }

  function handleCancelAlt() {
    setEditingAltId(null);
    setAltErrors({});
    setAltForm(createEmptyAltForm(criteria, alternatives));
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
      {/* Bagian 1: Manajemen Kriteria (Minimal 5) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Manajemen kriteria penilaian</h2>
            <p className="panel-subtitle">
              Kelola minimal {MIN_CRITERIA} kriteria seleksi beserta atribut benefit (semakin besar semakin baik) atau cost (semakin kecil semakin baik).
            </p>
          </div>
          <div className="action-row">
            <button type="button" className="key" onClick={onResetWorkspace}>
              Reset ilustrasi
            </button>
            <button type="button" className="key key--primary" onClick={onNextTab}>
              Atur bobot dan metode
            </button>
          </div>
        </div>

        {criteria.length < MIN_CRITERIA && (
          <div className="status-bar is-warn" role="alert">
            <span className="status-lead">
              <IconWarn />
              <span>
                Jumlah kriteria saat ini {criteria.length}. Tambahkan hingga minimal {MIN_CRITERIA} kriteria sesuai syarat proyek.
              </span>
            </span>
          </div>
        )}

        <form className="form-section" onSubmit={handleCritSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="crit-kode">
                Kode kriteria (wajib)
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
                {critErrors.kode || 'Singkat dan unik, mis. C1 sampai C6.'}
              </span>
            </div>

            <div className="field field-span-2">
              <label className="field-label" htmlFor="crit-nama">
                Nama kriteria (wajib)
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
                placeholder="Kesesuaian Budaya Tim"
              />
              <span id="crit-nama-help" className={`field-helper ${critErrors.nama ? 'is-error' : ''}`}>
                {critErrors.nama || 'Nama aspek yang diukur pada setiap calon karyawan.'}
              </span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="crit-tipe">
                Tipe atribut
              </label>
              <select
                id="crit-tipe"
                className="select"
                value={critForm.tipe}
                aria-invalid={Boolean(critErrors.tipe)}
                aria-describedby="crit-tipe-help"
                onChange={(e) => setCritForm({ ...critForm, tipe: e.target.value })}
              >
                <option value="benefit">Benefit (makin besar makin baik)</option>
                <option value="cost">Cost (makin kecil makin baik)</option>
              </select>
              <span id="crit-tipe-help" className={`field-helper ${critErrors.tipe ? 'is-error' : ''}`}>
                {critErrors.tipe || 'Menentukan arah normalisasi SAW, WP, dan TOPSIS.'}
              </span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="crit-satuan">
                Satuan (wajib)
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
                {critErrors.satuan || 'Contoh: poin, tahun, juta Rp.'}
              </span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="crit-bobot">
                Bobot awal (%)
              </label>
              <input
                id="crit-bobot"
                className="input input--mono"
                type="number"
                min="0.1"
                max="100"
                step="0.5"
                value={critForm.bobot}
                aria-required="true"
                aria-invalid={Boolean(critErrors.bobot)}
                aria-describedby="crit-bobot-help"
                onChange={(e) => setCritForm({ ...critForm, bobot: e.target.value })}
              />
              <span id="crit-bobot-help" className={`field-helper ${critErrors.bobot ? 'is-error' : ''}`}>
                {critErrors.bobot || 'Dapat dikalibrasi ulang di tab Bobot dan metode.'}
              </span>
            </div>
          </div>

          <div className="action-row" style={{ marginTop: 'var(--space-sm)' }}>
            <button type="submit" className="key">
              {editingCritId ? 'Simpan perubahan kriteria' : 'Tambah kriteria'}
            </button>
            {editingCritId && (
              <button type="button" className="key" onClick={handleCancelCrit}>
                Batal ubah
              </button>
            )}
          </div>
        </form>

        <div className="table-scroll" style={{ marginTop: 'var(--space-md)' }}>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama kriteria</th>
                <th>Tipe</th>
                <th>Satuan</th>
                <th className="col-num">Bobot input</th>
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
                      <span>{c.tipe === 'benefit' ? 'Benefit' : 'Cost'}</span>
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
                        title={criteria.length <= 1 ? 'Minimal satu kriteria harus tersisa' : undefined}
                        onClick={() => {
                          if (window.confirm(`Hapus kriteria "${c.kode} ${c.nama}" dari seluruh alternatif?`)) {
                            onDeleteCriterion(c.id);
                          }
                        }}
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

      {/* Bagian 2: Manajemen Alternatif (Minimal 4) */}
      <section className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Manajemen data alternatif (calon karyawan)</h2>
            <p className="panel-subtitle">
              Kelola minimal {MIN_ALTERNATIVES} alternatif calon karyawan. Kolom nilai otomatis mengikuti daftar kriteria aktif di atas.
            </p>
          </div>
        </div>

        {alternatives.length < MIN_ALTERNATIVES && (
          <div className="status-bar is-warn" role="alert">
            <span className="status-lead">
              <IconWarn />
              <span>
                Jumlah alternatif saat ini {alternatives.length}. Tambahkan hingga minimal {MIN_ALTERNATIVES} calon karyawan.
              </span>
            </span>
          </div>
        )}

        <form className="form-section" onSubmit={handleAltSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="alt-kode">
                Kode alternatif (wajib)
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
                {altErrors.kode || 'Kode unik pelamar, mis. A1 sampai A7.'}
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
                {altErrors.nama || 'Nama calon karyawan yang dievaluasi.'}
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
                {altErrors.posisi || 'Jabatan atau divisi tujuan pelamar.'}
              </span>
            </div>

            {criteria.map((c) => {
              const errKey = `nilai.${c.id}`;
              return (
                <div className="field" key={c.id}>
                  <label className="field-label" htmlFor={`alt-val-${c.id}`}>
                    {c.kode} {c.nama}{' '}
                    <span className="field-unit">
                      ({c.satuan}, {c.tipe})
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
                    {altErrors[errKey] || 'Angka positif (> 0).'}
                  </span>
                </div>
              );
            })}

            <div className="field field-full">
              <label className="field-label" htmlFor="alt-catatan">
                Catatan kualitatif / pertimbangan lapangan (opsional)
              </label>
              <input
                id="alt-catatan"
                className="input"
                type="text"
                value={altForm.catatanManusia}
                onChange={(e) => setAltForm({ ...altForm, catatanManusia: e.target.value })}
                placeholder="Observasi wawancara, ketersediaan mulai kerja, kecocokan tim"
              />
              <span className="field-helper">
                Membantu pengelola saat meninjau keputusan akhir di tab Hitung dan peringkat.
              </span>
            </div>
          </div>

          <div className="action-row" style={{ marginTop: 'var(--space-sm)' }}>
            <button type="submit" className="key">
              {editingAltId ? 'Simpan perubahan alternatif' : 'Tambah calon karyawan'}
            </button>
            {editingAltId && (
              <button type="button" className="key" onClick={handleCancelAlt}>
                Batal ubah
              </button>
            )}
          </div>
        </form>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <div className="toolbar">
            <h3>Matriks data alternatif ({alternatives.length})</h3>
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
                placeholder="Cari kode, nama, posisi"
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
              title="Belum ada data calon karyawan"
              description="Tambahkan minimal empat calon karyawan di formulir di atas atau muat ulang data ilustrasi agar perhitungan SPK dapat dijalankan."
              actionLabel="Muat ulang data ilustrasi"
              onAction={onResetWorkspace}
            />
          ) : filteredAlternatives.length === 0 ? (
            <EmptyState
              title="Tidak ada calon karyawan yang cocok dengan filter"
              description="Ubah kata kunci pencarian atau pilih semua posisi untuk menampilkan kembali seluruh alternatif."
              actionLabel="Tampilkan semua alternatif"
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
                      <th key={c.id} className="col-num" title={`${c.nama} (${c.tipe}, ${c.satuan})`}>
                        {c.kode}
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
                        <span className="cell-primary">{alt.nama}</span>
                        <span className="cell-secondary">{alt.posisi}</span>
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
                            onClick={() => {
                              if (window.confirm(`Hapus calon karyawan "${alt.kode} ${alt.nama}"?`)) {
                                onDeleteAlternative(alt.id);
                              }
                            }}
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
        </div>
      </section>
    </div>
  );
}
