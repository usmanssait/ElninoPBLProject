import React from 'react';
import {
  ArrowRight,
  ExternalLink,
  Map,
  Layers,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Compass,
  Database,
  Satellite,
  BarChart2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { ActiveTab } from '../components/Sidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface HomePageProps {
  onLaunchDashboard: (initialTab?: ActiveTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunchDashboard }) => {
  return (
    <div className="min-h-screen bg-[#EAECE4] text-[#1B2A22] font-sans selection:bg-[#12382B] selection:text-white">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Clean Editorial Navigation Bar */}
      {/* ------------------------------------------------------------------- */}
      <header className="border-b border-[#D5D9CE] px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between sticky top-0 bg-[#EAECE4]/90 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#1B2A22] uppercase">
            MAHARASHTRA / KHARIF CROP RISK
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#D9DECFA0] text-[#2F4238] border border-[#CCD2C2]">
            v2.4.0 • PRODUCTION
          </span>
        </div>

        <nav className="flex items-center gap-5 sm:gap-8 text-xs font-medium text-[#46574D]">
          <a
            href="#pipeline"
            className="hidden md:inline-block hover:text-[#1B2A22] transition-colors"
          >
            Pipeline
          </a>
          <a
            href="#metrics"
            className="hidden md:inline-block hover:text-[#1B2A22] transition-colors"
          >
            Metrics
          </a>
          <a
            href="#modules"
            className="hidden md:inline-block hover:text-[#1B2A22] transition-colors"
          >
            Modules
          </a>
          <a
            href="https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 hover:text-[#1B2A22] transition-colors"
          >
            <span>Hugging Face</span>
            <ExternalLink className="w-3 h-3 text-[#62756A]" />
          </a>
          <a
            href="https://github.com/usmanssait/ElninoPBLProject"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 hover:text-[#1B2A22] transition-colors"
          >
            <span>Source</span>
            <ExternalLink className="w-3 h-3 text-[#62756A]" />
          </a>

          {/* Theme Mode Toggle (Light/Dark) */}
          <ThemeToggle />

          {/* Standout Launch CTA */}
          <button
            onClick={() => onLaunchDashboard('overview')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12382B] text-white font-medium hover:bg-[#1A4C3B] transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Hero Section (2-Column Grid Matching User Reference Image) */}
      {/* ------------------------------------------------------------------- */}
      <section className="px-6 sm:px-10 lg:px-16 pt-10 sm:pt-14 pb-14 border-b border-[#D5D9CE]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Tags, Description, CTA Buttons */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider text-[#1B4D3E] bg-[#D8DED0] border border-[#C5CDC0] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4D3E]" />
              SPATIOTEMPORAL AI & REMOTE SENSING • B.TECH CAPSTONE
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#16221B] font-normal tracking-tight leading-[1.08]">
              Maharashtra Kharif Crop Failure Forecaster
            </h1>

            <p className="text-sm sm:text-base text-[#46574D] leading-relaxed max-w-xl">
              An operational spatiotemporal deep-learning early warning platform combining 
              Sentinel-2 multi-spectral satellite imagery, IMD gridded daily rainfall, and NOAA ONI 
              teleconnections to forecast Kharif crop yield collapse across Maharashtra before harvest.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onLaunchDashboard('overview')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#12382B] text-white text-sm font-semibold hover:bg-[#1A4C3B] transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
              >
                <span>Launch Interactive Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onLaunchDashboard('about_project')}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-[#16221B] text-[#16221B] text-sm font-medium hover:bg-[#DDE2D6] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#35483D]" />
                <span>Read Documentation</span>
              </button>

              <a
                href="https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-3 rounded-lg text-xs font-mono font-medium text-[#46574D] hover:text-[#16221B] hover:bg-[#DDE2D6] transition-all"
              >
                <span>Hugging Face Hub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Framed Live Application Preview Card */}
          <div className="lg:col-span-6">
            <div
              onClick={() => onLaunchDashboard('overview')}
              className="group cursor-pointer rounded-2xl bg-[#DCE0D4] border border-[#CCD2C4] p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#12382B]/40 hover:-translate-y-0.5"
            >
              {/* Window Header Dots */}
              <div className="flex items-center justify-between px-2 pb-2.5 border-b border-[#CCD2C4]/70 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#BDC4B6]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#BDC4B6]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#BDC4B6]" />
                </div>
                <span className="font-mono text-[10px] tracking-wider text-[#5C6E64] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  LIVE DECISION SUPPORT PLATFORM
                </span>
                <span className="text-[10px] font-mono text-[#5C6E64] group-hover:text-[#12382B] transition-colors flex items-center gap-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>

              {/* Main Screenshot Preview */}
              <div className="relative rounded-xl overflow-hidden border border-[#CCD2C4] bg-[#060D0A] aspect-[16/10]">
                <img
                  src="/images/dashboard_preview.png"
                  alt="Live Dashboard Interface with Satellite Terrain Basemap"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-semibold text-white drop-shadow-md flex items-center gap-2">
                    <span>Click anywhere to launch full interactive dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="flex items-center justify-between pt-2.5 px-1 font-mono text-[10px] text-[#5C6E64] uppercase">
                <span className="font-bold tracking-wider text-[#2F4238]">
                  GIS DECISION PLATFORM
                </span>
                <span className="tracking-widest">
                  REACT 18 • PYTORCH • SENTINEL-2
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 3. Metric / Highlights Strip (Matching Reference Image '7 stages | Offline | GUI+CLI') */}
      {/* ------------------------------------------------------------------- */}
      <section id="metrics" className="px-6 sm:px-10 lg:px-16 py-12 border-b border-[#D5D9CE] bg-[#E5E8DF]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          <div className="space-y-1.5 border-l-2 border-[#12382B] pl-4">
            <div className="font-serif text-3xl sm:text-4xl text-[#16221B] font-normal">
              6 Crops
            </div>
            <div className="text-xs font-bold text-[#1B4D3E] font-mono uppercase tracking-wider">
              Multi-Crop Conditioning
            </div>
            <p className="text-xs text-[#506257] leading-relaxed">
              Rice, Soybean, Cotton, Bajra, Jowar, and Tur unified into a single spatiotemporal model via 6D identity conditioning.
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-[#12382B] pl-4">
            <div className="font-serif text-3xl sm:text-4xl text-[#16221B] font-normal">
              98.3%
            </div>
            <div className="text-xs font-bold text-[#1B4D3E] font-mono uppercase tracking-wider">
              Disaster Recall (LOSO)
            </div>
            <p className="text-xs text-[#506257] leading-relaxed">
              59 out of 60 historical crop failure seasons correctly caught under strict out-of-season holdout cross-validation.
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-[#12382B] pl-4">
            <div className="font-serif text-3xl sm:text-4xl text-[#16221B] font-normal">
              58 Seasons
            </div>
            <div className="text-xs font-bold text-[#1B4D3E] font-mono uppercase tracking-wider">
              PMFBY Olympic Baselines
            </div>
            <p className="text-xs text-[#506257] leading-relaxed">
              Audited 1966–2023 DES harvest statistics establish rolling 5-year Olympic yield norms with a ≥ 15% deficit failure threshold.
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-[#12382B] pl-4">
            <div className="font-serif text-3xl sm:text-4xl text-[#16221B] font-normal">
              &lt; 35 ms
            </div>
            <div className="text-xs font-bold text-[#1B4D3E] font-mono uppercase tracking-wider">
              Zero-Latency GIS Engine
            </div>
            <p className="text-xs text-[#506257] leading-relaxed">
              Interactive SVG choropleth with gapless dual-resolution Earth Engine terrain basemap covering Maharashtra and Arabian Sea.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. End-to-End System Pipeline (4 Conceptual Stages) */}
      {/* ------------------------------------------------------------------- */}
      <section id="pipeline" className="px-6 sm:px-10 lg:px-16 py-14 border-b border-[#D5D9CE]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="space-y-2 max-w-2xl">
            <span className="font-mono text-xs font-bold text-[#1B4D3E] tracking-wider uppercase block">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#16221B] font-normal tracking-tight">
              Four Operational Pipeline Tiers
            </h2>
            <p className="text-sm text-[#46574D]">
              Connecting raw remote sensing and climate datasets to deep spatiotemporal recurrent modeling and zero-latency GIS decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stage 1 */}
            <div className="p-5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-3 flex flex-col justify-between hover:border-[#12382B]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#D2D8CA] text-[#12382B] flex items-center justify-center font-mono text-xs font-bold">
                  01
                </div>
                <h3 className="font-serif text-lg text-[#16221B] font-normal">
                  Multi-Source Earth Ingestion
                </h3>
                <p className="text-xs text-[#46574D] leading-relaxed">
                  Sentinel-2 L2A 8 spectral bands across 6 observation windows (T1–T6) paired with IMD 0.25° gridded rainfall and NOAA ONI SST teleconnections.
                </p>
              </div>
              <button
                onClick={() => onLaunchDashboard('data_sources')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12382B] hover:underline pt-2 cursor-pointer"
              >
                <span>Inspect Data Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stage 2 */}
            <div className="p-5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-3 flex flex-col justify-between hover:border-[#12382B]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#D2D8CA] text-[#12382B] flex items-center justify-center font-mono text-xs font-bold">
                  02
                </div>
                <h3 className="font-serif text-lg text-[#16221B] font-normal">
                  PMFBY Olympic Baseline
                </h3>
                <p className="text-xs text-[#46574D] leading-relaxed">
                  Automated 5-year rolling Olympic average isolating true climate collapse from technological yield trends, classifying failure at ≥ 15% deficit.
                </p>
              </div>
              <button
                onClick={() => onLaunchDashboard('historical_analysis')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12382B] hover:underline pt-2 cursor-pointer"
              >
                <span>View Historical Baseline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stage 3 */}
            <div className="p-5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-3 flex flex-col justify-between hover:border-[#12382B]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#D2D8CA] text-[#12382B] flex items-center justify-center font-mono text-xs font-bold">
                  03
                </div>
                <h3 className="font-serif text-lg text-[#16221B] font-normal">
                  Spatiotemporal CNN–LSTM
                </h3>
                <p className="text-xs text-[#46574D] leading-relaxed">
                  2D-CNN spatial visual extractor coupled with a bidirectional LSTM recurrent modeling stage conditioned on 6D crop identity vectors.
                </p>
              </div>
              <button
                onClick={() => onLaunchDashboard('model_architecture')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12382B] hover:underline pt-2 cursor-pointer"
              >
                <span>Examine Neural Tensors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stage 4 */}
            <div className="p-5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-3 flex flex-col justify-between hover:border-[#12382B]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#D2D8CA] text-[#12382B] flex items-center justify-center font-mono text-xs font-bold">
                  04
                </div>
                <h3 className="font-serif text-lg text-[#16221B] font-normal">
                  GIS Decision Dashboard
                </h3>
                <p className="text-xs text-[#46574D] leading-relaxed">
                  Interactive SVG choropleth with authentic dual-resolution Earth Engine satellite terrain, dual-axis rainfall charts, and future El Niño simulator.
                </p>
              </div>
              <button
                onClick={() => onLaunchDashboard('overview')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12382B] hover:underline pt-2 cursor-pointer"
              >
                <span>Explore Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Interactive Direct-Launch Modules */}
      {/* ------------------------------------------------------------------- */}
      <section id="modules" className="px-6 sm:px-10 lg:px-16 py-14 border-b border-[#D5D9CE] bg-[#E5E8DF]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="font-mono text-xs font-bold text-[#1B4D3E] tracking-wider uppercase block">
                EXPLORE MODULES
              </span>
              <h2 className="font-serif text-3xl text-[#16221B] font-normal tracking-tight">
                Direct Entry Points
              </h2>
            </div>
            <button
              onClick={() => onLaunchDashboard('overview')}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#12382B] hover:underline"
            >
              <span>ENTER FULL DASHBOARD VIEW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div
              onClick={() => onLaunchDashboard('risk_map')}
              className="p-5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] hover:border-[#12382B] cursor-pointer transition-all hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#DCE0D4] text-[#12382B] group-hover:bg-[#12382B] group-hover:text-white transition-colors">
                  <Map className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] text-[#62756A] uppercase">36 Districts</span>
              </div>
              <h4 className="font-serif text-base text-[#16221B] font-semibold group-hover:text-[#12382B] transition-colors">
                District Failure Risk Map
              </h4>
              <p className="text-xs text-[#506257] leading-relaxed">
                Interactive choropleth overlaid on seamless Earth Engine satellite terrain with drag-panning, wheel-zoom, and risk telemetry.
              </p>
            </div>

            <div
              onClick={() => onLaunchDashboard('rainfall_trends')}
              className="p-5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] hover:border-[#12382B] cursor-pointer transition-all hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#DCE0D4] text-[#12382B] group-hover:bg-[#12382B] group-hover:text-white transition-colors">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] text-[#62756A] uppercase">Dual-Axis</span>
              </div>
              <h4 className="font-serif text-base text-[#16221B] font-semibold group-hover:text-[#12382B] transition-colors">
                Rainfall & Crop Yield Trends
              </h4>
              <p className="text-xs text-[#506257] leading-relaxed">
                Synchronized dual-axis comparison contrasting cumulative IMD rainfall against historical harvest yield collapse and drought markers.
              </p>
            </div>

            <div
              onClick={() => onLaunchDashboard('model_predictions')}
              className="p-5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] hover:border-[#12382B] cursor-pointer transition-all hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#DCE0D4] text-[#12382B] group-hover:bg-[#12382B] group-hover:text-white transition-colors">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] text-[#62756A] uppercase">320 Predictions</span>
              </div>
              <h4 className="font-serif text-base text-[#16221B] font-semibold group-hover:text-[#12382B] transition-colors">
                CNN–LSTM Multi-Crop Inferences
              </h4>
              <p className="text-xs text-[#506257] leading-relaxed">
                Deep neural network predictions across all 6 Kharif crops conditioned on multi-spectral patches and climate vectors.
              </p>
            </div>

            <div
              onClick={() => onLaunchDashboard('loso_validation')}
              className="p-5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] hover:border-[#12382B] cursor-pointer transition-all hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#DCE0D4] text-[#12382B] group-hover:bg-[#12382B] group-hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] text-[#62756A] uppercase">Zero Leakage</span>
              </div>
              <h4 className="font-serif text-base text-[#16221B] font-semibold group-hover:text-[#12382B] transition-colors">
                LOSO Out-of-Season Validation
              </h4>
              <p className="text-xs text-[#506257] leading-relaxed">
                Comprehensive evaluation telemetry (98.3% recall, 0.987 ROC-AUC) across 2019, 2020, 2021, and 2022 test seasons.
              </p>
            </div>

            <div
              onClick={() => onLaunchDashboard('future_elnino')}
              className="p-5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] hover:border-[#12382B] cursor-pointer transition-all hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#DCE0D4] text-[#12382B] group-hover:bg-[#12382B] group-hover:text-white transition-colors">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] text-[#62756A] uppercase">In-Silico Shocks</span>
              </div>
              <h4 className="font-serif text-base text-[#16221B] font-semibold group-hover:text-[#12382B] transition-colors">
                Future El Niño Climate Simulator
              </h4>
              <p className="text-xs text-[#506257] leading-relaxed">
                Policy simulator modeling the cascading failure probabilities across crops under +0.5°C to +2.5°C Pacific SST warming shocks.
              </p>
            </div>

            <div
              onClick={() => onLaunchDashboard('data_sources')}
              className="p-5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] hover:border-[#12382B] cursor-pointer transition-all hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#DCE0D4] text-[#12382B] group-hover:bg-[#12382B] group-hover:text-white transition-colors">
                  <Database className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px] text-[#62756A] uppercase">Open Data</span>
              </div>
              <h4 className="font-serif text-base text-[#16221B] font-semibold group-hover:text-[#12382B] transition-colors">
                Data Sources & Ground Truth
              </h4>
              <p className="text-xs text-[#506257] leading-relaxed">
                Full provenance documentation of DES statistics (1966–2023), IMD gridded daily rainfall, NOAA ONI, and Sentinel-2 L2A patches.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 6. Clean Editorial Footer */}
      {/* ------------------------------------------------------------------- */}
      <footer className="px-6 sm:px-10 lg:px-16 py-10 bg-[#E0E4D8] border-t border-[#D0D6C6] text-xs text-[#526458]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="font-mono font-bold tracking-wider text-[#1B2A22] uppercase">
              MAHARASHTRA KHARIF CROP FAILURE PREDICTION PLATFORM
            </span>
            <span className="text-[11px] text-[#6B7D71]">
              B.Tech Final Year Capstone Project • Artificial Intelligence & Data Science • 2026
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a
              href="https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1B2A22] transition-colors flex items-center gap-1"
            >
              <span>Hugging Face Hub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/usmanssait/ElninoPBLProject"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1B2A22] transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => onLaunchDashboard('overview')}
              className="px-3 py-1.5 rounded-md bg-[#12382B] text-white font-sans font-medium hover:bg-[#1A4C3B] transition-colors cursor-pointer"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
