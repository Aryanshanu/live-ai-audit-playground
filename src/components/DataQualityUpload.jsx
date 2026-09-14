'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Database } from 'lucide-react';
import { analyzeCsvQuality } from '../lib/dataQualityAnalyzer';
import { getEvidenceTier } from '../lib/evidenceTiers';

const SEVERITY_STYLE = {
  CRITICAL: 'bg-red-50 border-red-200 text-fb-red',
  HIGH: 'bg-red-50 border-red-200 text-fb-red',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
  LOW: 'bg-fb-bg border-fb-border text-fb-textSecondary',
};

/**
 * Real data-quality check on an actual uploaded CSV sample — entirely
 * client-side (FileReader), nothing leaves the browser. This is the
 * "verified_data" counterpart to the prose-based DATA-* rules elsewhere,
 * so the Quality pillar has at least one check that touches real data.
 */
export default function DataQualityUpload({ onResult }) {
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [parseError, setParseError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const analysis = analyzeCsvQuality(e.target.result);
        setResult(analysis);
        onResult?.(analysis);
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.onerror = () => setParseError('Could not read this file.');
    reader.readAsText(file);
  };

  const tier = getEvidenceTier('verified_data');

  return (
    <div className="p-5 rounded-xl border border-fb-border bg-fb-card shadow-fbCard">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
            <Database size={14} className="text-fb-blue" /> Real Dataset Quality &amp; Fairness Check
          </h3>
          <p className="text-[10px] text-fb-textSecondary mt-0.5">
            Upload a CSV sample — checks run on the actual file, entirely in your browser. If it has a protected-attribute-shaped column (gender, race, age_group, etc.) alongside a label column, this also computes a real disparate-impact ratio, not just data quality stats.
          </p>
        </div>
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${tier.badgeClass}`}>
          {tier.shortLabel} Evidence
        </span>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-fb-border hover:border-fb-blue rounded-lg p-6 text-center cursor-pointer transition-colors bg-fb-bg"
      >
        <UploadCloud size={22} className="mx-auto text-fb-textSecondary mb-1.5" />
        <p className="text-xs text-fb-textSecondary">
          {fileName ? `Loaded: ${fileName}` : 'Click to select a .csv file'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {parseError && (
        <p className="mt-2 text-[11px] text-fb-red">⚠ {parseError}</p>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-fb-textSecondary">
                {result.stats.rowCount} rows × {result.stats.colCount} columns sampled
              </span>
              <span className={`font-bold ${result.score > 75 ? 'text-fb-green' : result.score > 45 ? 'text-amber-600' : 'text-fb-red'}`}>
                Quality Score: {result.score}%
              </span>
            </div>

            {result.issues.length === 0 ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-fb-green text-center">
                No quality issues detected in this sample.
              </div>
            ) : (
              <div className="space-y-2">
                {result.issues.map((issue, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border text-[11px] ${SEVERITY_STYLE[issue.severity]}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold font-mono text-[10px]">{issue.ruleId}</span>
                      <span className="text-[9px] opacity-70">{issue.clause}</span>
                    </div>
                    <p>{issue.message}</p>
                    <p className="mt-1 opacity-80">→ {issue.remediation}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
