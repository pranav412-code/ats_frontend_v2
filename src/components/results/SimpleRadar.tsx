import React from 'react';

interface Props {
  dimensions: Array<{ label: string; before: number; after: number }>;
  size?: number;
}

/**
 * Hand-rolled radar chart, zero-dep. Two overlay polygons:
 * before (gray fill, 50% opacity) and after (cyan fill, 60% opacity).
 */
export function SimpleRadar({ dimensions, size = 280 }: Props) {
  const n = dimensions.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const labelRadius = radius + 14;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const toXY = (i: number, val: number) => {
    const r = (Math.max(0, Math.min(100, val)) / 100) * radius;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const pathFrom = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toXY(i, v).join(' ')}`).join(' ') + ' Z';

  // Grid rings at 25/50/75/100.
  const rings = [25, 50, 75, 100].map((pct) => {
    const r = (pct / 100) * radius;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = angle(i);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
    return <polygon key={pct} points={pts} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />;
  });

  const beforePath = pathFrom(dimensions.map((d) => d.before));
  const afterPath = pathFrom(dimensions.map((d) => d.after));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto text-zinc-700 dark:text-zinc-300 overflow-visible">
      <defs>
        <filter id="glowAfter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="gradAfter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(6,182,212,0.5)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.2)" />
        </linearGradient>
      </defs>
      {rings}
      {dimensions.map((_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + radius * Math.cos(a)}
            y2={cy + radius * Math.sin(a)}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        );
      })}
      {/* Before */}
      <path d={beforePath} fill="rgba(113,113,122,0.15)" stroke="rgba(113,113,122,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* After */}
      <path d={afterPath} fill="url(#gradAfter)" stroke="rgba(34,211,238,1)" strokeWidth="2" strokeLinejoin="round" filter="url(#glowAfter)" />

      {/* Axis labels */}
      {dimensions.map((d, i) => {
        const a = angle(i);
        // Push labels slightly further out for breathing room
        const x = cx + (labelRadius + 4) * Math.cos(a);
        const y = cy + (labelRadius + 4) * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        return (
          <text
            key={d.label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-zinc-600 dark:fill-zinc-400 font-sans tracking-wide"
            fontSize="10"
            fontWeight="500"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
