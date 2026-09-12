'use client';

import { useState, useCallback } from 'react';
import ComplianceGauge from './ComplianceGauge';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'passed', label: 'Passed' },
];

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };

const STATUS_ICONS = {
  CRITICAL: '🚫',
  HIGH: '⚠️',
  MEDIUM: '⚡',
  pass: '✅',
};

const SEVERITY_STYLES = {
  CRITICAL: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/20 text-red-400',
  },
  HIGH: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  MEDIUM: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    badge: 'bg-yellow-500/20 text-yellow-400',
  },
};

const ERROR_MAP = {
  MODEL_NOT_FOUND: {
    icon: '🔍',
    title: 'Model Not Found',
    desc: 'The specified model ID does not exist on Hugging Face Hub. Double-check for typos in the namespace/model-name format.',
  },
  GATED_MODEL: {
    icon: '🔒',
    title: 'Gated Model — Authorization Required',
    desc: 'This model requires access authorization. Paste your Hugging Face access token in the optional field to bypass this restriction.',
  },
  RATE_LIMITED: {
    icon: '⏱️',
    title: 'Hugging Face API Busy',
    desc: 'API rate limit hit. Paste your HF Token to bypass rate limitations, or wait a few minutes before retrying.',
  },
  NETWORK_ERROR: {
    icon: '📡',
    title: 'Network Error',
    desc: 'Unable to reach the Hugging Face API. Check your internet connection and try again.',
  },
};

/**
 * Right panel — Live compliance report dashboard.
 * Shows gauge, model metadata, filter tabs, and issue logs.
 */
export default function ComplianceReportPanel({
  score,
  results,
  modelMeta,
  loading,
  error,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  // ── Export as JSON ──
  const handleExport = useCallback(() => {
    const report = {
      _generator: 'GOV.AX v1.0.0',
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

  // ── Copy to Clipboard ──
  const handleCopy = useCallback(async () => {
    const report = {
      _generator: 'GOV.AX v1.0.0',
      timestamp: new Date().toISOString(),
      model: modelMeta,
      complianceScore: score,
      results,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(report, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }, [modelMeta, score, results]);

  // ── Filter logic ──
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

  // ━━ Loading State ━━
  if (loading) {
    return (
      <div className="space-y-6 animate-in">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide">
          📊 Compliance Report
        </h2>
        <div className="flex justify-center">
          <div className="w-[200px] h-[200px] rounded-full bg-[#1E293B] skeleton-pulse" />
        </div>
        <p className="text-center text-sm text-emerald-400/80 font-mono animate-pulse">
          Fetching metadata from Hugging Face Hub...
        </p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-[#1E293B] rounded-lg skeleton-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ━━ Error State ━━
  if (error) {
    const info = ERROR_MAP[error] || {
      icon: '❌',
      title: 'Unexpected API Error',
      desc: `An unexpected error occurred: ${error}`,
    };

    return (
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide mb-6">
          📊 Compliance Report
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 border border-red-500/20 rounded-xl bg-red-500/5 max-w-sm neon-glow-red">
            <span className="text-5xl block mb-4">{info.icon}</span>
            <h3 className="text-lg font-bold text-red-400">{info.title}</h3>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              {info.desc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ━━ Empty / Awaiting State ━━
  if (!results) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide mb-6">
          📊 Compliance Report
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center">
          <ComplianceGauge score={null} />
          <p className="text-gray-500 mt-6 text-sm font-mono">
            Submit a model to begin your compliance audit.
          </p>
          <p className="text-gray-700 text-xs mt-2">
            Results will appear here in real-time.
          </p>
        </div>
      </div>
    );
  }

  // ━━ Results View ━━
  const failCount = results.filter((r) => r.status === 'fail').length;
  const passCount = results.filter((r) => r.status === 'pass').length;

  return (
    <div className="space-y-6">
      {/* ── Header + Export ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-100 tracking-wide">
          📊 Compliance Report
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs bg-[#1E293B] hover:bg-gray-700 text-gray-300 rounded-lg transition-all duration-200 hover:text-gray-100"
            title="Copy report to clipboard"
          >
            📋 Copy
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs bg-[#1E293B] hover:bg-gray-700 text-gray-300 rounded-lg transition-all duration-200 hover:text-gray-100"
            title="Download audit-report.json"
          >
            ⬇️ Export
          </button>
        </div>
      </div>

      {/* ── Gauge ── */}
      <ComplianceGauge score={score} />

      {/* ── Model Metadata Card ── */}
      {modelMeta && (
        <div className="p-4 bg-[#0B0F19] border border-[#1E293B] rounded-lg">
          <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3">
            Model Metadata
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <MetaRow label="Model" value={modelMeta.id} />
            <MetaRow label="Pipeline" value={modelMeta.pipelineTag} />
            <MetaRow
              label="Downloads"
              value={modelMeta.downloads?.toLocaleString()}
            />
            <MetaRow label="License" value={modelMeta.license} />
            <MetaRow label="Library" value={modelMeta.libraryName} />
            <MetaRow
              label="Gated"
              value={modelMeta.gated ? 'Yes' : 'No'}
              highlight={modelMeta.gated ? 'amber' : 'emerald'}
            />
          </div>
        </div>
      )}

      {/* ── Summary Counters ── */}
      <div className="flex gap-3">
        <div className="flex-1 text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="text-2xl font-extrabold text-red-400 font-mono">
            {failCount}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
            Issues Found
          </p>
        </div>
        <div className="flex-1 text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">
            {passCount}
          </span>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
            Rules Passed
          </p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-1 p-1 bg-[#0B0F19] rounded-lg border border-[#1E293B]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-200 uppercase tracking-wider ${
              activeFilter === tab.key
                ? 'bg-[#1E293B] text-gray-100 shadow-sm'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Issue Logs ── */}
      <div className="space-y-3">
        {filteredResults.map((result) => {
          const isFail = result.status === 'fail';
          const styles = isFail
            ? SEVERITY_STYLES[result.severity]
            : { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' };

          return (
            <div
              key={result.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${styles.border} ${styles.bg}`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">
                    {isFail
                      ? STATUS_ICONS[result.severity] || '⚠️'
                      : STATUS_ICONS.pass}
                  </span>
                  <span className="font-mono text-xs text-gray-400 font-bold">
                    {result.id}
                  </span>
                  {isFail && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${styles.badge}`}
                    >
                      {result.severity}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 font-mono shrink-0 ml-2">
                  {result.pillar}
                </span>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-300 leading-relaxed">
                {result.message}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {result.regulation}
              </p>

              {/* Remediation */}
              {result.remediation && (
                <div className="mt-3 p-3 bg-[#0B0F19] rounded-md border border-[#1E293B]">
                  <p className="text-xs text-emerald-400 leading-relaxed">
                    <span className="font-bold">💡 Remediation:</span>{' '}
                    {result.remediation}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredResults.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8 font-mono">
            No results match the &quot;{activeFilter}&quot; filter.
          </p>
        )}
      </div>
    </div>
  );
}

/** Small helper for metadata rows */
function MetaRow({ label, value, highlight }) {
  const colorClass = highlight
    ? highlight === 'amber'
      ? 'text-amber-400'
      : 'text-emerald-400'
    : 'text-gray-300';

  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className={`font-mono truncate ${colorClass}`}>{value}</span>
    </div>
  );
}
