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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#CCD2C4]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
            Monsoon Rainfall &amp; Climate Dynamics
          </h1>
          <p className="text-xs text-[#526458] mt-0.5 font-medium">
            High-resolution IMD 0.25° gridded daily rainfall records and NOAA CPC Oceanic Niño Index (Niño 3.4 SST) forcing series
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#CCD2C4] shadow-xs">
          <button
            onClick={() => setActiveTab('imd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'imd'
                ? 'bg-[#12382B] text-white font-bold shadow-xs'
                : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>IMD Rainfall Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('oni')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'oni'
                ? 'bg-[#12382B] text-white font-bold shadow-xs'
                : 'text-[#526458] hover:text-[#16221B]'
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
        <div className="rounded-2xl border border-[#CCD2C4] bg-white overflow-hidden shadow-xs space-y-0">
          <div className="p-4 sm:p-5 border-b border-[#CCD2C4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EAECE4]">
            <div>
              <h3 className="text-base font-bold text-[#16221B]">
                District-Wise Kharif Monsoon Rainfall ({selectedYear})
              </h3>
              <p className="text-xs text-[#526458] mt-0.5">
                Processed from IMD 0.25° daily gridded NetCDF arrays across June 1 – October 31
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-[#CCD2C4] shadow-2xs">
              <span className="text-[#526458]">SEASON:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-[#16221B] font-mono font-bold focus:outline-hidden cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-white text-[#16221B]">
                    {y} – {String(y + 1).slice(-2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#EAECE4] text-[#526458] border-b border-[#CCD2C4] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-sans font-semibold">District</th>
                  <th className="py-3 px-3 text-right">Season</th>
                  <th className="py-3 px-3 text-right">Rainfall (mm)</th>
                  <th className="py-3 px-3 text-right">8-Yr Normal</th>
                  <th className="py-3 px-3 text-right">Departure %</th>
                  <th className="py-3 px-4 text-right">Grid Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CCD2C4]">
                {rainfallForYear.map(row => {
                  const districtAllYears = IMD_RAINFALL_2015_2022.filter(r => r.district === row.district);
                  const meanRainfall = districtAllYears.length > 0
                    ? districtAllYears.reduce((sum, r) => sum + r.kharifRainfallMm, 0) / districtAllYears.length
                    : row.kharifRainfallMm;
                  const departure = meanRainfall > 0
                    ? ((row.kharifRainfallMm - meanRainfall) / meanRainfall) * 100
                    : 0;

                  return (
                    <tr key={`${row.district}-${row.year}`} className="hover:bg-[#F2F4EE] transition-colors">
                      <td className="py-2.5 px-4 font-sans font-semibold text-[#16221B]">{row.district}</td>
                      <td className="py-2.5 px-3 text-right text-[#526458] tabular-nums">{row.year}</td>
                      <td className="py-2.5 px-3 text-right text-[#16221B] tabular-nums font-bold">
                        {row.kharifRainfallMm.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#718277] tabular-nums">
                        {meanRainfall.toFixed(1)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                          departure < -20 ? 'text-[#DC2626]' : departure < 0 ? 'text-amber-600' : 'text-[#16A34A]'
                        }`}
                      >
                        {departure > 0 ? `+${departure.toFixed(1)}%` : `${departure.toFixed(1)}%`}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#718277] text-[11px] tabular-nums">
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
        <div className="rounded-2xl border border-[#CCD2C4] bg-[#E2E6DC] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#CCD2C4]">
            <h3 className="text-base font-bold text-[#16221B]">
              NOAA CPC Oceanic Niño Index (ONI) 2015–2022 Records
            </h3>
            <p className="text-xs text-[#526458] mt-0.5">
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
                      ? 'bg-[#FEE2E2] border-[#FECACA]'
                      : rec.ensoPhase === 'Weak El Niño'
                      ? 'bg-[#FEF3C7] border-[#FDE68A]'
                      : 'bg-[#EAECE4] border-[#CCD2C4]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono mb-2">
                    <span className="text-lg font-bold text-[#16221B]">{rec.year}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isElNino
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          : rec.ensoPhase === 'Weak El Niño'
                          ? 'bg-[#FEF3C7] text-amber-800 border border-[#FDE68A]'
                          : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                      }`}
                    >
                      {rec.ensoPhase}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#526458]">
                      <span>Early Warning ONI:</span>
                      <span className="text-[#16221B] font-bold tabular-nums">
                        {rec.jjaSstAnomaly > 0 ? `+${rec.jjaSstAnomaly}°C` : `${rec.jjaSstAnomaly}°C`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#526458]">
                      <span>El Niño Event:</span>
                      <span className={isElNino ? 'text-[#DC2626] font-bold' : 'text-[#16221B]'}>
                        {rec.elNinoIndicator ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 pt-2 border-t border-[#CCD2C4] text-[11px] text-[#526458] leading-relaxed font-sans">
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
