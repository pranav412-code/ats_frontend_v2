import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function ScoreGauge({ score, size = 'md', className, label }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200;
    const startValue = animatedScore;
    const endValue = score;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(startValue + (endValue - startValue) * easeOutCubic);
      if (progress < 1) window.requestAnimationFrame(step);
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  // Bumped sizes
  const radius = size === 'sm' ? 56 : size === 'md' ? 80 : 110;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
  const normalizedRadius = radius - strokeWidth - 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const dims = radius * 2;

  const numeralSize =
    size === 'sm' ? 'text-4xl' : size === 'md' ? 'text-6xl' : 'text-7xl';
  const suffixSize =
    size === 'sm' ? 'text-[11px]' : size === 'md' ? 'text-sm' : 'text-base';

  // Editorial ink tones — solid, no gradient
  const arcColor =
    score >= 80
      ? 'stroke-emerald-700 dark:stroke-emerald-400'
      : score >= 60
      ? 'stroke-amber-700 dark:stroke-amber-400'
      : 'stroke-rose-700 dark:stroke-rose-400';

  const numeralColor =
    score >= 80
      ? 'text-emerald-800 dark:text-emerald-300'
      : score >= 60
      ? 'text-amber-800 dark:text-amber-300'
      : score === 0
      ? 'text-zinc-900 dark:text-zinc-100'
      : 'text-rose-800 dark:text-rose-300';

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative inline-flex items-center justify-center" style={{ width: dims, height: dims }}>
        <svg height={dims} width={dims} className="-rotate-90 select-none">
          {/* Track */}
          <circle
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={dims / 2}
            cy={dims / 2}
            className="stroke-zinc-300 dark:stroke-zinc-700"
          />
          {/* Active arc */}
          <circle
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            r={normalizedRadius}
            cx={dims / 2}
            cy={dims / 2}
            className={arcColor}
          />
          {/* Inner hairline ring for editorial depth */}
          <circle
            fill="transparent"
            strokeWidth={1}
            r={normalizedRadius - strokeWidth - 4}
            cx={dims / 2}
            cy={dims / 2}
            className="stroke-zinc-300/60 dark:stroke-zinc-700/60"
          />
        </svg>

        {/* Center numeral */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline select-none">
            <span
              className={cn(
                'font-serif font-bold tabular-nums tracking-tight leading-none',
                numeralColor,
                numeralSize
              )}
            >
              {Math.round(animatedScore)}
            </span>
            <span
              className={cn(
                'font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 ml-1',
                suffixSize
              )}
            >
              /100
            </span>
          </div>
        </div>
      </div>

      {label && (
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-semibold text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      )}
    </div>
  );
}
