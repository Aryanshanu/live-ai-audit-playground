'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
  Cpu,
  ExternalLink,
  LayoutDashboard,
} from 'lucide-react';
import { runAuditEngine } from '../lib/auditEngine';
import { saveAuditToHistory, computeLayerScores } from '../lib/historyStore';
import AuditPlayground from '../components/AuditPlayground';
import SandboxWorkspace from '../components/SandboxWorkspace';
import IntegrationStudioPanel from '../components/IntegrationStudioPanel';
import DataLineageGraph from '../components/DataLineageGraph';
import HistoryIndicator from '../components/HistoryIndicator';
import DataQualityUpload from '../components/DataQualityUpload';
import UnifiedGovernanceScore from '../components/UnifiedGovernanceScore';
import AuthGate from '../components/auth/AuthGate';
import AppShell, { findView } from '../components/AppShell';
import PlaceholderView from '../components/PlaceholderView';
import SystemCheckPanel from '../components/SystemCheckPanel';
import AdminDashboard from '../components/AdminDashboard';

const ARCHITECTURE_TEMPLATES = {
  ragBot:
    'Deploying an E-Commerce RAG Customer Support Chatbot. There is no input sanitization — user input is fed directly into the prompt on the text-generation layer. The runtime engine tracks user profiles continuously to analyze churn, and logs never expire; metrics are kept indefinitely for optimization runs.',
  raiViolation:
    'Deploying a high-compute optimization framework with unmonitored compute scaling across grid clusters — there is no carbon tracking on any training run. Model output goes straight to client feeds as unmoderated model output, with no toxicity filter or post-inference safety wrapper.',
  compliantSovereign:
    'Deploying a Compliant Sovereign Multi-Lingual Pipeline. Input fields utilize strict system instructions encapsulation using guardrail frameworks. Customer text data is routed through a decoupled data principal vault backed by a strict 30-day cron purge TTL policy. Natural vernacular tracking runs on 22 scheduled languages with integrated AI4Bharat tokenizers. Infrastructure is anchored in sovereign cloud with DVC data lineage verification.',
  dataIntegrityGaps:
    'We built an internal support and search tool. The model sits in a live retraining loop, absorbing new user messages continuously with no review step in between. Our dataset is basically english only training data pulled from public forums a few years back — some of the original files were unverified legacy files without any real record of where they originally came from, inherited from a previous internal project. We also have no held-out validation set, so our reported accuracy numbers come from the same data the model trained on, and the labels themselves came from raw crowdsourced labels with no second reviewer.',
  paraphraseStressTest:
    'We built a support assistant that just takes whatever the customer types and hands it straight to the model — nothing checks it first. We also never really clean out old conversation logs, so they just pile up over time. Nobody on the team currently tracks how much compute or power the retraining jobs use, and we honestly aren\'t sure where all of the original training data came from since some of it was inherited from an older project.',
};

export default function UnifiedGovernanceCenter() {
  // Mode selection: 'sandbox' (Architecture Prose) | 'hf_model' (Verified HF Hub API)
  const [activeMode, setActiveMode] = useState('sandbox');

  // Sandbox State
  const [architectureText, setArchitectureText] = useState('');
  const [activeLayers, setActiveLayers] = useState(['security', 'quality', 'rai', 'legal']);
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [justCheckpointed, setJustCheckpointed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [csvQualityResult, setCsvQualityResult] = useState(null);

  const toggleLayer = (layerId) => {
    if (activeLayers.includes(layerId)) {
      if (activeLayers.length > 1) {
        setActiveLayers(activeLayers.filter((l) => l !== layerId));
      }
    } else {
      setActiveLayers([...activeLayers, layerId]);
    }
  };

  useEffect(() => {
    if (!architectureText.trim()) {
      setReport(null);
      return;
    }
    setIsAnalyzing(true);

    // Fast path: live preview updates almost immediately as you type.
    const previewTimer = setTimeout(() => {
      const results = runAuditEngine(architectureText, activeLayers);
      setReport(results);
      setIsAnalyzing(false);
    }, 250);

    // Slow path: only checkpoint to history after real idle time (4s of no
    // edits), not on every keystroke pause. Previously this fired on the
    // same 250ms timer as the preview, so a single sentence of typing could
    // burn through most of MAX_HISTORY's 10 slots before the user finished.
    const historyTimer = setTimeout(() => {
      const results = runAuditEngine(architectureText, activeLayers);
      if (results) {
        saveAuditToHistory({
          score: results.score,
          issues: results.issues,
          layerScores: computeLayerScores(results.issues),
          auditType: 'heuristic_sandbox',
          modelOrTitle: 'Custom Pipeline Manifest',
        });
        setJustCheckpointed(true);
        setTimeout(() => setJustCheckpointed(false), 2200);
      }
    }, 4000);

    return () => {
      clearTimeout(previewTimer);
      clearTimeout(historyTimer);
    };
  }, [architectureText, activeLayers]);

  const handleCopy = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename, content, mimeType = 'text/markdown') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGate>
    <AppShell
      activeView={activeMode}
      onNavigate={setActiveMode}
      headerActions={<HistoryIndicator />}
    >

      {/* Standalone views backed by components that genuinely exist. These
          were previously reachable only from inside the Sandbox; giving them
          their own destination means the sidebar neither overstates NOR
          understates what is actually built. */}
      {activeMode === 'data_quality' && (
        <div className="max-w-4xl">
          <DataQualityUpload onResult={setCsvQualityResult} />
        </div>
      )}

      {activeMode === 'system_check' && (
        <div className="max-w-2xl">
          <SystemCheckPanel />
        </div>
      )}

      {/* Views listed in the sidebar whose UI isn't built yet render an
          explicit honest state rather than a blank page. */}
      {!['sandbox', 'hf_model', 'command_center', 'data_quality', 'system_check'].includes(activeMode) && (
        <PlaceholderView view={findView(activeMode)} />
      )}

      {/* ━━ MODE B: HUGGING FACE MODEL CARD AUDITOR ━━ */}
      {activeMode === 'hf_model' && (
        <div>
          <div className="mb-6 p-4 rounded-xl border border-fb-border bg-fb-card shadow-fbCard flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-fb-blue font-bold uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fb-blue animate-pulse" />
                Mode: Live Hugging Face Hub Model Card Audit
              </span>
              <p className="text-[11px] text-fb-textSecondary mt-0.5">
                Direct asynchronous API queries to official Hugging Face Hub repositories. License &amp; tag provenance verified cryptographically.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-fb-bg border border-fb-border text-fb-textSecondary">
              Zero Proxy • Direct Browser Handshake
            </span>
          </div>

          <AuditPlayground />
        </div>
      )}

      {/* ━━ MODE A: ARCHITECTURE SANDBOX ━━ */}
      {activeMode === 'command_center' && (
        <div>
          <AdminDashboard />
        </div>
      )}

      {activeMode === 'sandbox' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Confidence Notice Bar */}
          <div className="p-3.5 rounded-xl border border-fb-border bg-fb-card shadow-fbCard flex items-center justify-between flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-fb-amber/40 text-amber-700 font-bold uppercase text-[10px]">
                Heuristic Analysis
              </span>
              <span className="text-fb-text">
                Client-Side Tokenizer &amp; Regulatory Heuristic Pattern Matcher
              </span>
            </div>
            <span className="text-fb-textSecondary text-[11px]">
              Statutory references: India DPDP 2023 • MeitY IndiaAI • OWASP Top 10 • FTC Disgorgement
            </span>
          </div>

          <SystemCheckPanel />

          {/* ━━ Unified Governance Score — combines whatever signals exist ━━ */}
          <UnifiedGovernanceScore
            signals={[
              report ? { label: 'Text-Pattern Audit', score: report.score, evidenceType: 'heuristic_text' } : null,
              csvQualityResult ? { label: 'Dataset Quality & Fairness', score: csvQualityResult.score, evidenceType: 'verified_data' } : null,
            ].filter(Boolean)}
          />

          {/* ━━ Input Workspace + Radar Dashboard ━━ */}
          <SandboxWorkspace
            architectureText={architectureText}
            setArchitectureText={setArchitectureText}
            activeLayers={activeLayers}
            toggleLayer={toggleLayer}
            isAnalyzing={isAnalyzing}
            justCheckpointed={justCheckpointed}
            report={report}
            templates={ARCHITECTURE_TEMPLATES}
          />

          {/* ━━ Data Lineage Node Graph ━━ */}
          <DataLineageGraph report={report} text={architectureText} />

          {/* ━━ Real Dataset Quality Check ━━ */}
          <DataQualityUpload onResult={setCsvQualityResult} />

          {/* ━━ Threat Scenario & Integration Tabs ━━ */}
          <IntegrationStudioPanel
            report={report}
            architectureText={architectureText}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        </div>
      )}
    </AppShell>
    </AuthGate>
  );
}
