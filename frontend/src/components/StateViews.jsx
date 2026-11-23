import React from 'react';

export function BrandLogo() {
  return (
    <svg className="brand-logo" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="8" fill="var(--color-graphite)" />
      <rect
        x="1"
        y="1"
        width="34"
        height="34"
        rx="7"
        stroke="var(--color-graphite-rule)"
        strokeWidth="1.5"
      />
      <rect x="7" y="19" width="5.5" height="10" rx="1.5" fill="var(--color-chart-3)" />
      <rect x="15.25" y="13.5" width="5.5" height="15.5" rx="1.5" fill="var(--color-chart-1)" />
      <rect x="23.5" y="7.5" width="5.5" height="21.5" rx="1.5" fill="var(--color-accent-2)" />
    </svg>
  );
}

export function IconGrid() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconUsers() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5.2" r="2.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 13C2.4 10.6 4 9.5 6 9.5C8 9.5 9.6 10.6 10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11.3" cy="5.8" r="1.7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11.3 9.7C12.7 9.8 13.7 10.8 14 12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconSliders() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4.2H13.5M2.5 8H13.5M2.5 11.8H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="5.5" cy="4.2" r="1.6" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10.5" cy="8" r="1.6" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6.8" cy="11.8" r="1.6" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconAward() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="6.2" r="3.7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.6 9.3L4.5 14L8 12.2L11.5 14L10.4 9.3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChart() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 13.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="3.5" y="8" width="2.2" height="5.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6.9" y="5" width="2.2" height="8.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10.3" y="2.8" width="2.2" height="10.7" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IconDoc() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2H9.5L12.5 5V14H4V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.2 8.2H10.3M6.2 10.8H9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4.2H13.5M2.5 8H13.5M2.5 11.8H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.2V12.8M3.2 8H12.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconUndo() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.5 4L2.5 7L5.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.8 7H9.5A3.5 3.5 0 1 1 9.5 14H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.2 8.4L6.4 11.6L12.8 4.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconWarn() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.4L14 13H2L8 2.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 6.4V9.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconUp() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 12.5V3.5M8 3.5L4.5 7M8 3.5L11.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDown() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 3.5V12.5M8 12.5L4.5 9M8 12.5L11.5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPrint() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 5.5V2.5H11.5V5.5M4.5 11H3A1.5 1.5 0 0 1 1.5 9.5V7A1.5 1.5 0 0 1 3 5.5H13A1.5 1.5 0 0 1 14.5 7V9.5A1.5 1.5 0 0 1 13 11H11.5M4.5 9H11.5V13.5H4.5V9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDownload() {
  return (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5V10.5M8 10.5L5 7.5M8 10.5L11 7.5M2.5 13H13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoadingSkeleton({ label = 'Memuat data seleksi...' }) {
  return (
    <section className="cut-panel" aria-busy="true">
      <div className="loading-box">
        <p>{label}</p>
        <div className="skeleton-bar" />
        <div className="skeleton-bar" />
      </div>
    </section>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, secondaryLabel, onSecondary }) {
  return (
    <div className="empty-box">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="action-row" style={{ justifyContent: 'center' }}>
        {actionLabel && onAction && (
          <button type="button" className="key key--primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button type="button" className="key" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusBanner({ banner, onDismiss, onRetry, onUndo }) {
  if (!banner) return null;
  const levelClass = banner.type === 'error' ? 'is-error' : banner.type === 'warn' ? 'is-warn' : 'is-pass';
  return (
    <div className={`status-bar ${levelClass}`} role="status" aria-live="polite">
      <span className="status-lead">
        {banner.type === 'error' || banner.type === 'warn' ? <IconWarn /> : <IconCheck />}
        <span>{banner.message}</span>
      </span>
      <div className="action-row">
        {banner.undoable && onUndo && (
          <button type="button" className="key key--sm" onClick={onUndo}>
            <IconUndo />
            <span>Urungkan</span>
          </button>
        )}
        {banner.retryable && onRetry && (
          <button type="button" className="key key--sm" onClick={onRetry}>
            Coba muat ulang
          </button>
        )}
        {onDismiss && (
          <button type="button" className="key key--sm" onClick={onDismiss}>
            Tutup
          </button>
        )}
      </div>
    </div>
  );
}
