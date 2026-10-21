import React, { useState } from 'react';
import { RainfallYieldChart } from '../components/charts/RainfallYieldChart';
import { IMD_RAINFALL_2015_2022 } from '../data/imdRainfallData';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
import { CloudRain, Thermometer } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useAppTheme } from '../context/ThemeContext';
import { YearSelect } from '../components/common/YearSelect';

export const RainfallTrendsPage: React.FC = () => {
  const { selectedYear } = useDashboard();
  const { isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'imd' | 'oni'>('imd');

  const rainfallForYear = IMD_RAINFALL_2015_2022.filter(r => r.yearInt === selectedYear);

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
            Monsoon Rainfall &amp; Climate Dynamics
          </h1>
          <p
            className={`text-xs mt-0.5 font-medium ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            High-resolution IMD 0.25° gridded daily rainfall records and NOAA CPC Oceanic Niño Index (Niño 3.4 SST) forcing series
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className={`flex items-center gap-1.5 p-1 rounded-xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
          }`}
        >
          <button
            onClick={() => setActiveTab('imd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'imd'
                ? isDark
                  ? 'bg-[#0E241C] text-[#22C55E] border border-[#22C55E]/40 font-bold shadow-xs'
                  : 'bg-[#12382B] text-white font-bold shadow-xs'
                : isDark
                ? 'text-[#7A9187] hover:text-white'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            <CloudRain className={`w-3.5 h-3.5 ${activeTab === 'imd' && isDark ? 'text-[#22C55E]' : ''}`} />
            <span>IMD Rainfall Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('oni')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'oni'
                ? isDark
                  ? 'bg-[#0E241C] text-[#22C55E] border border-[#22C55E]/40 font-bold shadow-xs'
                  : 'bg-[#12382B] text-white font-bold shadow-xs'
                : isDark
                ? 'text-[#7A9187] hover:text-white'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            <Thermometer className={`w-3.5 h-3.5 ${activeTab === 'oni' && isDark ? 'text-[#22C55E]' : ''}`} />
            <span>NOAA ONI Series</span>
          </button>
        </div>
      </div>

      {/* Primary Trend Chart */}
      <RainfallYieldChart />

      {/* Tab 1: IMD District Table */}
      {activeTab === 'imd' && (
        <div
          className={`rounded-2xl border overflow-hidden shadow-xs space-y-0 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
          }`}
        >
          <div
            className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
            }`}
          >
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                District-Wise Kharif Monsoon Rainfall ({selectedYear})
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
                Processed from IMD 0.25° daily gridded NetCDF arrays across June 1 – October 31
              </p>
            </div>

            <div className="flex items-center gap-2">
              <YearSelect />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`sticky top-0 z-10 border-b ${
                  isDark
                    ? 'bg-[#060D0A] text-[#7A9187] border-[#14261F]'
                    : 'bg-[#EAECE4] text-[#526458] border-[#CCD2C4]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 font-sans font-semibold">District</th>
                  <th className="py-3 px-3 text-right">Season</th>
                  <th className="py-3 px-3 text-right">Rainfall (mm)</th>
                  <th className="py-3 px-3 text-right">8-Yr Normal</th>
                  <th className="py-3 px-3 text-right">Departure %</th>
                  <th className="py-3 px-4 text-right">Grid Points</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
                {rainfallForYear.map(row => {
                  const districtAllYears = IMD_RAINFALL_2015_2022.filter(r => r.district === row.district);
                  const meanRainfall = districtAllYears.length > 0
                    ? districtAllYears.reduce((sum, r) => sum + r.kharifRainfallMm, 0) / districtAllYears.length
                    : row.kharifRainfallMm;
                  const departure = meanRainfall > 0
                    ? ((row.kharifRainfallMm - meanRainfall) / meanRainfall) * 100
                    : 0;

                  return (
                    <tr
                      key={`${row.district}-${row.year}`}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#0E241C]/40' : 'hover:bg-[#F2F4EE]'
                      }`}
                    >
                      <td
                        className={`py-2.5 px-4 font-sans font-semibold ${
                          isDark ? 'text-white' : 'text-[#16221B]'
                        }`}
                      >
                        {row.district}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums ${
                          isDark ? 'text-[#7A9187]' : 'text-[#526458]'
                        }`}
                      >
                        {row.year}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                          isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'
                        }`}
                      >
                        {row.kharifRainfallMm.toFixed(1)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums ${
                          isDark ? 'text-[#7A9187]' : 'text-[#718277]'
                        }`}
                      >
                        {meanRainfall.toFixed(1)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                          departure < -20
                            ? isDark
                              ? 'text-[#F87171]'
                              : 'text-[#DC2626]'
                            : departure < 0
                            ? isDark
                              ? 'text-amber-400'
                              : 'text-amber-600'
                            : isDark
                            ? 'text-[#4ADE80]'
                            : 'text-[#16A34A]'
                        }`}
                      >
                        {departure > 0 ? `+${departure.toFixed(1)}%` : `${departure.toFixed(1)}%`}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right text-[11px] tabular-nums ${
                          isDark ? 'text-[#7A9187]' : 'text-[#718277]'
                        }`}
                      >
                        {row.gridPointsUsed} cells
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: NOAA CPC ONI Cards */}
      {activeTab === 'oni' && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`pb-3 border-b ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              NOAA CPC Oceanic Niño Index (ONI) 2015–2022 Records
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Equatorial Pacific Sea Surface Temperature anomalies in the Niño 3.4 box (5°N–5°S, 120°W–170°W)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {NOAA_CPC_ONI_RECORDS.map(rec => {
              const isElNino = rec.elNinoIndicator === 1;
              return (
                <div
                  key={rec.year}
                  className={`p-4 rounded-xl border ${
                    isElNino
                      ? isDark
                        ? 'bg-[#2B0E10] border-[#5E1E22]'
                        : 'bg-[#FEE2E2] border-[#FECACA]'
                      : rec.ensoPhase === 'Weak El Niño'
                      ? isDark
                        ? 'bg-[#2D240E] border-[#5E4D1E]'
                        : 'bg-[#FEF3C7] border-[#FDE68A]'
                      : isDark
                      ? 'bg-[#060D0A] border-[#14261F]'
                      : 'bg-[#EAECE4] border-[#CCD2C4]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono mb-2">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                      {rec.year}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isElNino
                          ? isDark
                            ? 'bg-[#4C1518] text-[#F87171] border border-[#7A2429]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          : rec.ensoPhase === 'Weak El Niño'
                          ? isDark
                            ? 'bg-[#4C3B15] text-amber-300 border border-[#7A6024]'
                            : 'bg-[#FEF3C7] text-amber-800 border border-[#FDE68A]'
                          : isDark
                          ? 'bg-[#0E2E1E] text-[#4ADE80] border border-[#1A4C32]'
                          : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                      }`}
                    >
                      {rec.ensoPhase}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div
                      className={`flex justify-between ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}
                    >
                      <span>Early Warning ONI:</span>
                      <span
                        className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#16221B]'}`}
                      >
                        {rec.jjaSstAnomaly > 0 ? `+${rec.jjaSstAnomaly}°C` : `${rec.jjaSstAnomaly}°C`}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}
                    >
                      <span>El Niño Event:</span>
                      <span
                        className={
                          isElNino
                            ? isDark
                              ? 'text-[#F87171] font-bold'
                              : 'text-[#DC2626] font-bold'
                            : isDark
                            ? 'text-white'
                            : 'text-[#16221B]'
                        }
                      >
                        {rec.elNinoIndicator ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <p
                    className={`mt-3 pt-2 border-t text-[11px] leading-relaxed font-sans ${
                      isDark ? 'border-[#14261F] text-[#7A9187]' : 'border-[#CCD2C4] text-[#526458]'
                    }`}
                  >
                    {rec.notes}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
