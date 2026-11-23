import React from 'react';

// Skema visual cara kerja tiap metode SPK (membantu orang awam melihat beda SAW, WP, TOPSIS).
export default function MethodDiagram({ method }) {
  if (method === 'saw') {
    return (
      <svg
        className="method-diagram"
        viewBox="0 0 116 44"
        fill="none"
        role="img"
        aria-label="Diagram skematik metode SAW: penjumlahan nilai berbobot"
      >
        <rect x="4" y="8" width="28" height="6" rx="2" fill="var(--color-chart-1)" />
        <rect x="4" y="19" width="20" height="6" rx="2" fill="var(--color-chart-2)" />
        <rect x="4" y="30" width="24" height="6" rx="2" fill="var(--color-chart-3)" />
        <path d="M40 22H52" stroke="var(--color-rule-2)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="62" cy="22" r="9" fill="var(--color-accent-wash)" stroke="var(--color-chart-1)" strokeWidth="1.4" />
        <text x="62" y="25.5" textAnchor="middle" fill="var(--color-accent-deep)" fontSize="11" fontFamily="var(--font-outlier)">
          Σ
        </text>
        <path d="M74 22H84" stroke="var(--color-rule-2)" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="88" y="13" width="24" height="18" rx="3" fill="var(--color-chart-1)" />
        <text x="100" y="25" textAnchor="middle" fill="var(--color-accent-ink)" fontSize="9.5" fontFamily="var(--font-outlier)">
          V
        </text>
      </svg>
    );
  }

  if (method === 'wp') {
    return (
      <svg
        className="method-diagram"
        viewBox="0 0 116 44"
        fill="none"
        role="img"
        aria-label="Diagram skematik metode WP: perkalian pangkat bobot"
      >
        <circle cx="14" cy="22" r="7" fill="var(--color-chart-2)" />
        <text x="14" y="25" textAnchor="middle" fill="var(--color-accent-ink)" fontSize="8.5" fontFamily="var(--font-outlier)">
          x1
        </text>
        <text x="29" y="25" textAnchor="middle" fill="var(--color-muted)" fontSize="11" fontFamily="var(--font-outlier)">
          ×
        </text>
        <circle cx="44" cy="22" r="7" fill="var(--color-chart-3)" />
        <text x="44" y="25" textAnchor="middle" fill="var(--color-accent-ink)" fontSize="8.5" fontFamily="var(--font-outlier)">
          x2
        </text>
        <path d="M55 22H65" stroke="var(--color-rule-2)" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="69" y="13" width="18" height="18" rx="3" fill="var(--color-accent-wash)" stroke="var(--color-chart-1)" strokeWidth="1.4" />
        <text x="78" y="25" textAnchor="middle" fill="var(--color-accent-deep)" fontSize="9.5" fontFamily="var(--font-outlier)">
          S
        </text>
        <path d="M90 22H97" stroke="var(--color-rule-2)" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="99" y="13" width="14" height="18" rx="3" fill="var(--color-chart-1)" />
        <text x="106" y="25" textAnchor="middle" fill="var(--color-accent-ink)" fontSize="9" fontFamily="var(--font-outlier)">
          V
        </text>
      </svg>
    );
  }

  return (
    <svg
      className="method-diagram"
      viewBox="0 0 116 44"
      fill="none"
      role="img"
      aria-label="Diagram skematik metode TOPSIS: jarak ke solusi ideal positif dan negatif"
    >
      <line x1="12" y1="36" x2="104" y2="36" stroke="var(--color-rule-2)" strokeWidth="1.2" />
      <line x1="12" y1="6" x2="12" y2="36" stroke="var(--color-rule-2)" strokeWidth="1.2" />
      <line x1="28" y1="29" x2="58" y2="20" stroke="var(--color-muted)" strokeWidth="1.3" strokeDasharray="3 2" />
      <line x1="58" y1="20" x2="92" y2="11" stroke="var(--color-chart-1)" strokeWidth="1.6" />
      <circle cx="28" cy="29" r="4" fill="var(--color-chart-4)" />
      <text x="28" y="22" textAnchor="middle" fill="var(--color-muted)" fontSize="8.5" fontFamily="var(--font-outlier)">
        A-
      </text>
      <circle cx="58" cy="20" r="4.5" fill="var(--color-paper)" stroke="var(--color-chart-1)" strokeWidth="2" />
      <circle cx="92" cy="11" r="4.5" fill="var(--color-chart-1)" />
      <text x="103" y="14" textAnchor="middle" fill="var(--color-accent-deep)" fontSize="8.5" fontFamily="var(--font-outlier)">
        A+
      </text>
    </svg>
  );
}
