import { computeLegs, type CabinPoint, type RouteLeg } from "@/lib/route";
import {
  fetchLocationForecast,
  aggregateDaily,
  type DailyWeather,
} from "@/lib/met";

export type TimelineDay = {
  dayNumber: number;
  date: string | null;
  leg: RouteLeg;
  weather: DailyWeather | null;
};

export type TripTimeline = {
  days: TimelineDay[];
  totals: {
    distanceKm: number;
    elevationGain: number;
    elevationLoss: number;
    estimatedHours: number;
  };
  weatherUpdatedAt: string | null;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function buildTimeline(
  cabins: CabinPoint[],
  startDate: string | null,
  opts: { skipElevation?: boolean; skipWeather?: boolean } = {},
): Promise<TripTimeline> {
  const legs = await computeLegs(cabins, { skipElevation: opts.skipElevation });

  const startISO = startDate?.slice(0, 10) ?? null;
  const endISO = startISO && legs.length ? addDays(startISO, legs.length - 1) : null;

  const weatherByCabinDay = new Map<string, DailyWeather>();
  let weatherUpdatedAt: string | null = null;

  if (!opts.skipWeather && startISO && endISO) {
    const uniqueCabins = new Map<string, CabinPoint>();
    for (const leg of legs) {
      const key = `${leg.from.lat.toFixed(3)}_${leg.from.lon.toFixed(3)}`;
      if (!uniqueCabins.has(key)) uniqueCabins.set(key, leg.from);
    }
    const forecasts = await Promise.all(
      [...uniqueCabins.entries()].map(async ([key, c]) => {
        try {
          const f = await fetchLocationForecast(c.lat, c.lon);
          if (!weatherUpdatedAt || f.updatedAt > weatherUpdatedAt) {
            weatherUpdatedAt = f.updatedAt;
          }
          return { key, daily: aggregateDaily(f, startISO, endISO) };
        } catch {
          return { key, daily: [] as DailyWeather[] };
        }
      }),
    );
    for (const { key, daily } of forecasts) {
      for (const d of daily) {
        weatherByCabinDay.set(`${key}_${d.date}`, d);
      }
    }
  }

  const days: TimelineDay[] = legs.map((leg, i) => {
    const date = startISO ? addDays(startISO, i) : null;
    const cabinKey = `${leg.from.lat.toFixed(3)}_${leg.from.lon.toFixed(3)}`;
    const weather = date ? weatherByCabinDay.get(`${cabinKey}_${date}`) ?? null : null;
    return { dayNumber: leg.dayNumber, date, leg, weather };
  });

  const totals = legs.reduce(
    (acc, l) => ({
      distanceKm: acc.distanceKm + l.distanceKm,
      elevationGain: acc.elevationGain + l.elevationGain,
      elevationLoss: acc.elevationLoss + l.elevationLoss,
      estimatedHours: acc.estimatedHours + l.estimatedHours,
    }),
    { distanceKm: 0, elevationGain: 0, elevationLoss: 0, estimatedHours: 0 },
  );

  return {
    days,
    totals: {
      distanceKm: Math.round(totals.distanceKm * 10) / 10,
      elevationGain: Math.round(totals.elevationGain),
      elevationLoss: Math.round(totals.elevationLoss),
      estimatedHours: Math.round(totals.estimatedHours * 10) / 10,
    },
    weatherUpdatedAt,
  };
}
