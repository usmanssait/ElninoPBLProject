import React from 'react';
import { ExternalLink, Database, Layers, CloudRain, Thermometer, FileText } from 'lucide-react';
import { SENTINEL2_8_CHANNELS, TENSOR_SPEC } from '../data/satelliteSpec';

export const DataSourcesPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Header */}
      <div className="pb-2 border-b border-[#14261F]/60">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Data Sources, Portals & Engineering Ledger
        </h1>
        <p className="text-xs text-[#80978E] mt-0.5 font-medium">
          Authoritative meteorological, agricultural, and satellite observation data streams supporting the CNN-LSTM pipeline
        </p>
      </div>

      {/* 4 Source Cards */}
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
              href="https://data.desagri.gov.in"
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
              <span className="text-[#EF4444] font-bold">&gt;10% Deficit below prior baseline</span>
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
            Sentinel-2 Level-2A surface reflectance tiles (8 multi-spectral channels at 10m/20m GSD) sampled over verified agricultural parcels using the ESA WorldCover 10m Class 40 cropland purity mask (&ge;70% purity).
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

      {/* 8 Spectral Bands Table */}
      <div className="rounded-2xl border border-[#14261F] bg-[#091410] p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-white">
          8-Spectral Band Input Layer Specification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SENTINEL2_8_CHANNELS.map((ch, idx) => (
            <div key={ch.band} className="p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono">
              <div className="flex items-center justify-between text-[#22C55E] mb-1">
                <span className="font-bold text-xs">Channel {idx + 1}: {ch.band}</span>
                <span className="text-[10px] text-[#7A9187]">{ch.spatialResolutionM}m GSD</span>
              </div>
              <div className="text-white font-sans font-semibold text-xs">{ch.name}</div>
              <p className="text-[11px] text-[#80978E] font-sans mt-2 leading-relaxed border-t border-[#14261F] pt-1.5">
                {ch.spectralRole}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
