import React from 'react';
import { ExternalLink } from 'lucide-react';
import { SENTINEL2_8_CHANNELS } from '../data/satelliteSpec';

export const DataSourcesPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B] pb-12 w-full overflow-hidden">
      {/* Header */}
      <div className="bg-[#E2E6DC] border border-[#CCD2C4] rounded-2xl p-4 sm:p-5 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
          Data Sources, Portals & Engineering Ledger
        </h1>
        <p className="text-xs text-[#526458] mt-1 font-medium">
          Authoritative meteorological, agricultural, and satellite observation data streams supporting the CNN-LSTM pipeline
        </p>
      </div>

      {/* 4 Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source 1: NOAA CPC ONI */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-800 bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded uppercase font-semibold">Climate Forcing Input</span>
              <h3 className="text-base font-bold text-[#16221B] mt-1.5 font-serif">NOAA Climate Prediction Center (CPC)</h3>
            </div>
            <a
              href="https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#12382B] hover:bg-[#12382B] hover:text-white transition-colors shadow-2xs font-semibold"
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs text-[#526458] leading-relaxed">
            Oceanic Niño Index (ONI) based on ERSST.v5 SST anomalies in the Niño 3.4 equatorial Pacific box (5°N–5°S, 120°W–170°W). Used as the macro-climate forcing variable across all Kharif seasons.
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#526458] space-y-1 shadow-2xs">
            <div className="flex justify-between">
              <span>Parameter:</span>
              <span className="text-[#16221B] font-bold">3-Month Running Mean SST Anomaly (°C)</span>
            </div>
            <div className="flex justify-between">
              <span>Coverage:</span>
              <span className="text-[#16221B] font-bold">Monthly series (1950–Present)</span>
            </div>
          </div>
        </div>

        {/* Source 2: IMD Gridded Rainfall */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#0284C7] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded uppercase font-semibold">Precipitation Input</span>
              <h3 className="text-base font-bold text-[#16221B] mt-1.5 font-serif">India Meteorological Department (IMD)</h3>
            </div>
            <a
              href="https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#12382B] hover:bg-[#12382B] hover:text-white transition-colors shadow-2xs font-semibold"
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs text-[#526458] leading-relaxed">
            National Climate Centre (IMD Pune) 0.25° × 0.25° high-resolution daily gridded rainfall dataset (RF25_ind). Processed to compute cumulative June 1 – October 31 Kharif precipitation totals and departure percentages.
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#526458] space-y-1 shadow-2xs">
            <div className="flex justify-between">
              <span>Spatial Resolution:</span>
              <span className="text-[#16221B] font-bold">0.25° Latitude × 0.25° Longitude</span>
            </div>
            <div className="flex justify-between">
              <span>Temporal Interval:</span>
              <span className="text-[#16221B] font-bold">Daily Cumulative (June–October)</span>
            </div>
          </div>
        </div>

        {/* Source 3: DES Maharashtra Ground Truth */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded uppercase font-semibold">Target / Ground Truth</span>
              <h3 className="text-base font-bold text-[#16221B] mt-1.5 font-serif">DES Maharashtra (Agriculture Dept.)</h3>
            </div>
            <a
              href="https://data.desagri.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#12382B] hover:bg-[#12382B] hover:text-white transition-colors shadow-2xs font-semibold"
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs text-[#526458] leading-relaxed">
            Directorate of Economics and Statistics (Govt. of Maharashtra) official crop area, production, and yield (APY) statistics for Kharif rice (2015–2022) across the 24 primary rice-growing districts.
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#526458] space-y-1 shadow-2xs">
            <div className="flex justify-between">
              <span>Target Metric:</span>
              <span className="text-[#16221B] font-bold">District Kharif Rice Yield (kg/ha)</span>
            </div>
            <div className="flex justify-between">
              <span>Failure Threshold:</span>
              <span className="text-[#DC2626] font-bold">&gt;10% Deficit below prior baseline</span>
            </div>
          </div>
        </div>

        {/* Source 4: Copernicus Sentinel-2 & ESA WorldCover */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#0284C7] bg-[#E0F2FE] border border-[#BAE6FD] px-2 py-0.5 rounded uppercase font-semibold">Satellite Imagery Input</span>
              <h3 className="text-base font-bold text-[#16221B] mt-1.5 font-serif">ESA Copernicus & WorldCover</h3>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://browser.dataspace.copernicus.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-[11px] font-mono text-[#12382B] hover:bg-[#12382B] hover:text-white transition-colors shadow-2xs font-semibold"
              >
                <span>Copernicus</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://worldcover2020.esa.int"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-[11px] font-mono text-[#12382B] hover:bg-[#12382B] hover:text-white transition-colors shadow-2xs font-semibold"
              >
                <span>WorldCover</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p className="text-xs text-[#526458] leading-relaxed">
            Sentinel-2 Level-2A surface reflectance tiles (8 multi-spectral channels at 10m/20m GSD) sampled over verified agricultural parcels using the ESA WorldCover 10m Class 40 cropland purity mask (&ge;70% purity).
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#526458] space-y-1 shadow-2xs">
            <div className="flex justify-between">
              <span>Input Tensor Dimensions:</span>
              <span className="text-[#16221B] font-bold">[Batch, 6 Steps, 8 Bands, 32, 32]</span>
            </div>
            <div className="flex justify-between">
              <span>Cadastral Mask:</span>
              <span className="text-[#16221B] font-bold">ESA WorldCover 10m Class 40 (Cropland)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Spectral Bands Table */}
      <div className="rounded-2xl border border-[#CCD2C4] bg-[#E2E6DC] p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#16221B] font-serif">
          8-Spectral Band Input Layer Specification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SENTINEL2_8_CHANNELS.map((ch, idx) => (
            <div key={ch.band} className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono shadow-2xs">
              <div className="flex items-center justify-between text-[#12382B] mb-1">
                <span className="font-bold text-xs">Channel {idx + 1}: {ch.band}</span>
                <span className="text-[10px] text-[#718277]">{ch.spatialResolutionM}m GSD</span>
              </div>
              <div className="text-[#16221B] font-sans font-semibold text-xs">{ch.name}</div>
              <p className="text-[11px] text-[#526458] font-sans mt-2 leading-relaxed border-t border-[#CCD2C4] pt-1.5">
                {ch.spectralRole}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
