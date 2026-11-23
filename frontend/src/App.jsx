import React, { useCallback, useEffect, useState } from 'react';
import CalculationRankingTab from './components/CalculationRankingTab.jsx';
import DataManagementTab from './components/DataManagementTab.jsx';
import HeaderTray, { TABS } from './components/HeaderTray.jsx';
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
  const raw = window.location.hash.replace(/^#/, '');
  return VALID_TAB_IDS.has(raw) ? raw : 'data';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(readTabFromHash);
  const [activeMethod, setActiveMethod] = useState('saw');
  const [workspace, setWorkspace] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState('');
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [checklist, setChecklist] = useState({
    dataValid: false,
    asumsiSesuai: false,
    privasiTerjaga: false,
  });

  const connection = getApiConnection();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWorkspace();
      setWorkspace(data);
      setBanner(null);
    } catch (err) {
      setBanner({
        type: 'error',
        message: err.message || 'Gagal memuat data workspace.',
        retryable: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Proses perhitungan otomatis setiap alternatif atau kriteria/bobot berubah.
  useEffect(() => {
    if (!workspace) return;
    let cancelled = false;
    (async () => {
      try {
        const computed = await calculateWorkspace(workspace.alternatives, workspace.criteria);
        if (!cancelled) {
          setCalcResult(computed);
          setCalcError('');
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
    setWorkspace(nextWorkspace);
    try {
      const saved = await saveWorkspace(nextWorkspace);
      setWorkspace(saved);
    } catch (err) {
      setBanner({
        type: 'error',
        message: err.message || 'Perubahan gagal disimpan ke backend.',
        retryable: true,
      });
    }
  }

  function handleAddCriterion(crit) {
    const created = { ...crit, id: `c-${Date.now().toString(36)}` };
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
    const nextCriteria = workspace.criteria.filter((c) => c.id !== id);
    const nextAlternatives = syncAlternativesWithCriteria(workspace.alternatives, nextCriteria);
    persistNext({ ...workspace, criteria: nextCriteria, alternatives: nextAlternatives });
  }

  function handleAddAlternative(alt) {
    const created = { ...alt, id: `a-${Date.now().toString(36)}` };
    persistNext({ ...workspace, alternatives: [...workspace.alternatives, created] });
  }

  function handleUpdateAlternative(id, updated) {
    const nextAlternatives = workspace.alternatives.map((a) =>
      a.id === id ? { ...updated, id } : a,
    );
    persistNext({ ...workspace, alternatives: nextAlternatives });
  }

  function handleDeleteAlternative(id) {
    const nextAlternatives = workspace.alternatives.filter((a) => a.id !== id);
    persistNext({ ...workspace, alternatives: nextAlternatives });
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
    if (!window.confirm('Kembalikan seluruh kriteria dan calon karyawan ke data ilustrasi awal?')) {
      return;
    }
    try {
      const seed = await resetWorkspace();
      setWorkspace(seed);
      setBanner({
        type: 'pass',
        message: 'Data ilustrasi pembelajaran berhasil dimuat ulang.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        message: err.message || 'Gagal mereset data ilustrasi.',
      });
    }
  }

  const weightSummary = getWeightSummary(workspace?.criteria || []);

  return (
    <>
      <HeaderTray
        activeTab={activeTab}
        onSelectTab={selectTab}
        altCount={workspace?.alternatives?.length || 0}
        critCount={workspace?.criteria?.length || 0}
        weightTotal={weightSummary.rawTotal}
        isExact100={weightSummary.isExact100}
        connectionLabel={connection.label}
        engineSource={calcResult?.source || ''}
      />

      <main id="main-content" className="container workspace-main">
        <StatusBanner
          banner={banner}
          onDismiss={() => setBanner(null)}
          onRetry={loadAll}
        />

        {loading || !workspace ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === 'data' && (
              <DataManagementTab
                criteria={workspace.criteria}
                alternatives={workspace.alternatives}
                onAddCriterion={handleAddCriterion}
                onUpdateCriterion={handleUpdateCriterion}
                onDeleteCriterion={handleDeleteCriterion}
                onAddAlternative={handleAddAlternative}
                onUpdateAlternative={handleUpdateAlternative}
                onDeleteAlternative={handleDeleteAlternative}
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
          </>
        )}
      </main>

      <footer className="app-footer no-print">
        <div className="container footer-inner">
          <span>Sistem menyajikan dukungan perhitungan; pengelola bertanggung jawab atas keputusan akhir.</span>
          <span>Data bawaan bersifat ilustrasi pembelajaran. Rujukan konsep MSS: Sharda, Delen, dan Turban (2021).</span>
        </div>
      </footer>
    </>
  );
}

