'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPreviousAudit } from '../lib/historyStore';

export default function InteractiveRadarChart({ report }) {
  const [prevAudit, setPrevAudit] = useState(null);

  useEffect(() => {
    setPrevAudit(getPreviousAudit());
  }, [report]);

  // 1. Core structural metrics default boundaries mapping coordinates (5-axis radar chart)
  const dimensions = [
    { key: 'security', label: 'MODEL SAFETY', angle: 0 },
    { key: 'quality', label: 'DATA QUALITY', angle: 72 },
    { key: 'rai', label: 'RESPONSIBLE AI', angle: 144 },
    { key: 'legal', label: 'LEGAL PRIVACY', angle: 216 },
    { key: 'transparency', label: 'TRANSPARENCY', angle: 288 },
  ];

  // 2. Parse active structural logs to extract directional matrix vector parameters
  const getMetricValue = (auditObj, layer) => {
    if (!auditObj || !auditObj.issues) return 100;
    const violationsCount = auditObj.issues.filter(
      (i) =>
        i.layer === layer ||
        (layer === 'transparency' &&
          (i.ruleId.includes('VERNACULAR') ||
            i.ruleId.includes('FTC') ||
            i.ruleId.includes('LINEAGE')))
    ).length;
    return Math.max(20, 100 - violationsCount * 25);
  };

  const center = 50;
  const radius = 34;

  // Convert angular tracking positions to geometric vector mapping coordinates
  const getCoordinates = (value, angle) => {
    const radians = ((angle - 90) * Math.PI) / 180; // Shift by -90 to keep the primary node vertical
    const x = center + radius * (value / 100) * Math.cos(radians);
    const y = center + radius * (value / 100) * Math.sin(radians);
    return { x, y };
  };

  // Current audit data points
  const currentDataPoints = dimensions.map((d) => {
    const val = getMetricValue(report, d.key);
    return getCoordinates(val, d.angle);
  });
  const currentPath = currentDataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  // Ghosted previous audit data points
  const prevDataPoints = prevAudit
    ? dimensions.map((d) => {
        const val = getMetricValue(prevAudit, d.key);
        return getCoordinates(val, d.angle);
      })
    : null;
  const prevPath = prevDataPoints
    ? prevDataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
    : null;

  const scoreDelta = prevAudit && report ? report.score - prevAudit.score : null;

  const strokeColor = !report
    ? '#38BDF8'
    : report.score > 75
    ? '#10B981'
    : report.score > 45
    ? '#F59E0B'
    : '#EF4444';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.18)] overflow-visible">
        {/* Background Concentric Radar Calibration Rings */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />
        <circle cx={center} cy={center} r={radius * 0.66} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />
        <circle cx={center} cy={center} r={radius * 0.33} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />

        {/* Axis Web Vector Boundary Lines */}
        {dimensions.map((d, idx) => {
          const edge = getCoordinates(100, d.angle);
          return (
            <line key={idx} x1={center} y1={center} x2={edge.x} y2={edge.y} stroke="#1E293B" strokeWidth="0.5" />
          );
        })}

        {/* ━━ Ghosted Previous Audit Polygon ━━ */}
        {prevPath && (
          <polygon
            points={prevPath}
            fill="none"
            stroke="#475569"
            strokeWidth="0.8"
            strokeDasharray="1.5 1.5"
            className="opacity-50"
          />
        )}

        {/* ━━ Dynamic Current Vector Polyline Polygon ━━ */}
        <polygon
          points={currentPath}
          fill="url(#radarGradient5)"
          stroke={strokeColor}
          strokeWidth="1.2"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Plot Nodes */}
        {currentDataPoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="1.4"
            fill="#06B6D4"
            className="transition-all duration-700 ease-out fill-cyan-400 animate-pulse"
          />
        ))}

        <defs>
          <linearGradient id="radarGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Multi-Axis Labels */}
        {dimensions.map((d, idx) => {
          const textPos = getCoordinates(120, d.angle);
          return (
            <text
              key={idx}
              x={textPos.x}
              y={textPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#64748B"
              fontSize="2.4"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      {/* Ghost Legend & Delta */}
      <div className="flex items-center gap-3 mt-1 text-[9px] font-mono text-slate-500">
        <span className="flex items-center gap-1 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Current Run
        </span>
        {prevAudit && (
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2 h-0.5 border-b border-dashed border-slate-500" /> Prev Ghost
            {scoreDelta !== null && (
              <span className={`font-bold ml-0.5 ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}%)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
