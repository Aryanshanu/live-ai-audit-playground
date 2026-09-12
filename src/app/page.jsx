'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, FileText, Download, Copy, RefreshCw, Globe2 } from 'lucide-react';
import { runAuditEngine } from '../lib/auditEngine';

export default function GlobalAuditPlayground() {
  const [architectureText, setArchitectureText] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState(['us', 'india']); // Default focused on US Business Expansion
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleMarket = (marketId) => {
    if (selectedMarkets.includes(marketId)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter((m) => m !== marketId));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, marketId]);
    }
  };

  useEffect(() => {
    if (!architectureText.trim()) {
      setReport(null);
      return;
    }
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const results = runAuditEngine(architectureText, selectedMarkets);
      setReport(results);
      setIsAnalyzing(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [architectureText, selectedMarkets]);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!report) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'global_compliance_report.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-wider text-emerald-400 font-mono">
            &lt;CORE_GOV //&gt;
          </span>
          <span className="text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
            US Enterprise Grade
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono text-slate-400">
          <a
            href="https://github.com/Aryanshanu/live-ai-audit-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            GitHub Source
          </a>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-73px)] divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Left Input Sandbox */}
        <div className="p-6 flex flex-col gap-5 bg-[#0D1321]">
          <div>
            <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" /> Enterprise Deployment Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Inject your architectural prompts, structural dependencies, or data processing configurations. Scanned client-side locally with zero data retention.
            </p>
          </div>

          {/* Market Selectors */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-widest text-slate-500 block">
              Target Enterprise Markets
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'us', label: '🇺🇸 US Market (FTC & Bill of Rights)' },
                { id: 'india', label: '🇮🇳 India Hub (DPDP Act)' },
                { id: 'uk', label: '🇬🇧 United Kingdom Framework' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMarket(m.id)}
                  className={`px-3 py-2 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                    selectedMarkets.includes(m.id)
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="text-slate-500 text-[11px] self-center">Presets:</span>
            <button
              onClick={() =>
                setArchitectureText(
                  "Our model architecture uses unverified training data scraped directly from community platforms. We cross-monetize profile layers and use automated credit analysis filters to score applicants continuously, keeping data records held indefinitely without purge policies."
                )
              }
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] transition-all cursor-pointer"
            >
              ⚠️ US Corporate Violation
            </button>
            <button
              onClick={() =>
                setArchitectureText(
                  "Architecture utilizes licensed data with strict data lineage verification. System incorporates a transparent bias audit and disparate impact mitigation report. California opt-out architecture honors Global Privacy Control (GPC) signals. Storage adheres to automated TTL purge policies within 30 days."
                )
              }
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] transition-all cursor-pointer"
            >
              ✅ Enterprise Compliant
            </button>
          </div>

          {/* Text Area */}
          <div className="relative flex-1 min-h-[400px] flex flex-col">
            <textarea
              value={architectureText}
              onChange={(e) => setArchitectureText(e.target.value)}
              placeholder="Example (US Corporate Violation): 'Our model architecture uses unverified training data scraped directly from community platforms. We cross-monetize profile layers and use automated credit analysis filters to score applicants continuously, keeping data records held indefinitely...'"
              className="w-full flex-1 p-4 bg-[#070A13] border border-slate-800 rounded-xl text-slate-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-slate-600"
            />
            {isAnalyzing && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md shadow-lg">
                <RefreshCw size={12} className="animate-spin" /> Analyzing Targets...
              </div>
            )}
          </div>
        </div>

        {/* Right Output Dashboard */}
        <div className="p-6 bg-[#090D16] flex flex-col gap-6">
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl max-w-sm mx-auto my-12">
              <Globe2 size={40} className="text-slate-800 mb-2 animate-pulse" />
              <h3 className="text-xs font-mono text-slate-400 uppercase">System Ready</h3>
              <p className="text-xs text-slate-600 mt-1">
                Paste pipeline summaries to compile live cross-border risk maps.
              </p>
            </div>
          ) : (
            <>
              {/* Score Module */}
              <div className="border border-slate-800 bg-[#0F172A]/40 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    Global Compliance Rating
                  </h3>
                  <p className="text-3xl font-black mt-1 font-mono text-slate-100">
                    {report.score}%
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        report.score > 70
                          ? 'text-emerald-400'
                          : report.score > 40
                          ? 'text-amber-400'
                          : 'text-rose-500'
                      }
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

              {/* Warnings / Issues Display */}
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px]">
                {report.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`border p-4 rounded-xl ${
                      issue.severity === 'CRITICAL'
                        ? 'border-rose-950/80 bg-rose-950/10'
                        : 'border-amber-950/80 bg-amber-950/10'
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
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-slate-900 border-slate-800 text-slate-300">
                            {issue.ruleId}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            {issue.pillar}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 font-medium">{issue.message}</p>
                        <p className="text-xs text-slate-400 pt-1.5 border-t border-slate-800/80">
                          <span className="text-emerald-400 font-mono font-bold">Fix Matrix:</span>{' '}
                          {issue.remediation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {report.issues.length === 0 && (
                  <div className="border border-emerald-950 bg-emerald-950/10 p-5 rounded-xl flex items-center gap-3">
                    <CheckCircle className="text-emerald-400" size={18} />
                    <p className="text-xs text-slate-300 font-mono">
                      All active systems pass target geographic regulations cleanly.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2 font-mono text-xs">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 rounded-lg text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 py-2.5 rounded-lg text-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download size={12} /> Export Document
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
