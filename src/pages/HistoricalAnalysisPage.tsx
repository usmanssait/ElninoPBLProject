import React, { useState } from 'react';
import { computeZeroLeakageLabels, generateAuditReport } from '../data/baselineAuditEngine';
import { ShieldCheck, FileCheck2, Filter, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const HistoricalAnalysisPage: React.FC = () => {
  const { selectedYear } = useDashboard();
  const [baselineView, setBaselineView] = useState<'strict' | 'expanding'>('strict');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');

  const { strict5YrLabels, expandingLabels } = computeZeroLeakageLabels();
  const auditReport = generateAuditReport();

  const activeLabels = baselineView === 'strict' ? strict5YrLabels : expandingLabels;
  const filteredLabels = activeLabels.filter(item => {
    if (filterYear !== 'all' && item.year !== filterYear) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#14261F]/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Historical Baseline Audit & Ground Truth Engine
          </h1>
          <p className="text-xs text-[#80978E] mt-0.5 font-medium">
            Rigorous zero-leakage yield baseline comparison: Prior 5-Year Rolling vs. Prior Expanding historical yield averages
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#060D0A] border border-[#14261F]">
          <button
            onClick={() => setBaselineView('strict')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              baselineView === 'strict'
                ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                : 'text-[#80978E] hover:text-white'
            }`}
          >
            Strict 5-Yr (72 Samples)
          </button>
          <button
            onClick={() => setBaselineView('expanding')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              baselineView === 'expanding'
                ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                : 'text-[#80978E] hover:text-white'
            }`}
          >
            Expanding (120 Samples)
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#7A9187] block">
            Modeled Rice Belts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">24</span>
            <span className="text-[11px] text-[#7A9187] font-mono">/ 36 Districts</span>
          </div>
          <p className="text-[10px] text-[#647C72] mt-1 font-medium">
            Konkan & Eastern Vidarbha paddy zones
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#7A9187] block">
            Verified Time Horizon
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">8</span>
            <span className="text-[11px] text-[#7A9187] font-mono">Kharif Seasons (2015–22)</span>
          </div>
          <p className="text-[10px] text-[#647C72] mt-1 font-medium">
            192 verified district-year DES records
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#7A9187] block">
            Strict 5-Yr Baseline
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#22C55E]">72</span>
            <span className="text-[11px] text-[#7A9187] font-mono">Labeled Records</span>
          </div>
          <p className="text-[10px] text-[#647C72] mt-1 font-medium">
            Evaluated for 2020, 2021, and 2022
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#7A9187] block">
            Expanding Baseline
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#38BDF8]">120</span>
            <span className="text-[11px] text-[#7A9187] font-mono">Labeled Records</span>
          </div>
          <p className="text-[10px] text-[#647C72] mt-1 font-medium">
            Evaluated for 2018–2022 (t &ge; 3 prior seasons)
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="p-4 rounded-2xl bg-[#0B1A14] border border-[#16382A] text-xs text-[#A4B8AF] leading-relaxed space-y-1">
        <div className="flex items-center gap-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Zero Lookahead Bias Guarantee</span>
        </div>
        <p>
          Target-year yield observations are strictly excluded from the baseline mean calculation. A crop failure event is labeled when the target year yield experiences a deficit &gt; 10.0% below the historical prior baseline.
        </p>
      </div>

      {/* Labeled Records Table */}
      <div className="rounded-2xl border border-[#14261F] bg-[#091410] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#14261F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Ground-Truth Labeled District Observations ({filteredLabels.length} shown)
            </h3>
            <p className="text-xs text-[#80978E] mt-0.5">
              Current Method: {baselineView === 'strict' ? 'Strict 5-Year Rolling Mean' : 'Prior Expanding Mean (&ge; 3 Years)'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-[#7A9187]" />
            <span className="text-[#7A9187]">Filter Year:</span>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#060D0A] border border-[#14261F] text-white rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Available Seasons</option>
              {[2018, 2019, 2020, 2021, 2022].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#060D0A] text-[#7A9187] sticky top-0 border-b border-[#14261F] z-10">
              <tr>
                <th className="py-2.5 px-4 font-sans font-semibold">District</th>
                <th className="py-2.5 px-3">Crop Year</th>
                <th className="py-2.5 px-3 text-right">Actual DES Yield</th>
                <th className="py-2.5 px-3 text-right">Prior Baseline</th>
                <th className="py-2.5 px-3 text-right">Yield Anomaly</th>
                <th className="py-2.5 px-4 text-center">Observed Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14261F]">
              {filteredLabels.map((row, idx) => {
                const isFail = row.failureLabel === 1;
                return (
                  <tr key={`${row.districtId}-${row.year}-${idx}`} className="hover:bg-[#0B1A14]/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">{row.districtName}</td>
                    <td className="py-2.5 px-3 text-[#A4B8AF] font-medium">{row.year}</td>
                    <td className="py-2.5 px-3 text-right text-white tabular-nums">
                      {row.actualYieldKgHa.toLocaleString()} kg/ha
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#80978E] tabular-nums">
                      {row.baselineYieldKgHa.toLocaleString()} kg/ha
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isFail ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                      {row.yieldAnomalyPct > 0 ? `+${row.yieldAnomalyPct}%` : `${row.yieldAnomalyPct}%`}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFail
                          ? 'bg-[#2E1212] text-[#EF4444] border border-[#591C1C]'
                          : 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
                      }`}>
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
