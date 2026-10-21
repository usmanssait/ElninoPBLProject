import React from 'react';
import { ExternalLink } from 'lucide-react';
import { SENTINEL2_8_CHANNELS } from '../data/satelliteSpec';
import { useAppTheme } from '../context/ThemeContext';

export const DataSourcesPage: React.FC = () => {
  const { isDark } = useAppTheme();

  return (
    <div className={`space-y-4 max-w-[1720px] mx-auto pb-12 w-full overflow-hidden ${isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'}`}>
      {/* Header */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <h1 className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
          Data Sources, Portals & Engineering Ledger
        </h1>
        <p className={`text-xs mt-1 font-medium ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
          Authoritative meteorological, agricultural, and satellite observation data streams supporting the CNN-LSTM pipeline
        </p>
      </div>

      {/* 4 Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source 1: NOAA CPC ONI */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-3 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                  isDark
                    ? 'bg-[#352A12] text-amber-300 border-[#604D20]'
                    : 'bg-[#FEF3C7] text-amber-800 border-[#FDE68A]'
                }`}
              >
                Climate Forcing Input
              </span>
              <h3 className={`text-base font-bold mt-1.5 font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                NOAA Climate Prediction Center (CPC)
              </h3>
            </div>
            <a
              href="https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors shadow-2xs font-semibold ${
                isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E] hover:bg-[#0E241C]'
                  : 'bg-white border-[#CCD2C4] text-[#12382B] hover:bg-[#12382B] hover:text-white'
              }`}
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            Oceanic Niño Index (ONI) based on ERSST.v5 SST anomalies in the Niño 3.4 equatorial Pacific box (5°N–5°S, 120°W–170°W). Used as the macro-climate forcing variable across all Kharif seasons.
          </p>
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 shadow-2xs ${
              isDark ? 'bg-[#060D0A] border-[#14261F] text-[#7A9187]' : 'bg-white border-[#CCD2C4] text-[#526458]'
            }`}
          >
            <div className="flex justify-between">
              <span>Parameter:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>3-Month Running Mean SST Anomaly (°C)</span>
            </div>
            <div className="flex justify-between">
              <span>Coverage:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>Monthly series (1950–Present)</span>
            </div>
          </div>
        </div>

        {/* Source 2: IMD Gridded Rainfall */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-3 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                  isDark
                    ? 'bg-[#0E2A3A] text-[#38BDF8] border-[#1B4D66]'
                    : 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                }`}
              >
                Precipitation Input
              </span>
              <h3 className={`text-base font-bold mt-1.5 font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                India Meteorological Department (IMD)
              </h3>
            </div>
            <a
              href="https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors shadow-2xs font-semibold ${
                isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E] hover:bg-[#0E241C]'
                  : 'bg-white border-[#CCD2C4] text-[#12382B] hover:bg-[#12382B] hover:text-white'
              }`}
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            National Climate Centre (IMD Pune) 0.25° × 0.25° high-resolution daily gridded rainfall dataset (RF25_ind). Processed to compute cumulative June 1 – October 31 Kharif precipitation totals and departure percentages.
          </p>
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 shadow-2xs ${
              isDark ? 'bg-[#060D0A] border-[#14261F] text-[#7A9187]' : 'bg-white border-[#CCD2C4] text-[#526458]'
            }`}
          >
            <div className="flex justify-between">
              <span>Spatial Resolution:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>0.25° Latitude × 0.25° Longitude</span>
            </div>
            <div className="flex justify-between">
              <span>Temporal Interval:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>Daily Cumulative (June–October)</span>
            </div>
          </div>
        </div>

        {/* Source 3: DES Maharashtra Ground Truth */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-3 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                  isDark
                    ? 'bg-[#0E2E1E] text-[#4ADE80] border-[#1A4C32]'
                    : 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                }`}
              >
                Target / Ground Truth
              </span>
              <h3 className={`text-base font-bold mt-1.5 font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                DES Maharashtra (Agriculture Dept.)
              </h3>
            </div>
            <a
              href="https://data.desagri.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors shadow-2xs font-semibold ${
                isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E] hover:bg-[#0E241C]'
                  : 'bg-white border-[#CCD2C4] text-[#12382B] hover:bg-[#12382B] hover:text-white'
              }`}
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            Directorate of Economics and Statistics (Govt. of Maharashtra) official crop area, production, and yield (APY) statistics for Kharif rice (2015–2022) across the 24 primary rice-growing districts.
          </p>
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 shadow-2xs ${
              isDark ? 'bg-[#060D0A] border-[#14261F] text-[#7A9187]' : 'bg-white border-[#CCD2C4] text-[#526458]'
            }`}
          >
            <div className="flex justify-between">
              <span>Target Metric:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>District Kharif Rice Yield (kg/ha)</span>
            </div>
            <div className="flex justify-between">
              <span>Failure Threshold:</span>
              <span className="text-[#F87171] font-bold">&gt;10% Deficit below prior baseline</span>
            </div>
          </div>
        </div>

        {/* Source 4: Copernicus Sentinel-2 & ESA WorldCover */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-3 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                  isDark
                    ? 'bg-[#0E2A3A] text-[#38BDF8] border-[#1B4D66]'
                    : 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                }`}
              >
                Satellite Imagery Input
              </span>
              <h3 className={`text-base font-bold mt-1.5 font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                ESA Copernicus & WorldCover
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://browser.dataspace.copernicus.eu"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors shadow-2xs font-semibold ${
                  isDark
                    ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E] hover:bg-[#0E241C]'
                    : 'bg-white border-[#CCD2C4] text-[#12382B] hover:bg-[#12382B] hover:text-white'
                }`}
              >
                <span>Copernicus</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://worldcover2020.esa.int"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors shadow-2xs font-semibold ${
                  isDark
                    ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E] hover:bg-[#0E241C]'
                    : 'bg-white border-[#CCD2C4] text-[#12382B] hover:bg-[#12382B] hover:text-white'
                }`}
              >
                <span>WorldCover</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            Sentinel-2 Level-2A surface reflectance tiles (8 multi-spectral channels at 10m/20m GSD) sampled over verified agricultural parcels using the ESA WorldCover 10m Class 40 cropland purity mask (&ge;70% purity).
          </p>
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 shadow-2xs ${
              isDark ? 'bg-[#060D0A] border-[#14261F] text-[#7A9187]' : 'bg-white border-[#CCD2C4] text-[#526458]'
            }`}
          >
            <div className="flex justify-between">
              <span>Input Tensor Dimensions:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>[Batch, 6 Steps, 8 Bands, 32, 32]</span>
            </div>
            <div className="flex justify-between">
              <span>Cadastral Mask:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>ESA WorldCover 10m Class 40 (Cropland)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Spectral Bands Table */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-3 ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <h3 className={`text-sm font-bold font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
          8-Spectral Band Input Layer Specification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SENTINEL2_8_CHANNELS.map((ch, idx) => (
            <div
              key={ch.band}
              className={`p-3.5 rounded-xl border text-xs font-mono shadow-2xs ${
                isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-xs ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>
                  Channel {idx + 1}: {ch.band}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
                  {ch.spatialResolutionM}m GSD
                </span>
              </div>
              <div className={`font-sans font-semibold text-xs ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                {ch.name}
              </div>
              <p
                className={`text-[11px] font-sans mt-2 leading-relaxed border-t pt-1.5 ${
                  isDark ? 'border-[#14261F] text-[#7A9187]' : 'border-[#CCD2C4] text-[#526458]'
                }`}
              >
                {ch.spectralRole}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
