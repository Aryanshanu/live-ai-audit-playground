'use client';

import { useState } from 'react';
import { AlertCircle, Download, Copy, FileText } from 'lucide-react';
import { generatePythonTestSuite, generateMarkdownAuditReport } from '../lib/auditEngine';
import { generatePromptfooConfig, generatePromptfooWorkflow } from '../lib/promptfooExport';
import SemanticAuditPanel from './SemanticAuditPanel';
import BrowserClassifierPanel from './BrowserClassifierPanel';

const TABS = [
  { id: 'jira', label: '🎫 Jira/Linear Mapping' },
  { id: 'cicd', label: '🚀 CI/CD & Test' },
  { id: 'redteam', label: '🎯 Red-Team Config' },
  { id: 'onchain', label: '⚡ On-Device Classifier' },
  { id: 'semantic', label: '🧠 AI Semantic Audit' },
];

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
      <div className="lg:col-span-5 p-5 rounded-xl border border-red-200 bg-red-50 shadow-fbCard flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-fb-red uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <AlertCircle size={14} /> Red-Team Adversarial Threat Profile
          </h4>
          <div className="whitespace-pre-line text-fb-text font-mono text-xs leading-relaxed p-3 bg-white border border-fb-border rounded-xl max-h-[320px] overflow-y-auto">
            {report.threatModel}
          </div>
        </div>

        <p className="text-[10px] text-fb-textSecondary mt-3">
          Simulated attack scenarios derived from unmitigated architectural keywords.
        </p>
      </div>

      {/* Integration Studio Tabs (7 Cols) */}
      <div className="lg:col-span-7 p-5 rounded-xl border border-fb-border bg-white shadow-fbCard flex flex-col justify-between">
        {/* Tabs Bar */}
        <div className="flex border-b border-fb-border text-xs mb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-b-2 text-[11px] ${
                activeTab === tab.id
                  ? 'border-fb-blue text-fb-blue font-bold'
                  : 'border-transparent text-fb-textSecondary hover:text-fb-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="max-h-[260px] overflow-y-auto space-y-2.5 pr-1 text-xs">
          {activeTab === 'jira' && (
            <div className="space-y-2.5">
              {report.issues.map((issue, index) => (
                <div key={index} className="p-3 bg-fb-bg border border-fb-border rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-fb-blue font-bold font-mono">[STORY-RAI-{index + 1}]</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        issue.severity === 'CRITICAL' ? 'bg-red-100 text-fb-red' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Priority: {issue.jiraPriority}
                    </span>
                  </div>
                  <p className="text-fb-text font-bold text-[11px]">Remediate: {issue.pillar}</p>
                  <p className="text-fb-blue text-[10px]">Criteria: {issue.remediation}</p>
                </div>
              ))}
              {report.issues.length === 0 && (
                <p className="text-center text-fb-textSecondary py-6 text-xs">Zero backlog items generated.</p>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-2.5">
              {report.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    issue.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <span className="font-bold text-fb-text font-mono">{issue.ruleId} • {issue.layer.toUpperCase()}</span>
                    <span className="text-fb-textSecondary">{issue.clause}</span>
                  </div>
                  <p className="text-fb-text text-[11px] leading-relaxed">{issue.message}</p>
                  <p className="text-fb-blue text-[10px] mt-1 pt-1 border-t border-fb-border">
                    Remediation: {issue.remediation}
                  </p>
                </div>
              ))}
              {report.issues.length === 0 && (
                <div className="p-3 bg-green-50 text-fb-green rounded-xl text-center">
                  All systems compliant.
                </div>
              )}
            </div>
          )}

          {activeTab === 'cicd' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-fb-textSecondary">
                <span>pytest: test_ai_governance.py</span>
                <button
                  onClick={() => onCopy(generatePythonTestSuite(report), 'py-test')}
                  className="text-fb-blue hover:underline cursor-pointer font-medium"
                >
                  {copiedKey === 'py-test' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-2.5 bg-[#F6F8FA] border border-fb-border rounded-lg text-[10px] text-fb-text font-mono overflow-x-auto max-h-[140px]">
                {generatePythonTestSuite(report)}
              </pre>
            </div>
          )}

          {activeTab === 'redteam' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 leading-relaxed">
                ⚠ This is free text, not a live model — the target below is a placeholder. Real dynamic red-teaming needs an actual deployed model or API; use the HF Model Scanner mode for a config with a real target auto-filled.
              </div>
              <div className="flex justify-between items-center text-[10px] text-fb-textSecondary">
                <span>promptfooconfig.yaml</span>
                <button
                  onClick={() =>
                    onCopy(
                      generatePromptfooConfig({ activeLayers: [...new Set(report.issues.map((i) => i.layer))] }),
                      'promptfoo-config'
                    )
                  }
                  className="text-fb-blue hover:underline cursor-pointer font-medium"
                >
                  {copiedKey === 'promptfoo-config' ? 'Copied!' : 'Copy Config'}
                </button>
              </div>
              <pre className="p-2.5 bg-[#F6F8FA] border border-fb-border rounded-lg text-[10px] text-fb-text font-mono overflow-x-auto max-h-[140px]">
                {generatePromptfooConfig({ activeLayers: [...new Set(report.issues.map((i) => i.layer))] })}
              </pre>
              <div className="flex justify-between items-center text-[10px] text-fb-textSecondary">
                <span>.github/workflows/redteam.yml</span>
                <button
                  onClick={() => onCopy(generatePromptfooWorkflow(), 'promptfoo-workflow')}
                  className="text-fb-blue hover:underline cursor-pointer font-medium"
                >
                  {copiedKey === 'promptfoo-workflow' ? 'Copied!' : 'Copy Workflow'}
                </button>
              </div>
              <pre className="p-2.5 bg-[#F6F8FA] border border-fb-border rounded-lg text-[10px] text-fb-text font-mono overflow-x-auto max-h-[100px]">
                {generatePromptfooWorkflow()}
              </pre>
            </div>
          )}

          {activeTab === 'onchain' && (
            <BrowserClassifierPanel text={architectureText} />
          )}

          {activeTab === 'semantic' && (
            <SemanticAuditPanel description={architectureText} />
          )}
        </div>

        {/* Export Operations Footer */}
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-fb-border text-xs">
          <button
            onClick={() =>
              onDownload('GOV_AUDIT_REPORT.md', generateMarkdownAuditReport(report, architectureText), 'text/markdown')
            }
            className="flex-1 bg-fb-blue hover:bg-fb-blueHover py-2 rounded-lg text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs font-medium"
          >
            <Download size={13} /> Export Dossier (.md)
          </button>
          <button
            onClick={() => onCopy(generateMarkdownAuditReport(report, architectureText), 'md-dossier')}
            className="px-3 py-2 bg-fb-bg border border-fb-border hover:border-fb-blue rounded-lg text-fb-text flex items-center justify-center gap-1 cursor-pointer transition-all text-xs font-medium"
          >
            <Copy size={13} /> {copiedKey === 'md-dossier' ? 'Copied!' : 'MD'}
          </button>
          <button
            onClick={() => onCopy(JSON.stringify(report, null, 2), 'json-report')}
            className="px-3 py-2 bg-fb-bg border border-fb-border hover:border-fb-blue rounded-lg text-fb-text flex items-center justify-center gap-1 cursor-pointer transition-all text-xs font-medium"
          >
            <FileText size={13} /> {copiedKey === 'json-report' ? 'Copied!' : 'JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
