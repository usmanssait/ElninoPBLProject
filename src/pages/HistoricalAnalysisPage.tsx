import React, { useState } from 'react';
import { computeZeroLeakageLabels, generateAuditReport } from '../data/baselineAuditEngine';
import { ShieldCheck, Filter } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useAppTheme } from '../context/ThemeContext';
import { CustomSelect, SelectOption } from '../components/common/CustomSelect';

export const HistoricalAnalysisPage: React.FC = () => {
  const { selectedYear } = useDashboard();
  const { isDark } = useAppTheme();
  const [baselineView, setBaselineView] = useState<'strict' | 'expanding'>('strict');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');

  const { strict5YrLabels, expandingLabels } = computeZeroLeakageLabels();
  const auditReport = generateAuditReport();

  const activeLabels = baselineView === 'strict' ? strict5YrLabels : expandingLabels;
  const filteredLabels = activeLabels.filter(item => {
    if (filterYear !== 'all' && item.year !== filterYear) return false;
    return true;
  });

  const filterYearOptions: SelectOption<string>[] = [
    { value: 'all', label: 'All Available Seasons' },
    ...[2018, 2019, 2020, 2021, 2022].map(y => ({
      value: String(y),
      label: `Kharif ${y}`,
    })),
  ];

  return (
    <div className={`space-y-4 max-w-[1720px] mx-auto ${isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'}`}>
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'
        }`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            Historical Baseline Audit &amp; Ground Truth Engine
          </h1>
          <p
            className={`text-xs mt-0.5 font-medium ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Rigorous zero-leakage yield baseline comparison: Prior 5-Year Rolling vs. Prior Expanding historical yield averages
          </p>
        </div>

        {/* View Switcher */}
        <div
          className={`flex items-center gap-1.5 p-1 rounded-xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
          }`}
        >
          <button
            onClick={() => setBaselineView('strict')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              baselineView === 'strict'
                ? isDark
                  ? 'bg-[#0E241C] text-[#22C55E] border border-[#22C55E]/40 font-bold shadow-xs'
                  : 'bg-[#12382B] text-white font-bold shadow-xs'
                : isDark
                ? 'text-[#7A9187] hover:text-white'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Strict 5-Yr (72 Samples)
          </button>
          <button
            onClick={() => setBaselineView('expanding')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              baselineView === 'expanding'
                ? isDark
                  ? 'bg-[#0E241C] text-[#22C55E] border border-[#22C55E]/40 font-bold shadow-xs'
                  : 'bg-[#12382B] text-white font-bold shadow-xs'
                : isDark
                ? 'text-[#7A9187] hover:text-white'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Expanding (120 Samples)
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[11px] font-mono uppercase block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Modeled Rice Belts
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              24
            </span>
            <span
              className={`text-[11px] font-mono ${
                isDark ? 'text-[#7A9187]' : 'text-[#718277]'
              }`}
            >
              / 36 Districts
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 font-medium ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            Konkan &amp; Eastern Vidarbha paddy zones
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[11px] font-mono uppercase block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Verified Time Horizon
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              8
            </span>
            <span
              className={`text-[11px] font-mono ${
                isDark ? 'text-[#7A9187]' : 'text-[#718277]'
              }`}
            >
              Kharif Seasons (2015–22)
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 font-medium ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            192 verified district-year DES records
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[11px] font-mono uppercase block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Strict 5-Yr Baseline
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#22C55E]">72</span>
            <span
              className={`text-[11px] font-mono ${
                isDark ? 'text-[#7A9187]' : 'text-[#718277]'
              }`}
            >
              Labeled Records
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 font-medium ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            Evaluated for 2020, 2021, and 2022
          </p>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[11px] font-mono uppercase block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Expanding Baseline
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#38BDF8]">120</span>
            <span
              className={`text-[11px] font-mono ${
                isDark ? 'text-[#7A9187]' : 'text-[#718277]'
              }`}
            >
              Labeled Records
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 font-medium ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            Evaluated for 2018–2022 (t &ge; 3 prior seasons)
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div
        className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 shadow-2xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] text-[#A3B8AF]'
            : 'bg-[#EAECE4] border-[#CCD2C4] text-[#3E5146]'
        }`}
      >
        <div
          className={`flex items-center gap-2 font-bold ${
            isDark ? 'text-[#22C55E]' : 'text-[#16221B]'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
          <span>Zero Lookahead Bias Guarantee</span>
        </div>
        <p>
          Target-year yield observations are strictly excluded from the baseline mean calculation. A crop failure event is labeled when the target year yield experiences a deficit &gt; 10.0% below the historical prior baseline.
        </p>
      </div>

      {/* Labeled Records Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
        }`}
      >
        <div
          className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
          }`}
        >
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Ground-Truth Labeled District Observations ({filteredLabels.length} shown)
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Current Method: {baselineView === 'strict' ? 'Strict 5-Year Rolling Mean' : 'Prior Expanding Mean (&ge; 3 Years)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CustomSelect<string>
              value={String(filterYear)}
              onChange={val => setFilterYear(val === 'all' ? 'all' : Number(val))}
              options={filterYearOptions}
              label="FILTER SEASON"
              icon={<Filter className="w-3.5 h-3.5" />}
              align="right"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs font-mono">
            <thead
              className={`sticky top-0 border-b z-10 ${
                isDark
                  ? 'bg-[#060D0A] text-[#7A9187] border-[#14261F]'
                  : 'bg-[#EAECE4] text-[#526458] border-[#CCD2C4]'
              }`}
            >
              <tr>
                <th className="py-2.5 px-4 font-sans font-semibold">District</th>
                <th className="py-2.5 px-3">Crop Year</th>
                <th className="py-2.5 px-3 text-right">Actual DES Yield</th>
                <th className="py-2.5 px-3 text-right">Prior Baseline</th>
                <th className="py-2.5 px-3 text-right">Yield Anomaly</th>
                <th className="py-2.5 px-4 text-center">Observed Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
              {filteredLabels.map((row, idx) => {
                const isFail = row.failureLabel === 1;
                return (
                  <tr
                    key={`${row.districtId}-${row.year}-${idx}`}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#0E241C]/40' : 'hover:bg-[#F2F4EE]'
                    }`}
                  >
                    <td
                      className={`py-2.5 px-4 font-sans font-semibold ${
                        isDark ? 'text-white' : 'text-[#16221B]'
                      }`}
                    >
                      {row.districtName}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-medium ${
                        isDark ? 'text-[#7A9187]' : 'text-[#526458]'
                      }`}
                    >
                      {row.year}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                        isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'
                      }`}
                    >
                      {row.actualYieldKgHa.toLocaleString()} kg/ha
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums ${
                        isDark ? 'text-[#7A9187]' : 'text-[#718277]'
                      }`}
                    >
                      {row.baselineYieldKgHa.toLocaleString()} kg/ha
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                        isFail
                          ? isDark
                            ? 'text-[#F87171]'
                            : 'text-[#DC2626]'
                          : isDark
                          ? 'text-[#4ADE80]'
                          : 'text-[#16A34A]'
                      }`}
                    >
                      {row.yieldAnomalyPct > 0 ? `+${row.yieldAnomalyPct}%` : `${row.yieldAnomalyPct}%`}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFail
                            ? isDark
                              ? 'bg-[#351214] text-[#F87171] border border-[#602022]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                            : isDark
                            ? 'bg-[#0E2E1E] text-[#4ADE80] border border-[#1A4C32]'
                            : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
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
