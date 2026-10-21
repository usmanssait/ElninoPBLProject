import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, FileCode2, Play, Download, ExternalLink, Cpu, Layers } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { PYTHON_VISUALIZE_RESULTS_PY, PYTHON_STREAMLIT_APP_PY } from '../data/pythonEventCode';

export const ProjectScriptsInspectorView: React.FC = () => {
  const { isDark } = useAppTheme();
  const [activeScript, setActiveScript] = useState<'process_rainfall' | 'app' | 'visualize' | 'compare' | 'check' | 'bat'>('process_rainfall');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const scriptsData = {
    process_rainfall: {
      filename: 'process_all_rainfall.py',
      path: 'Python/process_all_rainfall.py',
      description: 'Extracts 0.25° IMD gridded NetCDF daily rainfall across 28 Maharashtra districts for Kharif seasons (June 1 – October 31) across 2015–2022.',
      highlights: [
        'GeoPandas spatial point-in-polygon containment test per district',
        'Generates lat/lon meshgrid for Maharashtra (lat: 15.5°–22.0°N, lon: 72.5°–80.0°E)',
        'Computes nanmean across grid cells followed by nansum for seasonal total mm',
        'Standardizes names (Ahilyanagar District ↔ Ahilyanagar, Gondiya ↔ Gondia)',
        'Saves verified Output/imd_district_kharif_rainfall_2015_2022.csv (224 district-years)',
      ],
      code: `from pathlib import Path
import geopandas as gpd
import pandas as pd
import xarray as xr
import numpy as np
import re

# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT = Path(r"C:\\Users\\SALMAN\\Desktop\\Usman ELNINO Project")
RAINFALL_DIR = PROJECT / "InputData" / "Yearly gridded Rainfall Files"
BOUNDARY_FILE = PROJECT / "InputData" / "District Bounds json" / "Maharashtra.Districts.geojson"
OUTPUT_FILE = PROJECT / "Output" / "imd_district_kharif_rainfall_2015_2022.csv"
DES_FILE = PROJECT / "InputData" / "2015-2023 DES Kharif Rice Data maharashtra" / "des_rice_maharashtra_kharif_final.csv"

# ============================================================
# 2. LOAD DISTRICT BOUNDARIES & DES DISTRICTS
# ============================================================

districts = gpd.read_file(BOUNDARY_FILE)
districts = districts[districts.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].copy()

des = pd.read_csv(DES_FILE)
des_districts = sorted(des["district"].dropna().unique())

name_mapping = {
    "Ahilyanagar": "Ahilyanagar District",
    "Gondia": "Gondiya"
}

boundary_names = [name_mapping.get(name, name) for name in des_districts]
districts = districts[districts["name"].isin(boundary_names)].copy()

# ============================================================
# 3. PREPARE 0.25° IMD GRID COORDINATES
# ============================================================

latitudes = np.arange(15.5, 22.0 + 0.25, 0.25)
longitudes = np.arange(72.5, 80.0 + 0.25, 0.25)
lon_grid, lat_grid = np.meshgrid(longitudes, latitudes)

grid_points = gpd.GeoDataFrame(
    {"latitude": lat_grid.ravel(), "longitude": lon_grid.ravel()},
    geometry=gpd.points_from_xy(lon_grid.ravel(), lat_grid.ravel()),
    crs="EPSG:4326"
)

# ============================================================
# 4. PROCESS ALL YEARS (JUNE 1 - OCTOBER 31 KHARIF WINDOW)
# ============================================================

rainfall_files = sorted(RAINFALL_DIR.rglob("RF25_ind*_rfp25.nc"))
all_results = []

for rainfall_file in rainfall_files:
    match = re.search(r"RF25_ind(\\d{4})_rfp25\\.nc", rainfall_file.name)
    if not match:
        continue
    year = int(match.group(1))
    crop_year = f"{year}-{str(year + 1)[-2:]}"

    with xr.open_dataset(rainfall_file) as ds:
        rainfall = ds["RAINFALL"]
        start_date = f"{year}-06-01"
        end_date = f"{year}-10-31"

        kharif_rainfall = rainfall.sel(TIME=slice(start_date, end_date))
        maharashtra_rainfall = kharif_rainfall.sel(
            LATITUDE=slice(15.5, 22.0),
            LONGITUDE=slice(72.5, 80.0)
        )

        for _, district in districts.iterrows():
            district_name = district["name"]
            inside_points = grid_points[grid_points.geometry.within(district.geometry)].copy()
            if len(inside_points) == 0:
                continue

            lat_idx = [np.abs(latitudes - lat).argmin() for lat in inside_points["latitude"]]
            lon_idx = [np.abs(longitudes - lon).argmin() for lon in inside_points["longitude"]]

            district_values = maharashtra_rainfall.values[:, lat_idx, lon_idx]
            daily_average = np.nanmean(district_values, axis=1)
            total_rainfall = np.nansum(daily_average)

            all_results.append({
                "district": district_name,
                "year": crop_year,
                "kharif_rainfall_mm": float(total_rainfall),
                "grid_points_used": len(inside_points)
            })

result_df = pd.DataFrame(all_results)
result_df["district"] = result_df["district"].replace({
    "Ahilyanagar District": "Ahilyanagar",
    "Gondiya": "Gondia"
})
result_df = result_df.sort_values(["district", "year"]).reset_index(drop=True)
result_df.to_csv(OUTPUT_FILE, index=False)`
    },
    app: {
      filename: 'app.py',
      path: 'Python/app.py',
      description: 'Streamlit Web Analytics Console implementing the custom agricultural color theme, SVG icon system, KPI metric cards, and tri-modal spatial visualization (Rainfall, Yield, and Crop Failure Events).',
      highlights: [
        'Color theme palette: #232A20 (Deep Green), #8B8C5A (Olive Gold), #F1E9D9 (Cream), #71658C (Rainfall Lavender), #B83A3A (Failure Crimson)',
        'Tri-modal choropleth comparison: side-by-side Rainfall, Rice Yield, and Crop Failure Events',
        'Zero target-year leakage: baseline calculated strictly from prior years',
        'Robust path resolution avoiding hardcoded absolute directories',
        'District event telemetry ledger with color-coded failure warnings',
      ],
      code: PYTHON_STREAMLIT_APP_PY,
    },
    visualize: {
      filename: 'visualize_results.py',
      path: 'Python/visualize_results.py',
      description: 'Complete choropleth mapping engine implementing create_rainfall_map(), create_yield_map(), and the new create_event_map() with EVENT_CMAP and EVENT_ANOMALY_CMAP.',
      highlights: [
        'create_event_map(): renders Discrete Crop Failure Flags (< -10%), Continuous Yield Anomaly %, and Compound Multi-Hazard Risk',
        'EVENT_CMAP: custom themed gradient [#4A6B46, #8B9E5A, #DCA44E, #C75836, #8F2420] matching #232A20 dashboard aesthetic',
        'EVENT_CATEGORICAL_COLORS: distinct thematic patches for Resilient (#526E4D) and Failure Event (#B83A3A)',
        '_resolve_path() pattern: dynamically locates files across current, parent, or environment override paths',
        'make_valid() fallback for Shapely/GeoPandas geometry sanity with zero-padding on flat color ranges',
      ],
      code: PYTHON_VISUALIZE_RESULTS_PY,
    },
    compare: {
      filename: 'compare_districts.py',
      path: 'Python/compare_districts.py',
      description: 'Audit script matching DES district records against GeoJSON boundaries to verify coverage.',
      highlights: [
        'Confirmed 28 study districts matched cleanly between DES and Maharashtra.Districts.geojson',
        'Explicit mapping for Ahilyanagar District and Gondiya',
      ],
      code: `import geopandas as gpd
import pandas as pd

boundary_file = r"InputData/District Bounds json/Maharashtra.Districts.geojson"
des_file = r"InputData/2015-2023 DES Kharif Rice Data maharashtra/des_rice_maharashtra_kharif_final.csv"

gdf = gpd.read_file(boundary_file)
des = pd.read_csv(des_file)

boundary_districts = sorted(gdf["name"].dropna().unique())
des_districts = sorted(des["district"].dropna().unique())

name_mapping = {
    "Ahilyanagar": "Ahilyanagar District",
    "Gondia": "Gondiya"
}

matched = [d for d in des_districts if name_mapping.get(d, d) in set(boundary_districts)]
print(f"Matched: {len(matched)} / {len(des_districts)} districts")`
    },
    check: {
      filename: 'check_districts.py',
      path: 'Python/check_districts.py',
      description: 'Inspects GeoJSON properties, geometry types, and feature counts in Maharashtra.Districts.geojson.',
      highlights: [
        'Inspects total features, columns, and geometry breakdown',
        'Dumps clean list of district names in GeoJSON',
      ],
      code: `import geopandas as gpd

file = r"InputData/District Bounds json/Maharashtra.Districts.geojson"
gdf = gpd.read_file(file)

print("Total features:", len(gdf))
print("Columns:", gdf.columns.tolist())
print("Geometry types:\\n", gdf.geometry.geom_type.value_counts())
for name in gdf["name"].dropna().unique():
    print(name)`
    },
    bat: {
      filename: 'run_app.bat',
      path: 'Python/run_app.bat',
      description: 'Windows 11 Batch launcher script to start Streamlit application with single click.',
      highlights: [
        'Changes directory to Python root and runs Streamlit on local port',
        'Works completely offline on local machine without internet connection',
      ],
      code: `@echo off
title Crop Failure Prediction App

cd /d "%~dp0"

echo Starting Crop Failure Prediction App...
echo.

python -m streamlit run app.py

pause`
    }
  };

  const current = scriptsData[activeScript];

  return (
    <div className={`space-y-6 max-w-7xl mx-auto pb-12 ${isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'}`}>
      {/* Title Banner */}
      <div
        className={`border rounded-2xl p-6 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`font-semibold tracking-wider uppercase ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>
                Local Execution Engine
              </span>
              <span aria-hidden="true" className={isDark ? 'text-[#3E5146]' : 'text-[#889B8F]'}>·</span>
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Preprocessing, Mapping & Streamlit</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Project Python Scripts & Data Pipeline
            </h1>
            <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Standalone Python data engineering and spatial choropleth scripts built for local execution without external cloud dependencies.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold shadow-2xs ${
                isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E]'
                  : 'bg-white border-[#CCD2C4] text-[#12382B]'
              }`}
            >
              Standalone Python 3.11
            </span>
          </div>
        </div>

        {/* Script Selector Tabs */}
        <div className={`flex flex-wrap items-center gap-2 mt-6 pt-5 border-t ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
          {(Object.keys(scriptsData) as Array<keyof typeof scriptsData>).map(key => {
            const item = scriptsData[key];
            const isActive = activeScript === key;
            return (
              <button
                key={key}
                onClick={() => setActiveScript(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-[#0E241C] text-[#22C55E] border border-[#22C55E]/40 font-bold shadow-xs'
                      : 'bg-[#12382B] text-white font-bold shadow-xs'
                    : isDark
                    ? 'text-[#7A9187] hover:text-white bg-[#060D0A] border border-[#14261F]'
                    : 'text-[#526458] hover:text-[#16221B] bg-white border border-[#CCD2C4]'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{item.filename}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Script Detail Card */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold font-mono flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                <span>{current.filename}</span>
              </h3>
              <span className={`text-[11px] font-mono ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>({current.path})</span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>{current.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(current.code, activeScript)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer shadow-2xs border ${
                isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E] hover:bg-[#0E241C]'
                  : 'bg-white hover:bg-[#12382B] hover:text-white text-[#12382B] border-[#CCD2C4]'
              }`}
            >
              {copied === activeScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[#22C55E]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Technical Highlights */}
        <div
          className={`p-4 rounded-xl border text-xs shadow-2xs ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
          }`}
        >
          <div className={`text-xs font-bold mb-2 flex items-center gap-1.5 font-mono ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
            <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
            <span>Key Computational Workflow:</span>
          </div>
          <ul className={`space-y-1 pl-4 list-disc ${isDark ? 'text-[#7A9187] marker:text-[#22C55E]' : 'text-[#526458] marker:text-[#12382B]'}`}>
            {current.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>

        {/* Code Content Box */}
        <div className={`relative rounded-xl overflow-hidden border ${isDark ? 'border-[#14261F] bg-[#060D0A]' : 'border-[#CCD2C4] bg-[#0E1712]'}`}>
          <div className={`flex items-center justify-between px-4 py-2 border-b text-[11px] font-mono ${isDark ? 'bg-[#040806] border-[#14261F] text-[#7A9187]' : 'bg-[#080E0B] border-[#1A2E24] text-[#80978E]'}`}>
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[#22C55E]" />
              <span>Python 3.11</span>
            </span>
            <span>{current.code.split('\n').length} lines</span>
          </div>
          <pre className="p-4 text-xs font-mono text-[#D4E2D9] overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
            <code>{current.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

