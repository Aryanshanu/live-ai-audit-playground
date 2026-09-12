'use client';

import { useState } from 'react';
import { AlertCircle, Download, Copy, FileText } from 'lucide-react';
import { generatePythonTestSuite, generateMarkdownAuditReport } from '../lib/auditEngine';

const TABS = [
  { id: 'jira', label: '🎫 Jira/Linear Mapping' },
  { id: 'cicd', label: '🚀 CI/CD & Test' },
];

/**
 * Lower bento pair for the sandbox mode: the red-team threat narrative log
 * (left) plus a tabbed "integration studio" for exporting the report as
 * Jira-style tickets, a raw issue list, or a generated pytest suite (right).
 * Extracted from page.jsx — was previously ~155 inline lines, the single
 * largest contiguous chunk in that file.
 */
export default function IntegrationStudioPanel({ report, architectureText, copiedKey, onCopy, onDownload }) {
  const [activeTab, setActiveTab] = useState('jira');

  if (!report) return null;

  const tabs = [
    ...TABS.slice(0, 1),
    { id: 'issues', label: `📋 Anomalies (${report.issues.length})` },
    ...TABS.slice(1),
  ];

  return (
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 text-[11px] ${
                activeTab === tab.id
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
          {activeTab === 'jira' && (
            <div className="space-y-2.5">
              {report.issues.map((issue, index) => (
                <div key={index} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
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
                  <p className="text-slate-200 font-bold text-[11px]">Remediate: {issue.pillar}</p>
                  <p className="text-emerald-400 text-[10px]">Criteria: {issue.remediation}</p>
                </div>
              ))}
              {report.issues.length === 0 && (
                <p className="text-center text-slate-500 py-6 text-xs">Zero backlog items generated.</p>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
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

          {activeTab === 'cicd' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>pytest: test_ai_governance.py</span>
                <button
                  onClick={() => onCopy(generatePythonTestSuite(report), 'py-test')}
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
              onDownload('GOV_AUDIT_REPORT.md', generateMarkdownAuditReport(report, architectureText), 'text/markdown')
            }
            className="flex-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 py-2 rounded-lg text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs"
          >
            <Download size={13} /> Export Dossier (.md)
          </button>
          <button
            onClick={() => onCopy(generateMarkdownAuditReport(report, architectureText), 'md-dossier')}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all text-xs"
          >
            <Copy size={13} /> {copiedKey === 'md-dossier' ? 'Copied!' : 'MD'}
          </button>
          <button
            onClick={() => onCopy(JSON.stringify(report, null, 2), 'json-report')}
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all text-xs"
          >
            <FileText size={13} /> {copiedKey === 'json-report' ? 'Copied!' : 'JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
