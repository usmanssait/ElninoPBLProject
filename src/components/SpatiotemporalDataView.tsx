import React, { useState } from 'react';
import { SENTINEL2_8_CHANNELS } from '../data/satelliteSpec';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
import { IMD_RAINFALL_2015_2022 } from '../data/imdRainfallData';
import { computeZeroLeakageLabels } from '../data/baselineAuditEngine';
import {
  Layers,
  CloudRain,
  ExternalLink,
  Database,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileCheck2,
} from 'lucide-react';

export const SpatiotemporalDataView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  const [activeDataSection, setActiveDataSection] = useState<'sources' | 'rainfall' | 'enso' | 'satellite' | 'audit'>('sources');

  // Audit state
  const [baselineView, setBaselineView] = useState<'strict' | 'expanding'>('strict');
  const [selectedAuditYear, setSelectedAuditYear] = useState<number | 'all'>('all');

  const { strict5YrLabels, expandingLabels } = computeZeroLeakageLabels();
  const activeLabels = baselineView === 'strict' ? strict5YrLabels : expandingLabels;
  const filteredLabels = activeLabels.filter(item => {
    if (selectedAuditYear !== 'all' && item.year !== selectedAuditYear) return false;
    return true;
  });

  const rainfallForSelectedYear = IMD_RAINFALL_2015_2022.filter(r => r.yearInt === selectedYear);

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner matching reference design */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E]">
              <span className="font-semibold uppercase tracking-wider">Multi-Modal Data Ledger</span>
              <span aria-hidden="true" className="text-[#3A5046]">·</span>
              <span className="text-[#80978E]">Verified Empirical Datasets with Working Official Portals</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Data Pillars & Baseline Audit
            </h1>
            <p className="text-xs text-[#80978E] max-w-3xl leading-relaxed">
              Every data stream used in this project originates from official meteorological, agricultural, and space agency sources. Includes the zero-leakage historical yield baseline audit for model ground truth.
            </p>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#060D0A] p-1 rounded-xl border border-[#14261F] overflow-x-auto self-start md:self-auto max-w-full">
            <button
              onClick={() => setActiveDataSection('sources')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'sources'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#80978E] hover:text-white'
              }`}
            >
              Data Sources & Links
            </button>
            <button
              onClick={() => setActiveDataSection('rainfall')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'rainfall'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#80978E] hover:text-white'
              }`}
            >
              IMD Rainfall
            </button>
            <button
              onClick={() => setActiveDataSection('enso')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'enso'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#80978E] hover:text-white'
              }`}
            >
              NOAA CPC ONI
            </button>
            <button
              onClick={() => setActiveDataSection('satellite')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'satellite'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#80978E] hover:text-white'
              }`}
            >
              Sentinel-2 (8 Ch)
            </button>
            <button
              onClick={() => setActiveDataSection('audit')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeDataSection === 'audit'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#80978E] hover:text-white'
              }`}
            >
              Baseline Yield Audit
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: VERIFIED REAL-WORLD SOURCES */}
      {activeDataSection === 'sources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source 1: NOAA CPC ONI */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Climate Forcing Input</span>
                  <h3 className="text-base font-bold text-white mt-0.5">NOAA Climate Prediction Center (CPC)</h3>
                </div>
                <a
                  href="https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#22C55E] hover:text-white hover:border-[#22C55E] transition-colors"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-[#A4B8AF] leading-relaxed">
                Oceanic Niño Index (ONI) based on ERSST.v5 SST anomalies in the Niño 3.4 equatorial Pacific box (5°N–5°S, 120°W–170°W). Used as the macro-climate forcing variable across all Kharif seasons.
              </p>
              <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#80978E] space-y-1">
                <div className="flex justify-between">
                  <span>Parameter:</span>
                  <span className="text-white">3-Month Running Mean SST Anomaly (°C)</span>
                </div>
                <div className="flex justify-between">
                  <span>Coverage:</span>
                  <span className="text-white">Monthly series (1950–Present)</span>
                </div>
              </div>
            </div>

            {/* Source 2: IMD Gridded Rainfall */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-semibold">Precipitation Input</span>
                  <h3 className="text-base font-bold text-white mt-0.5">India Meteorological Department (IMD)</h3>
                </div>
                <a
                  href="https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#22C55E] hover:text-white hover:border-[#22C55E] transition-colors"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-[#A4B8AF] leading-relaxed">
                National Climate Centre (IMD Pune) 0.25° × 0.25° high-resolution daily gridded rainfall dataset (RF25_ind). Processed to compute cumulative June 1 – October 31 Kharif precipitation totals and departure percentages.
              </p>
              <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#80978E] space-y-1">
                <div className="flex justify-between">
                  <span>Spatial Resolution:</span>
                  <span className="text-white">0.25° Latitude × 0.25° Longitude</span>
                </div>
                <div className="flex justify-between">
                  <span>Temporal Interval:</span>
                  <span className="text-white">Daily Cumulative (June–October)</span>
                </div>
              </div>
            </div>

            {/* Source 3: DES Maharashtra Ground Truth */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold">Target / Ground Truth</span>
                  <h3 className="text-base font-bold text-white mt-0.5">DES Maharashtra (Agriculture Dept.)</h3>
                </div>
                <a
                  href="https://agri.maharashtra.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#22C55E] hover:text-white hover:border-[#22C55E] transition-colors"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-[#A4B8AF] leading-relaxed">
                Directorate of Economics and Statistics (Govt. of Maharashtra) official crop area, production, and yield (APY) statistics for Kharif rice (2015–2022) across the 24 primary rice-growing districts.
              </p>
              <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#80978E] space-y-1">
                <div className="flex justify-between">
                  <span>Target Metric:</span>
                  <span className="text-white">District Kharif Rice Yield (kg/ha)</span>
                </div>
                <div className="flex justify-between">
                  <span>Failure Threshold:</span>
                  <span className="text-[#D93838] font-bold">&gt;10% Deficit below prior baseline</span>
                </div>
              </div>
            </div>

            {/* Source 4: Copernicus Sentinel-2 & ESA WorldCover */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#091410] border border-[#14261F] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-semibold">Satellite Imagery Input</span>
                  <h3 className="text-base font-bold text-white mt-0.5">ESA Copernicus & WorldCover</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://browser.dataspace.copernicus.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#060D0A] border border-[#14261F] text-[11px] font-mono text-[#22C55E] hover:text-white hover:border-[#22C55E] transition-colors"
                  >
                    <span>Copernicus</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://worldcover2020.esa.int"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#060D0A] border border-[#14261F] text-[11px] font-mono text-[#22C55E] hover:text-white hover:border-[#22C55E] transition-colors"
                  >
                    <span>WorldCover</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <p className="text-xs text-[#A4B8AF] leading-relaxed">
                Sentinel-2 Level-2A surface reflectance tiles (8 multi-spectral channels at 10m/20m GSD) sampled over verified agricultural parcels using the ESA WorldCover 10m Class 40 cropland purity mask (≥70% purity).
              </p>
              <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#80978E] space-y-1">
                <div className="flex justify-between">
                  <span>Input Tensor Dimensions:</span>
                  <span className="text-white">[Batch, 6 Steps, 8 Bands, 32, 32]</span>
                </div>
                <div className="flex justify-between">
                  <span>Cadastral Mask:</span>
                  <span className="text-white">ESA WorldCover 10m Class 40 (Cropland)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: IMD MONSOON RAINFALL */}
      {activeDataSection === 'rainfall' && (
        <div className="bg-[#091410] border border-[#14261F] rounded-2xl overflow-hidden shadow-xs space-y-0 w-full">
          <div className="p-4 sm:p-5 border-b border-[#14261F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">IMD Kharif In-Season Rainfall Profiles (mm)</h3>
              <p className="text-xs text-[#80978E] mt-0.5">
                Processed from IMD 0.25° NetCDF grids strictly within June 1 – October 31 Kharif seasons.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-[#060D0A] px-3 py-1.5 rounded-xl border border-[#14261F]">
              <span className="text-[#80978E]">SELECT YEAR:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-mono focus:outline-hidden cursor-pointer"
              >
                {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022].map(y => (
                  <option key={y} value={y} className="bg-[#060D0A]">{y}</option>
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
                  <th className="py-3 px-3 text-right">Departure</th>
                  <th className="py-3 px-4 text-right">Grid Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14261F]">
                {rainfallForSelectedYear.map(row => {
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
                      <td className="py-2.5 px-3 text-right text-white tabular-nums font-bold">{row.kharifRainfallMm.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right text-[#80978E] tabular-nums">{meanRainfall.toFixed(1)}</td>
                      <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                        departure < -20 ? 'text-[#D93838]' : departure < 0 ? 'text-amber-400' : 'text-[#22C55E]'
                      }`}>
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

      {/* SECTION 3: NOAA ONI EL NINO */}
      {activeDataSection === 'enso' && (
        <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#14261F]">
            <h3 className="text-base font-bold text-white">NOAA CPC Oceanic Niño Index (ONI) 2015–2022</h3>
            <p className="text-xs text-[#80978E] mt-0.5">
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
                      ? 'bg-[#281313] border-[#4D1D1D]'
                      : rec.ensoPhase === 'Weak El Niño'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#060D0A] border-[#14261F]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono mb-2">
                    <span className="text-lg font-bold text-white">{rec.year}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      isElNino
                        ? 'bg-[#401818] text-[#D93838]'
                        : rec.ensoPhase === 'Weak El Niño'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-[#0E281F] text-[#22C55E]'
                    }`}>
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
                      <span className={isElNino ? 'text-[#D93838] font-bold' : 'text-white'}>
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

      {/* SECTION 4: SATELLITE 8 CHANNELS */}
      {activeDataSection === 'satellite' && (
        <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#14261F]">
            <h3 className="text-base font-bold text-white">
              8-Channel Multi-Spectral Spatial Tensor Specification
            </h3>
            <p className="text-xs text-[#80978E] font-mono mt-0.5">
              Input Spatial Tensor: X_spatial &isin; R^(B &times; 6 &times; 8 &times; 32 &times; 32)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SENTINEL2_8_CHANNELS.map((ch, idx) => (
              <div key={ch.band} className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono">
                <div className="flex items-center justify-between text-[#22C55E] mb-1">
                  <span className="font-bold text-sm">Channel {idx + 1}: {ch.band}</span>
                  <span className="text-[10px] text-[#80978E]">{ch.spatialResolutionM}m GSD</span>
                </div>
                <div className="text-white font-sans font-semibold">{ch.name}</div>
                {ch.wavelengthNm > 0 && (
                  <div className="text-[11px] text-[#80978E] mt-0.5">&lambda; &approx; {ch.wavelengthNm} nm</div>
                )}
                <p className="text-[11px] text-[#80978E] font-sans mt-2.5 leading-relaxed border-t border-[#14261F] pt-2">
                  {ch.spectralRole}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: COMPACT BASELINE YIELD AUDIT */}
      {activeDataSection === 'audit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
              <div className="text-[11px] font-mono text-[#7A9187] uppercase">Modeled Rice Belts</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">24</span>
                <span className="text-[10px] text-[#7A9187] font-mono">/ 36 districts</span>
              </div>
              <p className="text-[10px] text-[#6A8177] mt-1">Konkan and eastern Vidarbha paddy belts</p>
            </div>

            <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
              <div className="text-[11px] font-mono text-[#7A9187] uppercase">Verified Time Horizon</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">8</span>
                <span className="text-[10px] text-[#7A9187] font-mono">Years (2015–2022)</span>
              </div>
              <p className="text-[10px] text-[#6A8177] mt-1">192 district-year DES records</p>
            </div>

            <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
              <div className="text-[11px] font-mono text-[#7A9187] uppercase">Strict 5-Yr Baseline</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#22C55E]">72</span>
                <span className="text-[10px] text-[#7A9187] font-mono">Samples</span>
              </div>
              <p className="text-[10px] text-[#6A8177] mt-1">2020, 2021, and 2022 evaluations</p>
            </div>

            <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
              <div className="text-[11px] font-mono text-[#7A9187] uppercase">Expanding Baseline</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#38BDF8]">120</span>
                <span className="text-[10px] text-[#7A9187] font-mono">Samples</span>
              </div>
              <p className="text-[10px] text-[#6A8177] mt-1">2018–2022 evaluations (t &ge; 3 prior)</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F] text-[#A4B8AF] text-xs leading-relaxed space-y-1">
            <span className="text-white font-bold block">Methodology: Zero Target-Year Leakage</span>
            <p>
              Under verified DES data, a genuine historical baseline requires preceding years (t-1, ..., t-k). The target-year yield cannot be included in baseline calculation without introducing lookahead bias.
            </p>
          </div>

          {/* Labeled Dataset Table */}
          <div className="border border-[#14261F] rounded-2xl overflow-hidden bg-[#091410] shadow-xs">
            <div className="p-4 border-b border-[#14261F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Ground-Truth Labeled District Records ({filteredLabels.length} shown)
                </h4>
                <p className="text-xs text-[#80978E] mt-0.5">
                  Failure Event threshold: DES actual yield &lt; -10.0% below prior baseline
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#060D0A] border border-[#14261F]">
                <button
                  onClick={() => setBaselineView('strict')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    baselineView === 'strict'
                      ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                      : 'text-[#80978E] hover:text-white'
                  }`}
                >
                  Strict 5-Yr (72)
                </button>
                <button
                  onClick={() => setBaselineView('expanding')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    baselineView === 'expanding'
                      ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                      : 'text-[#80978E] hover:text-white'
                  }`}
                >
                  Expanding (120)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
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
                        <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isFail ? 'text-[#D93838]' : 'text-[#22C55E]'}`}>
                          {row.yieldAnomalyPct > 0 ? `+${row.yieldAnomalyPct}%` : `${row.yieldAnomalyPct}%`}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFail
                              ? 'bg-[#2E1212] text-[#D93838] border border-[#591C1C]'
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
      )}
    </div>
  );
};
