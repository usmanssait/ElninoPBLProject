import { MAHARASHTRA_DISTRICTS, DistrictInfo } from './canonicalDistricts';
import { IMD_DISTRICT_KHARIF_RAINFALL } from './imdRainfallData';
import { DES_RICE_RECORDS_2015_2022 } from './desRiceData';
import { NOAA_CPC_ONI_RECORDS } from './oniElNinoData';

export interface DistrictYearMetric {
  districtId: string;
  districtName: string;
  division: string;
  year: number;
  cropYearStr: string; // e.g. "2015-16"
  rainfallMm: number;
  yieldTonnesHa: number;
  baselineYieldTonnesHa: number;
  yieldAnomalyPct: number;
  failureEvent: 0 | 1; // 1 if anomaly < -10%
  ensoPhase: string;
  oniSstAnomaly: number;
  compoundRiskScore: number; // 0 - 100
  isRiceProducer: boolean;
}

// Compute district-year metrics for all 36 districts across 2015-2022
export function buildDistrictYearMetrics(): Record<number, Record<string, DistrictYearMetric>> {
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
  const metricsByYear: Record<number, Record<string, DistrictYearMetric>> = {};

  for (const year of years) {
    metricsByYear[year] = {};
    const cropYearStr = `${year}-${String(year + 1).slice(-2)}`;
    const oni = NOAA_CPC_ONI_RECORDS.find(r => r.year === year);

    for (const dist of MAHARASHTRA_DISTRICTS) {
      // Rainfall lookup
      const rainEntry = IMD_DISTRICT_KHARIF_RAINFALL.find(
        r => r.yearInt === year && (r.district.toLowerCase() === dist.name.toLowerCase() || dist.aliases.some(a => a.toLowerCase() === r.district.toLowerCase()))
      );
      const rainfallMm = rainEntry ? rainEntry.kharifRainfallMm : 850;

      // Yield lookup
      const desEntry = DES_RICE_RECORDS_2015_2022.find(
        d => d.year === year && d.districtId === dist.id
      );
      const actualYieldKg = desEntry ? desEntry.yieldKgHa : dist.meanYieldKgHa;
      const actualYieldTonnes = Number((actualYieldKg / 1000).toFixed(2));

      // Baseline: prior years if available, otherwise long-term mean
      const priorDes = DES_RICE_RECORDS_2015_2022.filter(
        d => d.districtId === dist.id && d.year < year
      );

      let baselineKg = dist.meanYieldKgHa;
      if (priorDes.length >= 3) {
        const sum = priorDes.slice(-5).reduce((acc, curr) => acc + curr.yieldKgHa, 0);
        baselineKg = sum / Math.min(priorDes.length, 5);
      } else if (dist.meanYieldKgHa > 0) {
        baselineKg = dist.meanYieldKgHa;
      }

      const baselineTonnes = Number((baselineKg / 1000).toFixed(2));
      const anomalyPct = baselineKg > 0 ? Number((((actualYieldKg - baselineKg) / baselineKg) * 100).toFixed(1)) : 0;
      const failureEvent: 0 | 1 = (dist.isRiceProducer && anomalyPct < -10.0) ? 1 : 0;

      // Compound Risk Score: weights rainfall deficit + ONI anomaly + yield anomaly
      const rainNormal = 1100;
      const rainDeficitPct = Math.max(0, ((rainNormal - rainfallMm) / rainNormal) * 100);
      const oniStress = oni ? Math.max(0, oni.meanEarlyWarningSstAnomaly * 25) : 0;
      const yieldDeficit = Math.max(0, -anomalyPct * 1.5);
      const compoundRiskScore = Math.min(100, Math.round(rainDeficitPct * 0.35 + oniStress * 0.35 + yieldDeficit * 0.30));

      metricsByYear[year][dist.id] = {
        districtId: dist.id,
        districtName: dist.name,
        division: dist.division,
        year,
        cropYearStr,
        rainfallMm,
        yieldTonnesHa: actualYieldTonnes,
        baselineYieldTonnesHa: baselineTonnes,
        yieldAnomalyPct: anomalyPct,
        failureEvent,
        ensoPhase: oni ? oni.ensoPhase : 'Neutral',
        oniSstAnomaly: oni ? oni.meanEarlyWarningSstAnomaly : 0,
        compoundRiskScore,
        isRiceProducer: dist.isRiceProducer,
      };
    }
  }

  return metricsByYear;
}

export const ALL_YEAR_METRICS = buildDistrictYearMetrics();

// Color interpolation matching Python colormaps:
// RAIN_CMAP: ["#ECE8F2", "#C7BCD7", "#A99BBE", "#71658C"]
export function getRainfallColor(rainfallMm: number, min = 300, max = 2200): string {
  const norm = Math.max(0, Math.min(1, (rainfallMm - min) / (max - min)));
  if (norm < 0.33) {
    return interpolateHex('#ECE8F2', '#C7BCD7', norm / 0.33);
  } else if (norm < 0.66) {
    return interpolateHex('#C7BCD7', '#A99BBE', (norm - 0.33) / 0.33);
  } else {
    return interpolateHex('#A99BBE', '#71658C', (norm - 0.66) / 0.34);
  }
}

// YIELD_CMAP: ["#F1E9BF", "#D3D291", "#A9AE6A", "#8B8C5A"]
export function getYieldColor(yieldTonnes: number, min = 0.8, max = 3.4): string {
  const norm = Math.max(0, Math.min(1, (yieldTonnes - min) / (max - min)));
  if (norm < 0.33) {
    return interpolateHex('#F1E9BF', '#D3D291', norm / 0.33);
  } else if (norm < 0.66) {
    return interpolateHex('#D3D291', '#A9AE6A', (norm - 0.33) / 0.33);
  } else {
    return interpolateHex('#A9AE6A', '#8B8C5A', (norm - 0.66) / 0.34);
  }
}

// EVENT_CMAP: ["#4A6B46", "#B4BA64", "#DCA44E", "#C75836", "#8F2420"]
// For Yield Anomaly %: positive/neutral (green) to severe drop (deep crimson)
export function getEventAnomalyColor(anomalyPct: number): string {
  if (anomalyPct >= 5) return '#4A6B46'; // Resilient / Surplus
  if (anomalyPct >= 0) return '#6B8E62'; // Normal / Neutral
  if (anomalyPct >= -5) return '#B4BA64'; // Mild dip
  if (anomalyPct >= -10) return '#DCA44E'; // Stress threshold alert
  if (anomalyPct >= -20) return '#C75836'; // Moderate Failure Event (< -10%)
  return '#8F2420'; // Severe Failure Event (< -20%)
}

// Discrete Failure Event Color (0: Normal, 1: Failure)
export function getEventDiscreteColor(failureEvent: 0 | 1): string {
  return failureEvent === 1 ? '#A83E38' : '#526E4D';
}

// Compound Risk Color (0 - 100 score)
export function getCompoundRiskColor(score: number): string {
  const norm = Math.max(0, Math.min(100, score)) / 100;
  if (norm < 0.25) return interpolateHex('#4A6B46', '#B4BA64', norm / 0.25);
  if (norm < 0.50) return interpolateHex('#B4BA64', '#DCA44E', (norm - 0.25) / 0.25);
  if (norm < 0.75) return interpolateHex('#DCA44E', '#C75836', (norm - 0.50) / 0.25);
  return interpolateHex('#C75836', '#8F2420', (norm - 0.75) / 0.25);
}

function interpolateHex(color1: string, color2: string, factor: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;

  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 36 Maharashtra District SVG polygon definitions (projected into viewBox: 0 0 920 620)
// Designed with authentic administrative adjacency and realistic coastal contours
export interface DistrictPolygon {
  id: string;
  name: string;
  center: [number, number]; // label coordinates [x, y]
  path: string; // SVG path d attribute
}

export const MAHARASHTRA_DISTRICT_POLYGONS: DistrictPolygon[] = [
  // --- KONKAN DIVISION ---
  {
    id: 'palghar',
    name: 'Palghar',
    center: [75, 120],
    path: 'M 50,75 L 85,70 L 105,95 L 98,145 L 68,160 L 52,140 L 46,100 Z',
  },
  {
    id: 'thane',
    name: 'Thane',
    center: [95, 185],
    path: 'M 68,160 L 98,145 L 125,160 L 120,205 L 85,215 L 70,185 Z',
  },
  {
    id: 'mumbai_city',
    name: 'Mumbai City',
    center: [65, 235],
    path: 'M 60,225 L 72,225 L 70,245 L 58,245 Z',
  },
  {
    id: 'mumbai_suburban',
    name: 'Mumbai Sub.',
    center: [68, 210],
    path: 'M 60,195 L 80,195 L 75,225 L 60,225 Z',
  },
  {
    id: 'raigad',
    name: 'Raigad',
    center: [100, 265],
    path: 'M 75,215 L 120,205 L 140,245 L 130,295 L 90,305 L 75,260 Z',
  },
  {
    id: 'ratnagiri',
    name: 'Ratnagiri',
    center: [115, 375],
    path: 'M 90,305 L 130,295 L 145,355 L 135,435 L 105,445 L 95,360 Z',
  },
  {
    id: 'sindhudurg',
    name: 'Sindhudurg',
    center: [135, 485],
    path: 'M 105,445 L 135,435 L 160,470 L 155,530 L 125,535 L 115,480 Z',
  },

  // --- NASHIK DIVISION ---
  {
    id: 'nandurbar',
    name: 'Nandurbar',
    center: [160, 48],
    path: 'M 115,30 L 180,25 L 205,50 L 185,85 L 135,80 L 115,55 Z',
  },
  {
    id: 'dhule',
    name: 'Dhule',
    center: [215, 95],
    path: 'M 185,85 L 205,50 L 255,60 L 260,110 L 220,135 L 175,120 Z',
  },
  {
    id: 'jalgaon',
    name: 'Jalgaon',
    center: [305, 95],
    path: 'M 255,60 L 345,65 L 360,115 L 315,145 L 260,110 Z',
  },
  {
    id: 'nashik',
    name: 'Nashik',
    center: [160, 155],
    path: 'M 105,95 L 135,80 L 175,120 L 220,135 L 210,195 L 155,215 L 125,160 Z',
  },
  {
    id: 'ahilyanagar',
    name: 'Ahilyanagar',
    center: [240, 235],
    path: 'M 155,215 L 210,195 L 265,190 L 305,230 L 285,300 L 225,295 L 195,255 Z',
  },

  // --- PUNE DIVISION ---
  {
    id: 'pune',
    name: 'Pune',
    center: [175, 275],
    path: 'M 125,205 L 155,215 L 195,255 L 225,295 L 210,345 L 160,335 L 140,245 Z',
  },
  {
    id: 'satara',
    name: 'Satara',
    center: [175, 365],
    path: 'M 140,295 L 160,335 L 210,345 L 225,395 L 180,420 L 145,355 Z',
  },
  {
    id: 'sangli',
    name: 'Sangli',
    center: [225, 435],
    path: 'M 180,420 L 225,395 L 280,420 L 275,470 L 210,480 L 185,450 Z',
  },
  {
    id: 'kolhapur',
    name: 'Kolhapur',
    center: [170, 465],
    path: 'M 145,395 L 180,420 L 185,450 L 210,480 L 185,530 L 155,530 L 135,435 Z',
  },
  {
    id: 'solapur',
    name: 'Solapur',
    center: [305, 375],
    path: 'M 225,295 L 285,300 L 350,330 L 375,400 L 335,445 L 280,420 L 225,395 L 210,345 Z',
  },

  // --- MARATHWADA DIVISION ---
  {
    id: 'chhatrapati_sambhajinagar',
    name: 'Chh. Sambhajinagar',
    center: [295, 175],
    path: 'M 220,135 L 260,110 L 315,145 L 345,170 L 320,215 L 265,190 Z',
  },
  {
    id: 'jalna',
    name: 'Jalna',
    center: [360, 185],
    path: 'M 315,145 L 360,115 L 400,150 L 395,210 L 345,215 L 345,170 Z',
  },
  {
    id: 'beed',
    name: 'Beed',
    center: [335, 260],
    path: 'M 265,190 L 320,215 L 345,215 L 390,250 L 370,305 L 305,300 Z',
  },
  {
    id: 'parbhani',
    name: 'Parbhani',
    center: [420, 215],
    path: 'M 395,210 L 440,195 L 465,235 L 435,270 L 390,250 Z',
  },
  {
    id: 'hingoli',
    name: 'Hingoli',
    center: [450, 170],
    path: 'M 400,150 L 450,140 L 485,175 L 465,205 L 440,195 Z',
  },
  {
    id: 'nanded',
    name: 'Nanded',
    center: [495, 230],
    path: 'M 465,205 L 485,175 L 540,205 L 535,275 L 480,285 L 435,270 L 465,235 Z',
  },
  {
    id: 'dharashiv',
    name: 'Dharashiv',
    center: [370, 335],
    path: 'M 305,300 L 370,305 L 405,340 L 390,390 L 350,330 Z',
  },
  {
    id: 'latur',
    name: 'Latur',
    center: [425, 325],
    path: 'M 370,305 L 390,250 L 435,270 L 480,285 L 470,345 L 415,360 L 405,340 Z',
  },

  // --- AMRAVATI DIVISION ---
  {
    id: 'buldhana',
    name: 'Buldhana',
    center: [385, 105],
    path: 'M 345,65 L 405,65 L 415,125 L 400,150 L 360,115 Z',
  },
  {
    id: 'akola',
    name: 'Akola',
    center: [445, 105],
    path: 'M 405,65 L 465,70 L 475,130 L 450,140 L 415,125 Z',
  },
  {
    id: 'washim',
    name: 'Washim',
    center: [465, 140],
    path: 'M 450,140 L 475,130 L 505,145 L 495,185 L 465,170 Z',
  },
  {
    id: 'amravati',
    name: 'Amravati',
    center: [520, 85],
    path: 'M 465,70 L 565,65 L 575,125 L 515,135 L 475,130 Z',
  },
  {
    id: 'yavatmal',
    name: 'Yavatmal',
    center: [545, 165],
    path: 'M 505,145 L 575,125 L 610,165 L 590,225 L 540,205 L 495,185 Z',
  },

  // --- NAGPUR DIVISION (Premier Eastern Paddy Belt) ---
  {
    id: 'wardha',
    name: 'Wardha',
    center: [605, 115],
    path: 'M 575,125 L 625,95 L 650,135 L 625,175 L 590,170 Z',
  },
  {
    id: 'nagpur',
    name: 'Nagpur',
    center: [665, 80],
    path: 'M 625,95 L 695,65 L 720,105 L 675,135 L 650,135 Z',
  },
  {
    id: 'bhandara',
    name: 'Bhandara',
    center: [735, 95],
    path: 'M 720,105 L 760,85 L 780,125 L 740,150 L 675,135 Z',
  },
  {
    id: 'gondia',
    name: 'Gondia',
    center: [805, 85],
    path: 'M 760,85 L 835,65 L 855,125 L 795,150 L 780,125 Z',
  },
  {
    id: 'chandrapur',
    name: 'Chandrapur',
    center: [685, 205],
    path: 'M 625,175 L 675,135 L 740,150 L 745,215 L 720,275 L 650,265 L 590,225 Z',
  },
  {
    id: 'gadchiroli',
    name: 'Gadchiroli',
    center: [805, 215],
    path: 'M 740,150 L 795,150 L 855,125 L 885,185 L 870,295 L 815,350 L 770,305 L 745,215 Z',
  },
];
