#!/usr/bin/env python3
"""Run the trained Maharashtra rice crop-failure CNN-LSTM on satellite patch GeoJSONs.

For a new year, put MH_Rice_S2_Patches_<YEAR>.geojson in --data-dir, provide an IMD
CSV that includes that district-season rainfall, and pass the project's June-August
mean ONI anomaly for that year with --oni-values YEAR=VALUE. Do not pass DES labels:
this script generates model predictions without needing the answer label.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path
import numpy as np
import pandas as pd
import torch
from train_crop_failure_model import (CropFailureCNNLSTM, WINDOWS, CHANNELS, PATCH_SIZE,
                                      clean_name, year_start, find_csv)


def load_imd(data_dir, imd_file):
    path = find_csv(data_dir, imd_file,
                    ['imd_district_kharif_rainfall_2015_2022*.csv', '*imd*rainfall*.csv'], 'IMD')
    df = pd.read_csv(path)
    needed = {'district', 'year', 'kharif_rainfall_mm'}
    if not needed.issubset(df.columns):
        raise ValueError(f'IMD CSV must contain {sorted(needed)}')
    df['district_key'] = df['district'].map(clean_name)
    df['year_start'] = df['year'].map(year_start)
    df['kharif_rainfall_mm'] = pd.to_numeric(df['kharif_rainfall_mm'], errors='coerce')
    df = df.dropna(subset=['district_key', 'year_start', 'kharif_rainfall_mm']).copy()
    df['year_start'] = df['year_start'].astype(int)
    df = df.drop_duplicates(['district_key', 'year_start'], keep='first')
    rainfall = {(r.district_key, int(r.year_start)): float(r.kharif_rainfall_mm)
                for r in df.itertuples(index=False)}
    return rainfall, path


def read_satellite(data_dir, years, rainfall, rain_baseline, oni_map):
    sat_rows=[]; climate_rows=[]; cov_rows=[]; meta=[]
    for year in years:
        path = data_dir / f'MH_Rice_S2_Patches_{year}.geojson'
        if not path.exists(): raise FileNotFoundError(f'Missing satellite file: {path}')
        if year not in oni_map:
            print(f'SKIP {year}: no ONI anomaly supplied. Add --oni-values {year}=VALUE.')
            continue
        print(f'Reading {path.name}...')
        with path.open('r', encoding='utf-8') as f: geo=json.load(f)
        for feature in geo.get('features', []):
            p=feature.get('properties') or {}
            district=str(p.get('district','')).strip(); dkey=clean_name(district)
            yr=int(p.get('satellite_year',year))
            rain_key=(dkey,yr)
            if rain_key not in rainfall:
                continue
            patch=np.full((6,8,PATCH_SIZE,PATCH_SIZE),np.nan,dtype=np.float32)
            cov=np.zeros(6,dtype=np.float32); valid=True
            for ti,w in enumerate(WINDOWS):
                for ci,band in enumerate(CHANNELS):
                    val=p.get(f'{w}_{band}')
                    if not isinstance(val,list): valid=False; continue
                    a=np.asarray(val,dtype=np.float32)
                    if a.shape != (PATCH_SIZE,PATCH_SIZE): valid=False; continue
                    a=a.copy(); a[(~np.isfinite(a)) | (a <= -9998.0) | (np.abs(a)>3.0)]=np.nan
                    patch[ti,ci]=a
                cov[ti]=float(np.isfinite(patch[ti,0]).mean())
            if not valid or cov.sum() <= 0: continue
            rain=float(rainfall[rain_key])
            baseline=float(rain_baseline.get(dkey, rain))
            departure=((rain-baseline)/baseline*100.0) if baseline > 0 else 0.0
            sat_rows.append(patch)
            climate_rows.append([rain,departure,float(oni_map[yr])])
            cov_rows.append(cov)
            meta.append({'location_id':str(p.get('location_id',feature.get('id','unknown'))),
                         'district':district,'satellite_year':yr,'crop_year':f'{yr}-{yr+1}',
                         'kharif_rainfall_mm':rain,'rainfall_departure_pct_vs_training_baseline':departure,
                         'oni_mean_jun_aug':float(oni_map[yr]),'valid_pixel_fraction_mean':float(cov.mean())})
        del geo
    if not meta: raise RuntimeError('No prediction samples matched available satellite, IMD, and ONI inputs.')
    return np.stack(sat_rows),np.asarray(climate_rows,np.float32),np.stack(cov_rows),pd.DataFrame(meta)


def main():
    script_dir = Path(__file__).resolve().parent
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--data-dir',default=str(script_dir),help='Folder containing satellite GeoJSON files and the IMD CSV.')
    ap.add_argument('--model',default='crop_failure_model.pt',help='Path to trained .pt checkpoint.')
    ap.add_argument('--imd-file',default=None,help='Optional IMD CSV path/name.')
    ap.add_argument('--years',default='2019,2020,2021,2022',help='Comma-separated satellite years to predict.')
    ap.add_argument('--oni-values',default='',help='Optional ONI anomaly overrides, e.g. 2025=0.8,2026=0.6.')
    ap.add_argument('--output',default='crop_failure_predictions.csv',help='Output CSV path.')
    args=ap.parse_args()
    data_dir=Path(args.data_dir).resolve(); model_path=Path(args.model)
    if not model_path.is_absolute(): model_path=data_dir/model_path
    if not model_path.exists() and str(args.model) == 'crop_failure_model.pt':
        fallback=data_dir/'crop_model_output'/'crop_failure_model.pt'
        if fallback.exists(): model_path=fallback
    if not model_path.exists(): raise FileNotFoundError(f'Model not found: {model_path}')
    # Checkpoint is a locally-created trusted file; weights_only=False supports its metadata dictionaries.
    ckpt=torch.load(model_path,map_location='cpu',weights_only=False)
    oni_map={int(k):float(v) for k,v in ckpt['oni_mean_by_year'].items()}
    if args.oni_values.strip():
        for pair in args.oni_values.split(','):
            year,value=pair.split('=',1); oni_map[int(year.strip())]=float(value.strip())
    years=[int(x.strip()) for x in args.years.split(',') if x.strip()]
    rainfall,imd_path=load_imd(data_dir,args.imd_file)
    baseline=ckpt.get('rain_baseline_by_district',{})
    Xraw,C3,cov,meta=read_satellite(data_dir,years,rainfall,baseline,oni_map)
    sm=np.asarray(ckpt['sat_mean'],np.float32); ss=np.asarray(ckpt['sat_std'],np.float32)
    cm=np.asarray(ckpt['climate_mean'],np.float32); cs=np.asarray(ckpt['climate_std'],np.float32)
    X=np.zeros_like(Xraw,dtype=np.float32)
    for c in range(Xraw.shape[2]):
        a=Xraw[:,:,c]; ok=np.isfinite(a)
        normalized=np.clip((a-sm[c])/ss[c],-5,5)
        X[:,:,c]=np.where(ok,normalized,0.0)
    C3seq=np.repeat(C3[:,None,:],cov.shape[1],axis=1)
    C=np.concatenate([C3seq,cov[:,:,None]],axis=2)
    C=np.clip((C-cm[None,None,:])/cs[None,None,:],-5,5).astype(np.float32)
    model=CropFailureCNNLSTM(**ckpt.get('model_config',{}))
    model.load_state_dict(ckpt['model_state_dict']); model.eval()
    probs=[]
    with torch.no_grad():
        for i in range(0,len(X),16):
            logits=model(torch.from_numpy(X[i:i+16]),torch.from_numpy(C[i:i+16]))
            probs.extend(torch.sigmoid(logits).numpy().tolist())
    meta['crop_failure_risk_score_0_to_1']=np.asarray(probs,dtype=np.float32)
    meta['risk_category']=pd.cut(meta['crop_failure_risk_score_0_to_1'],[-0.001,0.33,0.66,1.001],labels=['Low','Moderate','High']).astype(str)
    # Aggregate location-level estimates to a district-season estimate aligned to DES target granularity.
    result=meta.groupby(['district','satellite_year','crop_year'],as_index=False).agg(
        mean_crop_failure_risk_score=('crop_failure_risk_score_0_to_1','mean'),
        median_crop_failure_risk_score=('crop_failure_risk_score_0_to_1','median'),
        sampled_locations=('location_id','nunique'),
        mean_valid_pixel_fraction=('valid_pixel_fraction_mean','mean'),
        kharif_rainfall_mm=('kharif_rainfall_mm','first'),
        rainfall_departure_pct=('rainfall_departure_pct_vs_training_baseline','first'),
        oni_mean_jun_aug=('oni_mean_jun_aug','first'))
    result['risk_category']=pd.cut(result['mean_crop_failure_risk_score'],[-0.001,0.33,0.66,1.001],labels=['Low','Moderate','High']).astype(str)
    out=Path(args.output)
    if not out.is_absolute(): out=data_dir/out
    out.parent.mkdir(parents=True,exist_ok=True); result.to_csv(out,index=False)
    print(f'IMD: {imd_path}')
    print(f'Predicted {len(meta)} patch rows; wrote {len(result)} district-season predictions to {out}')
    print('Note: scores are not probability-calibrated. The model was trained on 2019-2022, none of which has supplied June-August mean ONI >= +0.5 C; genuine El Niño use is extrapolation.')

if __name__=='__main__': main()
