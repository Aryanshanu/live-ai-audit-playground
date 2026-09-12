'use client';
import React from 'react';

export default function InteractiveRadarChart({ report }) {
  // 1. Core structural metrics default boundaries mapping coordinates (5-axis radar chart)
  const dimensions = [
    { key: 'security', label: 'MODEL SAFETY', angle: 0 },
    { key: 'quality', label: 'DATA QUALITY', angle: 72 },
    { key: 'rai', label: 'RESPONSIBLE AI', angle: 144 },
    { key: 'legal', label: 'LEGAL PRIVACY', angle: 216 },
    { key: 'transparency', label: 'TRANSPARENCY', angle: 288 }
  ];

  // 2. Parse active structural logs to extract directional matrix vector parameters
  const getMetricValue = (layer) => {
    if (!report || !report.issues) return 100;
    const violationsCount = report.issues.filter(
      (i) => i.layer === layer || (layer === 'transparency' && (i.ruleId.includes('VERNACULAR') || i.ruleId.includes('FTC') || i.ruleId.includes('LINEAGE')))
    ).length;
    return Math.max(20, 100 - (violationsCount * 25));
  };

  const center = 50; 
  const radius = 35;

  // Convert angular tracking positions to geometric vector mapping coordinates
  const getCoordinates = (value, angle) => {
    const radians = ((angle - 90) * Math.PI) / 180; // Shift by -90 to keep the primary node vertical
    const x = center + (radius * (value / 100)) * Math.cos(radians);
    const y = center + (radius * (value / 100)) * Math.sin(radians);
    return { x, y };
  };

  const dataPoints = dimensions.map((d) => {
    const val = getMetricValue(d.key);
    return getCoordinates(val, d.angle);
  });

  const polylinePath = dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  const strokeColor = !report
    ? '#38BDF8'
    : report.score > 75
    ? '#10B981'
    : report.score > 45
    ? '#F59E0B'
    : '#EF4444';

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.15)] overflow-visible">
        {/* Background Concentric Radar Calibration Rings */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />
        <circle cx={center} cy={center} r={radius * 0.66} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />
        <circle cx={center} cy={center} r={radius * 0.33} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />

        {/* Axis Web Vector Boundary Lines */}
        {dimensions.map((d, idx) => {
          const edge = getCoordinates(100, d.angle);
          return (
            <line 
              key={idx} 
              x1={center} y1={center} x2={edge.x} y2={edge.y} 
              stroke="#1E293B" strokeWidth="0.5" 
            />
          );
        })}

        {/* Dynamic Vector Polyline Path Polygon */}
        <polygon
          points={polylinePath}
          fill="url(#radarGradient5)"
          stroke={strokeColor}
          strokeWidth="1.2"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Plot Nodes */}
        {dataPoints.map((p, idx) => (
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
    </div>
  );
}
