'use client';
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { getPreviousAudit } from '../lib/historyStore';

// 5-axis dimensions — declared outside the component since they're static
// and referenced by both the metric lookup and the spring wiring below.
const DIMENSIONS = [
  { key: 'security', label: 'MODEL SAFETY', angle: 0 },
  { key: 'quality', label: 'DATA QUALITY', angle: 72 },
  { key: 'rai', label: 'RESPONSIBLE AI', angle: 144 },
  { key: 'legal', label: 'LEGAL PRIVACY', angle: 216 },
  { key: 'transparency', label: 'TRANSPARENCY', angle: 288 },
];

const CENTER = 50;
const RADIUS = 34;
const SPRING_CONFIG = { stiffness: 90, damping: 20, mass: 0.7 };

function getMetricValue(auditObj, layer) {
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
}

function getCoordinates(value, angle) {
  const radians = ((angle - 90) * Math.PI) / 180; // Shift by -90 to keep the primary node vertical
  const x = CENTER + RADIUS * (value / 100) * Math.cos(radians);
  const y = CENTER + RADIUS * (value / 100) * Math.sin(radians);
  return { x, y };
}

export default function InteractiveRadarChart({ report }) {
  const [prevAudit, setPrevAudit] = useState(null);

  useEffect(() => {
    setPrevAudit(getPreviousAudit());
  }, [report]);

  // ── One spring per axis (explicit, not a .map() — keeps hook count
  // fixed across renders, which react-hooks/rules-of-hooks requires). ──
  const springSecurity = useSpring(100, SPRING_CONFIG);
  const springQuality = useSpring(100, SPRING_CONFIG);
  const springRai = useSpring(100, SPRING_CONFIG);
  const springLegal = useSpring(100, SPRING_CONFIG);
  const springTransparency = useSpring(100, SPRING_CONFIG);
  const axisSprings = [springSecurity, springQuality, springRai, springLegal, springTransparency];

  useEffect(() => {
    DIMENSIONS.forEach((d, i) => {
      axisSprings[i].set(getMetricValue(report, d.key));
    });
    // axisSprings entries are stable MotionValue refs across renders (from
    // useSpring), so this effect only needs to re-fire when `report` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  // Combined polygon `points` string, recalculated whenever ANY axis spring
  // ticks — this is what makes the whole shape move as one physical object
  // instead of five independently-transitioning CSS properties.
  const currentPath = useTransform(axisSprings, (values) =>
    DIMENSIONS.map((d, i) => {
      const { x, y } = getCoordinates(values[i], d.angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ')
  );

  // Individual vertex dot (x, y) positions, spring-driven off the same
  // values. Declared as explicit, fixed hook calls rather than a .map() —
  // calling hooks inside a loop/callback breaks react-hooks/rules-of-hooks.
  const vx0 = useTransform(springSecurity, (v) => getCoordinates(v, DIMENSIONS[0].angle).x);
  const vy0 = useTransform(springSecurity, (v) => getCoordinates(v, DIMENSIONS[0].angle).y);
  const vx1 = useTransform(springQuality, (v) => getCoordinates(v, DIMENSIONS[1].angle).x);
  const vy1 = useTransform(springQuality, (v) => getCoordinates(v, DIMENSIONS[1].angle).y);
  const vx2 = useTransform(springRai, (v) => getCoordinates(v, DIMENSIONS[2].angle).x);
  const vy2 = useTransform(springRai, (v) => getCoordinates(v, DIMENSIONS[2].angle).y);
  const vx3 = useTransform(springLegal, (v) => getCoordinates(v, DIMENSIONS[3].angle).x);
  const vy3 = useTransform(springLegal, (v) => getCoordinates(v, DIMENSIONS[3].angle).y);
  const vx4 = useTransform(springTransparency, (v) => getCoordinates(v, DIMENSIONS[4].angle).x);
  const vy4 = useTransform(springTransparency, (v) => getCoordinates(v, DIMENSIONS[4].angle).y);
  const vertexCoords = [
    { cx: vx0, cy: vy0 },
    { cx: vx1, cy: vy1 },
    { cx: vx2, cy: vy2 },
    { cx: vx3, cy: vy3 },
    { cx: vx4, cy: vy4 },
  ];

  // Ghosted previous-audit polygon — static (no spring), since it's a
  // reference snapshot, not something currently animating toward a target.
  const prevPath = prevAudit
    ? DIMENSIONS.map((d) => {
        const { x, y } = getCoordinates(getMetricValue(prevAudit, d.key), d.angle);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ')
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
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.66} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.33} fill="none" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="1 1" />

        {/* Axis Web Vector Boundary Lines */}
        {DIMENSIONS.map((d, idx) => {
          const edge = getCoordinates(100, d.angle);
          return (
            <line key={idx} x1={CENTER} y1={CENTER} x2={edge.x} y2={edge.y} stroke="#1E293B" strokeWidth="0.5" />
          );
        })}

        {/* ━━ Ghosted Previous Audit Polygon (static reference, entrance-faded) ━━ */}
        {prevPath && (
          <motion.polygon
            points={prevPath}
            fill="none"
            stroke="#475569"
            strokeWidth="0.8"
            strokeDasharray="1.5 1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />
        )}

        {/* ━━ Spring-Driven Current Vector Polygon ━━ */}
        <motion.polygon
          points={currentPath}
          fill="url(#radarGradient5)"
          stroke={strokeColor}
          strokeWidth="1.2"
        />

        {/* Spring-Driven Vertex Plot Nodes */}
        {vertexCoords.map((coord, idx) => (
          <motion.circle
            key={idx}
            cx={coord.cx}
            cy={coord.cy}
            r="1.4"
            fill="#06B6D4"
            className="fill-cyan-400 animate-pulse"
          />
        ))}

        <defs>
          <linearGradient id="radarGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Multi-Axis Labels */}
        {DIMENSIONS.map((d, idx) => {
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
