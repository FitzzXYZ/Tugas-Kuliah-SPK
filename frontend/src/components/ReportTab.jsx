import React from 'react';
import {
  DECISION_LABELS,
  METHOD_INFO,
  buildDecisionCsv,
  detectDataIssues,
  getWeightSummary,
} from '../models/spkEngine.js';
import { EmptyState, IconDownload, IconPrint, IconWarn } from './StateViews.jsx';

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportTab({
  workspace,
  activeMethod,
  calcResult,
  calcError,
  checklist,
  onToggleChecklist,
  onUpdateMetadata,
  onExportSuccess,
  onGoToData,
  onReviewWeights,
}) {
  if (calcError || !calcResult) {
    return (
      <section className="cut-panel">
        <EmptyState
          title="Laporan belum dapat dibuat"
          description={calcError || 'Lengkapi data kriteria dan alternatif terlebih dahulu sebelum menyusun laporan hasil keputusan.'}
          actionLabel="Buka data dan kriteria"
          onAction={onGoToData}
        />
      </section>
    );
  }

  const activeData = calcResult[activeMethod];
  const methodInfo = METHOD_INFO[activeMethod];
  const weightSummary = getWeightSummary(workspace.criteria);
  const issues = detectDataIssues(workspace.alternatives, workspace.criteria);
  const compById = Object.fromEntries(calcResult.comparison.map((r) => [r.id, r]));
  const todayText = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function handleExportCsv() {
    const csv = buildDecisionCsv(workspace, activeData, activeMethod);
    triggerDownload(`laporan-spk-${activeMethod}.csv`, csv, 'text/csv;charset=utf-8');
    onExportSuccess(`Laporan CSV (${methodInfo.nama}) berhasil diunduh.`);
  }

  function handleExportJson() {
    const payload = {
      dibuatPada: new Date().toISOString(),
      metadata: workspace.metadata,
      metodeAktif: activeMethod,
      enginePerhitungan: calcResult.source || 'browser-js',
      kriteria: weightSummary.items,
      hasilPerankingan: activeData.rankings.map((r) => ({
        peringkat: r.rank,
        kode: r.kode,
        nama: r.nama,
        posisi: r.posisi,
        skor: Number(r.score.toFixed(6)),
        keputusanPengelola: r.alternative.keputusan,
        catatanManusia: r.alternative.catatanManusia,
      })),
      perbandinganMetode: calcResult.comparison,
      validasiPengelola: checklist,
    };
    triggerDownload(
      `laporan-spk-${activeMethod}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
    );
    onExportSuccess(`Laporan JSON (${methodInfo.nama}) berhasil diunduh.`);
  }

  const lanjutList = workspace.alternatives.filter((a) => a.keputusan === 'lanjut');
  const cadanganList = workspace.alternatives.filter((a) => a.keputusan === 'cadangan');
  const allChecked = checklist.dataValid && checklist.asumsiSesuai && checklist.privasiTerjaga;

  return (
    <div className="stack-lg">
      {/* Kontrol Laporan (disembunyikan saat cetak PDF) */}
      <section className="cut-panel no-print">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">Pengaturan dan ekspor laporan keputusan</h2>
            <p className="panel-subtitle">
              Lengkapi identitas laporan di bawah, lalu cetak ke PDF atau unduh berkas CSV dan JSON sebagai dokumentasi hasil seleksi.
            </p>
          </div>
          <div className="action-row">
            <button type="button" className="key" onClick={onReviewWeights}>
              Tinjau ulang bobot
            </button>
            <button type="button" className="key" onClick={handleExportCsv}>
              <IconDownload />
              <span>Unduh CSV</span>
            </button>
            <button type="button" className="key" onClick={handleExportJson}>
              <IconDownload />
              <span>Unduh JSON</span>
            </button>
            <button type="button" className="key key--primary" onClick={() => window.print()}>
              <IconPrint />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="meta-judul">
              Judul seleksi
            </label>
            <input
              id="meta-judul"
              className="input"
              type="text"
              value={workspace.metadata?.judulSeleksi || ''}
              onChange={(e) => onUpdateMetadata({ judulSeleksi: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="meta-pic">
              Penanggung jawab keputusan
            </label>
            <input
              id="meta-pic"
              className="input"
              type="text"
              value={workspace.metadata?.penanggungJawab || ''}
              onChange={(e) => onUpdateMetadata({ penanggungJawab: e.target.value })}
            />
          </div>
          <div className="field field-full">
            <label className="field-label" htmlFor="meta-catatan">
              Catatan umum laporan
            </label>
            <input
              id="meta-catatan"
              className="input"
              type="text"
              value={workspace.metadata?.catatanUmum || ''}
              onChange={(e) => onUpdateMetadata({ catatanUmum: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Lembar Laporan Hasil Keputusan (Siap Cetak) */}
      <article className="cut-panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2 className="panel-title">
              Laporan Hasil Keputusan: {workspace.metadata?.judulSeleksi || 'Seleksi Calon Karyawan'}
            </h2>
            <p className="panel-subtitle">{workspace.metadata?.catatanUmum}</p>
          </div>
        </div>

        <dl className="report-meta-list">
          <div>
            <dt>Tanggal penyusunan</dt>
            <dd>{todayText}</dd>
          </div>
          <div>
            <dt>Penanggung jawab</dt>
            <dd>{workspace.metadata?.penanggungJawab || '-'}</dd>
          </div>
          <div>
            <dt>Metode SPK aktif</dt>
            <dd>
              {methodInfo.nama} ({methodInfo.namaLengkap})
            </dd>
          </div>
          <div>
            <dt>Ringkasan ketetapan pengelola</dt>
            <dd>
              {lanjutList.length} lanjut wawancara akhir, {cadanganList.length} cadangan
            </dd>
          </div>
        </dl>

        {issues.length > 0 && (
          <div className="status-bar is-warn" style={{ marginBottom: 'var(--space-lg)' }}>
            <span className="status-lead">
              <IconWarn />
              <span>{issues.map((i) => i.message).join(' ')}</span>
            </span>
          </div>
        )}

        <div className="stack-lg">
          <div>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>1. Kriteria dan bobot yang digunakan</h3>
            <div className="table-scroll">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama kriteria</th>
                    <th>Tipe</th>
                    <th className="col-num">Bobot input</th>
                    <th className="col-num">Bobot ternormalisasi (w)</th>
                  </tr>
                </thead>
                <tbody>
                  {weightSummary.items.map((w) => (
                    <tr key={w.id}>
                      <td className="col-code">{w.kode}</td>
                      <td>{w.nama}</td>
                      <td>{w.tipe === 'benefit' ? 'Benefit' : 'Cost'}</td>
                      <td className="col-num">{w.raw}%</td>
                      <td className="col-num">{w.weight.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>
              2. Hasil perankingan ({methodInfo.nama}) dan ketetapan pengelola
            </h3>
            <div className="table-scroll">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th className="col-num">Peringkat</th>
                    <th>Calon karyawan</th>
                    <th className="col-num">Skor {methodInfo.nama}</th>
                    <th className="col-num">SAW / WP / TOPSIS</th>
                    <th>Keputusan pengelola</th>
                    <th>Catatan manusia</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.rankings.map((item) => {
                    const cmp = compById[item.id];
                    const alt = item.alternative;
                    return (
                      <tr key={item.id} className={item.rank === 1 ? 'is-leader' : ''}>
                        <td className="col-num">#{item.rank}</td>
                        <td>
                          <span className="cell-primary">
                            {alt.kode} {alt.nama}
                          </span>
                          <span className="cell-secondary">{alt.posisi}</span>
                        </td>
                        <td className="col-num">{item.score.toFixed(4)}</td>
                        <td className="col-num">
                          #{cmp?.sawRank} / #{cmp?.wpRank} / #{cmp?.topsisRank}
                        </td>
                        <td>{DECISION_LABELS[alt.keputusan] || alt.keputusan}</td>
                        <td>{alt.catatanManusia || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>
              3. Pemeriksaan kualitas data, asumsi, dan tanggung jawab manusia (MSS)
            </h3>
            <ul className="checklist">
              <li className="checklist-row">
                <input
                  id="rep-chk-data"
                  type="checkbox"
                  checked={checklist.dataValid}
                  onChange={(e) => onToggleChecklist('dataValid', e.target.checked)}
                />
                <label htmlFor="rep-chk-data">
                  <strong>Data benar dan relevan:</strong> seluruh nilai tes, pengalaman, dan ekspektasi gaji pelamar telah diperiksa kelengkapannya.
                </label>
              </li>
              <li className="checklist-row">
                <input
                  id="rep-chk-asumsi"
                  type="checkbox"
                  checked={checklist.asumsiSesuai}
                  onChange={(e) => onToggleChecklist('asumsiSesuai', e.target.checked)}
                />
                <label htmlFor="rep-chk-asumsi">
                  <strong>Bobot dan metode sesuai kebutuhan lapangan:</strong> prioritas kriteria mencerminkan kondisi posisi saat ini, dan sensitivitas hasil lintas SAW, WP, serta TOPSIS sudah ditinjau.
                </label>
              </li>
              <li className="checklist-row">
                <input
                  id="rep-chk-privasi"
                  type="checkbox"
                  checked={checklist.privasiTerjaga}
                  onChange={(e) => onToggleChecklist('privasiTerjaga', e.target.checked)}
                />
                <label htmlFor="rep-chk-privasi">
                  <strong>Privasi data pribadi terjaga:</strong> informasi pelamar hanya diakses dan dibagikan kepada pihak pengelola yang berwenang.
                </label>
              </li>
            </ul>
            <p className="panel-subtitle" style={{ marginTop: 'var(--space-sm)' }}>
              {allChecked
                ? 'Seluruh poin verifikasi telah ditandai. Laporan siap dicetak atau diarsipkan.'
                : 'Sistem menyajikan hasil analisis; keputusan final menjadi tanggung jawab pengelola setelah pemeriksaan di atas selesai.'}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

