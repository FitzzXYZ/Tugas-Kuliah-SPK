import { SAMPLE_WORKSPACE } from '../data/sampleWorkspace.js';
import { calculateAllMethods } from '../models/spkEngine.js';

const STORAGE_KEY = 'spk_seleksi_karyawan_workspace_v4';

function resolveApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('api');
  const fromEnv = import.meta?.env?.VITE_API_URL || '';
  const candidate = fromQuery || fromEnv || '';
  if (!candidate) return '';

  if (candidate.startsWith('/')) {
    return candidate.replace(/\/+$/, '');
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString().replace(/\/+$/, '');
    }
  } catch {
    return '';
  }
  return '';
}

let memoryWorkspace = structuredClone(SAMPLE_WORKSPACE);

function readLocalWorkspace() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = structuredClone(SAMPLE_WORKSPACE);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.criteria) && Array.isArray(parsed.alternatives)) {
      return parsed;
    }
  } catch {
    // Fallback ke memori bila storage diblokir browser.
  }
  return structuredClone(memoryWorkspace);
}

function writeLocalWorkspace(workspace) {
  memoryWorkspace = structuredClone(workspace);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // Biarkan tetap berjalan di memori sesi.
  }
}

function isServerUnreachableError(err) {
  if (!err) return false;
  if (err.isUnreachable) return true;
  if (err instanceof TypeError) return true;
  const msg = String(err.message || '');
  return /failed to fetch|networkerror|load failed|502|503|504/i.test(msg);
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (networkErr) {
    const err = new Error('Server backend tidak dapat dijangkau.');
    err.isUnreachable = true;
    err.cause = networkErr;
    throw err;
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    const err = new Error(`Server backend belum aktif (HTTP ${response.status}).`);
    err.isUnreachable = true;
    throw err;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // Gunakan pesan status HTTP bawaan.
    }
    throw new Error(`Permintaan ke backend gagal (${detail}).`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function getApiConnection() {
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) {
    return {
      mode: 'local',
      baseUrl: '',
      label: 'Mode lokal browser',
    };
  }
  return {
    mode: 'remote',
    baseUrl,
    label: `Backend API (${baseUrl})`,
  };
}

export async function fetchWorkspace() {
  const conn = getApiConnection();
  if (conn.mode === 'remote') {
    try {
      const data = await requestJson(`${conn.baseUrl}/workspace`);
      writeLocalWorkspace(data);
      return { workspace: data, fallbackOffline: false };
    } catch (err) {
      if (isServerUnreachableError(err)) {
        // Fallback otomatis ke penyimpanan browser agar aplikasi tidak pernah layar kosong "Failed to fetch".
        return { workspace: readLocalWorkspace(), fallbackOffline: true };
      }
      throw err;
    }
  }
  return { workspace: readLocalWorkspace(), fallbackOffline: false };
}

export async function saveWorkspace(workspace) {
  const conn = getApiConnection();
  writeLocalWorkspace(workspace);
  if (conn.mode === 'remote') {
    try {
      const saved = await requestJson(`${conn.baseUrl}/workspace`, {
        method: 'PUT',
        body: JSON.stringify(workspace),
      });
      return { workspace: saved, fallbackOffline: false };
    } catch (err) {
      if (isServerUnreachableError(err)) {
        return { workspace: structuredClone(workspace), fallbackOffline: true };
      }
      throw err;
    }
  }
  return { workspace: structuredClone(workspace), fallbackOffline: false };
}

export async function resetWorkspace() {
  const conn = getApiConnection();
  if (conn.mode === 'remote') {
    try {
      const seed = await requestJson(`${conn.baseUrl}/workspace/reset`, { method: 'POST' });
      writeLocalWorkspace(seed);
      return { workspace: seed, fallbackOffline: false };
    } catch (err) {
      if (!isServerUnreachableError(err)) throw err;
    }
  }
  const seed = structuredClone(SAMPLE_WORKSPACE);
  writeLocalWorkspace(seed);
  return { workspace: seed, fallbackOffline: conn.mode === 'remote' };
}

export async function calculateWorkspace(alternatives, criteria) {
  const conn = getApiConnection();
  if (conn.mode === 'remote') {
    try {
      const res = await requestJson(`${conn.baseUrl}/calculate`, {
        method: 'POST',
        body: JSON.stringify({ alternatives, criteria, method: 'all' }),
      });
      return { ...res, source: res.engine || 'backend', fallbackOffline: false };
    } catch (err) {
      if (isServerUnreachableError(err)) {
        const computed = calculateAllMethods(alternatives, criteria);
        return { ...computed, source: 'browser-js (offline fallback)', fallbackOffline: true };
      }
      throw err;
    }
  }
  const computed = calculateAllMethods(alternatives, criteria);
  return { ...computed, source: 'browser-js', fallbackOffline: false };
}
