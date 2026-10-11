import { MAHARASHTRA_DISTRICTS, PRIMARY_RICE_DISTRICTS } from './canonicalDistricts';
import { DES_RICE_RECORDS_2015_2022, DesRiceRecord } from './desRiceData';

export interface LabeledDistrictYear {
  districtId: string;
  districtName: string;
  year: number;
  actualYieldKgHa: number;
  baselineYieldKgHa: number;
  yieldAnomalyPct: number;
  failureLabel: 0 | 1; // 1 if anomaly < -10.0%, else 0
  baselineMethod: 'prior_5yr_rolling' | 'prior_expanding_3yr_plus' | 'insufficient_history';
  priorYearsUsed: number[];
}

export interface AuditSummaryReport {
  totalDistrictsInState: number;
  primaryRiceDistrictsCount: number;
  verifiedDesYears: number[];
  totalObservationsInDes: number;
  
  // Pure 5-Year Prior Rolling Baseline (Zero Leakage)
  strict5YrBaseline: {
    eligibleYears: number[];
    ineligibleYears: number[];
    totalLabeledObservations: number;
    failureCount: number;
    nonFailureCount: number;
    failureRatePct: number;
  };

  // Expanding Prior Baseline (Minimum 3 prior years)
  expandingBaseline: {
    eligibleYears: number[];
    ineligibleYears: number[];
    totalLabeledObservations: number;
    failureCount: number;
    nonFailureCount: number;
    failureRatePct: number;
  };

  // Scientific recommendation
  additionalHistoricalDataRequired: boolean;
  recommendationNote: string;
}

/**
 * Computes district-year crop failure labels strictly using prior years.
 * Zero temporal or target-year leakage guaranteed.
 */
export function computeZeroLeakageLabels(): {
  strict5YrLabels: LabeledDistrictYear[];
  expandingLabels: LabeledDistrictYear[];
  allRecordsWithBaselines: LabeledDistrictYear[];
} {
  const strict5YrLabels: LabeledDistrictYear[] = [];
  const expandingLabels: LabeledDistrictYear[] = [];
  const allRecordsWithBaselines: LabeledDistrictYear[] = [];

  const districts = PRIMARY_RICE_DISTRICTS;
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

  for (const district of districts) {
    const districtRecords = DES_RICE_RECORDS_2015_2022.filter(r => r.districtId === district.id);
    const yieldMap = new Map<number, number>();
    districtRecords.forEach(r => yieldMap.set(r.year, r.yieldKgHa));

    for (const year of years) {
      const actualYield = yieldMap.get(year);
      if (actualYield === undefined) continue;

      // Extract strictly prior years (target year strictly excluded)
      const priorYearsAvailable = years.filter(y => y < year && yieldMap.has(y));

      // 1. Strict prior 5-year rolling check
      const prior5Years = priorYearsAvailable.slice(-5);
      if (prior5Years.length === 5) {
        const sum = prior5Years.reduce((acc, y) => acc + (yieldMap.get(y) || 0), 0);
        const baseline = Math.round(sum / 5);
        const anomaly = Number((((actualYield - baseline) / baseline) * 100).toFixed(2));
        const failure: 0 | 1 = anomaly < -10.0 ? 1 : 0;

        const entry: LabeledDistrictYear = {
          districtId: district.id,
          districtName: district.name,
          year,
          actualYieldKgHa: actualYield,
          baselineYieldKgHa: baseline,
          yieldAnomalyPct: anomaly,
          failureLabel: failure,
          baselineMethod: 'prior_5yr_rolling',
          priorYearsUsed: prior5Years,
        };
        strict5YrLabels.push(entry);
        allRecordsWithBaselines.push(entry);
      } else if (priorYearsAvailable.length >= 3) {
        // 2. Expanding prior baseline (3 to 4 prior years)
        const sum = priorYearsAvailable.reduce((acc, y) => acc + (yieldMap.get(y) || 0), 0);
        const baseline = Math.round(sum / priorYearsAvailable.length);
        const anomaly = Number((((actualYield - baseline) / baseline) * 100).toFixed(2));
        const failure: 0 | 1 = anomaly < -10.0 ? 1 : 0;

        const entry: LabeledDistrictYear = {
          districtId: district.id,
          districtName: district.name,
          year,
          actualYieldKgHa: actualYield,
          baselineYieldKgHa: baseline,
          yieldAnomalyPct: anomaly,
          failureLabel: failure,
          baselineMethod: 'prior_expanding_3yr_plus',
          priorYearsUsed: priorYearsAvailable,
        };
        expandingLabels.push(entry);
        allRecordsWithBaselines.push(entry);
      } else {
        // Insufficient prior years (2015, 2016, 2017)
        allRecordsWithBaselines.push({
          districtId: district.id,
          districtName: district.name,
          year,
          actualYieldKgHa: actualYield,
          baselineYieldKgHa: 0,
          yieldAnomalyPct: 0,
          failureLabel: 0,
          baselineMethod: 'insufficient_history',
          priorYearsUsed: priorYearsAvailable,
        });
      }
    }
  }

  // Also include strict 5-yr entries in the expanding list (since expanding covers t >= 2018)
  const fullExpandingLabels = [...expandingLabels, ...strict5YrLabels].sort((a, b) => a.year - b.year);

  return {
    strict5YrLabels,
    expandingLabels: fullExpandingLabels,
    allRecordsWithBaselines,
  };
}

/**
 * Generates the formal Data & Sample-Size Audit Report for Steps 1–4.
 */
export function generateAuditReport(): AuditSummaryReport {
  const { strict5YrLabels, expandingLabels } = computeZeroLeakageLabels();

  const strictFailures = strict5YrLabels.filter(l => l.failureLabel === 1).length;
  const strictNonFailures = strict5YrLabels.length - strictFailures;

  const expandingFailures = expandingLabels.filter(l => l.failureLabel === 1).length;
  const expandingNonFailures = expandingLabels.length - expandingFailures;

  return {
    totalDistrictsInState: MAHARASHTRA_DISTRICTS.length, // 36
    primaryRiceDistrictsCount: PRIMARY_RICE_DISTRICTS.length, // 24
    verifiedDesYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022], // 8 years
    totalObservationsInDes: DES_RICE_RECORDS_2015_2022.length, // 192 (24 districts x 8 years)

    strict5YrBaseline: {
      eligibleYears: [2020, 2021, 2022], // 3 years
      ineligibleYears: [2015, 2016, 2017, 2018, 2019], // 5 years lack 5 prior years
      totalLabeledObservations: strict5YrLabels.length, // 72 (24 x 3)
      failureCount: strictFailures,
      nonFailureCount: strictNonFailures,
      failureRatePct: Number(((strictFailures / strict5YrLabels.length) * 100).toFixed(1)),
    },

    expandingBaseline: {
      eligibleYears: [2018, 2019, 2020, 2021, 2022], // 5 years
      ineligibleYears: [2015, 2016, 2017], // 3 years lack minimum 3 prior years
      totalLabeledObservations: expandingLabels.length, // 120 (24 x 5)
      failureCount: expandingFailures,
      nonFailureCount: expandingNonFailures,
      failureRatePct: Number(((expandingFailures / expandingLabels.length) * 100).toFixed(1)),
    },

    additionalHistoricalDataRequired: true,
    recommendationNote: `With verified DES data limited strictly to 2015–2022 (8 years), a genuine prior-5-year baseline WITHOUT target-year leakage can only be computed for 3 years (2020, 2021, 2022), yielding only 72 labeled district-year observations. Even with an expanding 3-year minimum prior baseline (2018–2022), the sample size is only 120 observations. For a spatiotemporal CNN-LSTM with ~80,000 parameters, 72–120 samples is statistically underpowered and risks severe overfitting. Therefore, obtaining pre-2015 historical DES/ICRISAT district rice records (e.g. 2010–2014) is scientifically strongly recommended before final deep learning model convergence.`,
  };
}
