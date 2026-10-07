import { memo } from 'react';
import { formatCount, formatTime, toIsoString } from '../format';
import { useElementWidth } from '../hooks/useElementWidth';
import type { ActiveUsersPoint, Slice } from '../types';
import { WidgetCard } from './WidgetCard';

interface ActiveUsersWidgetProps {
  activeUsers: Slice<ActiveUsersPoint[]>;
  className?: string;
}

const DEFAULT_WIDTH = 600;
const HEIGHT = 180;
const PAD = { top: 12, right: 16, bottom: 24, left: 40 };
const INNER_H = HEIGHT - PAD.top - PAD.bottom;

/** Rounds up to a tidy axis maximum (a multiple of 50) with a little headroom. */
function axisMax(max: number) {
  return Math.max(50, Math.ceil((max * 1.1) / 50) * 50);
}

function ActiveUsersChart({ points, width }: { points: ActiveUsersPoint[]; width: number }) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return <p className="text-sm text-slate-500">No samples yet.</p>;

  const peak = Math.max(...points.map((p) => p.count));
  const yMax = axisMax(peak);
  const innerW = width - PAD.left - PAD.right;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (count: number) => PAD.top + INNER_H - (count / yMax) * INNER_H;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.count)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, yMax / 2, yMax];

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      width={width}
      height={HEIGHT}
      className="block"
      role="img"
      aria-label={`Active users over the last ${points.length} samples: from ${formatCount(first.count)} to ${formatCount(last.count)}, peaking at ${formatCount(peak)}.`}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-slate-200"
            strokeWidth={1}
          />
          <text
            x={PAD.left - 8}
            y={y(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-slate-500 text-[11px]"
          >
            {formatCount(tick)}
          </text>
        </g>
      ))}
      <text x={x(0)} y={HEIGHT - 6} className="fill-slate-500 text-[11px]">
        {formatTime(first.at)}
      </text>
      <text
        x={x(points.length - 1)}
        y={HEIGHT - 6}
        textAnchor="end"
        className="fill-slate-500 text-[11px]"
      >
        {formatTime(last.at)}
      </text>
      <path d={area} className="fill-indigo-500/10" />
      <path
        d={line}
        fill="none"
        className="stroke-indigo-600"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(points.length - 1)}
        cy={y(last.count)}
        r={4.5}
        className="fill-indigo-600 stroke-white"
        strokeWidth={2}
      />
      {/* Hit targets larger than the line give each sample a native hover tooltip. */}
      {points.map((p, i) => (
        <circle key={p.at} cx={x(i)} cy={y(p.count)} r={10} fill="transparent">
          <title>{`${formatTime(p.at)}: ${formatCount(p.count)} active users`}</title>
        </circle>
      ))}
    </svg>
  );
}

/** Memoized: re-renders only when the active-users slice changes reference. */
export const ActiveUsersWidget = memo(function ActiveUsersWidget({
  activeUsers,
  className,
}: ActiveUsersWidgetProps) {
  const points = activeUsers.value;
  const latest = points.at(-1);
  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>(DEFAULT_WIDTH);
  return (
    <WidgetCard title="Active users" updatedAt={activeUsers.updatedAt} className={className}>
      {latest && (
        <p className="mb-2 text-3xl font-semibold text-slate-900 tabular-nums">
          {formatCount(latest.count)}{' '}
          <span className="text-sm font-normal text-slate-500">
            right now (sampled{' '}
            <time dateTime={toIsoString(latest.at)}>{formatTime(latest.at)}</time>)
          </span>
        </p>
      )}
      <div ref={chartRef}>
        <ActiveUsersChart points={points} width={chartWidth} />
      </div>
    </WidgetCard>
  );
});
