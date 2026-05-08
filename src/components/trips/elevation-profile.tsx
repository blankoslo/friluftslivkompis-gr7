import type { ProfilePoint } from "@/lib/trips/stats";

interface Props {
  points: ProfilePoint[];
  title?: string;
  height?: number;
  maxKm?: number;
  maxElevation?: number;
  highlight?: boolean;
}

export function ElevationProfile({
  points,
  title,
  height = 180,
  maxKm,
  maxElevation,
  highlight = true,
}: Props) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-text-muted">
        Mangler etappedata for høydeprofil.
      </p>
    );
  }

  const width = 600;
  const padX = 36;
  const padTop = 16;
  const padBottom = 28;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const km = maxKm ?? Math.max(...points.map((p) => p.km));
  const elevMax = Math.max(
    1,
    maxElevation ?? Math.max(...points.map((p) => p.elevation)),
  );
  const yTicks = niceTicks(elevMax, 4);
  const yMax = Math.max(elevMax, yTicks[yTicks.length - 1]);

  const xFor = (v: number) => padX + (km > 0 ? (v / km) * innerW : 0);
  const yFor = (v: number) => padTop + innerH - (v / yMax) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.km).toFixed(1)} ${yFor(p.elevation).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${xFor(points[points.length - 1].km).toFixed(1)} ${yFor(0).toFixed(1)} L ${xFor(points[0].km).toFixed(1)} ${yFor(0).toFixed(1)} Z`;

  const xTicks = niceTicks(km, 4);

  return (
    <figure className="w-full">
      {title && (
        <figcaption className="mb-xs text-xs uppercase tracking-label font-bold text-text-muted" style={{ fontFamily: "var(--font-stamp)" }}>
          {title}
        </figcaption>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-auto"
        role="img"
        aria-label={`Høydeprofil. Total ${km.toFixed(1)} km, ${Math.round(elevMax)} m stigning`}
      >
        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={padX}
              x2={width - padX}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--neutral-text-muted)"
              strokeOpacity="0.25"
              strokeDasharray="2 4"
            />
            <text
              x={padX - 6}
              y={yFor(t)}
              dy="0.3em"
              textAnchor="end"
              fontSize="10"
              fill="var(--neutral-text-muted)"
            >
              {t}m
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={`x-${t}`}
            x={xFor(t)}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--neutral-text-muted)"
          >
            {t}km
          </text>
        ))}
        <line
          x1={padX}
          x2={width - padX}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="var(--neutral-text-muted)"
          strokeOpacity="0.4"
        />
        <path
          d={areaPath}
          fill={highlight ? "var(--brand-flame-primary)" : "var(--accent-fjord)"}
          fillOpacity="0.18"
        />
        <path
          d={linePath}
          fill="none"
          stroke={highlight ? "var(--brand-flame-pressed)" : "var(--accent-fjord)"}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <g key={`pt-${i}`}>
            <circle
              cx={xFor(p.km)}
              cy={yFor(p.elevation)}
              r={i === 0 || i === points.length - 1 ? 4 : 3}
              fill="var(--neutral-bg)"
              stroke={highlight ? "var(--brand-flame-pressed)" : "var(--accent-fjord)"}
              strokeWidth="2"
            />
            {(i === 0 || i === points.length - 1 || points.length <= 6) && (
              <text
                x={xFor(p.km)}
                y={yFor(p.elevation) - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="var(--neutral-text-primary)"
              >
                {truncate(p.cabin, 14)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}

function niceTicks(max: number, count: number): number[] {
  if (max <= 0) return [0];
  const step = niceStep(max / count);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.0001; v += step) {
    ticks.push(Math.round(v));
  }
  return ticks;
}

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const base = Math.pow(10, exp);
  const f = rough / base;
  let nice: number;
  if (f < 1.5) nice = 1;
  else if (f < 3) nice = 2;
  else if (f < 7) nice = 5;
  else nice = 10;
  return nice * base;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
