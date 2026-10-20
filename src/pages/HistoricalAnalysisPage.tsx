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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#CCD2C4]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
            Historical Baseline Audit &amp; Ground Truth Engine
          </h1>
          <p className="text-xs text-[#526458] mt-0.5 font-medium">
            Rigorous zero-leakage yield baseline comparison: Prior 5-Year Rolling vs. Prior Expanding historical yield averages
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#CCD2C4] shadow-xs">
          <button
            onClick={() => setBaselineView('strict')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              baselineView === 'strict'
                ? 'bg-[#12382B] text-white font-bold shadow-xs'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Strict 5-Yr (72 Samples)
          </button>
          <button
            onClick={() => setBaselineView('expanding')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              baselineView === 'expanding'
                ? 'bg-[#12382B] text-white font-bold shadow-xs'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Expanding (120 Samples)
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#526458] block">
            Modeled Rice Belts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16221B]">24</span>
            <span className="text-[11px] text-[#718277] font-mono">/ 36 Districts</span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1 font-medium">
            Konkan &amp; Eastern Vidarbha paddy zones
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#526458] block">
            Verified Time Horizon
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16221B]">8</span>
            <span className="text-[11px] text-[#718277] font-mono">Kharif Seasons (2015–22)</span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1 font-medium">
            192 verified district-year DES records
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#526458] block">
            Strict 5-Yr Baseline
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16A34A]">72</span>
            <span className="text-[11px] text-[#718277] font-mono">Labeled Records</span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1 font-medium">
            Evaluated for 2020, 2021, and 2022
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <span className="text-[11px] font-mono uppercase text-[#526458] block">
            Expanding Baseline
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#0284C7]">120</span>
            <span className="text-[11px] text-[#718277] font-mono">Labeled Records</span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1 font-medium">
            Evaluated for 2018–2022 (t &ge; 3 prior seasons)
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="p-4 rounded-2xl bg-[#EAECE4] border border-[#CCD2C4] text-xs text-[#3E5146] leading-relaxed space-y-1 shadow-2xs">
        <div className="flex items-center gap-2 text-[#16221B] font-bold">
          <ShieldCheck className="w-4 h-4 text-[#12382B]" />
          <span>Zero Lookahead Bias Guarantee</span>
        </div>
        <p>
          Target-year yield observations are strictly excluded from the baseline mean calculation. A crop failure event is labeled when the target year yield experiences a deficit &gt; 10.0% below the historical prior baseline.
        </p>
      </div>

      {/* Labeled Records Table */}
      <div className="rounded-2xl border border-[#CCD2C4] bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#CCD2C4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EAECE4]">
          <div>
            <h3 className="text-sm font-bold text-[#16221B]">
              Ground-Truth Labeled District Observations ({filteredLabels.length} shown)
            </h3>
            <p className="text-xs text-[#526458] mt-0.5">
              Current Method: {baselineView === 'strict' ? 'Strict 5-Year Rolling Mean' : 'Prior Expanding Mean (&ge; 3 Years)'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-[#526458]" />
            <span className="text-[#526458]">Filter Year:</span>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-white border border-[#CCD2C4] text-[#16221B] rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer shadow-2xs"
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
            <thead className="bg-[#EAECE4] text-[#526458] sticky top-0 border-b border-[#CCD2C4] z-10">
              <tr>
                <th className="py-2.5 px-4 font-sans font-semibold">District</th>
                <th className="py-2.5 px-3">Crop Year</th>
                <th className="py-2.5 px-3 text-right">Actual DES Yield</th>
                <th className="py-2.5 px-3 text-right">Prior Baseline</th>
                <th className="py-2.5 px-3 text-right">Yield Anomaly</th>
                <th className="py-2.5 px-4 text-center">Observed Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CCD2C4]">
              {filteredLabels.map((row, idx) => {
                const isFail = row.failureLabel === 1;
                return (
                  <tr key={`${row.districtId}-${row.year}-${idx}`} className="hover:bg-[#F2F4EE] transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-[#16221B]">{row.districtName}</td>
                    <td className="py-2.5 px-3 text-[#526458] font-medium">{row.year}</td>
                    <td className="py-2.5 px-3 text-right text-[#16221B] tabular-nums font-semibold">
                      {row.actualYieldKgHa.toLocaleString()} kg/ha
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#718277] tabular-nums">
                      {row.baselineYieldKgHa.toLocaleString()} kg/ha
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isFail ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                      {row.yieldAnomalyPct > 0 ? `+${row.yieldAnomalyPct}%` : `${row.yieldAnomalyPct}%`}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFail
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
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
