'use client';

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Spring-driven circular compliance gauge with synchronized counter & arc
 */
export default function ComplianceGauge({ score }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const isReady = score !== null && score !== undefined;
  const targetScore = isReady ? Math.max(0, Math.min(100, score)) : 0;

  // Spring physics for smooth synchronized animation
  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 18,
    mass: 1,
  });

  useEffect(() => {
    if (isReady) {
      springValue.set(targetScore);
    } else {
      springValue.set(0);
    }
  }, [isReady, targetScore, springValue]);

  const displayScore = useTransform(springValue, (current) => Math.round(current));
  const strokeOffset = useTransform(
    springValue,
    (current) => circumference - (current / 100) * circumference
  );

  const getColor = () => {
    if (!isReady) return '#334155';
    if (targetScore <= 40) return '#EF4444';
    if (targetScore <= 70) return '#F59E0B';
    return '#10B981';
  };

  const getLabel = () => {
    if (!isReady) return 'AWAITING';
    if (targetScore <= 40) return 'CRITICAL';
    if (targetScore <= 70) return 'AT RISK';
    return 'COMPLIANT';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-full">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1E293B"
            strokeWidth="10"
          />
          {/* Spring-animated progress arc */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: isReady ? strokeOffset : circumference,
              filter: isReady ? `drop-shadow(0 0 10px ${color}60)` : 'none',
            }}
          />
        </svg>

        {/* Center text overlay with spring counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <motion.span
            className="text-4xl font-extrabold font-mono tabular-nums"
            style={{ color }}
          >
            {isReady ? (
              <motion.span>{displayScore}</motion.span>
            ) : (
              '--'
            )}
            {isReady && '%'}
          </motion.span>
          <span
            className="text-[10px] font-bold tracking-[0.25em] mt-1.5 uppercase font-mono"
            style={{ color }}
          >
            {getLabel()}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500 font-mono tracking-widest uppercase">
        Global Health Score
      </p>
    </div>
  );
}
