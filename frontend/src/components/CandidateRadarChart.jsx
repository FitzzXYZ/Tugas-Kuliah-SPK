import React from 'react';

// Diagram radar berbasis data nyata (normalisasi SAW 0..1) membandingkan kandidat terpilih terhadap rata-rata pelamar.
export default function CandidateRadarChart({ criteria, sawResult, candidateId, candidateName }) {
  if (!sawResult?.matrixR?.length || !criteria?.length || criteria.length < 3) {
    return null;
  }

  const targetRow = sawResult.matrixR.find((r) => r.id === candidateId) || sawResult.matrixR[0];
  const count = criteria.length;
  const cx = 175;
  const cy = 148;
  const maxR = 96;
  const rings = [0.25, 0.5, 0.75, 1];

  const pointAt = (index, ratio) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return {
      x: cx + Math.cos(angle) * maxR * ratio,
      y: cy + Math.sin(angle) * maxR * ratio,
    };
  };

  const ringPolygons = rings.map((r) =>
    criteria
      .map((_, i) => {
        const pt = pointAt(i, r);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' '),
  );

  // Rata-rata ternormalisasi seluruh pelamar per kriteria sebagai garis pembanding
  const avgValues = criteria.map((c) => {
    const sum = sawResult.matrixR.reduce((acc, row) => acc + (row.values[c.id] ?? 0), 0);
    return sum / sawResult.matrixR.length;
  });

  const avgPoints = avgValues
    .map((val, i) => {
      const pt = pointAt(i, val);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const targetCoords = criteria.map((c, i) => pointAt(i, targetRow.values[c.id] ?? 0));
  const targetPoints = targetCoords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  return (
    <div className="radar-wrap">
      <div className="chart-legend" aria-hidden="true">
        <span className="legend-item">
          <span className="legend-swatch is-c1" />
          {candidateName || targetRow.nama}
        </span>
        <span className="legend-item">
          <span className="legend-swatch is-c4" />
          Rata-rata semua pelamar
        </span>
      </div>

      <svg
        className="svg-chart radar-svg"
        viewBox="0 0 350 300"
        role="img"
        aria-label={`Diagram radar profil skor ${candidateName || targetRow.nama} dibanding rata-rata pelamar pada ${count} kriteria`}
      >
        {/* Jaring poligon konsentris */}
        {ringPolygons.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth="1"
          />
        ))}

        {/* Garis sumbu per kriteria */}
        {criteria.map((c, i) => {
          const outer = pointAt(i, 1);
          const lbl = pointAt(i, 1.24);
          const shortName = c.nama.length > 14 ? `${c.nama.slice(0, 13)}…` : c.nama;
          const anchor =
            Math.abs(lbl.x - cx) < 12 ? 'middle' : lbl.x > cx ? 'start' : 'end';
          return (
            <g key={c.id}>
              <line
                x1={cx}
                y1={cy}
                x2={outer.x.toFixed(1)}
                y2={outer.y.toFixed(1)}
                stroke="var(--color-rule)"
                strokeWidth="1"
              />
              <text
                x={lbl.x.toFixed(1)}
                y={(lbl.y + 4).toFixed(1)}
                textAnchor={anchor}
                fill="var(--color-ink-2)"
                fontSize="11"
                fontFamily="var(--font-display)"
              >
                {shortName}
              </text>
            </g>
          );
        })}

        {/* Poligon rata-rata tim */}
        <polygon
          points={avgPoints}
          fill="var(--color-chart-4)"
          fillOpacity="0.18"
          stroke="var(--color-muted)"
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />

        {/* Poligon kandidat aktif dengan animasi bloom GPU */}
        <g key={targetRow.id} className="radar-bloom">
          <polygon
            points={targetPoints}
            fill="var(--color-chart-1)"
            fillOpacity="0.22"
            stroke="var(--color-chart-1)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {targetCoords.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x.toFixed(1)}
              cy={pt.y.toFixed(1)}
              r="3.8"
              fill="var(--color-paper)"
              stroke="var(--color-chart-1)"
              strokeWidth="2"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
