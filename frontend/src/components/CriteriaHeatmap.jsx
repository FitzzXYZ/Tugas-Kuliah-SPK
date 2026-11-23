import React from 'react';
import { formatCriterionValue } from '../models/spkEngine.js';

function getHeatTier(norm) {
  if (norm >= 0.92) return 5;
  if (norm >= 0.82) return 4;
  if (norm >= 0.72) return 3;
  if (norm >= 0.60) return 2;
  return 1;
}

// Peta panas (heatmap) skor ternormalisasi semua pelamar pada seluruh kriteria.
export default function CriteriaHeatmap({ criteria, sawResult, onInspectCandidate }) {
  if (!sawResult?.matrixR?.length || !criteria?.length) return null;

  const sortedRows = sawResult.rankings.map((rankItem) => {
    const rRow = sawResult.matrixR.find((r) => r.id === rankItem.id);
    const xRow = sawResult.matrixX.find((x) => x.id === rankItem.id);
    return { rankItem, rRow, xRow };
  });

  return (
    <div className="stack-sm">
      <div className="heat-legend" aria-hidden="true">
        <span>Lebih rendah</span>
        <span className="heat-swatch is-heat-1" />
        <span className="heat-swatch is-heat-2" />
        <span className="heat-swatch is-heat-3" />
        <span className="heat-swatch is-heat-4" />
        <span className="heat-swatch is-heat-5" />
        <span>Terbaik (100%)</span>
      </div>

      <div className="table-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Pelamar</th>
              {criteria.map((c) => (
                <th key={c.id} className="col-num" title={`${c.nama} (${c.tipe}, ${c.satuan})`}>
                  {c.kode} {c.nama.length > 12 ? `${c.nama.slice(0, 11)}…` : c.nama}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(({ rankItem, rRow, xRow }) => (
              <tr key={rankItem.id}>
                <td>
                  {onInspectCandidate ? (
                    <button
                      type="button"
                      className="person-trigger"
                      onClick={() => onInspectCandidate(rankItem.id)}
                    >
                      <span>
                        <span className="cell-primary">
                          #{rankItem.rank} {rankItem.nama}
                        </span>
                        <span className="cell-secondary">{rankItem.kode}</span>
                      </span>
                    </button>
                  ) : (
                    <span>
                      <span className="cell-primary">
                        #{rankItem.rank} {rankItem.nama}
                      </span>
                      <span className="cell-secondary">{rankItem.kode}</span>
                    </span>
                  )}
                </td>
                {criteria.map((c) => {
                  const norm = rRow?.values?.[c.id] ?? 0;
                  const raw = xRow?.values?.[c.id] ?? 0;
                  const tier = getHeatTier(norm);
                  const pct = Math.round(norm * 100);
                  return (
                    <td
                      key={c.id}
                      className={`heat-cell is-heat-${tier}`}
                      title={`${rankItem.nama}, ${c.nama}: ${formatCriterionValue(c, raw)} (${pct}% dari terbaik)`}
                    >
                      <span className="heat-pct">{pct}%</span>
                      <span className="heat-raw">{formatCriterionValue(c, raw)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
