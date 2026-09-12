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
  Terminal,
  Sparkles,
  Zap,
  Code2,
  BookmarkCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  runAuditEngine,
  generatePythonTestSuite,
  generateGitHubActionWorkflow,
  generateJiraTicketMapping,
  generateMarkdownAuditReport,
} from '../lib/auditEngine';
import InteractiveRadarChart from '../components/InteractiveRadarChart';

const ARCHITECTURE_TEMPLATES = {
  ragBot:
    'Deploying an E-Commerce RAG Customer Support Chatbot. User input text is passed via raw prompt injection blocks to a text-generation layer without guardrails. The runtime engine tracks user profiles continuously to analyze churn, keeping database logs permanent and metrics stored indefinitely in un-audited buckets. Retraining pipelines ingest newly scraped customer queries automatically every week. English-centric dataset without Indic language filters.',
  fintechLoan:
    'Building a FinTech Loan & Credit Underwriting AI. System implements automated screening filters and opaque credit analysis to evaluate applicant profiles without contestability or human-in-the-loop review. User financial vectors and mobile location telemetry are cross-monetized with third-party insurance partners without opt-out controls. Training pipelines rely on standard web scrape corpuses and unverified legacy files without localized anomaly detection workflows.',
  compliantSovereign:
    'Deploying a Compliant Sovereign Multi-Lingual Pipeline. Input fields utilize strict system instructions encapsulation using NeMo Guardrail frameworks. Customer text data is routed through a decoupled data principal vault backed by a strict 30-day cron purge TTL policy. Natural vernacular tracking runs on 22 scheduled languages with integrated AI4Bharat tokenizers. Infrastructure is anchored in the Mumbai sovereign cloud (ap-south-1) with DVC data lineage verification.',
};

export default function AdvancedAuditPlayground() {
  const [architectureText, setArchitectureText] = useState('');
  const [activeLayers, setActiveLayers] = useState(['security', 'quality', 'legal']);
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
      setIsAnalyzing(false);
    }, 200);
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
    <div className="min-h-screen bg-[#060813] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ━━ Top Navbar ━━ */}
      <header className="border-b border-slate-800/80 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            &lt;GOV.AX //&gt;
          </span>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md font-mono text-emerald-400 tracking-widest uppercase font-bold">
            Next-Gen Realtime Core
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
          <a
            href="https://github.com/Aryanshanu/live-ai-audit-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            GitHub Repository <ExternalLink size={12} />
          </a>
          <a
            href="https://psa.gov.in/psa-prod/publication/PSA-AI-Guidelines-2024.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors hidden sm:inline"
          >
            Framework Specs
          </a>
        </div>
      </header>

      {/* ━━ Main Workspace Split Grid ━━ */}
      <main className="grid grid-cols-1 xl:grid-cols-2 min-h-[calc(100vh-73px)] divide-y xl:divide-y-0 xl:divide-x divide-slate-800/60">
        {/* ── Left Input Sandbox ── */}
        <div className="p-6 flex flex-col gap-5 bg-[#0A0D1A]/40 overflow-y-auto">
          <div>
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" /> Pipeline Architecture Sandbox
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Inject system descriptions. Compliance validation vectors resolve natively inside isolated client threads with zero data persistence.
            </p>
          </div>

          {/* Pre-Formatted Architecture Archetypes */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Pre-Formatted Architecture Archetypes
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setArchitectureText(ARCHITECTURE_TEMPLATES.ragBot)}
                className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-all hover:bg-slate-900 cursor-pointer"
              >
                E-Com RAG Bot
              </button>
              <button
                onClick={() => setArchitectureText(ARCHITECTURE_TEMPLATES.fintechLoan)}
                className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-all hover:bg-slate-900 cursor-pointer"
              >
                FinTech Credit AI
              </button>
              <button
                onClick={() => setArchitectureText(ARCHITECTURE_TEMPLATES.compliantSovereign)}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono transition-all hover:bg-emerald-500/20 cursor-pointer"
              >
                Sovereign Compliant Array
              </button>
            </div>
          </div>

          {/* Active Framework Toggles */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Active Audit Dimensions
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'security', label: '🛡️ Security Layer (OWASP)' },
                { id: 'quality', label: '📊 Quality Stack (MeitY)' },
                { id: 'legal', label: '⚖️ Legal Check (DPDP/FTC)' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggleLayer(l.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    activeLayers.includes(l.id)
                      ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area Input */}
          <div className="relative flex-1 min-h-[380px] flex flex-col">
            <textarea
              value={architectureText}
              onChange={(e) => setArchitectureText(e.target.value)}
              placeholder="Paste custom architectural data system logs or pipeline descriptions here manually..."
              className="w-full flex-1 p-4 bg-[#04060C] border border-slate-800 rounded-xl font-mono text-xs leading-relaxed text-slate-300 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 resize-none transition-all placeholder:text-slate-700"
            />
            {isAnalyzing && (
              <div className="absolute bottom-4 right-4 text-[10px] font-mono text-emerald-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-black/80 backdrop-blur">
                <RefreshCw size={10} className="animate-spin text-cyan-400" /> Computing Vectors...
              </div>
            )}
          </div>
        </div>

        {/* ── Right Interactive Dashboard Output ── */}
        <div className="p-6 bg-[#070915] flex flex-col gap-6 overflow-y-auto">
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-2xl text-center max-w-sm mx-auto my-auto bg-slate-950/20 backdrop-blur-sm">
              <Shield size={36} className="text-slate-800 mb-3 animate-pulse" />
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                System Ready For Context Ingestion
              </h4>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Select an archetype above or inject structural specifications on the terminal workstation console to display reactive real-time telemetry mapping.
              </p>
            </div>
          ) : (
            <>
              {/* ── INTERACTIVE COMPLIANCE RADAR GRAPH MODULE ── */}
              <div className="border border-slate-800 bg-gradient-to-b from-[#0F1326]/60 to-[#0B0D19]/40 backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-1 z-10">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={11} className="text-emerald-400" /> Dynamic Compliance Metric Radar
                  </h4>
                  <p className="text-4xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
                    {report.score}%
                  </p>
                  <span className="text-[10px] font-mono border border-slate-800 px-2 py-0.5 rounded-full text-slate-400 bg-slate-950 inline-block mt-1">
                    {report.score > 75 ? '🟢 HEALTHY COMPLIANCE' : report.score > 45 ? '🟡 ELEVATED RISK' : '🔴 CRITICAL ACTION REQUIRED'}
                  </span>
                </div>

                {/* Scalable Reactive Radar Component */}
                <div className="w-48 h-48 shrink-0 flex items-center justify-center z-10">
                  <InteractiveRadarChart report={report} />
                </div>
              </div>

              {/* ── Adversarial Threat Model Display ── */}
              {report.threatModel && (
                <div className="border border-rose-950/70 bg-rose-950/15 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <Zap size={10} /> {report.threatModel.severity} THREAT SCENARIO
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Adversary: {report.threatModel.adversary}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold font-mono text-slate-200">
                    {report.threatModel.title}
                  </h3>

                  <div className="p-2 bg-black/40 rounded border border-slate-800 text-[11px] font-mono text-rose-300/90">
                    Attack Vector: {report.threatModel.attackVector}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {report.threatModel.narrative}
                  </p>

                  <div className="pt-2 border-t border-rose-900/30 text-[11px] text-slate-400 font-mono">
                    <strong className="text-rose-400">Projected Impact:</strong> {report.threatModel.impact}
                  </div>
                </div>
              )}

              {/* ── Integrated Integration Studio Tabs ── */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0A0D1A]/50">
                <div className="flex border-b border-slate-800 text-xs font-mono bg-slate-950/60">
                  {[
                    { id: 'jira', label: '🎫 Jira/Linear Story Mapping' },
                    { id: 'issues', label: `📋 Tracked Anomalies Log (${report.issues.length})` },
                    { id: 'cicd', label: '🚀 CI/CD & Python Test' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveIntegrationTab(tab.id)}
                      className={`flex-1 py-2.5 px-3 text-center transition-all cursor-pointer border-b-2 text-[11px] ${
                        activeIntegrationTab === tab.id
                          ? 'bg-[#060813] text-emerald-400 font-bold border-b-emerald-400 bg-gradient-to-b from-emerald-500/5 to-transparent'
                          : 'text-slate-500 border-b-transparent hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-4 max-h-[380px] overflow-y-auto space-y-3">
                  {/* Jira / Linear Mapping */}
                  {activeIntegrationTab === 'jira' && (
                    <div className="space-y-3">
                      {report.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg font-mono text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-cyan-400 font-bold">
                              [STORY-GOV-{index + 1}]
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                issue.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              Priority: {issue.jiraPriority || (issue.severity === 'CRITICAL' ? 'Highest' : 'High')}
                            </span>
                          </div>
                          <p className="text-slate-200 font-semibold text-[11px]">
                            Mitigate Compliance Vulnerability: {issue.pillar}
                          </p>
                          <p className="text-slate-400 text-[10px] leading-relaxed">
                            Detected architecture violation rule <span className="text-slate-200">{issue.ruleId}</span> ({issue.clause}).
                          </p>
                          <p className="text-emerald-400 text-[10px] pt-1 border-t border-slate-800">
                            <span className="font-bold">Mandatory engineering criteria:</span> {issue.remediation}
                          </p>
                        </div>
                      ))}

                      {report.issues.length === 0 && (
                        <div className="text-center py-6 text-xs font-mono text-slate-500">
                          Zero items queued for integration tracking. System is compliant.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Issues Log */}
                  {activeIntegrationTab === 'issues' && (
                    <div className="space-y-3">
                      {report.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border font-mono text-xs space-y-1.5 ${
                            issue.severity === 'CRITICAL'
                              ? 'border-rose-950/60 bg-rose-950/10'
                              : 'border-amber-950/60 bg-amber-950/10'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-300">
                              {issue.ruleId} • Layer: {issue.layer}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                issue.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[10px]">{issue.clause}</p>
                          <p className="text-slate-200 text-[11px] font-sans leading-relaxed">{issue.message}</p>
                          <p className="text-emerald-400 text-[10px] pt-1 border-t border-slate-800/80">
                            <span className="font-bold">Fix Matrix:</span> {issue.remediation}
                          </p>
                        </div>
                      ))}

                      {report.issues.length === 0 && (
                        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
                          <CheckCircle size={16} /> All systems pass verified governance criteria.
                        </div>
                      )}
                    </div>
                  )}

                  {/* CI/CD & Python Test Tab */}
                  {activeIntegrationTab === 'cicd' && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-400">Shift-Left Python Test Suite (pytest)</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(generatePythonTestSuite(report), 'py-test')}
                            className="text-emerald-400 hover:text-emerald-300 text-[11px] cursor-pointer"
                          >
                            {copiedKey === 'py-test' ? 'Copied!' : 'Copy Code'}
                          </button>
                          <button
                            onClick={() => handleDownload('test_ai_governance.py', generatePythonTestSuite(report), 'text/x-python')}
                            className="text-cyan-400 hover:text-cyan-300 text-[11px] cursor-pointer"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 bg-[#030509] border border-slate-800 rounded-lg text-[10px] text-slate-300 overflow-x-auto leading-relaxed max-h-[160px]">
                        {generatePythonTestSuite(report)}
                      </pre>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-[11px] text-slate-400">GitHub Actions Workflow</span>
                        <button
                          onClick={() => handleCopy(generateGitHubActionWorkflow(), 'gh-action')}
                          className="text-emerald-400 hover:text-emerald-300 text-[11px] cursor-pointer"
                        >
                          {copiedKey === 'gh-action' ? 'Copied!' : 'Copy YAML'}
                        </button>
                      </div>
                      <pre className="p-3 bg-[#030509] border border-slate-800 rounded-lg text-[10px] text-slate-300 overflow-x-auto leading-relaxed max-h-[140px]">
                        {generateGitHubActionWorkflow()}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Action Operations Footer ── */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                <button
                  onClick={() =>
                    handleDownload(
                      'GOV_AUDIT_REPORT.md',
                      generateMarkdownAuditReport(report, architectureText),
                      'text/markdown'
                    )
                  }
                  className="flex-1 min-w-[140px] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 py-2.5 rounded-lg text-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
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
