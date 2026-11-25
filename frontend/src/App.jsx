import React, { useCallback, useEffect, useRef, useState } from 'react';
import AppShell, { TABS } from './components/AppShell.jsx';
import CalculationRankingTab from './components/CalculationRankingTab.jsx';
import CandidateDrawer from './components/CandidateDrawer.jsx';
import DashboardTab from './components/DashboardTab.jsx';
import DataManagementTab from './components/DataManagementTab.jsx';
import ReportTab from './components/ReportTab.jsx';
import { LoadingSkeleton, StatusBanner } from './components/StateViews.jsx';
import VisualizationTab from './components/VisualizationTab.jsx';
import WeightsMethodTab from './components/WeightsMethodTab.jsx';
import {
  getWeightSummary,
  normalizeCriteriaWeightsTo100,
  syncAlternativesWithCriteria,
} from './models/spkEngine.js';
import {
  calculateWorkspace,
  fetchWorkspace,
  getApiConnection,
  resetWorkspace,
  saveWorkspace,
} from './services/spkApi.js';

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

function readTabFromHash() {
  if (typeof window === 'undefined') return 'dashboard';
  const raw = window.location.hash.replace(/^#/, '');
  return VALID_TAB_IDS.has(raw) ? raw : 'dashboard';
}

function makeEntityId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function App() {
  const connection = getApiConnection();
  const [activeTab, setActiveTab] = useState(readTabFromHash);
  const [activeMethod, setActiveMethod] = useState('saw');
  const [workspace, setWorkspace] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState('');
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [serverOnline, setServerOnline] = useState(connection.mode === 'remote');
  const [inspectedId, setInspectedId] = useState(null);
  const [dataIntent, setDataIntent] = useState(null);
  const [checklist, setChecklist] = useState({
    dataValid: false,
    asumsiSesuai: false,
    privasiTerjaga: false,
  });

  const undoSnapshotRef = useRef(null);
  const saveSeqRef = useRef(0);

  const loadAll = useCallback(async () => {
    const reqId = ++saveSeqRef.current;
    setLoading(true);
    try {
      const { workspace: data, fallbackOffline, syncedOfflineEdits } = await fetchWorkspace();
      if (reqId !== saveSeqRef.current) return;
      setWorkspace(data);
      setServerOnline(connection.mode === 'remote' && !fallbackOffline);
      if (fallbackOffline) {
        setBanner({
          type: 'warn',
          message:
            'Server backend (port 8000) belum aktif. Aplikasi otomatis berjalan menggunakan data lokal browser.',
          retryable: true,
        });
      } else if (syncedOfflineEdits) {
        setBanner({
          type: 'pass',
          message: 'Koneksi backend pulih. Perubahan selama mode offline berhasil disinkronkan ke server.',
        });
      } else {
        setBanner(null);
      }
    } catch (err) {
      if (reqId !== saveSeqRef.current) return;
      setBanner({
        type: 'error',
        message: err.message || 'Gagal memuat data workspace.',
        retryable: true,
      });
    } finally {
      if (reqId === saveSeqRef.current) {
        setLoading(false);
      }
    }
  }, [connection.mode]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    function onHashChange() {
      setActiveTab(readTabFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!workspace) return;
    let cancelled = false;
    (async () => {
      try {
        const computed = await calculateWorkspace(workspace.alternatives, workspace.criteria);
        if (!cancelled) {
          setCalcResult(computed);
          setCalcError('');
          if (connection.mode === 'remote') {
            setServerOnline(!computed.fallbackOffline);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCalcResult(null);
          setCalcError(err.message || 'Perhitungan gagal dijalankan.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace]);

  function selectTab(tabId) {
    if (!VALID_TAB_IDS.has(tabId)) return;
    setActiveTab(tabId);
    if (window.location.hash !== `#${tabId}`) {
      window.location.hash = tabId;
    }
  }

  async function persistNext(nextWorkspace) {
    const reqId = ++saveSeqRef.current;
    setWorkspace(nextWorkspace);
    try {
      const { workspace: saved, fallbackOffline } = await saveWorkspace(nextWorkspace);
      if (reqId !== saveSeqRef.current) return;
      setWorkspace(saved);
      setServerOnline(connection.mode === 'remote' && !fallbackOffline);
    } catch (err) {
      if (reqId !== saveSeqRef.current) return;
      setBanner({
        type: 'error',
        message: err.message || 'Perubahan gagal disimpan ke server.',
        retryable: true,
      });
    }
  }

  function handleUndo() {
    if (!undoSnapshotRef.current) return;
    const restored = undoSnapshotRef.current;
    undoSnapshotRef.current = null;
    persistNext(restored);
    setBanner({ type: 'pass', message: 'Perubahan terakhir berhasil dikembalikan.' });
  }

  function handleAddCriterion(crit) {
    const created = { ...crit, id: makeEntityId('c') };
    const nextCriteria = [...workspace.criteria, created];
    const nextAlternatives = syncAlternativesWithCriteria(
      workspace.alternatives,
      nextCriteria,
      created,
    );
    persistNext({ ...workspace, criteria: nextCriteria, alternatives: nextAlternatives });
  }

  function handleUpdateCriterion(id, updated) {
    const nextCriteria = workspace.criteria.map((c) => (c.id === id ? { ...updated, id } : c));
    persistNext({ ...workspace, criteria: nextCriteria });
  }

  function handleDeleteCriterion(id) {
    if (workspace.criteria.length <= 1) return;
    const target = workspace.criteria.find((c) => c.id === id);
    undoSnapshotRef.current = structuredClone(workspace);
    const nextCriteria = workspace.criteria.filter((c) => c.id !== id);
    const nextAlternatives = syncAlternativesWithCriteria(workspace.alternatives, nextCriteria);
    persistNext({ ...workspace, criteria: nextCriteria, alternatives: nextAlternatives });
    setBanner({
      type: 'warn',
      message: `Kriteria "${target?.nama || id}" dihapus dari penilaian.`,
      undoable: true,
    });
  }

  function handleAddAlternative(alt) {
    const created = { ...alt, id: makeEntityId('a') };
    persistNext({ ...workspace, alternatives: [...workspace.alternatives, created] });
  }

  function handleUpdateAlternative(id, updated) {
    const nextAlternatives = workspace.alternatives.map((a) =>
      a.id === id ? { ...updated, id } : a,
    );
    persistNext({ ...workspace, alternatives: nextAlternatives });
  }

  function handleDeleteAlternative(id) {
    const target = workspace.alternatives.find((a) => a.id === id);
    undoSnapshotRef.current = structuredClone(workspace);
    const nextAlternatives = workspace.alternatives.filter((a) => a.id !== id);
    if (inspectedId === id) setInspectedId(null);
    persistNext({ ...workspace, alternatives: nextAlternatives });
    setBanner({
      type: 'warn',
      message: `Pelamar "${target?.nama || id}" dihapus dari daftar.`,
      undoable: true,
    });
  }

  function handleChangeWeight(criterionId, bobot) {
    const nextCriteria = workspace.criteria.map((c) =>
      c.id === criterionId ? { ...c, bobot } : c,
    );
    persistNext({ ...workspace, criteria: nextCriteria });
  }

  function handleNormalizeWeights() {
    const nextCriteria = normalizeCriteriaWeightsTo100(workspace.criteria);
    persistNext({ ...workspace, criteria: nextCriteria });
  }

  function handleApplyPreset(byCode) {
    const updated = workspace.criteria.map((c) => {
      const target = byCode[c.kode.toUpperCase()];
      return target ? { ...c, bobot: target } : c;
    });
    const nextCriteria = normalizeCriteriaWeightsTo100(updated);
    persistNext({ ...workspace, criteria: nextCriteria });
  }

  function handleUpdateHumanDecision(altId, patch) {
    const nextAlternatives = workspace.alternatives.map((a) =>
      a.id === altId ? { ...a, ...patch } : a,
    );
    persistNext({ ...workspace, alternatives: nextAlternatives });
  }

  function handleUpdateMetadata(patch) {
    persistNext({
      ...workspace,
      metadata: { ...workspace.metadata, ...patch },
    });
  }

  async function handleResetWorkspace() {
    const reqId = ++saveSeqRef.current;
    undoSnapshotRef.current = structuredClone(workspace);
    try {
      const { workspace: seed, fallbackOffline } = await resetWorkspace();
      if (reqId !== saveSeqRef.current) return;
      setWorkspace(seed);
      setServerOnline(connection.mode === 'remote' && !fallbackOffline);
      setInspectedId(null);
      setBanner({
        type: 'pass',
        message: 'Data contoh awal dimuat ulang.',
        undoable: true,
      });
    } catch (err) {
      if (reqId !== saveSeqRef.current) return;
      setBanner({
        type: 'error',
        message: err.message || 'Gagal memuat ulang data contoh.',
      });
    }
  }

  function handleQuickAddCandidate() {
    selectTab('data');
    setDataIntent({ mode: 'add' });
  }

  function handleRequestEditCandidate(altId) {
    selectTab('data');
    setDataIntent({ mode: 'edit', id: altId });
  }

  const weightSummary = getWeightSummary(workspace?.criteria || []);
  const activeLeader = calcResult?.[activeMethod]?.rankings?.[0] || null;
  const leaderSummary = activeLeader
    ? {
        id: activeLeader.id,
        nama: activeLeader.nama,
        scoreLabel:
          activeMethod === 'wp'
            ? `${(activeLeader.score * 100).toFixed(1)}%`
            : `${(activeLeader.score * 100).toFixed(1)}`,
      }
    : null;
  const inspectedCandidate =
    inspectedId && workspace
      ? workspace.alternatives.find((a) => a.id === inspectedId) || null
      : null;

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onSelectTab={selectTab}
        activeMethod={activeMethod}
        onSelectMethod={setActiveMethod}
        judulSeleksi={workspace?.metadata?.judulSeleksi || ''}
        altCount={workspace?.alternatives?.length || 0}
        critCount={workspace?.criteria?.length || 0}
        weightTotal={weightSummary.rawTotal}
        isExact100={weightSummary.isExact100}
        isRemote={serverOnline}
        leaderSummary={leaderSummary}
        quickCandidates={workspace?.alternatives || []}
        onInspectLeader={setInspectedId}
        onQuickAddCandidate={handleQuickAddCandidate}
      >
        <StatusBanner
          banner={banner}
          onDismiss={() => setBanner(null)}
          onRetry={loadAll}
          onUndo={handleUndo}
        />

        {loading || !workspace ? (
          <LoadingSkeleton />
        ) : (
          <div key={activeTab} className="view-stage">
            {activeTab === 'dashboard' && (
              <DashboardTab
                workspace={workspace}
                activeMethod={activeMethod}
                onSelectMethod={setActiveMethod}
                calcResult={calcResult}
                calcError={calcError}
                onApplyPreset={handleApplyPreset}
                onUpdateHumanDecision={handleUpdateHumanDecision}
                onInspectCandidate={setInspectedId}
                onNavigateTab={selectTab}
              />
            )}

            {activeTab === 'data' && (
              <DataManagementTab
                criteria={workspace.criteria}
                alternatives={workspace.alternatives}
                dataIntent={dataIntent}
                onConsumeIntent={() => setDataIntent(null)}
                onAddCriterion={handleAddCriterion}
                onUpdateCriterion={handleUpdateCriterion}
                onDeleteCriterion={handleDeleteCriterion}
                onAddAlternative={handleAddAlternative}
                onUpdateAlternative={handleUpdateAlternative}
                onDeleteAlternative={handleDeleteAlternative}
                onInspectCandidate={setInspectedId}
                onResetWorkspace={handleResetWorkspace}
                onNextTab={() => selectTab('bobot-metode')}
              />
            )}

            {activeTab === 'bobot-metode' && (
              <WeightsMethodTab
                criteria={workspace.criteria}
                activeMethod={activeMethod}
                onSelectMethod={setActiveMethod}
                onChangeWeight={handleChangeWeight}
                onApplyPreset={handleApplyPreset}
                onNormalizeWeights={handleNormalizeWeights}
                onNextTab={() => selectTab('perhitungan')}
              />
            )}

            {activeTab === 'perhitungan' && (
              <CalculationRankingTab
                criteria={workspace.criteria}
                alternatives={workspace.alternatives}
                activeMethod={activeMethod}
                onSelectMethod={setActiveMethod}
                calcResult={calcResult}
                calcError={calcError}
                onUpdateHumanDecision={handleUpdateHumanDecision}
                onInspectCandidate={setInspectedId}
                onGoToData={() => selectTab('data')}
                onNextTab={() => selectTab('visualisasi')}
              />
            )}

            {activeTab === 'visualisasi' && (
              <VisualizationTab
                criteria={workspace.criteria}
                alternatives={workspace.alternatives}
                activeMethod={activeMethod}
                calcResult={calcResult}
                calcError={calcError}
                onInspectCandidate={setInspectedId}
                onGoToData={() => selectTab('data')}
                onNextTab={() => selectTab('laporan')}
              />
            )}

            {activeTab === 'laporan' && (
              <ReportTab
                workspace={workspace}
                activeMethod={activeMethod}
                calcResult={calcResult}
                calcError={calcError}
                checklist={checklist}
                onToggleChecklist={(key, val) =>
                  setChecklist((prev) => ({ ...prev, [key]: val }))
                }
                onUpdateMetadata={handleUpdateMetadata}
                onExportSuccess={(msg) => setBanner({ type: 'pass', message: msg })}
                onGoToData={() => selectTab('data')}
                onReviewWeights={() => selectTab('bobot-metode')}
              />
            )}
          </div>
        )}
      </AppShell>

      <CandidateDrawer
        candidate={inspectedCandidate}
        criteria={workspace?.criteria || []}
        calcResult={calcResult}
        activeMethod={activeMethod}
        onClose={() => setInspectedId(null)}
        onUpdateDecision={handleUpdateHumanDecision}
        onEditCandidate={handleRequestEditCandidate}
      />
    </>
  );
}
