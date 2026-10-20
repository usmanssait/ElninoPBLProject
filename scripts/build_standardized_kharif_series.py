#!/usr/bin/env python3
"""
Standardize Official Maharashtra Kharif Crop Statistics (1966–2024)
Integrates:
1. ICRISAT VDSA Historical Database (1966–2017)
2. Directorate of Economics & Statistics (DES) Ministry of Agriculture (2018–2021)
3. Directorate of Economics & Statistics (DES) Ministry of Agriculture (2021–2024)

Computes:
- Olympic 5-year rolling baseline yield (PMFBY Standard: mean of middle 3 of prior 5 years)
- Yield anomaly percentage against baseline
- Mathematically transparent binary failure labels for both -15% and -20% thresholds
"""
import re
from pathlib import Path
import pandas as pd
import numpy as np

# Canonical District Name Normalizer
DISTRICT_NAME_MAP = {
    'ahmednagar': 'Ahilyanagar',
    'ahilyanagar': 'Ahilyanagar',
    'aurangabad': 'Chhatrapati Sambhajinagar',
    'chhatrapati sambhajinagar': 'Chhatrapati Sambhajinagar',
    'osmanabad': 'Dharashiv',
    'dharashiv': 'Dharashiv',
    'beed': 'Beed',
    'bid': 'Beed',
    'buldhana': 'Buldhana',
    'buldana': 'Buldhana',
    'gondiya': 'Gondia',
    'gondia': 'Gondia',
    'raigarh': 'Raigad',
    'raigad': 'Raigad',
    'bombay': 'Mumbai',
    'greater bombay': 'Mumbai',
}

# Crop Name Normalizer
CROP_NAME_MAP = {
    'RICE': 'Rice',
    'Rice': 'Rice',
    'KHARIF SORGHUM': 'Jowar',
    'Jowar': 'Jowar',
    'PEARL MILLET': 'Bajra',
    'Bajra': 'Bajra',
    'PIGEONPEA': 'Tur',
    'Tur': 'Tur',
    'SOYABEAN': 'Soybean',
    'Soybean': 'Soybean',
    'COTTON': 'Cotton',
    'Cotton': 'Cotton',
}

def clean_district(name: str) -> str:
    cleaned = re.sub(r'\s+', ' ', str(name).strip()).lower()
    return DISTRICT_NAME_MAP.get(cleaned, str(name).strip().title())

def parse_icrisat(file_path: Path) -> pd.DataFrame:
    df = pd.read_csv(file_path)
    records = []
    for _, row in df.iterrows():
        crop_raw = str(row['Crop']).strip()
        crop = CROP_NAME_MAP.get(crop_raw)
        if not crop:
            continue
        dist = clean_district(row['Dist Name'])
        year = int(row['Year'])
        area_ha = float(row['Area(1000 ha)']) * 1000.0 if pd.notnull(row['Area(1000 ha)']) else np.nan
        prod_t = float(row['Production(1000 tons)']) * 1000.0 if pd.notnull(row['Production(1000 tons)']) else np.nan
        yield_kg_ha = float(row['Yield(Kg per ha)']) if pd.notnull(row['Yield(Kg per ha)']) else np.nan
        if np.isnan(yield_kg_ha) and area_ha > 0 and prod_t >= 0:
            yield_kg_ha = (prod_t * 1000.0) / area_ha
        records.append({
            'source': 'ICRISAT_VDSA',
            'state': 'Maharashtra',
            'district': dist,
            'crop': crop,
            'season': 'Kharif',
            'year': year,
            'area_ha': area_ha,
            'production_tonnes': prod_t,
            'yield_kg_ha': yield_kg_ha,
            'yield_t_per_ha': yield_kg_ha / 1000.0 if pd.notnull(yield_kg_ha) else np.nan
        })
    return pd.DataFrame(records)

def parse_des_wide(file_path: Path, year_triplets: list[tuple[str, str, str]]) -> pd.DataFrame:
    df = pd.read_csv(file_path)
    df_mh = df[(df['State'].str.strip().str.lower() == 'maharashtra') & 
               (df['Season'].str.strip().str.lower() == 'kharif')].copy()
    records = []
    for _, row in df_mh.iterrows():
        crop_raw = str(row['Crop']).strip()
        crop = CROP_NAME_MAP.get(crop_raw)
        if not crop:
            continue
        dist = clean_district(row['District'])
        for year_str, area_col, prod_col in year_triplets:
            year_int = int(year_str.split('-')[0])
            area_val = row.get(area_col)
            prod_val = row.get(prod_col)
            area_ha = float(area_val) if pd.notnull(area_val) and str(area_val).strip() != '' else np.nan
            prod_t = float(prod_val) if pd.notnull(prod_val) and str(prod_val).strip() != '' else np.nan
            
            yield_col = f'Yield-{year_str}'
            yield_val = row.get(yield_col)
            if pd.notnull(yield_val) and str(yield_val).strip() != '':
                yield_kg_ha = float(yield_val)
            elif area_ha > 0 and pd.notnull(prod_t):
                yield_kg_ha = (prod_t * 1000.0) / area_ha
            else:
                yield_kg_ha = np.nan
                
            records.append({
                'source': 'DES_MoA',
                'state': 'Maharashtra',
                'district': dist,
                'crop': crop,
                'season': 'Kharif',
                'year': year_int,
                'area_ha': area_ha,
                'production_tonnes': prod_t,
                'yield_kg_ha': yield_kg_ha,
                'yield_t_per_ha': yield_kg_ha / 1000.0 if pd.notnull(yield_kg_ha) else np.nan
            })
    return pd.DataFrame(records)

def compute_olympic_baselines_and_labels(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(by=['district', 'crop', 'year']).reset_index(drop=True)
    
    baseline_olympic = []
    anomaly_pct_list = []
    label_15_list = []
    label_20_list = []
    
    for idx, row in df.iterrows():
        dist = row['district']
        crop = row['crop']
        curr_year = row['year']
        curr_yield = row['yield_kg_ha']
        
        # Prior 5 years of the same district and crop
        prior = df[(df['district'] == dist) & (df['crop'] == crop) & 
                   (df['year'] < curr_year) & (df['year'] >= curr_year - 7) & 
                   (df['yield_kg_ha'].notnull()) & (df['yield_kg_ha'] > 0)]
        
        if len(prior) >= 3:
            # Take last up to 5 years
            yields_series = prior['yield_kg_ha'].tail(5).tolist()
            if len(yields_series) >= 5:
                # Olympic 5-year average: drop highest and lowest, average remaining 3
                sorted_y = sorted(yields_series)
                olympic_mean = np.mean(sorted_y[1:-1])
            else:
                # Fallback to simple mean if 3 or 4 years available
                olympic_mean = np.mean(yields_series)
                
            baseline_olympic.append(olympic_mean)
            
            if pd.notnull(curr_yield) and olympic_mean > 0:
                anom = ((curr_yield - olympic_mean) / olympic_mean) * 100.0
                anomaly_pct_list.append(round(anom, 2))
                label_15_list.append(1 if anom <= -15.0 else 0)
                label_20_list.append(1 if anom <= -20.0 else 0)
            else:
                anomaly_pct_list.append(np.nan)
                label_15_list.append(np.nan)
                label_20_list.append(np.nan)
        else:
            baseline_olympic.append(np.nan)
            anomaly_pct_list.append(np.nan)
            label_15_list.append(np.nan)
            label_20_list.append(np.nan)
            
    df['baseline_yield_olympic_kg_ha'] = baseline_olympic
    df['yield_anomaly_pct'] = anomaly_pct_list
    df['crop_failure_label_15pct'] = label_15_list
    df['crop_failure_label_20pct'] = label_20_list
    return df

def main():
    root = Path(__file__).resolve().parent.parent
    data_dir = root / 'data'
    
    print('1. Ingesting ICRISAT historical data (1966–2017)...')
    icrisat_df = parse_icrisat(data_dir / 'icrisat_maharashtra_historical_crops.csv')
    print(f'   Ingested {len(icrisat_df)} ICRISAT records.')
    
    print('2. Ingesting DES 2018–2021 data...')
    des1_triplets = [
        ('2018-19', 'Area-2018-19', 'Production-2018-19'),
        ('2019-20', 'Area-2019-20', 'Production-2019-20'),
        ('2020-21', 'Area-2020-21', 'Production-2020-21'),
    ]
    des1_df = parse_des_wide(data_dir / 'DES-District-Data-For-2018-19-to-2020-21.csv', des1_triplets)
    print(f'   Ingested {len(des1_df)} DES 2018-2021 records.')
    
    print('3. Ingesting DES 2021–2024 data...')
    des2_triplets = [
        ('2021-22', 'Area-2021-22', 'Production-2021-22'),
        ('2022-23', 'Area-2022-23', 'Production-2022-23'),
        ('2023-24', 'Area-2023-24', 'Production-2023-24'),
    ]
    des2_df = parse_des_wide(data_dir / 'DES-District-Data-For-2021-22-to-2023-24.csv', des2_triplets)
    print(f'   Ingested {len(des2_df)} DES 2021-2024 records.')
    
    # Deduplicate overlapping 2021-22 if any, prioritizing the updated series
    combined = pd.concat([icrisat_df, des1_df, des2_df], ignore_index=True)
    combined = combined.drop_duplicates(subset=['district', 'crop', 'year'], keep='last')
    print(f'   Total unified district-crop-year records: {len(combined)}')
    
    print('4. Computing PMFBY Olympic 5-year rolling baselines and verified failure labels...')
    audited = compute_olympic_baselines_and_labels(combined)
    
    # Save complete series for all crops
    all_crops_out = data_dir / 'standardized_maharashtra_kharif_all_crops_1966_2024.csv'
    audited.to_csv(all_crops_out, index=False)
    print(f'   [Saved] {all_crops_out} ({len(audited)} records)')
    
    # Save Rice-specific audited dataset for CNN-LSTM modelling
    rice_df = audited[audited['crop'] == 'Rice'].copy()
    rice_out = data_dir / 'standardized_maharashtra_kharif_rice_audited.csv'
    rice_df.to_csv(rice_out, index=False)
    print(f'   [Saved] {rice_out} ({len(rice_df)} records)')
    
    # Verification of Bhandara 2015-16
    bhandara_2015 = rice_df[(rice_df['district'] == 'Bhandara') & (rice_df['year'] == 2015)]
    print('\n=== Mathematical Audit Verification: Bhandara Rice 2015 ===')
    for _, r in bhandara_2015.iterrows():
        print(f"District: {r['district']}, Year: {r['year']}")
        print(f"Yield: {r['yield_kg_ha']:.1f} kg/ha, Baseline: {r['baseline_yield_olympic_kg_ha']:.1f} kg/ha")
        print(f"Yield Anomaly: {r['yield_anomaly_pct']:.2f}%")
        print(f"Failure Label (-15% Rule): {r['crop_failure_label_15pct']}")
        print(f"Failure Label (-20% Rule): {r['crop_failure_label_20pct']}")

if __name__ == '__main__':
    main()
