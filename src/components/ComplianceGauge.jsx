'use client';

/**
 * SVG circular compliance gauge with animated stroke,
 * neon color transitions, and severity label.
 *
 * @param {{ score: number|null }} props
 */
export default function ComplianceGauge({ score }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const isReady = score !== null && score !== undefined;
  const clampedScore = isReady ? Math.max(0, Math.min(100, score)) : 0;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getColor = () => {
    if (!isReady) return '#334155';
    if (clampedScore <= 40) return '#EF4444';
    if (clampedScore <= 70) return '#F59E0B';
    return '#10B981';
  };

  const getLabel = () => {
    if (!isReady) return 'AWAITING';
    if (clampedScore <= 40) return 'CRITICAL';
    if (clampedScore <= 70) return 'AT RISK';
    return 'COMPLIANT';
  };

  const getGlowClass = () => {
    if (!isReady) return '';
    if (clampedScore <= 40) return 'neon-glow-red';
    if (clampedScore <= 70) return 'neon-glow-amber';
    return 'neon-glow-green';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-full ${getGlowClass()}`}>
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
          {/* Progress arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isReady ? strokeDashoffset : circumference}
            style={{
              transition:
                'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
              filter: isReady ? `drop-shadow(0 0 10px ${color}60)` : 'none',
            }}
          />
        </svg>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span
            className="text-4xl font-extrabold font-mono tabular-nums"
            style={{ color }}
          >
            {isReady ? `${clampedScore}%` : '--'}
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.25em] mt-1.5 uppercase"
            style={{ color }}
          >
            {getLabel()}
          </span>
        </div>
      </div>

      {/* Health Score Label */}
      <p className="mt-4 text-xs text-gray-500 font-mono tracking-widest uppercase">
        Global Health Score
      </p>
    </div>
  );
}
