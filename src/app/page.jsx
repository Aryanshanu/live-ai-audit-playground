'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, FileText, Download, Copy, RefreshCw } from 'lucide-react';
import { runAuditEngine } from '../lib/auditEngine';

export default function AuditPlayground() {
  const [architectureText, setArchitectureText] = useState('');
  const [auditMode, setAuditMode] = useState('dual'); // dual, dpdp, indiaai
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Automatically trigger real-time client-side auditing as the user types
  useEffect(() => {
    if (!architectureText.trim()) {
      setReport(null);
      return;
    }
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const results = runAuditEngine(architectureText, auditMode);
      setReport(results);
      setIsAnalyzing(false);
    }, 300); // 300ms debounce to prevent UI lag during typing
    return () => clearTimeout(timer);
  }, [architectureText, auditMode]);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "gov_audit_report.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-wider text-emerald-400 font-mono">&lt;AI_GOV //&gt;</span>
          <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">India Sandbox v2</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono text-slate-400">
          <a href="https://github.com/Aryanshanu/live-ai-audit-playground" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub Source</a>
          <a href="https://psa.gov.in/psa-prod/publication/PSA-AI-Guidelines-2024.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">PSA Framework Doc</a>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-73px)] divide-y md:divide-y-0 md:divide-x divide-slate-800">
        
        {/* Left Side: Input Space */}
        <div className="p-6 flex flex-col gap-4 bg-[#0D1321]">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-sm font-mono text-slate-400 tracking-wider uppercase flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" /> System Architecture Sandbox
            </h2>
            {/* Mode Selectors */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
              {['dual', 'dpdp', 'indiaai'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAuditMode(mode)}
                  className={`px-3 py-1.5 rounded transition-all capitalize ${auditMode === mode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {mode === 'dual' ? 'Full Framework' : mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Paste your raw technical descriptions, dataset pipelines, retention policies, or model cards anonymously below. Processing happens entirely within volatile local storage parameters.
          </p>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="text-slate-500 text-[11px] self-center">Presets:</span>
            <button
              onClick={() => setArchitectureText("Our system tracks user location parameters continuously to predict regional churn metrics. Vector representations are processed using an embedded black-box model layer and indexed into an optimization database held indefinitely for secondary foundational pre-training scripts. Training datasets are standard web-scraped English-centric repositories.")}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] transition-all"
            >
              ⚠️ High Risk Pipeline
            </button>
            <button
              onClick={() => setArchitectureText("User interaction vectors require explicit consent screen verification before data extraction. Telemetry data includes an auto-delete TTL purge policy clearing logs after 30 days. Model training incorporates Indic languages from AI4Bharat with explainable SHAP telemetry frameworks.")}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] transition-all"
            >
              ✅ Compliant Pipeline
            </button>
          </div>

          <div className="relative flex-1 min-h-[450px] flex flex-col">
            <textarea
              value={architectureText}
              onChange={(e) => setArchitectureText(e.target.value)}
              placeholder="Example: 'Our system tracks user location parameters continuously to predict regional churn metrics. Vector representations are processed using an embedded model layer and indexed into an optimization database held indefinitely for secondary foundational pre-training scripts...'"
              className="w-full flex-1 p-4 bg-[#070A13] border border-slate-800 rounded-xl text-slate-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/20"
            />
            {isAnalyzing && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-md shadow-lg">
                <RefreshCw size={12} className="animate-spin" /> Engine Processing...
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Dashboard Output */}
        <div className="p-6 bg-[#090D16] flex flex-col gap-6">
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl max-w-md mx-auto my-12">
              <Shield size={40} className="text-slate-700 mb-3 animate-pulse" />
              <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wide">Awaiting Context Injection</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Provide architectural text patterns inside the sandbox to compile compliance diagnostics.
              </p>
            </div>
          ) : (
            <>
              {/* Score Module */}
              <div className="border border-slate-800 bg-[#0F172A]/40 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Global Governance Health Index</h3>
                  <p className="text-3xl font-black tracking-tight mt-1 font-mono text-slate-100">
                    {report.score}% <span className="text-xs font-normal text-slate-500">Compliance Rate</span>
                  </p>
                </div>
                {/* Visual Circle Gauge */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                      className={report.score > 75 ? "text-emerald-400" : report.score > 45 ? "text-amber-400" : "text-rose-500"}
                      strokeDasharray={`${report.score}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>

              {/* Issues Summary Log */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[500px]">
                {report.issues.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className={`border p-4 rounded-xl transition-all ${
                      issue.severity === 'CRITICAL' ? 'border-rose-950 bg-rose-950/10' : 'border-amber-950 bg-amber-950/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {issue.severity === 'CRITICAL' ? (
                        <AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={16} />
                      ) : (
                        <AlertTriangle className="text-amber-400 mt-0.5 shrink-0" size={16} />
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                            issue.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{issue.ruleId} • {issue.pillar}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-200">{issue.message}</p>
                        <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 font-sans leading-relaxed">
                          <strong className="text-emerald-400 font-mono">Remediation:</strong> {issue.remediation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {report.issues.length === 0 && (
                  <div className="border border-emerald-950 bg-emerald-950/10 p-5 rounded-xl flex items-center gap-3">
                    <CheckCircle className="text-emerald-400" size={20} />
                    <p className="text-sm text-slate-300">
                      Zero regulatory critical compliance liabilities triggered. Pipeline matches verified criteria.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Operations */}
              <div className="flex gap-3 border-t border-slate-800 pt-4 font-mono text-xs">
                <button 
                  onClick={handleCopy}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 rounded-lg flex items-center justify-center gap-2 text-slate-300 transition-all cursor-pointer"
                >
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy Audit JSON'}
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 py-2.5 rounded-lg flex items-center justify-center gap-2 text-emerald-400 transition-all cursor-pointer"
                >
                  <Download size={14} /> Export Report
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
