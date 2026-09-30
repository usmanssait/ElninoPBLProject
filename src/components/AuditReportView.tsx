import React, { useState } from 'react';
import {
  generateAuditReport,
  computeZeroLeakageLabels,
  LabeledDistrictYear,
} from '../data/baselineAuditEngine';
import {
  MAHARASHTRA_DISTRICTS,
  PRIMARY_RICE_DISTRICTS,
} from '../data/canonicalDistricts';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  Activity,
  Calendar,
  Filter,
} from 'lucide-react';

export const AuditReportView: React.FC = () => {
  const [baselineView, setBaselineView] = useState<'strict' | 'expanding'>('strict');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'all'>('all');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('all');

  const auditReport = generateAuditReport();
  const { strict5YrLabels, expandingLabels } = computeZeroLeakageLabels();

  const activeLabels = baselineView === 'strict' ? strict5YrLabels : expandingLabels;

  const filteredLabels = activeLabels.filter(item => {
    if (selectedYearFilter !== 'all' && item.year !== selectedYearFilter) return false;
    if (selectedDivisionFilter !== 'all') {
      const dist = MAHARASHTRA_DISTRICTS.find(d => d.id === item.districtId);
      if (dist?.division !== selectedDivisionFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Ground-Truth Validation</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Zero Target-Year Leakage Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ground-Truth Baseline & Sample-Size Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Empirical verification of Directorate of Economics and Statistics (DES) Maharashtra Kharif rice records (2015–2022), calculating exact usable sample sizes for spatiotemporal modeling without lookahead bias.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Audit Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Four Focused Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Primary Rice Belts</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {auditReport.primaryRiceDistrictsCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 36 in state</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Konkan, Wainganga, and Ghats basins</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Verified Time Horizon</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {auditReport.verifiedDesYears.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">Years (2015–2022)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">192 total district-year records</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Strict 5-Yr Baseline</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              {auditReport.strict5YrBaseline.totalLabeledObservations}
            </span>
            <span className="text-xs text-slate-500 font-mono">Samples</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Covers 2020, 2021, and 2022</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Expanding Baseline</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 tabular-nums">
              {auditReport.expandingBaseline.totalLabeledObservations}
            </span>
            <span className="text-xs text-slate-500 font-mono">Samples</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Covers 2018–2022 (t ≥ 3 prior)</p>
        </div>
      </div>

      {/* 3. Scientific Finding Callout */}
      <div className="p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs text-slate-300">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs leading-relaxed">
            <h3 className="text-sm font-semibold text-amber-300">
              Methodological Finding: Baseline Feasibility & Temporal Independence
            </h3>
            <p className="text-slate-300">
              Under verified 2015–2022 DES data, a genuine prior rolling baseline requires preceding years (t-1, ..., t-k). The target-year yield cannot be included in baseline calculation without introducing fatal lookahead bias.
            </p>
            <p className="text-slate-400">
              Only 3 years (2020–2022) have 5 prior years available, yielding 72 strict samples. Expanding prior baselines (t ≥ 2018) yield 120 samples.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Baseline Selector & Filter Controls */}
      <div className="p-4 rounded-2xl bg-[#131920] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono font-semibold">METHOD:</span>
          <div className="inline-flex rounded-xl bg-[#0B0F14] p-1 border border-slate-800">
            <button
              onClick={() => setBaselineView('strict')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                baselineView === 'strict'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Strict Prior 5-Year (2020–2022 · 72 samples)
            </button>
            <button
              onClick={() => setBaselineView('expanding')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                baselineView === 'expanding'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expanding Prior Baseline (2018–2022 · 120 samples)
            </button>
          </div>
        </div>

        {/* Year and Division Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">YEAR:</span>
            <select
              value={selectedYearFilter}
              onChange={e => setSelectedYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#0B0F14] border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Available Years</option>
              {baselineView === 'strict'
                ? [2020, 2021, 2022].map(y => <option key={y} value={y}>{y}</option>)
                : [2018, 2019, 2020, 2021, 2022].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">DIVISION:</span>
            <select
              value={selectedDivisionFilter}
              onChange={e => setSelectedDivisionFilter(e.target.value)}
              className="bg-[#0B0F14] border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Divisions</option>
              <option value="Konkan">Konkan</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Pune">Pune</option>
              <option value="Nashik">Nashik</option>
              <option value="Marathwada">Marathwada</option>
              <option value="Amravati">Amravati</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Simplified Labeled Dataset Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#131920] shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Ground-Truth Labeled District Records ({filteredLabels.length} shown)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Failure Event threshold: Yield Drop &lt; -10.0% below historical baseline
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Failure: {filteredLabels.filter(r => r.failureLabel === 1).length}
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Resilient: {filteredLabels.filter(r => r.failureLabel === 0).length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F14] text-slate-400 font-mono sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-3">Crop Year</th>
                <th className="py-3 px-3 text-right">Actual Yield</th>
                <th className="py-3 px-3 text-right">Prior Baseline</th>
                <th className="py-3 px-3 text-right">Yield Anomaly</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLabels.map((row, idx) => {
                const isFail = row.failureLabel === 1;
                return (
                  <tr
                    key={`${row.districtId}-${row.year}-${idx}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {row.districtName}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{row.year}</td>
                    <td className="py-3 px-3 text-right text-slate-200 tabular-nums">
                      {row.actualYieldKgHa.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400 font-sans">kg/ha</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                      {row.baselineYieldKgHa.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500 font-sans">kg/ha</span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold tabular-nums ${
                        isFail ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {row.yieldAnomalyPct > 0 ? `+${row.yieldAnomalyPct}%` : `${row.yieldAnomalyPct}%`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          isFail
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isFail ? 'FAILURE' : 'RESILIENT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
