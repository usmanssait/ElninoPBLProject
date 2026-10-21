import React from 'react';
import {
  ArrowRight,
  ExternalLink,
  Satellite,
  CloudRain,
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  Database,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from '../components/Sidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAppTheme } from '../context/ThemeContext';

interface HomePageProps {
  onLaunchDashboard: (initialTab?: ActiveTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunchDashboard }) => {
  const { isDark } = useAppTheme();

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#12382B] selection:text-white transition-colors duration-200 ${
        isDark ? 'bg-[#060D0A] text-[#E8EFEB]' : 'bg-[#EAECE4] text-[#16221B]'
      }`}
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. Clean Academic Navigation Bar (No duplicate dashboard links)     */}
      {/* ------------------------------------------------------------------- */}
      <header
        className={`px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-40 border-b transition-colors ${
          isDark
            ? 'bg-[#060D0A]/90 border-[#14261F]'
            : 'bg-[#EAECE4]/90 border-[#D5D9CE]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-xs sm:text-sm font-bold tracking-widest uppercase ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            MAHARASHTRA / KHARIF CROP RISK
          </span>
          <span
            className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
              isDark
                ? 'bg-[#0E241C] text-[#22C55E] border-[#183B2B]'
                : 'bg-[#DCE1D4] text-[#12382B] border-[#CCD2C4]'
            }`}
          >
            B.TECH CAPSTONE RESEARCH
          </span>
        </div>

        <nav className="flex items-center gap-6 sm:gap-8 text-xs font-medium">
          <a
            href="#specifications"
            className={`hidden md:inline-block transition-colors ${
              isDark ? 'text-[#7A9187] hover:text-white' : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Specifications
          </a>
          <a
            href="#architecture"
            className={`hidden md:inline-block transition-colors ${
              isDark ? 'text-[#7A9187] hover:text-white' : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Architecture
          </a>
          <a
            href="#validation"
            className={`hidden md:inline-block transition-colors ${
              isDark ? 'text-[#7A9187] hover:text-white' : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            Validation
          </a>
          <a
            href="https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden lg:flex items-center gap-1.5 transition-colors ${
              isDark ? 'text-[#7A9187] hover:text-white' : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            <span>Hugging Face</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://github.com/usmanssait/ElninoPBLProject"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden lg:flex items-center gap-1.5 transition-colors ${
              isDark ? 'text-[#7A9187] hover:text-white' : 'text-[#526458] hover:text-[#16221B]'
            }`}
          >
            <span>Source Code</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Theme Mode Toggle */}
          <ThemeToggle />
        </nav>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Hero Section: Contains the ONLY Dashboard Entry Point             */}
      {/* ------------------------------------------------------------------- */}
      <section className={`px-6 sm:px-10 lg:px-16 pt-10 sm:pt-14 pb-14 border-b ${isDark ? 'border-[#14261F]' : 'border-[#D5D9CE]'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Context, and Single Dashboard Launcher */}
          <div className="lg:col-span-6 space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider uppercase border ${
                isDark
                  ? 'bg-[#0E241C] text-[#22C55E] border-[#183B2B]'
                  : 'bg-[#D8DED0] text-[#1B4D3E] border-[#C5CDC0]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#22C55E]' : 'bg-[#1B4D3E]'}`} />
              SPATIOTEMPORAL AI & REMOTE SENSING • B.TECH RESEARCH
            </div>

            <h1
              className={`font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.08] ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              Maharashtra Kharif Crop Failure Forecaster
            </h1>

            <p
              className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                isDark ? 'text-[#7A9187]' : 'text-[#46574D]'
              }`}
            >
              A spatiotemporal deep learning early warning framework coupling multi-spectral Sentinel-2 satellite imagery, IMD 0.25° gridded daily rainfall, and NOAA Oceanic Niño Index teleconnections into a compact PyTorch CNN-BiLSTM neural network to predict Kharif crop yield collapse up to 60–75 days prior to harvest.
            </p>

            {/* Sole Dashboard Action Button & Repository Reference Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* THE ONLY LINK TO MAIN DASHBOARD ON THIS PAGE */}
              <button
                onClick={() => onLaunchDashboard('overview')}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 ${
                  isDark
                    ? 'bg-[#22C55E] text-[#060D0A] hover:bg-[#16A34A] shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                    : 'bg-[#12382B] text-white hover:bg-[#1A4C3B]'
                }`}
              >
                <span>Launch Interactive Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-mono font-medium border transition-colors ${
                  isDark
                    ? 'bg-[#091410] border-[#14261F] text-[#7A9187] hover:text-white hover:border-[#22C55E]/50'
                    : 'bg-white border-[#CCD2C4] text-[#46574D] hover:text-[#16221B]'
                }`}
              >
                <span>Hugging Face Hub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://github.com/usmanssait/ElninoPBLProject"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-mono font-medium border transition-colors ${
                  isDark
                    ? 'bg-[#091410] border-[#14261F] text-[#7A9187] hover:text-white hover:border-[#22C55E]/50'
                    : 'bg-white border-[#CCD2C4] text-[#46574D] hover:text-[#16221B]'
                }`}
              >
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Framed Dashboard Preview (Static Display Card, No Secondary Links) */}
          <div className="lg:col-span-6">
            <div
              className={`rounded-2xl border p-3.5 shadow-xl transition-all duration-300 ${
                isDark
                  ? 'bg-[#091410] border-[#14261F]'
                  : 'bg-[#DCE0D4] border-[#CCD2C4]'
              }`}
            >
              {/* Window Header */}
              <div className={`flex items-center justify-between px-2 pb-2.5 border-b mb-2.5 ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]/70'}`}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#183B2B]' : 'bg-[#BDC4B6]'}`} />
                  <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#183B2B]' : 'bg-[#BDC4B6]'}`} />
                  <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#183B2B]' : 'bg-[#BDC4B6]'}`} />
                </div>
                <span className={`font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5 ${isDark ? 'text-[#7A9187]' : 'text-[#5C6E64]'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  MAHARASHTRA DISTRICT RISK OVERVIEW
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#4D6559]' : 'text-[#889B8F]'}`}>
                  KHARIF 2020
                </span>
              </div>

              {/* Main Screenshot Preview Container */}
              <div className={`relative rounded-xl overflow-hidden border aspect-[16/10] ${isDark ? 'border-[#14261F] bg-[#060D0A]' : 'border-[#CCD2C4] bg-[#060D0A]'}`}>
                <img
                  src="/images/dashboard_preview.png"
                  alt="Dashboard Interface with Satellite Terrain Basemap"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Meta Footer */}
              <div className={`flex items-center justify-between pt-2.5 px-1 font-mono text-[10px] uppercase ${isDark ? 'text-[#7A9187]' : 'text-[#5C6E64]'}`}>
                <span className={`font-bold tracking-wider ${isDark ? 'text-[#22C55E]' : 'text-[#2F4238]'}`}>
                  DECISION SUPPORT TELEMETRY
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
      {/* 3. Core Project Specifications (Details that actually matter)       */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="specifications"
        className={`px-6 sm:px-10 lg:px-16 py-12 border-b ${
          isDark
            ? 'bg-[#091410]/50 border-[#14261F]'
            : 'bg-[#E5E8DF] border-[#D5D9CE]'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          <div className={`space-y-1.5 border-l-2 pl-4 ${isDark ? 'border-[#22C55E]' : 'border-[#12382B]'}`}>
            <div className={`font-serif text-3xl sm:text-4xl font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              24 Belts
            </div>
            <div className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-[#22C55E]' : 'text-[#1B4D3E]'}`}>
              Monitored Rice Belts
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
              8 verified Kharif seasons (2015–2022) across 192 district-year DES yield records in Konkan & Eastern Vidarbha.
            </p>
          </div>

          <div className={`space-y-1.5 border-l-2 pl-4 ${isDark ? 'border-[#22C55E]' : 'border-[#12382B]'}`}>
            <div className={`font-serif text-3xl sm:text-4xl font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              60–75 Days
            </div>
            <div className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-[#22C55E]' : 'text-[#1B4D3E]'}`}>
              Early Warning Lead Time
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
              Strict August 31 in-season observation cutoff. Predicts October–November harvest collapse months ahead of harvest.
            </p>
          </div>

          <div className={`space-y-1.5 border-l-2 pl-4 ${isDark ? 'border-[#22C55E]' : 'border-[#12382B]'}`}>
            <div className={`font-serif text-3xl sm:text-4xl font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Zero Leakage
            </div>
            <div className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-[#22C55E]' : 'text-[#1B4D3E]'}`}>
              Rolling Baseline Audit
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
              Target year strictly excluded from 5-year historical prior mean. Crop failure labeled at &gt;10% deficit below baseline.
            </p>
          </div>

          <div className={`space-y-1.5 border-l-2 pl-4 ${isDark ? 'border-[#22C55E]' : 'border-[#12382B]'}`}>
            <div className={`font-serif text-3xl sm:text-4xl font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              17,449
            </div>
            <div className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-[#22C55E]' : 'text-[#1B4D3E]'}`}>
              Trainable PyTorch Params
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
              Compact 2D-CNN spatial encoder fused with Bidirectional LSTM sequence modeling, preventing overfitting on tabular climate data.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Concrete Pipeline Architecture (No nested CTA links)            */}
      {/* ------------------------------------------------------------------- */}
      <section id="architecture" className={`px-6 sm:px-10 lg:px-16 py-14 border-b ${isDark ? 'border-[#14261F]' : 'border-[#D5D9CE]'}`}>
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="space-y-2 max-w-2xl">
            <span className={`font-mono text-xs font-bold tracking-wider uppercase block ${isDark ? 'text-[#22C55E]' : 'text-[#1B4D3E]'}`}>
              SYSTEM ARCHITECTURE
            </span>
            <h2 className={`font-serif text-3xl sm:text-4xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Spatiotemporal Machine Learning Pipeline
            </h2>
            <p className={`text-sm ${isDark ? 'text-[#7A9187]' : 'text-[#46574D]'}`}>
              Authoritative data streams, ground-truth label definitions, and neural feature extraction without simulated assumptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Component 1 */}
            <div
              className={`p-5 rounded-2xl border space-y-3 shadow-xs ${
                isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${
                  isDark
                    ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                    : 'bg-[#D2D8CA] border-[#BDC4B4] text-[#12382B]'
                }`}
              >
                01
              </div>
              <h3 className={`font-serif text-lg font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                Macro-Climate Teleconnections
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#46574D]'}`}>
                NOAA Climate Prediction Center (CPC) Oceanic Niño Index (ONI) tracking Niño 3.4 SST anomalies (°C) to quantify Pacific warming forcing on the Indian monsoon.
              </p>
              <div className={`pt-2 border-t text-[10px] font-mono ${isDark ? 'border-[#14261F] text-[#4D6559]' : 'border-[#CCD2C4] text-[#718277]'}`}>
                Source: NOAA ERSST.v5 Niño 3.4
              </div>
            </div>

            {/* Component 2 */}
            <div
              className={`p-5 rounded-2xl border space-y-3 shadow-xs ${
                isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${
                  isDark
                    ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                    : 'bg-[#D2D8CA] border-[#BDC4B4] text-[#12382B]'
                }`}
              >
                02
              </div>
              <h3 className={`font-serif text-lg font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                High-Resolution Meteorology
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#46574D]'}`}>
                IMD Pune 0.25° × 0.25° daily gridded rainfall (RF25) arrays aggregated across June 1 – August 31 to evaluate seasonal precipitation volume and percentage departure from normal.
              </p>
              <div className={`pt-2 border-t text-[10px] font-mono ${isDark ? 'border-[#14261F] text-[#4D6559]' : 'border-[#CCD2C4] text-[#718277]'}`}>
                Source: IMD National Climate Centre
              </div>
            </div>

            {/* Component 3 */}
            <div
              className={`p-5 rounded-2xl border space-y-3 shadow-xs ${
                isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${
                  isDark
                    ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                    : 'bg-[#D2D8CA] border-[#BDC4B4] text-[#12382B]'
                }`}
              >
                03
              </div>
              <h3 className={`font-serif text-lg font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                Multi-Spectral Sentinel-2
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#46574D]'}`}>
                8-channel surface reflectance patches (B2–B4, B8, B11, B12, NDVI, NDWI) sampled over verified cropland masks across 6 bi-weekly observation intervals prior to August 31.
              </p>
              <div className={`pt-2 border-t text-[10px] font-mono ${isDark ? 'border-[#14261F] text-[#4D6559]' : 'border-[#CCD2C4] text-[#718277]'}`}>
                Tensor: [Batch, 6, 8, 32, 32]
              </div>
            </div>

            {/* Component 4 */}
            <div
              className={`p-5 rounded-2xl border space-y-3 shadow-xs ${
                isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${
                  isDark
                    ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                    : 'bg-[#D2D8CA] border-[#BDC4B4] text-[#12382B]'
                }`}
              >
                04
              </div>
              <h3 className={`font-serif text-lg font-normal ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                CNN-BiLSTM Architecture
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#46574D]'}`}>
                TimeDistributed 2D-CNN extracts 24-dim visual vectors, concatenated with 10 climate/crop features into a 48-dim BiLSTM hidden representation to predict failure probability.
              </p>
              <div className={`pt-2 border-t text-[10px] font-mono ${isDark ? 'border-[#14261F] text-[#4D6559]' : 'border-[#CCD2C4] text-[#718277]'}`}>
                Model Checkpoint: crop_failure_model.pt
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Validation Protocol & Reproducibility (Quality Technical Context) */}
      {/* ------------------------------------------------------------------- */}
      <section
        id="validation"
        className={`px-6 sm:px-10 lg:px-16 py-14 border-b ${
          isDark
            ? 'bg-[#091410]/50 border-[#14261F]'
            : 'bg-[#E5E8DF] border-[#D5D9CE]'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="space-y-1.5 max-w-2xl">
            <span className={`font-mono text-xs font-bold tracking-wider uppercase block ${isDark ? 'text-[#22C55E]' : 'text-[#1B4D3E]'}`}>
              RIGOROUS EVALUATION
            </span>
            <h2 className={`font-serif text-3xl font-normal tracking-tight ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Spatial Generalization & Academic Reproducibility
            </h2>
            <p className={`text-sm ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
              Verified out-of-sample evaluation guarantees that model predictions generalize across unseen geographic districts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div
              className={`p-5 rounded-2xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
                <h4 className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                  Grouped-District Holdout Protocol
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
                5 entire geographical districts (<code className={`font-mono ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>gondia, nagpur, nashik, palghar, sangli</code>) were completely withheld from model training, validating out-of-district spatial transferability.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} />
                <h4 className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                  Empirical Benchmark Scores
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
                Evaluated under weighted binary cross-entropy (pos_weight = 6.5) to overcome historical failure rarity (~13% failure rate), reaching 89.2% ROC-AUC and 0.824 F1-score across held-out seasons.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-[#16A34A]'}`} />
                <h4 className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                  Hugging Face Hub Storage
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#506257]'}`}>
                The 3.14 GB crop mask raster, IMD NetCDF daily series, and trained PyTorch checkpoints are hosted publicly on Hugging Face Hub for one-command replication.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 6. Clean Editorial Footer (No duplicate dashboard links)            */}
      {/* ------------------------------------------------------------------- */}
      <footer
        className={`px-6 sm:px-10 lg:px-16 py-10 border-t text-xs transition-colors ${
          isDark
            ? 'bg-[#091410] border-[#14261F] text-[#7A9187]'
            : 'bg-[#E0E4D8] border-[#D0D6C6] text-[#526458]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className={`font-mono font-bold tracking-wider uppercase ${isDark ? 'text-white' : 'text-[#1B2A22]'}`}>
              MAHARASHTRA KHARIF CROP FAILURE PREDICTION PLATFORM
            </span>
            <span className={`text-[11px] ${isDark ? 'text-[#4D6559]' : 'text-[#6B7D71]'}`}>
              B.Tech Final Year Capstone Project • Usman Sait • Artificial Intelligence & Data Science
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a
              href="https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors flex items-center gap-1 ${
                isDark ? 'hover:text-white' : 'hover:text-[#1B2A22]'
              }`}
            >
              <span>Hugging Face Dataset</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/usmanssait/ElninoPBLProject"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors flex items-center gap-1 ${
                isDark ? 'hover:text-white' : 'hover:text-[#1B2A22]'
              }`}
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
