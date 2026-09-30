import React, { useState } from 'react';
import { SENTINEL2_8_CHANNELS, TENSOR_SPEC } from '../data/satelliteSpec';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
import { IMD_RAINFALL_2015_2022 } from '../data/imdRainfallData';
import {
  Layers,
  CloudRain,
  Sun,
  ShieldAlert,
  CheckCircle2,
  Database,
  Calendar,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

export const SpatiotemporalDataView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  const [activeDataSection, setActiveDataSection] = useState<'status' | 'rainfall' | 'enso' | 'satellite'>('status');

  const rainfallForSelectedYear = IMD_RAINFALL_2015_2022.filter(r => r.yearInt === selectedYear);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Multi-Modal Data Ledger</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">IMD Gridded Rainfall, NOAA ONI & Sentinel-2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Spatiotemporal Climate & Crop Data Pillars
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Consolidates Directorate of Economics and Statistics (DES) historical rice production, India Meteorological Department (IMD) 0.25° gridded monsoon rainfall NetCDF data, and NOAA CPC Oceanic Niño Index (ONI) records across the early warning Kharif window.
            </p>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#0B0F14] p-1 rounded-xl border border-slate-800 overflow-x-auto self-start md:self-auto">
            <button
              onClick={() => setActiveDataSection('status')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'status'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Data Ledger
            </button>
            <button
              onClick={() => setActiveDataSection('rainfall')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'rainfall'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              IMD Rainfall
            </button>
            <button
              onClick={() => setActiveDataSection('enso')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'enso'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NOAA ONI ENSO
            </button>
            <button
              onClick={() => setActiveDataSection('satellite')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'satellite'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sentinel-2 (8 Ch)
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: DATA INTEGRITY LEDGER */}
      {activeDataSection === 'status' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status 1: IMD */}
            <div className="p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-2">
                <span className="font-semibold uppercase">Verified Ingested</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-white">IMD Gridded Rainfall</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Daily 0.25° NetCDF series covering 2015–2022 (RF25_ind). Kharif seasonal totals extracted across all study districts.
              </p>
            </div>

            {/* Status 2: DES */}
            <div className="p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-2">
                <span className="font-semibold uppercase">Verified Ingested</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-white">DES Rice Production</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                District-level Kharif rice area, production, and yield for 2015–2022 across the 24 primary rice-growing districts of Maharashtra.
              </p>
            </div>

            {/* Status 3: NOAA ONI */}
            <div className="p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-2">
                <span className="font-semibold uppercase">Published Series</span>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-base font-bold text-white">NOAA Oceanic Niño Index</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Official NOAA ERSST.v5 Niño 3.4 SST anomaly records during peak in-season Kharif months (MJJ, JJA, JAS).
              </p>
            </div>

            {/* Status 4: Sentinel-2 */}
            <div className="p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-2">
                <span className="font-semibold uppercase">Sampling Protocol</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
              <h4 className="text-base font-bold text-white">Sentinel-2 & WorldCover</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                8-channel spectral layout and ESA WorldCover Class 40 cropland purity mask (&ge; 70% threshold) defined for 32x32 patches.
              </p>
            </div>
          </div>

          {/* Mandatory ESA WorldCover Cropland Statement */}
          <div className="p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-sm">
            <div className="flex items-start gap-3.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5 text-slate-300 leading-relaxed">
                <span className="font-semibold text-amber-300 uppercase font-mono tracking-wider">
                  Methodological Protocol: Cropland Purity vs. Cadastral Rice Mask
                </span>
                <p className="text-sm text-white font-medium">
                  "{TENSOR_SPEC.croplandMaskSpec.mandatoryLimitationStatement}"
                </p>
                <p className="text-slate-400">
                  Because a dedicated 10m cadastral paddy mask for all Maharashtra districts is not publicly available, we sample 32x32 agricultural patches using ESA WorldCover Class 40 (Cropland purity &ge; 70%) inside verified Kharif rice-growing districts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: IMD MONSOON RAINFALL */}
      {activeDataSection === 'rainfall' && (
        <div className="bg-[#131920] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">IMD Kharif In-Season Rainfall Profiles (mm)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Processed from IMD 0.25° NetCDF grids strictly within June 1 – October 31 Kharif seasons.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-[#0B0F14] px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">SELECT YEAR:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-mono focus:outline-hidden cursor-pointer"
              >
                {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022].map(y => (
                  <option key={y} value={y} className="bg-[#0B0F14]">{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0F14] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-sans font-semibold">District</th>
                  <th className="py-3 px-3 text-right">Season</th>
                  <th className="py-3 px-3 text-right">Rainfall (mm)</th>
                  <th className="py-3 px-3 text-right">8-Yr Normal (mm)</th>
                  <th className="py-3 px-3 text-right">Departure</th>
                  <th className="py-3 px-4 text-right">Grid Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rainfallForSelectedYear.map(row => {
                  const districtAllYears = IMD_RAINFALL_2015_2022.filter(r => r.district === row.district);
                  const meanRainfall = districtAllYears.length > 0
                    ? districtAllYears.reduce((sum, r) => sum + r.kharifRainfallMm, 0) / districtAllYears.length
                    : row.kharifRainfallMm;
                  const departure = meanRainfall > 0
                    ? ((row.kharifRainfallMm - meanRainfall) / meanRainfall) * 100
                    : 0;

                  return (
                    <tr key={`${row.district}-${row.year}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-white">{row.district}</td>
                      <td className="py-3 px-3 text-right text-slate-400 tabular-nums">{row.year}</td>
                      <td className="py-3 px-3 text-right text-white tabular-nums font-bold">{row.kharifRainfallMm.toFixed(1)}</td>
                      <td className="py-3 px-3 text-right text-slate-400 tabular-nums">{meanRainfall.toFixed(1)}</td>
                      <td className={`py-3 px-3 text-right font-bold tabular-nums ${
                        departure < -20 ? 'text-rose-400' : departure < 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {departure > 0 ? `+${departure.toFixed(1)}%` : `${departure.toFixed(1)}%`}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px] tabular-nums">
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

      {/* SECTION 3: NOAA ONI EL NINO */}
      {activeDataSection === 'enso' && (
        <div className="bg-[#131920] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">NOAA CPC Oceanic Niño Index (ONI) 2015–2022</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              3-month running mean SST anomalies in the Niño 3.4 region (5°N–5°S, 120°W–170°W) based on ERSST.v5.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {NOAA_CPC_ONI_RECORDS.map(rec => {
              const isElNino = rec.elNinoIndicator === 1;
              return (
                <div
                  key={rec.year}
                  className={`p-4 rounded-xl border ${
                    isElNino
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : rec.ensoPhase === 'Weak El Niño'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#0B0F14] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono mb-2">
                    <span className="text-lg font-bold text-white">{rec.year}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      isElNino
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                        : rec.ensoPhase === 'Weak El Niño'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {rec.ensoPhase}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>JJA Early Warning ONI:</span>
                      <span className="text-white font-bold tabular-nums">
                        {rec.jjaSstAnomaly > 0 ? `+${rec.jjaSstAnomaly}°C` : `${rec.jjaSstAnomaly}°C`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>El Niño Event Flag:</span>
                      <span className={isElNino ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {rec.elNinoIndicator}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
                    {rec.notes}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: SATELLITE 8 CHANNELS & TENSOR */}
      {activeDataSection === 'satellite' && (
        <div className="bg-[#131920] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">
              8-Channel Multi-Spectral Spatial Tensor Specification
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Input Spatial Tensor: X_spatial &isin; R^(B &times; 6 &times; 8 &times; 32 &times; 32)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SENTINEL2_8_CHANNELS.map((ch, idx) => (
              <div key={ch.band} className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between text-emerald-400 mb-1">
                  <span className="font-bold text-sm">Channel {idx + 1}: {ch.band}</span>
                  <span className="text-[10px] text-slate-400">{ch.spatialResolutionM}m GSD</span>
                </div>
                <div className="text-white font-sans font-semibold">{ch.name}</div>
                {ch.wavelengthNm > 0 && (
                  <div className="text-[11px] text-slate-400 mt-0.5">&lambda; &approx; {ch.wavelengthNm} nm</div>
                )}
                <p className="text-[11px] text-slate-400 font-sans mt-2.5 leading-relaxed border-t border-slate-800 pt-2">
                  {ch.spectralRole}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
