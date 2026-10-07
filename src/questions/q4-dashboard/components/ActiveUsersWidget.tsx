import { memo, useId } from 'react';
import { formatCount, formatDelta, formatTime, toIsoString } from '../format';
import { useElementWidth } from '../hooks/useElementWidth';
import type { ActiveUsersPoint, Slice } from '../types';
import { WidgetCard } from './WidgetCard';

interface ActiveUsersWidgetProps {
  activeUsers: Slice<ActiveUsersPoint[]>;
  className?: string;
}

const DEFAULT_WIDTH = 600;
const HEIGHT = 200;
const PAD = { top: 24, right: 12, bottom: 24, left: 36 };
const INNER_H = HEIGHT - PAD.top - PAD.bottom;

/** Rounds up to a tidy axis maximum (an even step, so the midline is round too) with headroom. */
function axisMax(max: number) {
  const step = max * 1.1 > 200 ? 100 : 50;
  return Math.max(step, Math.ceil((max * 1.1) / step) * step);
}

interface ActiveUsersChartProps {
  points: ActiveUsersPoint[];
  width: number;
}

function ActiveUsersChart({ points, width }: ActiveUsersChartProps) {
  // useId output isn't a valid bare url(#id) fragment everywhere; keep it to safe characters.
  const gradientId = `active-users-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
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
  const lastX = x(points.length - 1);
  const lastY = y(last.count);

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      width={width}
      height={HEIGHT}
      className="block"
      role="img"
      aria-label={`Active users over the last ${points.length} samples: from ${formatCount(first.count)} to ${formatCount(last.count)}, peaking at ${formatCount(peak)}.`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--color-brand-500)] [stop-opacity:0.22]" />
          <stop offset="100%" className="[stop-color:var(--color-brand-500)] [stop-opacity:0]" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(tick)}
            y2={y(tick)}
            className={tick === 0 ? 'stroke-slate-200' : 'stroke-slate-100'}
            strokeWidth={1}
          />
          <text
            x={PAD.left - 8}
            y={y(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-slate-400 text-[11px] tabular-nums"
          >
            {formatCount(tick)}
          </text>
        </g>
      ))}
      <text x={x(0)} y={HEIGHT - 4} className="fill-slate-400 text-[11px] tabular-nums">
        {formatTime(first.at)}
      </text>
      <text
        x={lastX}
        y={HEIGHT - 4}
        textAnchor="end"
        className="fill-slate-400 text-[11px] tabular-nums"
      >
        {formatTime(last.at)}
      </text>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        className="stroke-brand-600"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={lastX}
        x2={lastX}
        y1={lastY}
        y2={y(0)}
        className="stroke-slate-300"
        strokeDasharray="3 3"
      />
      <text
        x={lastX}
        y={lastY - 12}
        textAnchor="end"
        className="fill-brand-700 text-xs font-semibold tabular-nums"
      >
        {formatCount(last.count)}
      </text>
      <circle
        cx={lastX}
        cy={lastY}
        r={5}
        className="fill-brand-600 stroke-white"
        strokeWidth={2.5}
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
  const previous = points.at(-2);
  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>(DEFAULT_WIDTH);

  return (
    <WidgetCard title="Active users" updatedAt={activeUsers.updatedAt} className={className}>
      {latest && (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatCount(latest.count)}
          </p>
          <p className="text-sm text-slate-500">
            online now
            {previous && (
              <>
                {' · '}
                <span className="font-medium text-slate-700 tabular-nums">
                  {formatDelta(latest.count - previous.count)}
                </span>{' '}
                since{' '}
                <time dateTime={toIsoString(previous.at)} className="tabular-nums">
                  {formatTime(previous.at)}
                </time>
              </>
            )}
          </p>
        </div>
      )}
      <div ref={chartRef} className="-mx-1 mt-auto overflow-hidden">
        <ActiveUsersChart points={points} width={chartWidth} />
      </div>
    </WidgetCard>
  );
});
