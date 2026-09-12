'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  FileText,
  Download,
  Copy,
  RefreshCw,
  Terminal,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Layers,
  Cpu,
  Globe2,
  Workflow,
  CheckCircle2,
  BookmarkCheck,
  TrendingUp,
} from 'lucide-react';
import {
  runAuditEngine,
  generatePythonTestSuite,
  generateGitHubActionWorkflow,
  generateMarkdownAuditReport,
} from '../lib/auditEngine';
import { saveAuditToHistory, computeLayerScores } from '../lib/historyStore';
import InteractiveRadarChart from '../components/InteractiveRadarChart';
import DataLineageGraph from '../components/DataLineageGraph';
import AuditPlayground from '../components/AuditPlayground';

const ARCHITECTURE_TEMPLATES = {
  ragBot:
    'Deploying an E-Commerce RAG Customer Support Chatbot. User input text is passed via raw prompt injection blocks to a text-generation layer. The runtime engine tracks user profiles continuously to analyze churn, keeping database logs permanent and metrics stored indefinitely for optimization runs.',
  raiViolation:
    'Deploying a high-compute optimization framework running massive grid clusters with compute parameters unchecked for carbon usage. Model output flows directly via raw generation output into client feeds without content filtering or post-inference context safety wrappers.',
  compliantSovereign:
    'Deploying a Compliant Sovereign Multi-Lingual Pipeline. Input fields utilize strict system instructions encapsulation using guardrail frameworks. Customer text data is routed through a decoupled data principal vault backed by a strict 30-day cron purge TTL policy. Natural vernacular tracking runs on 22 scheduled languages with integrated AI4Bharat tokenizers. Infrastructure is anchored in sovereign cloud with DVC data lineage verification.',
};

export default function UnifiedGovernanceCenter() {
  // Mode selection: 'sandbox' (Architecture Prose) | 'hf_model' (Verified HF Hub API)
  const [activeMode, setActiveMode] = useState('sandbox');

  // Sandbox State
  const [architectureText, setArchitectureText] = useState('');
  const [activeLayers, setActiveLayers] = useState(['security', 'quality', 'rai', 'legal']);
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeIntegrationTab, setActiveIntegrationTab] = useState('jira');
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
    const timer = setTimeout(() => {
      const results = runAuditEngine(architectureText, activeLayers);
      setReport(results);
      if (results) {
        saveAuditToHistory({
          score: results.score,
          issues: results.issues,
          layerScores: computeLayerScores(results.issues),
          auditType: 'heuristic_sandbox',
          modelOrTitle: 'Custom Pipeline Manifest',
        });
      }
      setIsAnalyzing(false);
    }, 250);
    return () => clearTimeout(timer);
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Console (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4 p-6 rounded-2xl border border-slate-800 bg-[#090D18]/80 backdrop-blur-md shadow-xl">
              <div>
                <h2 className="text-xs font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2 font-bold">
                  <Terminal size={14} className="text-emerald-400" /> Technical Architecture Console
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Inject pipeline specifications, prompt templates, or data retention parameters.
                </p>
              </div>

              {/* Presets Bar */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Pre-Formatted Archetypes:
                </span>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setArchitectureText(ARCHITECTURE_TEMPLATES.ragBot)}
                    className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-all cursor-pointer"
                  >
                    E-Com RAG Bot
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setArchitectureText(ARCHITECTURE_TEMPLATES.raiViolation)}
                    className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-rose-400 transition-all cursor-pointer"
                  >
                    RAI Ethical Violation Case
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setArchitectureText(ARCHITECTURE_TEMPLATES.compliantSovereign)}
                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono transition-all hover:bg-emerald-500/20 cursor-pointer"
                  >
                    Sovereign Compliant Stack
                  </motion.button>
                </div>
              </div>

              {/* Active Evaluation Layers */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Active Audit Lenses
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'security', label: '🛡️ Security', sub: 'OWASP Top 10' },
                    { id: 'quality', label: '📊 Quality', sub: 'MeitY Stack' },
                    { id: 'rai', label: '🧠 RAI Ethics', sub: 'Green Compute' },
                    { id: 'legal', label: '⚖️ Legal', sub: 'DPDP 2023' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => toggleLayer(l.id)}
                      className={`px-3 py-2 rounded-xl text-left font-mono border transition-all cursor-pointer ${
                        activeLayers.includes(l.id)
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/20'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <span className="text-xs font-bold block">{l.label}</span>
                      <span className="text-[9px] text-slate-500 block">{l.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div className="relative flex-1 min-h-[300px] flex flex-col">
                <textarea
                  value={architectureText}
                  onChange={(e) => setArchitectureText(e.target.value)}
                  placeholder="Paste custom architectural data system logs or pipeline descriptions here..."
                  className="w-full flex-1 p-4 bg-[#04060C] border border-slate-800 rounded-xl font-mono text-xs leading-relaxed text-slate-300 focus:outline-none focus:border-emerald-500/40 resize-none placeholder:text-slate-700 transition-all"
                />
                {isAnalyzing && (
                  <div className="absolute bottom-4 right-4 text-[10px] font-mono text-emerald-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xl backdrop-blur">
                    <RefreshCw size={10} className="animate-spin text-cyan-400" /> Computing Matrices...
                  </div>
                )}
              </div>
            </div>

            {/* Right Radar & Compliance Overview (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-slate-800 bg-[#090D18]/80 backdrop-blur-md shadow-xl justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} className="text-emerald-400" /> Dynamic 5-Axis Radar
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Live Geometry</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Calibrated across Model Safety, Data Quality, Responsible AI, Privacy, &amp; Transparency.
                </p>
              </div>

              {/* Radar Chart Component with Ghost Overlay */}
              <div className="w-full h-64 flex items-center justify-center my-auto">
                <InteractiveRadarChart report={report} />
              </div>

              {/* Score Metric Bar */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Health Index</span>
                  <span className="text-2xl font-black text-slate-100">
                    {report ? `${report.score}%` : '--'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    !report
                      ? 'bg-slate-900 border-slate-800 text-slate-500'
                      : report.score > 75
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : report.score > 45
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {!report
                    ? 'Awaiting Context'
                    : report.score > 75
                    ? '🟢 COMPLIANT'
                    : report.score > 45
                    ? '🟡 ELEVATED RISK'
                    : '🔴 CRITICAL ACTION'}
                </span>
              </div>
            </div>
          </div>

          {/* ━━ Lower Bento: Data Lineage Node Graph ━━ */}
          <DataLineageGraph report={report} text={architectureText} />

          {/* ━━ Lower Bento: Threat Scenario & Integration Tabs ━━ */}
          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Threat Matrix Log (5 Cols) */}
              <div className="lg:col-span-5 p-5 rounded-2xl border border-rose-950/70 bg-rose-950/15 backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <AlertCircle size={14} /> Red-Team Adversarial Threat Profile
                  </h4>
                  <div className="whitespace-pre-line text-slate-300 font-mono text-xs leading-relaxed p-3 bg-black/40 border border-slate-900 rounded-xl max-h-[320px] overflow-y-auto">
                    {report.threatModel}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-mono mt-3">
                  Simulated attack scenarios derived from unmitigated architectural keywords.
                </p>
              </div>

              {/* Integration Studio Tabs (7 Cols) */}
              <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-800 bg-[#090D18]/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
                {/* Tabs Bar */}
                <div className="flex border-b border-slate-800 text-xs font-mono mb-3">
                  {[
                    { id: 'jira', label: '🎫 Jira/Linear Mapping' },
                    { id: 'issues', label: `📋 Anomalies (${report.issues.length})` },
                    { id: 'cicd', label: '🚀 CI/CD & Test' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveIntegrationTab(tab.id)}
                      className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 text-[11px] ${
                        activeIntegrationTab === tab.id
                          ? 'border-emerald-400 text-emerald-400 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Body */}
                <div className="max-h-[260px] overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
                  {/* Jira Tab */}
                  {activeIntegrationTab === 'jira' && (
                    <div className="space-y-2.5">
                      {report.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1"
                        >
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-cyan-400 font-bold">[STORY-RAI-{index + 1}]</span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              Priority: {issue.jiraPriority}
                            </span>
                          </div>
                          <p className="text-slate-200 font-bold text-[11px]">
                            Remediate: {issue.pillar}
                          </p>
                          <p className="text-emerald-400 text-[10px]">
                            Criteria: {issue.remediation}
                          </p>
                        </div>
                      ))}
                      {report.issues.length === 0 && (
                        <p className="text-center text-slate-500 py-6 text-xs">Zero backlog items generated.</p>
                      )}
                    </div>
                  )}

                  {/* Issues Tab */}
                  {activeIntegrationTab === 'issues' && (
                    <div className="space-y-2.5">
                      {report.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border ${
                            issue.severity === 'CRITICAL' ? 'border-rose-950/60 bg-rose-950/10' : 'border-amber-950/60 bg-amber-950/10'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-bold text-slate-300">{issue.ruleId} • {issue.layer.toUpperCase()}</span>
                            <span className="text-slate-500">{issue.clause}</span>
                          </div>
                          <p className="text-slate-200 text-[11px] font-sans leading-relaxed">{issue.message}</p>
                          <p className="text-emerald-400 text-[10px] mt-1 pt-1 border-t border-slate-800">
                            Remediation: {issue.remediation}
                          </p>
                        </div>
                      ))}
                      {report.issues.length === 0 && (
                        <div className="p-3 bg-emerald-950/20 text-emerald-300 rounded-xl text-center">
                          All systems compliant.
                        </div>
                      )}
                    </div>
                  )}

                  {/* CI/CD Tab */}
                  {activeIntegrationTab === 'cicd' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>pytest: test_ai_governance.py</span>
                        <button
                          onClick={() => handleCopy(generatePythonTestSuite(report), 'py-test')}
                          className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          {copiedKey === 'py-test' ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                      <pre className="p-2.5 bg-[#030509] border border-slate-800 rounded-lg text-[10px] text-slate-300 overflow-x-auto max-h-[140px]">
                        {generatePythonTestSuite(report)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Export Operations Footer */}
                <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-slate-800 text-xs font-mono">
                  <button
                    onClick={() =>
                      handleDownload(
                        'GOV_AUDIT_REPORT.md',
                        generateMarkdownAuditReport(report, architectureText),
                        'text/markdown'
                      )
                    }
                    className="flex-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 py-2 rounded-lg text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs"
                  >
                    <Download size={13} /> Export Dossier (.md)
                  </button>
                  <button
                    onClick={() =>
                      handleCopy(generateMarkdownAuditReport(report, architectureText), 'md-dossier')
                    }
                    className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all text-xs"
                  >
                    <Copy size={13} /> {copiedKey === 'md-dossier' ? 'Copied!' : 'MD'}
                  </button>
                  <button
                    onClick={() => handleCopy(JSON.stringify(report, null, 2), 'json-report')}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all text-xs"
                  >
                    <FileText size={13} /> {copiedKey === 'json-report' ? 'Copied!' : 'JSON'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
