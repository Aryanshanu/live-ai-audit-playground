'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { runAuditEngine } from '../lib/auditEngine';
import { saveAuditToHistory, computeLayerScores } from '../lib/historyStore';
import AuditPlayground from '../components/AuditPlayground';
import SandboxWorkspace from '../components/SandboxWorkspace';
import IntegrationStudioPanel from '../components/IntegrationStudioPanel';
import DataLineageGraph from '../components/DataLineageGraph';
import HistoryIndicator from '../components/HistoryIndicator';

const ARCHITECTURE_TEMPLATES = {
  ragBot:
    'Deploying an E-Commerce RAG Customer Support Chatbot. There is no input sanitization — user input is fed directly into the prompt on the text-generation layer. The runtime engine tracks user profiles continuously to analyze churn, and logs never expire; metrics are kept indefinitely for optimization runs.',
  raiViolation:
    'Deploying a high-compute optimization framework with unmonitored compute scaling across grid clusters — there is no carbon tracking on any training run. Model output goes straight to client feeds as unmoderated model output, with no toxicity filter or post-inference safety wrapper.',
  compliantSovereign:
    'Deploying a Compliant Sovereign Multi-Lingual Pipeline. Input fields utilize strict system instructions encapsulation using guardrail frameworks. Customer text data is routed through a decoupled data principal vault backed by a strict 30-day cron purge TTL policy. Natural vernacular tracking runs on 22 scheduled languages with integrated AI4Bharat tokenizers. Infrastructure is anchored in sovereign cloud with DVC data lineage verification.',
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
  const [copiedKey, setCopiedKey] = useState(null);

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
    <div className="min-h-screen bg-[#070A12] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ━━ Top Navbar ━━ */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-sm text-emerald-400">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                &lt;GOV.AX //&gt;
              </span>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono text-emerald-400 font-bold tracking-wider uppercase">
                Unified Governance Center
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-mono">
              Dual-Engine Architecture: Asymmetric Bento Matrix &amp; Verified Model Scanner
            </p>
          </div>
        </div>

        {/* Mode Selector Pill Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs relative">
          <button
            onClick={() => setActiveMode('sandbox')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 relative z-10 ${
              activeMode === 'sandbox' ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeMode === 'sandbox' && (
              <motion.div
                layoutId="navModePill"
                className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <Workflow size={13} />
            <span>Architecture Sandbox</span>
          </button>

          <button
            onClick={() => setActiveMode('hf_model')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 relative z-10 ${
              activeMode === 'hf_model' ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeMode === 'hf_model' && (
              <motion.div
                layoutId="navModePill"
                className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/30 rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <Cpu size={13} />
            <span>Hugging Face Hub Scanner</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
          <HistoryIndicator />
          <a
            href="https://github.com/Aryanshanu/live-ai-audit-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            GitHub Source <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* ━━ MODE B: HUGGING FACE MODEL CARD AUDITOR ━━ */}
      {activeMode === 'hf_model' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Mode: Live Hugging Face Hub Model Card Audit
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Direct asynchronous API queries to official Hugging Face Hub repositories. License &amp; tag provenance verified cryptographically.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Zero Proxy • Direct Browser Handshake
            </span>
          </div>

          <AuditPlayground />
        </div>
      )}

      {/* ━━ MODE A: ASYMMETRIC BENTO GRID ARCHITECTURE SANDBOX ━━ */}
      {activeMode === 'sandbox' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Confidence Notice Bar */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0B0F1C]/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold uppercase text-[10px]">
                Heuristic Analysis
              </span>
              <span className="text-slate-300">
                Client-Side Tokenizer &amp; Regulatory Heuristic Pattern Matcher
              </span>
            </div>
            <span className="text-slate-500 text-[11px]">
              Statutory references: India DPDP 2023 • MeitY IndiaAI • OWASP Top 10 • FTC Disgorgement
            </span>
          </div>

          {/* ━━ Upper Bento Split: Input Workspace + Radar Dashboard ━━ */}
          <SandboxWorkspace
            architectureText={architectureText}
            setArchitectureText={setArchitectureText}
            activeLayers={activeLayers}
            toggleLayer={toggleLayer}
            isAnalyzing={isAnalyzing}
            report={report}
            templates={ARCHITECTURE_TEMPLATES}
          />


          {/* ━━ Lower Bento: Data Lineage Node Graph ━━ */}
          <DataLineageGraph report={report} text={architectureText} />

          {/* ━━ Lower Bento: Threat Scenario & Integration Tabs ━━ */}
          <IntegrationStudioPanel
            report={report}
            architectureText={architectureText}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        </div>
      )}
    </div>
  );
}
