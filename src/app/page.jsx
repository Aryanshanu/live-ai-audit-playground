'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Copy,
  RefreshCw,
  Globe2,
  Terminal,
  Layers,
  Cpu,
  Database,
  Scale,
  Code2,
  BookmarkCheck,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  runUnifiedAuditEngine,
  ARCHITECTURE_TEMPLATES,
  generatePythonTestSuite,
  generateGitHubActionWorkflow,
  generateJiraTicketMapping,
  generateMarkdownAuditReport,
} from '../lib/auditEngine';

export default function UnifiedGovernanceAuditor() {
  const [architectureText, setArchitectureText] = useState('');
  const [activeLayers, setActiveLayers] = useState(['security', 'quality', 'legal']);
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'threat' | 'integration'
  const [integrationMode, setIntegrationMode] = useState('github'); // 'github' | 'python' | 'jira'

  // Run audit engine on text / layer change
  useEffect(() => {
    if (!architectureText.trim()) {
      setReport(null);
      return;
    }
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const results = runUnifiedAuditEngine(architectureText, activeLayers);
      setReport(results);
      setIsAnalyzing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [architectureText, activeLayers]);

  // Set preset architecture template
  const applyTemplate = (template) => {
    setArchitectureText(template.text);
  };

  // Toggle active layer
  const toggleLayer = (layerKey) => {
    if (activeLayers.includes(layerKey)) {
      if (activeLayers.length > 1) {
        setActiveLayers(activeLayers.filter((l) => l !== layerKey));
      }
    } else {
      setActiveLayers([...activeLayers, layerKey]);
    }
  };

  // Copy helper
  const handleCopy = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Download helper
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
    <div className="min-h-screen bg-[#070A12] text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* ━━ Top Command Header ━━ */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-sm">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-emerald-400 font-mono">
                &lt;CORE_GOV //&gt;
              </span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Enterprise v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Unified AI Governance Platform: Security (OWASP) + Data Quality (IndiaAI) + DPDP Act
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="hidden md:flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-900/60 px-2.5 py-1 rounded-full text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Zero Data Retention Vault
          </span>
          <a
            href="https://github.com/Aryanshanu/live-ai-audit-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            GitHub Source
          </a>
        </div>
      </header>

      {/* ━━ Template Selector Bar ━━ */}
      <section className="bg-[#0A0E1A] border-b border-slate-800/80 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
            <BookmarkCheck size={14} className="text-emerald-400" /> Presets:
          </span>
          {ARCHITECTURE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => applyTemplate(tmpl)}
              className="text-[11px] font-mono whitespace-nowrap px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{tmpl.badge}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ━━ Main Workspace ━━ */}
      <main className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-125px)] divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
        {/* ── Left Sandbox Panel (Columns 1-6) ── */}
        <div className="lg:col-span-6 p-6 flex flex-col gap-4 bg-[#090D18]">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" /> System Architecture Sandbox
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {architectureText.length} chars
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste your raw technical descriptions, dataset pipelines, or system prompts. The engine will evaluate them against all 3 codependent governance layers.
            </p>
          </div>

          {/* 3 Codependent Layer Filter Toggles */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
              Active Governance Lenses
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => toggleLayer('security')}
                className={`px-3 py-2 rounded-lg font-mono text-xs border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  activeLayers.includes('security')
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Cpu size={14} className="shrink-0 text-rose-400" />
                <div className="truncate">
                  <span className="block font-bold">1. AI Security</span>
                  <span className="text-[10px] text-slate-400">OWASP Top 10</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('quality')}
                className={`px-3 py-2 rounded-lg font-mono text-xs border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  activeLayers.includes('quality')
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Database size={14} className="shrink-0 text-amber-400" />
                <div className="truncate">
                  <span className="block font-bold">2. Data Quality</span>
                  <span className="text-[10px] text-slate-400">MeitY IndiaAI</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('legal')}
                className={`px-3 py-2 rounded-lg font-mono text-xs border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  activeLayers.includes('legal')
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Scale size={14} className="shrink-0 text-emerald-400" />
                <div className="truncate">
                  <span className="block font-bold">3. Compliance</span>
                  <span className="text-[10px] text-slate-400">DPDP Act 2023</span>
                </div>
              </button>
            </div>
          </div>

          {/* Textarea Input */}
          <div className="relative flex-1 min-h-[460px] flex flex-col">
            <textarea
              value={architectureText}
              onChange={(e) => setArchitectureText(e.target.value)}
              placeholder="Paste raw architecture docs, system prompts, or data pipeline descriptions here... Or select one of the presets above to start immediately."
              className="w-full flex-1 p-4 bg-[#05070D] border border-slate-800/90 rounded-xl text-slate-200 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/20"
            />
            {isAnalyzing && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded-md shadow-xl backdrop-blur">
                <RefreshCw size={12} className="animate-spin" /> Cross-Layer Analysis...
              </div>
            )}
          </div>
        </div>

        {/* ── Right Output Dashboard (Columns 7-12) ── */}
        <div className="lg:col-span-6 p-6 bg-[#060810] flex flex-col gap-5">
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800/80 rounded-xl max-w-sm mx-auto my-16">
              <Globe2 size={44} className="text-slate-800 mb-3 animate-pulse" />
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Awaiting Architectural Context
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Click any preset above or paste your system specs to generate instant multi-layer compliance telemetry.
              </p>
            </div>
          ) : (
            <>
              {/* ── Metric Cards Grid ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Global Score */}
                <div className="border border-slate-800 bg-[#0C101D] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Global Index</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span
                      className={`text-2xl font-black font-mono ${
                        report.score > 75
                          ? 'text-emerald-400'
                          : report.score > 45
                          ? 'text-amber-400'
                          : 'text-rose-500'
                      }`}
                    >
                      {report.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        report.score > 75
                          ? 'bg-emerald-400'
                          : report.score > 45
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                </div>

                {/* AI Security */}
                <div className="border border-slate-800 bg-[#0C101D] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Cpu size={12} className="text-rose-400" /> AI Security
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-200 mt-2">
                    {report.layerScores.security}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">OWASP LLM</span>
                </div>

                {/* Data Quality */}
                <div className="border border-slate-800 bg-[#0C101D] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Database size={12} className="text-amber-400" /> Data Quality
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-200 mt-2">
                    {report.layerScores.quality}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">IndiaAI Stack</span>
                </div>

                {/* DPDP Legal */}
                <div className="border border-slate-800 bg-[#0C101D] p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Scale size={12} className="text-emerald-400" /> Compliance
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-200 mt-2">
                    {report.layerScores.legal}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">DPDP 2023</span>
                </div>
              </div>

              {/* ── Sub-navigation Tabs ── */}
              <div className="flex border-b border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`pb-2 px-3 border-b-2 font-bold transition-all cursor-pointer ${
                    activeTab === 'issues'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Identified Gaps ({report.issues.length})
                </button>
                <button
                  onClick={() => setActiveTab('threat')}
                  className={`pb-2 px-3 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'threat'
                      ? 'border-rose-400 text-rose-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap size={12} /> Threat Modeling
                </button>
                <button
                  onClick={() => setActiveTab('integration')}
                  className={`pb-2 px-3 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'integration'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 size={12} /> CI/CD &amp; Shift-Left
                </button>
              </div>

              {/* ━━ Tab 1: Issues Feed ━━ */}
              {activeTab === 'issues' && (
                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[460px] pr-1">
                  {report.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`border p-4 rounded-xl transition-all ${
                        issue.severity === 'CRITICAL'
                          ? 'border-rose-950/70 bg-rose-950/10'
                          : 'border-amber-950/70 bg-amber-950/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={
                            issue.severity === 'CRITICAL'
                              ? 'text-rose-500 mt-0.5 shrink-0'
                              : 'text-amber-400 mt-0.5 shrink-0'
                          }
                          size={16}
                        />
                        <div className="space-y-1.5 w-full">
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                                  issue.severity === 'CRITICAL'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                }`}
                              >
                                {issue.severity}
                              </span>
                              <span className="text-[11px] font-mono text-slate-300 font-bold">
                                {issue.ruleId}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {issue.pillar}
                            </span>
                          </div>

                          <p className="text-xs font-mono text-emerald-400/90">
                            Clause: {issue.clause}
                          </p>

                          <p className="text-sm text-slate-200 leading-relaxed font-sans">
                            {issue.message}
                          </p>

                          <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 leading-relaxed">
                            <span className="text-emerald-400 font-mono font-bold">Remediation:</span>{' '}
                            {issue.remediation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {report.issues.length === 0 && (
                    <div className="border border-emerald-950 bg-emerald-950/10 p-6 rounded-xl flex items-center gap-3">
                      <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          Zero Regulatory Gaps Detected
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Pipeline matches verified criteria under OWASP LLM Top 10, MeitY IndiaAI Inclusivity benchmarks, and the DPDP Act 2023.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ━━ Tab 2: Threat Modeling Scenario ━━ */}
              {activeTab === 'threat' && (
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[460px] pr-1">
                  <div className="border border-rose-950/80 bg-rose-950/15 p-5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {report.threatScenario.severity} THREAT SCENARIO
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Adversary: {report.threatScenario.adversary}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">
                      {report.threatScenario.title}
                    </h3>

                    <div className="p-2.5 bg-black/40 rounded border border-slate-800 text-xs font-mono text-rose-300/90">
                      Attack Vector: {report.threatScenario.attackVector}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {report.threatScenario.narrative}
                    </p>

                    <div className="pt-2 border-t border-rose-900/40 text-xs text-slate-400">
                      <strong className="text-rose-400 font-mono">Impact Projection:</strong>{' '}
                      {report.threatScenario.impact}
                    </div>
                  </div>
                </div>
              )}

              {/* ━━ Tab 3: CI/CD & Integration Studio ━━ */}
              {activeTab === 'integration' && (
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[460px] pr-1">
                  {/* Mode Selector */}
                  <div className="flex gap-2 text-xs font-mono">
                    <button
                      onClick={() => setIntegrationMode('github')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        integrationMode === 'github'
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      GitHub Action CI/CD
                    </button>
                    <button
                      onClick={() => setIntegrationMode('python')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        integrationMode === 'python'
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Python Test Suite
                    </button>
                    <button
                      onClick={() => setIntegrationMode('jira')}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        integrationMode === 'jira'
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Jira / Linear Mapping
                    </button>
                  </div>

                  {/* Integration Content Area */}
                  {integrationMode === 'github' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                        <span>.github/workflows/ai-governance-audit.yml</span>
                        <button
                          onClick={() => handleCopy(generateGitHubActionWorkflow(), 'gh-action')}
                          className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          {copiedKey === 'gh-action' ? 'Copied!' : 'Copy YAML'}
                        </button>
                      </div>
                      <pre className="p-3 bg-[#030509] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                        {generateGitHubActionWorkflow()}
                      </pre>
                    </div>
                  )}

                  {integrationMode === 'python' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                        <span>test_ai_governance.py (pytest)</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(generatePythonTestSuite(report), 'py-test')}
                            className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
                          >
                            {copiedKey === 'py-test' ? 'Copied!' : 'Copy Code'}
                          </button>
                          <button
                            onClick={() =>
                              handleDownload('test_ai_governance.py', generatePythonTestSuite(report), 'text/x-python')
                            }
                            className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 bg-[#030509] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                        {generatePythonTestSuite(report)}
                      </pre>
                    </div>
                  )}

                  {integrationMode === 'jira' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                        <span>Jira Issue Tickets Payload ({report.issues.length} Tickets)</span>
                        <button
                          onClick={() =>
                            handleCopy(JSON.stringify(generateJiraTicketMapping(report.issues), null, 2), 'jira-json')
                          }
                          className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          {copiedKey === 'jira-json' ? 'Copied!' : 'Copy JSON'}
                        </button>
                      </div>
                      <pre className="p-3 bg-[#030509] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                        {JSON.stringify(generateJiraTicketMapping(report.issues), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* ── Action Operations Footer ── */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                <button
                  onClick={() =>
                    handleDownload(
                      'GOV_AUDIT_REPORT.md',
                      generateMarkdownAuditReport(report, architectureText),
                      'text/markdown'
                    )
                  }
                  className="flex-1 min-w-[130px] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 py-2.5 rounded-lg text-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download size={13} /> Export Dossier (.md)
                </button>
                <button
                  onClick={() =>
                    handleCopy(generateMarkdownAuditReport(report, architectureText), 'md-dossier')
                  }
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Copy size={13} /> {copiedKey === 'md-dossier' ? 'Copied!' : 'Copy MD'}
                </button>
                <button
                  onClick={() => handleCopy(JSON.stringify(report, null, 2), 'json-report')}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileText size={13} /> {copiedKey === 'json-report' ? 'Copied!' : 'JSON'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
