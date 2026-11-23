import React from 'react';

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

export function StatusBanner({ banner, onDismiss, onRetry }) {
  if (!banner) return null;
  const levelClass = banner.type === 'error' ? 'is-error' : banner.type === 'warn' ? 'is-warn' : 'is-pass';
  return (
    <div className={`status-bar ${levelClass}`} role="status" aria-live="polite">
      <span className="status-lead">
        {banner.type === 'error' || banner.type === 'warn' ? <IconWarn /> : <IconCheck />}
        <span>{banner.message}</span>
      </span>
      <div className="action-row">
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

