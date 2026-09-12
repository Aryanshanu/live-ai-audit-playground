'use client';
import React from 'react';

export default function InteractiveRadarChart({ report }) {
  // 1. Core structural metrics default boundaries mapping coordinates
  const dimensions = [
    { key: 'security', label: 'Model Safety', angle: 0 },
    { key: 'quality', label: 'Data Quality', angle: 90 },
    { key: 'legal', label: 'Data Privacy', angle: 180 },
    { key: 'transparency', label: 'Transparency', angle: 270 }
  ];

  // 2. Parse active structural logs to extract directional matrix vector parameters
  const getMetricValue = (layer) => {
    if (!report || !report.issues) return 100;
    // Count active risk objects inside specific tracking arrays
    const violationsCount = report.issues.filter(
      (i) => i.layer === layer || (layer === 'transparency' && (i.ruleId.includes('LINEAGE') || i.ruleId.includes('FTC') || i.pillar.includes('Transparency')))
    ).length;
    return Math.max(20, 100 - (violationsCount * 25));
  };

  const center = 50; // SVG space coordinate relative center percentage mapping marker
  const radius = 38;

  // Convert angular tracking positions to geometric vector mapping coordinate arrays
  const getCoordinates = (value, angle) => {
    const radians = (angle * Math.PI) / 180;
    const x = center + (radius * (value / 100)) * Math.cos(radians);
    const y = center + (radius * (value / 100)) * Math.sin(radians);
    return { x, y };
  };

  const dataPoints = dimensions.map((d) => {
    const val = d.key === 'transparency' ? getMetricValue('transparency') : getMetricValue(d.key);
    return getCoordinates(val, d.angle);
  });

  // Compile individual mapping positions into a functional continuous vector polyline string path
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
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.2)]">
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
          fill="url(#radarGradient)"
          stroke={strokeColor}
          strokeWidth="1.2"
          className="transition-all duration-700 ease-out"
        />

        {/* Interactive Highlight Vertex Vector Plot Nodes */}
        {dataPoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="#06B6D4"
            className="transition-all duration-700 ease-out fill-cyan-400 animate-pulse"
          />
        ))}

        {/* Global Color Spectrum Linear Grid Vector Gradients Defs Mapping */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Floating Structural Dimension Category Labels */}
        <text x="50" y="5.5" textAnchor="middle" fill="#64748B" fontSize="2.8" fontWeight="bold" fontFamily="monospace">TRANSPARENCY</text>
        <text x="96" y="51" textAnchor="start" fill="#64748B" fontSize="2.8" fontWeight="bold" fontFamily="monospace">SAFETY</text>
        <text x="50" y="96.5" textAnchor="middle" fill="#64748B" fontSize="2.8" fontWeight="bold" fontFamily="monospace">QUALITY</text>
        <text x="4" y="51" textAnchor="end" fill="#64748B" fontSize="2.8" fontWeight="bold" fontFamily="monospace">PRIVACY</text>
      </svg>
    </div>
  );
}
