import React, { useState } from 'react';
import { RainfallYieldChart } from '../components/charts/RainfallYieldChart';
import { IMD_RAINFALL_2015_2022 } from '../data/imdRainfallData';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
import { CloudRain, Thermometer, Calendar } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const RainfallTrendsPage: React.FC = () => {
  const { selectedYear, setSelectedYear, availableYears } = useDashboard();
  const [activeTab, setActiveTab] = useState<'imd' | 'oni'>('imd');

  const rainfallForYear = IMD_RAINFALL_2015_2022.filter(r => r.yearInt === selectedYear);

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#14261F]/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Monsoon Rainfall & Climate Dynamics
          </h1>
          <p className="text-xs text-[#80978E] mt-0.5 font-medium">
            High-resolution IMD 0.25° gridded daily rainfall records and NOAA CPC Oceanic Niño Index (Niño 3.4 SST) forcing series
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#060D0A] border border-[#14261F]">
          <button
            onClick={() => setActiveTab('imd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'imd'
                ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                : 'text-[#80978E] hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>IMD Rainfall Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('oni')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'oni'
                ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                : 'text-[#80978E] hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>NOAA ONI Series</span>
          </button>
        </div>
      </div>

      {/* Primary Trend Chart */}
      <RainfallYieldChart />

      {/* Tab 1: IMD District Table */}
      {activeTab === 'imd' && (
        <div className="rounded-2xl border border-[#14261F] bg-[#091410] overflow-hidden shadow-xs space-y-0">
          <div className="p-4 sm:p-5 border-b border-[#14261F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                District-Wise Kharif Monsoon Rainfall ({selectedYear})
              </h3>
              <p className="text-xs text-[#80978E] mt-0.5">
                Processed from IMD 0.25° daily gridded NetCDF arrays across June 1 – October 31
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-[#060D0A] px-3 py-1.5 rounded-xl border border-[#14261F]">
              <span className="text-[#80978E]">SEASON:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white font-mono font-bold focus:outline-hidden cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-[#08120E]">
                    {y} – {String(y + 1).slice(-2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060D0A] text-[#7A9187] border-b border-[#14261F] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-sans font-semibold">District</th>
                  <th className="py-3 px-3 text-right">Season</th>
                  <th className="py-3 px-3 text-right">Rainfall (mm)</th>
                  <th className="py-3 px-3 text-right">8-Yr Normal</th>
                  <th className="py-3 px-3 text-right">Departure %</th>
                  <th className="py-3 px-4 text-right">Grid Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14261F]">
                {rainfallForYear.map(row => {
                  const districtAllYears = IMD_RAINFALL_2015_2022.filter(r => r.district === row.district);
                  const meanRainfall = districtAllYears.length > 0
                    ? districtAllYears.reduce((sum, r) => sum + r.kharifRainfallMm, 0) / districtAllYears.length
                    : row.kharifRainfallMm;
                  const departure = meanRainfall > 0
                    ? ((row.kharifRainfallMm - meanRainfall) / meanRainfall) * 100
                    : 0;

                  return (
                    <tr key={`${row.district}-${row.year}`} className="hover:bg-[#0B1A14]/40 transition-colors">
                      <td className="py-2.5 px-4 font-sans font-semibold text-white">{row.district}</td>
                      <td className="py-2.5 px-3 text-right text-[#80978E] tabular-nums">{row.year}</td>
                      <td className="py-2.5 px-3 text-right text-white tabular-nums font-bold">
                        {row.kharifRainfallMm.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#80978E] tabular-nums">
                        {meanRainfall.toFixed(1)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                          departure < -20 ? 'text-[#EF4444]' : departure < 0 ? 'text-amber-400' : 'text-[#22C55E]'
                        }`}
                      >
                        {departure > 0 ? `+${departure.toFixed(1)}%` : `${departure.toFixed(1)}%`}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#80978E] text-[11px] tabular-nums">
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
        <div className="rounded-2xl border border-[#14261F] bg-[#091410] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#14261F]">
            <h3 className="text-base font-bold text-white">
              NOAA CPC Oceanic Niño Index (ONI) 2015–2022 Records
            </h3>
            <p className="text-xs text-[#80978E] mt-0.5">
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
                      ? 'bg-[#281313] border-[#4D1D1D]'
                      : rec.ensoPhase === 'Weak El Niño'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#060D0A] border-[#14261F]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono mb-2">
                    <span className="text-lg font-bold text-white">{rec.year}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isElNino
                          ? 'bg-[#401818] text-[#EF4444]'
                          : rec.ensoPhase === 'Weak El Niño'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-[#0E281F] text-[#22C55E]'
                      }`}
                    >
                      {rec.ensoPhase}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#80978E]">
                      <span>Early Warning ONI:</span>
                      <span className="text-white font-bold tabular-nums">
                        {rec.jjaSstAnomaly > 0 ? `+${rec.jjaSstAnomaly}°C` : `${rec.jjaSstAnomaly}°C`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#80978E]">
                      <span>El Niño Event:</span>
                      <span className={isElNino ? 'text-[#EF4444] font-bold' : 'text-white'}>
                        {rec.elNinoIndicator ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 pt-2 border-t border-[#14261F] text-[11px] text-[#80978E] leading-relaxed font-sans">
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
