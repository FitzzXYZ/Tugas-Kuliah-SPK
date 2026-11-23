import { SAMPLE_WORKSPACE } from '../data/sampleWorkspace.js';
import { calculateAllMethods } from '../models/spkEngine.js';

const STORAGE_KEY = 'spk_seleksi_karyawan_workspace_v3';

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
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
    return requestJson(`${conn.baseUrl}/workspace`);
  }
  return readLocalWorkspace();
}

export async function saveWorkspace(workspace) {
  const conn = getApiConnection();
  if (conn.mode === 'remote') {
    return requestJson(`${conn.baseUrl}/workspace`, {
      method: 'PUT',
      body: JSON.stringify(workspace),
    });
  }
  writeLocalWorkspace(workspace);
  return structuredClone(workspace);
}

export async function resetWorkspace() {
  const conn = getApiConnection();
  if (conn.mode === 'remote') {
    return requestJson(`${conn.baseUrl}/workspace/reset`, { method: 'POST' });
  }
  const seed = structuredClone(SAMPLE_WORKSPACE);
  writeLocalWorkspace(seed);
  return seed;
}

export async function calculateWorkspace(alternatives, criteria) {
  const conn = getApiConnection();
  if (conn.mode === 'remote') {
    const res = await requestJson(`${conn.baseUrl}/calculate`, {
      method: 'POST',
      body: JSON.stringify({ alternatives, criteria, method: 'all' }),
    });
    return { ...res, source: res.engine || 'backend' };
  }
  const computed = calculateAllMethods(alternatives, criteria);
  return { ...computed, source: 'browser-js' };
}

