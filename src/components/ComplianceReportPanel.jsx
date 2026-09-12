'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ComplianceGauge from './ComplianceGauge';
import InteractiveRadarChart from './InteractiveRadarChart';
import IssueCard from './IssueCard';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'passed', label: 'Passed' },
];

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };

export default function ComplianceReportPanel({
  score,
  results,
  modelMeta,
  loading,
  error,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const handleExport = useCallback(() => {
    const report = {
      _generator: 'GOV.AX Model Metadata Auditor',
      _evidence: 'VERIFIED_API_METADATA',
      timestamp: new Date().toISOString(),
      model: modelMeta,
      complianceScore: score,
      results,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${modelMeta?.id?.replace('/', '-') || 'unknown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [modelMeta, score, results]);

  const handleCopy = useCallback(async () => {
    const report = {
      _generator: 'GOV.AX Model Metadata Auditor',
      _evidence: 'VERIFIED_API_METADATA',
      timestamp: new Date().toISOString(),
      model: modelMeta,
      complianceScore: score,
      results,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  }, [modelMeta, score, results]);

  const filteredResults = results
    ? results
        .filter((r) => {
          if (activeFilter === 'all') return true;
          if (activeFilter === 'critical')
            return (
              r.status === 'fail' &&
              (r.severity === 'CRITICAL' || r.severity === 'HIGH')
            );
          if (activeFilter === 'warnings')
            return r.status === 'fail' && r.severity === 'MEDIUM';
          if (activeFilter === 'passed') return r.status === 'pass';
          return true;
        })
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'fail' ? -1 : 1;
          return (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
        })
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide">
          📊 Verified Model Card Audit
        </h2>
        <div className="flex justify-center">
          <div className="w-[200px] h-[200px] rounded-full bg-[#1E293B] skeleton-pulse" />
        </div>
        <p className="text-center text-sm text-emerald-400/80 font-mono animate-pulse">
          Querying metadata from Hugging Face Hub...
        </p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#1E293B] rounded-lg skeleton-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide mb-6">
          📊 Verified Model Card Audit
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 border border-red-500/20 rounded-xl bg-red-500/5 max-w-sm neon-glow-red">
            <span className="text-5xl block mb-4">❌</span>
            <h3 className="text-lg font-bold text-red-400">Query Failed</h3>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              {error === 'MODEL_NOT_FOUND'
                ? 'Model not found on Hugging Face Hub. Double-check namespace/model-name.'
                : error === 'GATED_MODEL'
                ? 'Model is gated. Provide a Hugging Face Bearer Token to access metadata.'
                : `Error: ${error}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide mb-6">
          📊 Verified Model Card Audit
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center">
          <ComplianceGauge score={null} />
          <p className="text-gray-500 mt-6 text-sm font-mono">
            Submit a model ID to begin your verified metadata audit.
          </p>
        </div>
      </div>
    );
  }

  const failCount = results.filter((r) => r.status === 'fail').length;
  const passCount = results.filter((r) => r.status === 'pass').length;

  // Adapt this panel's {id, status, layer, ...} shape into the
  // {score, issues: [{ruleId, layer}]} shape InteractiveRadarChart expects
  // — the same radar component now serves both the sandbox heuristic
  // engine and this verified HF-metadata engine.
  const radarReport = {
    score,
    issues: results
      .filter((r) => r.status === 'fail')
      .map((r) => ({ ruleId: r.id, layer: r.layer, severity: r.severity })),
  };

  return (
    <div className="space-y-6">
      {/* Header + Confidence Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-100 tracking-wide">
            📊 Model Card Compliance
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 mt-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            VERIFIED METADATA • Hugging Face Hub REST API
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs bg-[#1E293B] hover:bg-gray-700 text-gray-300 rounded-lg transition-all cursor-pointer"
          >
            📋 Copy
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs bg-[#1E293B] hover:bg-gray-700 text-gray-300 rounded-lg transition-all cursor-pointer"
          >
            ⬇️ Export
          </button>
        </div>
      </div>

      {/* Spring Gauge */}
      <ComplianceGauge score={score} />

      {/* 5-Axis Radar — now shared with the sandbox engine, so verified
          HF-model audits get drift tracking against their own history too */}
      <div className="h-56">
        <InteractiveRadarChart report={radarReport} auditType="verified_hf_api" subjectId={modelMeta?.id} />
      </div>

      {/* Model Metadata Card */}
      {modelMeta && (
        <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 font-mono">
            Verified Model Parameters
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono">
            <div><span className="text-slate-500">ID:</span> <span className="text-slate-200">{modelMeta.id}</span></div>
            <div><span className="text-slate-500">Pipeline:</span> <span className="text-slate-200">{modelMeta.pipelineTag}</span></div>
            <div><span className="text-slate-500">Downloads:</span> <span className="text-slate-200">{modelMeta.downloads?.toLocaleString()}</span></div>
            <div><span className="text-slate-500">License:</span> <span className="text-emerald-400">{modelMeta.license}</span></div>
          </div>
        </div>
      )}

      {/* Summary Counters */}
      <div className="flex gap-3">
        <div className="flex-1 text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="text-2xl font-extrabold text-red-400 font-mono">
            {failCount}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
            Issues Found
          </p>
        </div>
        <div className="flex-1 text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">
            {passCount}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
            Rules Passed
          </p>
        </div>
      </div>

      {/* Filter Tabs with layoutId activeTabPill sliding animation */}
      <div className="flex gap-1 p-1 bg-[#0B0F19] rounded-lg border border-[#1E293B] relative">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors uppercase tracking-wider relative cursor-pointer font-mono ${
                isActive ? 'text-gray-100' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-[#1E293B] rounded-md shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Issue Logs with Staggered Entrance & PopLayout */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredResults.map((result) => (
            <IssueCard key={result.id} result={result} />
          ))}
        </AnimatePresence>

        {filteredResults.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8 font-mono">
            No results match the &quot;{activeFilter}&quot; filter.
          </p>
        )}
      </motion.div>
    </div>
  );
}
