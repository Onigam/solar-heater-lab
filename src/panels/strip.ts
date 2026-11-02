import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { SolarSim } from '../sim/engine';
import { SPEEDS } from '../sim/presets';
import { ALARM_TEXTS } from '../sim/texts';
import { months, num, st, sx } from './strings';

// What the bottom strip of the frame shows: live values, the date of the clock, the alarms.

export function stripValues(sim: SolarSim): StripValue[] {
  const s = sim.state;
  // the arrow marks a flow that runs backward: a sign is easy to miss
  const back = s.flowDir < 0 ? '↓ ' : '';
  return [
    { label: st('stripSun'), value: num(s.sunG), unit: 'W/m²' },
    {
      label: st('stripFlow'),
      value: `${back}${num(s.flowLph, Math.abs(s.flowLph) < 10 ? 1 : 0)}`,
      unit: 'L/h',
      cls: 'live--water',
    },
    { label: st('stripOut'), value: num(s.collectorOut), unit: '°C' },
    { label: st('stripTop'), value: num(s.tankTop), unit: '°C' },
    { label: st('stripBottom'), value: num(s.tankBottom), unit: '°C' },
    { label: st('stripGain'), value: num(s.gain / 1000, 2), unit: 'kW' },
    { label: st('stripTap'), value: num(s.tapT), unit: '°C' },
  ];
}

const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Month of a day of the year, 0 to 11. */
export function monthOf(day: number): number {
  const d = Math.floor(day);
  for (let m = 11; m >= 0; m--) if (d >= DAYS_BEFORE[m]!) return m;
  return 0;
}

export function stripClock(sim: SolarSim): { time: string; sub: string } {
  const s = sim.state;
  const hh = Math.floor(s.hour);
  const mm = Math.floor((s.hour - hh) * 60);
  const m = monthOf(s.dayOfYear);
  return {
    time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    sub: `${s.dayOfYear - DAYS_BEFORE[m]! + 1} ${months()[m]}`,
  };
}

export function stripAlarms(sim: SolarSim): StripAlarm[] {
  return sim.state.alarms.map((a) => ({ key: a, label: sx('alarm', a), severe: ALARM_TEXTS[a].severe }));
}

export const STRIP_SPEEDS = SPEEDS;
