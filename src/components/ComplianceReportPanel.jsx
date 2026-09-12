'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ComplianceGauge from './ComplianceGauge';
import InteractiveRadarChart from './InteractiveRadarChart';
import IssueCard from './IssueCard';
import { generatePromptfooConfig } from '../lib/promptfooExport';
import { runLiveInjectionProbe } from '../lib/livePromptProbe';

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
  hfToken,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [probeState, setProbeState] = useState(null); // null | 'running' | {status, detail, rawResponse}

  const handleRunProbe = useCallback(async () => {
    if (!modelMeta?.id) return;
    setProbeState('running');
    const result = await runLiveInjectionProbe(modelMeta.id, hfToken);
    setProbeState(result);
  }, [modelMeta, hfToken]);

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
        <h2 className="text-lg font-bold text-fb-text">
          📊 Verified Model Card Audit
        </h2>
        <div className="flex justify-center">
          <div className="w-[200px] h-[200px] rounded-full bg-gray-100 skeleton-pulse" />
        </div>
        <p className="text-center text-sm text-fb-blue animate-pulse">
          Querying metadata from Hugging Face Hub...
        </p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-lg skeleton-pulse"
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
        <h2 className="text-lg font-bold text-fb-text mb-6">
          📊 Verified Model Card Audit
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 border border-red-200 rounded-xl bg-red-50 max-w-sm">
            <span className="text-5xl block mb-4">❌</span>
            <h3 className="text-lg font-bold text-fb-red">Query Failed</h3>
            <p className="text-sm text-fb-textSecondary mt-3 leading-relaxed">
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
        <h2 className="text-lg font-bold text-fb-text mb-6">
          📊 Verified Model Card Audit
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center">
          <ComplianceGauge score={null} />
          <p className="text-fb-textSecondary mt-6 text-sm">
            Submit a model ID to begin your verified metadata audit.
          </p>
        </div>
      </div>
    );
  }

  const failCount = results.filter((r) => r.status === 'fail').length;
  const passCount = results.filter((r) => r.status === 'pass').length;

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
          <h2 className="text-lg font-bold text-fb-text">
            📊 Model Card Compliance
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 mt-1 rounded-full bg-green-50 text-fb-green border border-green-200 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-fb-green" />
            VERIFIED METADATA • Hugging Face Hub REST API
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs bg-fb-bg hover:bg-gray-200 text-fb-text rounded-lg transition-all cursor-pointer font-medium"
          >
            📋 Copy
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs bg-fb-bg hover:bg-gray-200 text-fb-text rounded-lg transition-all cursor-pointer font-medium"
          >
            ⬇️ Export
          </button>
          {modelMeta?.id && (
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  generatePromptfooConfig({
                    modelId: modelMeta.id,
                    activeLayers: [...new Set(results.filter((r) => r.status === 'fail').map((r) => r.layer))],
                    purpose: `Pre-deployment red-team scan of ${modelMeta.id}, generated from a GOV.AX audit finding ${failCount} issue(s).`,
                  })
                )
              }
              title="Copies a promptfooconfig.yaml targeting this exact model via huggingface:chat — a real target, not a placeholder"
              className="px-3 py-1.5 text-xs bg-fb-blueLight hover:bg-blue-100 text-fb-blue border border-fb-blue/30 rounded-lg transition-all cursor-pointer font-medium"
            >
              🎯 Copy Red-Team Config
            </button>
          )}
        </div>
      </div>

      {/* Spring Gauge */}
      <ComplianceGauge score={score} />

      {/* 5-Axis Radar */}
      <div className="h-56">
        <InteractiveRadarChart report={radarReport} auditType="verified_hf_api" subjectId={modelMeta?.id} />
      </div>

      {/* Model Metadata Card */}
      {modelMeta && (
        <div className="p-4 bg-fb-bg border border-fb-border rounded-lg text-xs">
          <h3 className="text-[10px] font-bold text-fb-textSecondary uppercase tracking-[0.2em] mb-2">
            Verified Model Parameters
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono">
            <div><span className="text-fb-textSecondary">ID:</span> <span className="text-fb-text">{modelMeta.id}</span></div>
            <div><span className="text-fb-textSecondary">Pipeline:</span> <span className="text-fb-text">{modelMeta.pipelineTag}</span></div>
            <div><span className="text-fb-textSecondary">Downloads:</span> <span className="text-fb-text">{modelMeta.downloads?.toLocaleString()}</span></div>
            <div><span className="text-fb-textSecondary">License:</span> <span className="text-fb-blue">{modelMeta.license}</span></div>
          </div>
        </div>
      )}

      {/* Live Prompt-Injection Probe — the one part of this audit that
          actually talks to the model, instead of reading static metadata.
          Uses the user's own free HF inference credits; costs GOV.AX nothing. */}
      {modelMeta?.id && (
        <div className="p-4 bg-white border border-fb-border rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
              🧪 Live Injection Probe
              <span className="text-[9px] font-normal text-fb-textSecondary">(dynamic test, not metadata)</span>
            </h3>
            <button
              onClick={handleRunProbe}
              disabled={probeState === 'running'}
              className="px-3 py-1 text-[11px] bg-fb-blueLight hover:bg-blue-100 text-fb-blue border border-fb-blue/30 rounded-lg cursor-pointer disabled:opacity-50 font-medium"
            >
              {probeState === 'running' ? 'Probing…' : 'Run Free Probe'}
            </button>
          </div>
          <p className="text-[10px] text-fb-textSecondary leading-relaxed mb-2">
            Sends one adversarial prompt directly to this model via your own Hugging Face token (free monthly inference credits — nothing billed to GOV.AX). One probe isn't a full security clearance, just a real, live data point instead of only static metadata.
          </p>
          {probeState && probeState !== 'running' && (
            <div
              className={`p-2.5 rounded-lg text-[11px] border ${
                probeState.status === 'fail'
                  ? 'bg-red-50 border-red-200 text-fb-red'
                  : probeState.status === 'pass'
                  ? 'bg-green-50 border-green-200 text-fb-green'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span className="font-bold uppercase">
                {probeState.status === 'fail' ? '🚫 Injection Succeeded' : probeState.status === 'pass' ? '✅ Resisted' : '⚠ Could Not Run'}
              </span>
              <p className="mt-1">{probeState.detail}</p>
            </div>
          )}
        </div>
      )}

      {/* Summary Counters */}
      <div className="flex gap-3">
        <div className="flex-1 text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-2xl font-extrabold text-fb-red">
            {failCount}
          </span>
          <p className="text-[10px] text-fb-textSecondary mt-1 uppercase tracking-wider font-medium">
            Issues Found
          </p>
        </div>
        <div className="flex-1 text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-2xl font-extrabold text-fb-green">
            {passCount}
          </span>
          <p className="text-[10px] text-fb-textSecondary mt-1 uppercase tracking-wider font-medium">
            Rules Passed
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-fb-bg rounded-lg border border-fb-border relative">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors uppercase tracking-wider relative cursor-pointer ${
                isActive ? 'text-fb-blue' : 'text-fb-textSecondary hover:text-fb-text'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-md shadow-fbCard"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Issue Logs */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredResults.map((result) => (
            <IssueCard key={result.id} result={result} />
          ))}
        </AnimatePresence>

        {filteredResults.length === 0 && (
          <p className="text-center text-fb-textSecondary text-sm py-8">
            No results match the &quot;{activeFilter}&quot; filter.
          </p>
        )}
      </motion.div>
    </div>
  );
}
