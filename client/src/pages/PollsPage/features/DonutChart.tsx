import React from 'react';

export interface DonutSegment {
  id: string;
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}

/**
 * Pure SVG donut chart — no external dependencies.
 *
 * Each segment is a full-circle <circle> with stroke-dasharray set to
 * only draw the arc for that segment's proportion, rotated to start at the right angle.
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 180,
  strokeWidth = 22,
  centerLabel,
  centerSub,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * r;

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const GAP = total > 1 ? 3 : 0;

  let cumulativeAngle = 0;

  const activeSegments = segments.filter((s) => s.value > 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="poll-donut-chart"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--bg-tertiary)"
        strokeWidth={strokeWidth}
      />

      {total > 0 &&
        activeSegments.map((segment) => {
          const fraction = segment.value / total;
          const arcLen = Math.max(0, fraction * circumference - GAP);
          const startAngle = cumulativeAngle - 90;
          cumulativeAngle += fraction * 360;

          return (
            <circle
              key={segment.id}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLen} ${circumference}`}
              strokeLinecap="butt"
              transform={`rotate(${startAngle}, ${cx}, ${cy})`}
              className="poll-donut-chart__segment"
            />
          );
        })}

      {centerLabel !== undefined && (
        <>
          <text
            x={cx}
            y={cy - (centerSub ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.16}
            fontWeight="700"
            fill="var(--text-primary)"
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text
              x={cx}
              y={cy + size * 0.1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.077}
              fill="var(--text-secondary)"
            >
              {centerSub}
            </text>
          )}
        </>
      )}
    </svg>
  );
};
