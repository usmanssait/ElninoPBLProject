import React from 'react';
import { KpiCards } from '../components/panels/KpiCards';
import { DistrictChoropleth } from '../components/map/DistrictChoropleth';
import { RainfallYieldChart } from '../components/charts/RainfallYieldChart';
import { SeasonalClimateCard } from '../components/panels/SeasonalClimateCard';
import { DistrictDetailPanel } from '../components/panels/DistrictDetailPanel';
import { useDashboard } from '../context/DashboardContext';

export const OverviewPage: React.FC = () => {
  const { cropYearStr, currentYearMetrics, monitoredDistrictsForCrop, selectedCrop } = useDashboard();

  const handleDownloadCsv = () => {
    const headers = [
      'district_id',
      'district_name',
      'division',
      'crop',
      'crop_year',
      'imd_rainfall_mm',
      'des_actual_yield_t_ha',
      'baseline_yield_t_ha',
      'yield_departure_pct',
      'des_observed_failure_status',
    ];

    const rows = monitoredDistrictsForCrop.map(d => {
      const m = currentYearMetrics[d.id];
      return [
        d.id,
        `"${d.name}"`,
        `"${d.division}"`,
        `"${m?.crop || selectedCrop}"`,
        cropYearStr,
        m?.rainfallMm !== null && m?.rainfallMm !== undefined ? Math.round(m.rainfallMm) : 'N/A',
        m?.yieldTonnesHa !== null && m?.yieldTonnesHa !== undefined ? m.yieldTonnesHa.toFixed(2) : 'N/A',
        m?.baselineYieldTonnesHa !== null && m?.baselineYieldTonnesHa !== undefined ? m.baselineYieldTonnesHa.toFixed(2) : 'N/A',
        m?.yieldAnomalyPct !== null && m?.yieldAnomalyPct !== undefined ? `${m.yieldAnomalyPct.toFixed(1)}%` : 'N/A',
        m?.failureEvent === 1 ? 'Failure (>10% Deficit)' : 'Resilient (<=10%)',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maharashtra_des_crop_failure_${selectedCrop}_${cropYearStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3.5 w-full text-[#16221B]">
      {/* 1. Page Header with Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#CCD2C4]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
            Maharashtra District Risk &amp; Historical Intelligence
          </h1>
          <p className="text-xs text-[#526458] mt-0.5 font-medium">
            Spatiotemporal CNN-LSTM Framework for All-Kharif Crop Failure Prediction using Satellite Imagery and IMD Data
          </p>
        </div>
      </div>

      {/* 2. Full-Width 6-Card KPI Row */}
      <KpiCards />

      {/* 3. Central Grid: Left Column (Map + Bottom Row) vs Right Column (District Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (8 cols): Map + Bottom Equal 2-Card Row */}
        <div className="lg:col-span-8 flex flex-col gap-3.5">
          {/* Main Maharashtra Map Card with Expansive Vertical Room */}
          <DistrictChoropleth
            mode="historical"
            title={`Observed Crop Failure Ground Truth — Kharif ${cropYearStr} (${selectedCrop === 'ALL' ? 'All Crops' : selectedCrop})`}
            heightClass="h-[490px] sm:h-[530px] xl:h-[560px]"
          />

          {/* Bottom Row under Map: Equal 50/50 Split with Identical Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch flex-1">
            <RainfallYieldChart className="h-full" />
            <SeasonalClimateCard className="h-full" />
          </div>
        </div>

        {/* Right Column (4 cols): District Insights Panel with Year & District selectors */}
        <div className="lg:col-span-4 flex flex-col">
          <DistrictDetailPanel className="h-full" onDownloadCsv={handleDownloadCsv} />
        </div>
      </div>
    </div>
  );
};
