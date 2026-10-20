#!/usr/bin/env python3
"""
=============================================================================
Generate Professional Word (.docx) and PDF (.pdf) Project Documentation
Script: scripts/build_word_and_pdf_documentation.py
=============================================================================
"""

import os
import sys
import re
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = ROOT / "scratch"
SCRATCH.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. Render Professional Diagram Figures
# ---------------------------------------------------------------------------
def render_diagrams():
    print("[*] Rendering high-resolution diagram figures...")
    
    # Diagram 1: End-to-End System Architecture
    fig, ax = plt.subplots(figsize=(11, 4.5), dpi=300)
    fig.patch.set_facecolor('#0B1310')
    ax.set_facecolor('#0B1310')
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 4.5)
    ax.axis('off')

    boxes = [
        (0.4, 0.6, 2.2, 3.2, "#13231D", "#22C55E", "1. DATA LAYER", 
         "• DES Yields (1966-2024)\n• IMD Gridded Rainfall (0.25°)\n• NOAA CPC ONI SST Index\n• Sentinel-2 L2A (8 Bands)\n• NASA MODIS 8-Day 500m"),
        (3.0, 0.6, 2.2, 3.2, "#13231D", "#38BDF8", "2. FEATURE ENGINE", 
         "• PMFBY Olympic Baselines\n• Yield Deficit (>15%)\n• 6D Crop One-Hot Vectors\n• Dual-Resolution Blender\n• Temporal Normalizers"),
        (5.6, 0.6, 2.2, 3.2, "#13231D", "#EAB308", "3. CNN-LSTM ENGINE", 
         "• 2D Spatial CNN Extractor\n• Recurrent BiLSTM (T=6)\n• Class-Weighted BCE Loss\n• LOSO Cross-Validation\n• Operational PyTorch Checkpoint"),
        (8.2, 0.6, 2.4, 3.2, "#13231D", "#F43F5E", "4. REACT DASHBOARD", 
         "• SVG Choropleth Map Engine\n• Seamless Satellite Terrain\n• Dual-Axis Rainfall-Yield Chart\n• District Agro-Climate Panel\n• Future El Niño Simulator")
    ]

    for x, y, w, h, bg_c, border_c, title, body in boxes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.35, title, color=border_c, fontsize=10.5, fontweight='bold', ha='center', va='center')
        ax.text(x + 0.15, y + h - 0.75, body, color='#E2E8F0', fontsize=8.2, ha='left', va='top', linespacing=1.6)

    # Arrows
    for ax_x in [2.7, 5.3, 7.9]:
        arrow = patches.FancyArrowPatch((ax_x, 2.2), (ax_x + 0.2, 2.2), arrowstyle='->',
                                        mutation_scale=18, color='#38BDF8', linewidth=2.5)
        ax.add_patch(arrow)

    d1_path = SCRATCH / "diagram1_system_architecture.png"
    fig.savefig(d1_path, bbox_inches='tight', pad_inches=0.1)
    plt.close(fig)

    # Diagram 2: Spatiotemporal Neural Network Tensor Flow
    fig, ax = plt.subplots(figsize=(11, 4.0), dpi=300)
    fig.patch.set_facecolor('#0B1310')
    ax.set_facecolor('#0B1310')
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 4.0)
    ax.axis('off')

    stages = [
        (0.3, 1.8, 1.8, 1.8, "#1A2E26", "#22C55E", "Sentinel-2 Patch", "[B, 6, 8, 32, 32]\n8 Bands x 6 Windows"),
        (2.5, 1.8, 1.8, 1.8, "#1A2E26", "#22C55E", "Spatial 2D-CNN", "Conv2D + MaxPool\nAdaptiveAvgPool(1,1)\n-> [B, 6, 24]"),
        (4.7, 0.4, 1.8, 1.8, "#152433", "#38BDF8", "Climate & Crop", "[B, 6, 10]\nRainfall + ONI + Cov\n+ 6D Crop One-Hot"),
        (6.9, 1.1, 1.8, 2.2, "#2A2415", "#EAB308", "Recurrent BiLSTM", "Fused Input: [B, 6, 34]\nHidden Size: 24 (Bi)\nOutput: [B, 6, 48]\nFinal Timestep: h_6"),
        (9.1, 1.3, 1.6, 1.8, "#31181F", "#F43F5E", "Risk Output", "Linear(48->24) + Dropout\nLinear(24->1) + Sigmoid\n-> Prob(Failure) in [0, 1]")
    ]

    for x, y, w, h, bg_c, border_c, title, body in stages:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.12",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=1.8)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.3, title, color=border_c, fontsize=9.5, fontweight='bold', ha='center', va='center')
        ax.text(x + w/2, y + (h-0.3)/2, body, color='#E2E8F0', fontsize=7.8, ha='center', va='center', linespacing=1.4)

    # Connections
    ax.add_patch(patches.FancyArrowPatch((2.2, 2.7), (2.4, 2.7), arrowstyle='->', mutation_scale=15, color='#22C55E', linewidth=2))
    ax.add_patch(patches.FancyArrowPatch((4.4, 2.7), (6.8, 2.4), arrowstyle='->', mutation_scale=15, color='#22C55E', linewidth=2))
    ax.add_patch(patches.FancyArrowPatch((6.6, 1.3), (6.8, 1.8), arrowstyle='->', mutation_scale=15, color='#38BDF8', linewidth=2))
    ax.add_patch(patches.FancyArrowPatch((8.8, 2.2), (9.0, 2.2), arrowstyle='->', mutation_scale=15, color='#EAB308', linewidth=2))

    d2_path = SCRATCH / "diagram2_tensor_pipeline.png"
    fig.savefig(d2_path, bbox_inches='tight', pad_inches=0.1)
    plt.close(fig)

    # Diagram 3: PMFBY Olympic 5-Year Baseline Flow
    fig, ax = plt.subplots(figsize=(10, 3.2), dpi=300)
    fig.patch.set_facecolor('#0B1310')
    ax.set_facecolor('#0B1310')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.2)
    ax.axis('off')

    steps = [
        (0.2, 0.5, 2.0, 2.2, "#1E293B", "#38BDF8", "Step 1: History", "Extract preceding\n5 seasons (Y-5..Y-1)\nfor District & Crop\n(Strictly t < Y)"),
        (2.6, 0.5, 2.1, 2.2, "#1E293B", "#38BDF8", "Step 2: Olympic Sort", "Sort yields:\n[y1, y2, y3, y4, y5]\nDrop lowest (y1)\nDrop highest (y5)"),
        (5.1, 0.5, 2.2, 2.2, "#1E293B", "#EAB308", "Step 3: Baseline", "Average middle 3:\nBaseline = (y2+y3+y4)/3\nAnomaly % =\n(Yield_Y - Base)/Base*100"),
        (7.7, 0.5, 2.1, 2.2, "#1E293B", "#F43F5E", "Step 4: Classification", "If Anomaly <= -15%:\n-> y = 1 (Crop Failure)\nIf Anomaly > -15%:\n-> y = 0 (Resilient)")
    ]

    for x, y, w, h, bg_c, border_c, title, body in steps:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.12",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=1.8)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.35, title, color=border_c, fontsize=9.5, fontweight='bold', ha='center', va='center')
        ax.text(x + w/2, y + (h-0.35)/2, body, color='#E2E8F0', fontsize=8.0, ha='center', va='center', linespacing=1.4)

    for ax_x in [2.3, 4.8, 7.4]:
        arrow = patches.FancyArrowPatch((ax_x, 1.6), (ax_x + 0.2, 1.6), arrowstyle='->',
                                        mutation_scale=15, color='#EAB308', linewidth=2)
        ax.add_patch(arrow)

    d3_path = SCRATCH / "diagram3_pmfby_baseline.png"
    fig.savefig(d3_path, bbox_inches='tight', pad_inches=0.1)
    plt.close(fig)

    print("[+] Diagram figures rendered successfully.")
    return d1_path, d2_path, d3_path


# ---------------------------------------------------------------------------
# 2. Build Formatted Word Document
# ---------------------------------------------------------------------------
def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_word_document(docx_path: Path, d1_path, d2_path, d3_path):
    print(f"[*] Building Word document at: {docx_path}...")
    doc = Document()
    
    # Page setup: Standard Letter, 0.8 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styling Palette
    COLOR_PRIMARY = RGBColor(16, 120, 80)     # Forest Green
    COLOR_SECONDARY = RGBColor(14, 116, 144)  # Deep Teal
    COLOR_TEXT = RGBColor(30, 41, 59)         # Slate 800
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500

    # Header / Title Block
    title = doc.add_paragraph()
    r_title = title.add_run("Spatiotemporal CNN–LSTM Framework for Maharashtra Kharif Crop Failure Prediction")
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = COLOR_PRIMARY
    title.paragraph_format.space_after = Pt(4)

    subtitle = doc.add_paragraph()
    r_sub = subtitle.add_run("Comprehensive Technical, Mathematical, Architectural, and Operational Documentation")
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = COLOR_SECONDARY
    r_sub.italic = True
    subtitle.paragraph_format.space_after = Pt(14)

    # Metadata Box (Table)
    meta_table = doc.add_table(rows=2, cols=3)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        [("Scope", "36 Districts of Maharashtra\n6 Primary Kharif Crops"),
         ("Sensors & Data", "Sentinel-2 L2A (10m), Copernicus DEM\nNASA MODIS 500m, IMD Rainfall, ONI"),
         ("Core Architecture", "Spatiotemporal 2D-CNN + BiLSTM\nwith 6D Crop Conditioning Vector")],
        [("Ground Truth Standard", "PMFBY 5-Year Olympic Baseline\nYield Deficit >= 15%"),
         ("Web Engine", "React 18, Vite, TypeScript, Tailwind\nDual-Resolution Earth Engine Terrain"),
         ("Repository Links", "Hugging Face Hub / UsmanSait\nGitHub / usmanssait/ElninoPBLProject")]
    ]
    for row_idx, row in enumerate(meta_data):
        for col_idx, (label, val) in enumerate(row):
            cell = meta_table.cell(row_idx, col_idx)
            set_cell_background(cell, "F1F5F9")
            set_cell_margins(cell, 120, 120, 150, 150)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r1 = p.add_run(f"{label}\n")
            r1.bold = True
            r1.font.size = Pt(9.5)
            r1.font.color.rgb = COLOR_PRIMARY
            r2 = p.add_run(val)
            r2.font.size = Pt(8.5)
            r2.font.color.rgb = COLOR_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Helper function for headings
    def add_h1(text):
        h = doc.add_heading(level=1)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(16)
        r.font.color.rgb = COLOR_PRIMARY
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)

    def add_h2(text):
        h = doc.add_heading(level=2)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(12.5)
        r.font.color.rgb = COLOR_SECONDARY
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)

    def add_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(space_after)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.color.rgb = COLOR_TEXT
        r = p.add_run(text)
        r.font.size = Pt(10)
        r.font.color.rgb = COLOR_TEXT
        return p

    def add_callout(text, title="IMPORTANT NOTICE"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "FEF3C7") # Warm Amber
        set_cell_margins(cell, 140, 140, 200, 200)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r_t = p.add_run(f"⚠️ {title}: ")
        r_t.bold = True
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(180, 83, 9)
        r_b = p.add_run(text)
        r_b.font.size = Pt(9.0)
        r_b.font.color.rgb = RGBColor(120, 53, 15)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -----------------------------------------------------------------------
    # Section 1: Executive Summary & Problem Statement
    # -----------------------------------------------------------------------
    add_h1("1. Executive Summary & Problem Statement")
    add_p(
        "Maharashtra is among India's foremost agricultural states, yet over 70% of its cultivated Kharif "
        "acreage is rainfed and exceptionally sensitive to meteorological anomalies driven by the El Niño "
        "Southern Oscillation (ENSO) and the Indian Ocean Dipole (IOD). Ocean warming in the equatorial Pacific "
        "(Niño 3.4 SST anomalies) disrupts the seasonal monsoon trough, triggering prolonged dry spells, "
        "soil moisture depletion, and crop failure across staple cereals and commercial crops—including Rice in Konkan "
        "and Vidarbha, Soybean in Marathwada, and Cotton in Vidarbha."
    )
    add_p(
        "This project establishes a unified spatiotemporal deep learning early-warning framework that combines "
        "high-resolution Sentinel-2 multi-spectral satellite imagery (8 spectral bands across 6 observation windows) with "
        "India Meteorological Department (IMD) gridded rainfall data, NOAA CPC Oceanic Niño Index (ONI) sea-surface "
        "temperatures, and official Department of Agriculture (DES) harvest yield records (1966–2024). The system is deployed "
        "via a production-grade React 18 GIS dashboard featuring a gapless, dual-resolution Earth Engine satellite terrain basemap."
    )

    # -----------------------------------------------------------------------
    # Section 2: End-to-End System Architecture
    # -----------------------------------------------------------------------
    add_h1("2. End-to-End System Architecture")
    add_p("The end-to-end framework bridges offline remote sensing pipelines, recurrent deep learning, and interactive web visualization:")
    doc.add_picture(str(d1_path), width=Inches(6.8))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p("Figure 1: High-level system architecture spanning data acquisition, feature engineering, neural network training, and the React decision dashboard.", bold_prefix="System Pipeline: ", space_after=10)

    # -----------------------------------------------------------------------
    # Section 3: Data Sources & Ground-Truth Provenance
    # -----------------------------------------------------------------------
    add_h1("3. Data Sources & Provenance Catalog")
    add_p("The model and dashboard integrate five authoritative meteorological, agronomic, and earth observation datasets:")

    headers = ["Dataset / Parameter", "Source Agency", "Spatial Extent", "Temporal Window", "Role in Pipeline"]
    data_rows = [
        ["Kharif Crop Yield Statistics", "DES Maharashtra & ICRISAT", "36 Districts", "1966 – 2024 (58 seasons)", "Ground-truth yields, Olympic baselines & labels"],
        ["District Kharif Rainfall", "India Meteorological Dept (IMD)", "0.25° Gridded", "2015 – 2024", "Cumulative precipitation (mm) & departures (%)"],
        ["Oceanic Niño Index (ONI)", "NOAA CPC", "Niño 3.4 Region", "1950 – 2024", "ENSO sea-surface temperature summer anomalies"],
        ["Sentinel-2 Multi-Spectral", "ESA / Copernicus Hub / GEE", "10m Resampled 32x32", "2019 – 2022 (6 windows)", "8-band canopy reflectance, NDVI & NDWI"],
        ["Copernicus DEM (GLO-30)", "ESA", "30m / 90m Global", "Static", "Topographic relief for Western Ghats & Deccan"],
        ["NASA MODIS Surface Refl.", "NASA LP DAAC (MOD09A1)", "500m Global", "8-Day Composite", "Seamless regional outer basemap (62°E–92°E)"]
    ]

    t_src = doc.add_table(rows=len(data_rows)+1, cols=len(headers))
    t_src.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c_idx, h_text in enumerate(headers):
        c = t_src.cell(0, c_idx)
        set_cell_background(c, "0F766E") # Dark Teal
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row in enumerate(data_rows):
        bg_col = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
        for c_idx, val in enumerate(row):
            c = t_src.cell(r_idx+1, c_idx)
            set_cell_background(c, bg_col)
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.0)
            r.font.color.rgb = COLOR_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -----------------------------------------------------------------------
    # Section 4: Agricultural Ground Truth & PMFBY Olympic Baseline
    # -----------------------------------------------------------------------
    add_h1("4. Agricultural Ground Truth & Failure Label Definition")
    add_p(
        "To establish realistic agronomic ground truth, the pipeline implements the official Pradhan Mantri "
        "Fasal Bima Yojana (PMFBY) 5-year rolling Olympic baseline. Agricultural yields exhibit long-term technological "
        "increases, making fixed thresholding invalid. The Olympic average isolates true climate collapse from natural variance."
    )
    doc.add_picture(str(d3_path), width=Inches(6.6))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p("Figure 2: PMFBY 5-year rolling Olympic baseline workflow and >= 15% deficit failure classification.", bold_prefix="Baseline Logic: ", space_after=8)

    add_p(
        "Mathematical Formulation: For district D, crop C, and year Y, we collect preceding valid harvest yields: "
        "Y_prior = { Yield_(D,C,t) | Y-7 <= t < Y and Yield > 0 }. When >= 5 years exist, yields are sorted in ascending "
        "order [y(1), y(2), y(3), y(4), y(5)]. The highest and lowest values are dropped, and the middle 3 are averaged: "
        "Baseline = (y(2) + y(3) + y(4)) / 3. Anomaly % = ((Yield_Y - Baseline) / Baseline) * 100. "
        "Failure label y = 1 if Anomaly <= -15.0%, else y = 0. Temporal integrity is strictly preserved: no concurrent or future yields influence the baseline."
    )

    # -----------------------------------------------------------------------
    # Section 5: Spatiotemporal CNN–LSTM Architecture
    # -----------------------------------------------------------------------
    add_h1("5. Spatiotemporal CNN–LSTM Deep Learning Architecture")
    add_p(
        "The neural network architecture integrates spatial visual feature extraction with sequential temporal recurrent modeling. "
        "Each training observation is represented as a sequence across T = 6 fortnightly Kharif observation windows (mid-June through late August)."
    )
    doc.add_picture(str(d2_path), width=Inches(6.8))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p("Figure 3: Spatiotemporal tensor flow through 2D-CNN feature extraction, climate/crop conditioning fusion, BiLSTM recurrent modeling, and binary risk classification head.", bold_prefix="Neural Network Architecture: ", space_after=8)

    add_h2("Layer Tensor Shapes & Flow")
    add_p("1. Satellite Patch Input: Shape [Batch, T=6, C=8, H=32, W=32]. The 8 channels comprise B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2), NDVI, and NDWI.")
    add_p("2. 2D Spatial CNN Extractor: Reshapes tensor to [Batch*6, 8, 32, 32], applies Conv2D(8->16, k=3, p=1) + BatchNorm2d + ReLU + MaxPool2d(2) -> Conv2D(16->24, k=3, p=1) + BatchNorm2d + ReLU + MaxPool2d(2) -> AdaptiveAvgPool2d((1,1)) -> Flatten. Result: [Batch, T=6, 24] visual features.")
    add_p("3. Climate & Conditioning Sequence: Shape [Batch, T=6, 10]. Contains normalized rainfall, normalized departure, normalized ONI anomaly, valid pixel coverage fraction, and the 6D one-hot crop vector.")
    add_p("4. Fused Sequential Input: Fused via torch.cat([Spatial_24, Climate_10], dim=-1) to yield input dimension 34 per timestep.")
    add_p("5. Bidirectional LSTM Stage: 1 layer, bidirectional, hidden size 24. Outputs [Batch, T=6, 48].")
    add_p("6. Temporal Pooling & Classification Head: Extracts the final timestep state h_6 [Batch, 48], applies Linear(48->24) + ReLU + Dropout(p=0.25) -> Linear(24->1) -> Sigmoid activation.")
    add_p("7. Class-Weighted Loss: Optimized using BCEWithLogitsLoss with positive weighting pos_weight = N_neg / N_pos ≈ 4.33, heavily penalizing missed disasters.")

    # -----------------------------------------------------------------------
    # Section 6: Crop Conditioning & Proxy Disclosure
    # -----------------------------------------------------------------------
    add_h1("6. Crop Conditioning Mechanism & Proxy Disclosure")
    add_p(
        "Inside train_all_kharif_crops_cnn_lstm.py, crop conditioning is implemented via a 6-dimensional one-hot identity vector: "
        "Rice [1,0,0,0,0,0], Soybean [0,1,0,0,0,0], Cotton [0,0,1,0,0,0], Bajra [0,0,0,1,0,0], Jowar [0,0,0,0,1,0], Tur [0,0,0,0,0,1]. "
        "This vector is concatenated directly into the sequence input at every timestep of the BiLSTM, enabling the network to learn crop-specific vulnerability thresholds."
    )
    add_callout(
        "In the current Sentinel-2 dataset (MH_Rice_S2_Patches_*.geojson), patches were sampled across agricultural pixels "
        "within 20 pilot districts. The multi-crop model pairs the same regional agricultural patch with each crop's one-hot identity "
        "vector and target label. Therefore, the satellite branch acts as a REGIONAL AGRO-CLIMATIC PROXY (reflecting district-wide vegetative vigor, "
        "canopy health, and moisture stress via NDWI), while the crop vector directs the network to predict that crop's vulnerability. "
        "The model does NOT view field-level segmented crop polygons (e.g. exclusive cotton or soybean parcels).",
        title="TECHNICAL & ACADEMIC DISCLOSURE"
    )

    # -----------------------------------------------------------------------
    # Section 7: LOSO Validation & Per-Crop Metrics
    # -----------------------------------------------------------------------
    add_h1("7. Leave-One-Season-Out (LOSO) Validation & Evaluation Metrics")
    add_p(
        "To guarantee zero temporal leakage, the model was validated using Leave-One-Season-Out (LOSO) cross-validation "
        "across all test seasons (2019, 2020, 2021, and 2022). Normalization parameters were fitted strictly on training folds."
    )
    add_h2("Per-Crop Operational Performance Table (320 District-Crop Seasons)")

    m_headers = ["Crop", "Records", "Failures", "Failure %", "TN", "FP", "FN", "TP", "Precision", "Recall", "F1", "Bal. Acc.", "ROC-AUC"]
    m_data = [
        ["Bajra", "37", "5", "13.5%", "32", "0", "0", "5", "100.0%", "100.0%", "1.000", "1.000", "1.000"],
        ["Cotton", "49", "8", "16.3%", "40", "1", "0", "8", "88.9%", "100.0%", "0.941", "0.988", "0.993"],
        ["Jowar", "49", "16", "32.7%", "27", "6", "0", "16", "72.7%", "100.0%", "0.842", "0.909", "0.976"],
        ["Rice", "63", "8", "12.7%", "51", "4", "0", "8", "66.7%", "100.0%", "0.800", "0.964", "0.969"],
        ["Soybean", "54", "14", "25.9%", "36", "4", "0", "14", "77.8%", "100.0%", "0.875", "0.950", "0.991"],
        ["Tur", "68", "9", "13.2%", "58", "1", "1", "8", "88.9%", "88.9%", "0.889", "0.936", "0.985"],
        ["Overall", "320", "60", "18.8%", "244", "16", "1", "59", "78.7%", "98.3%", "0.874", "0.961", "0.984"]
    ]

    t_met = doc.add_table(rows=len(m_data)+1, cols=len(m_headers))
    t_met.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c_idx, h_text in enumerate(m_headers):
        c = t_met.cell(0, c_idx)
        set_cell_background(c, "1E293B")
        set_cell_margins(c, 80, 80, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.bold = True
        r.font.size = Pt(7.8)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row in enumerate(m_data):
        bg_col = "F1F5F9" if r_idx % 2 == 0 else "FFFFFF"
        if r_idx == len(m_data) - 1:
            bg_col = "E2E8F0"
        for c_idx, val in enumerate(row):
            c = t_met.cell(r_idx+1, c_idx)
            set_cell_background(c, bg_col)
            set_cell_margins(c, 70, 70, 80, 80)
            p = c.paragraphs[0]
            r = p.add_run(val)
            if r_idx == len(m_data) - 1 or c_idx in [8, 9, 10]:
                r.bold = True
            r.font.size = Pt(7.5)
            r.font.color.rgb = COLOR_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    add_p(
        "Key Findings: Across all 320 district-crop seasons, 59 out of 60 historical failures were correctly predicted "
        "(Recall = 98.3%). Positive class re-weighting keeps false negatives near zero at the expense of a moderate false-alarm "
        "rate in Rice (66.7% precision) and Jowar (72.7% precision), which aligns with agrarian disaster management priorities."
    )

    # -----------------------------------------------------------------------
    # Section 8: Geospatial Satellite Terrain & GEE Engine
    # -----------------------------------------------------------------------
    add_h1("8. Geospatial Satellite Terrain & Earth Engine Mapping Engine")
    add_p(
        "The district risk map integrates an authentic, dual-resolution Earth observation basemap. To eliminate the stepped "
        "tile dropouts caused by land-only DEMs, the pipeline executes a three-stage compositing workflow:"
    )
    add_p("• Step 1 (Earth Engine MODIS Export): Uses NASA MODIS 8-day surface reflectance (MOD09A1) across [62.0°E, 8.0°N, 92.0°E, 30.0°N]. Because MODIS images land and ocean in a single continuous grid, it never cuts off at the coast.")
    add_p("• Step 2 (Python Dual-Resolution Blending): Blends the 500m MODIS regional canvas with the ~540MB high-res Maharashtra GeoTIFF (10m Sentinel-2 + DEM) using a 20px Gaussian-blurred alpha mask and color-ratio balancing. Post-export fills the southwest ocean corner with RGB(0, 11, 21).")
    add_p("• Step 3 (React SVG Transform): Maps the combined WebP asset to SVG viewBox (0, 0, 860, 713) with coordinates x = -1091.8 px, y = -859.9 px, width = 3089.8 px, height = 2394.6 px, guaranteeing zero black margins even at 25% zoom out.")

    # Embed master satellite terrain preview
    sat_img_path = ROOT / "public" / "images" / "maharashtra_satellite_terrain_sentinel2_dem.png"
    if sat_img_path.exists():
        doc.add_picture(str(sat_img_path), width=Inches(6.4))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_p("Figure 4: Master dual-resolution satellite terrain basemap combining high-resolution Maharashtra Sentinel-2 + DEM core with wide regional MODIS Arabian Sea and Indian subcontinent canvas.", bold_prefix="Basemap Preview: ", space_after=10)

    # -----------------------------------------------------------------------
    # Section 9: Frontend Architecture
    # -----------------------------------------------------------------------
    add_h1("9. Frontend Dashboard Architecture & UI Components")
    add_p("Built with React 18, Vite, TypeScript, and TailwindCSS, the dashboard provides interactive decision support:")
    add_p("• DashboardContext.tsx: Global state manager coordinating selectedYear, selectedDistrictId, selectedCrop, and 320 precomputed CNN-LSTM inferences.")
    add_p("• DistrictChoropleth.tsx: Interactive SVG choropleth with mouse drag-panning, wheel-zooming (clamped 75%–250%), dynamic risk categorization, and satellite terrain alignment.")
    add_p("• RainfallYieldChart.tsx: Synchronized dual-axis chart contrasting IMD precipitation against harvest yields, with vertical indicators marking historical El Niño drought years.")
    add_p("• FutureElNinoPage.tsx: Policy scenario simulator modeling crop-specific vulnerability under synthetic +0.5°C to +2.5°C ENSO sea-surface temperature shocks.")

    # -----------------------------------------------------------------------
    # Section 10: Execution & Maintenance Guide
    # -----------------------------------------------------------------------
    add_h1("10. Execution, Retraining, and Reproduction Guide")
    add_p("1. Launch Web Application:", bold_prefix="Local Dev: ")
    add_p("npm install  &&  npm run dev (Runs on http://localhost:3000)")
    add_p("2. Retrain Multi-Crop Model:", bold_prefix="Model Training: ")
    add_p("& 'C:\\Users\\USMAN\\AppData\\Local\\Python\\bin\\python.exe' CNN_LSTM_Training/CropFailureProject/train_all_kharif_crops_cnn_lstm.py")
    add_p("3. Re-generate Satellite Terrain Basemap:", bold_prefix="Terrain Pipeline: ")
    add_p("& 'C:\\Users\\USMAN\\AppData\\Local\\Python\\bin\\python.exe' scripts/combine_wide_satellite_terrain.py -i data/regional_seamless_satellite_terrain_500m.tif")
    add_p("4. Synchronize with Hugging Face Hub:", bold_prefix="Data Backup: ")
    add_p("& 'C:\\Users\\USMAN\\AppData\\Local\\Python\\bin\\python.exe' hf_sync.py --repo-id UsmanSait/elnino-crop-failure-pbl --repo-type dataset --token <HF_TOKEN>")

    # Save Word Document
    doc.save(str(docx_path))
    print(f"[+] Successfully saved Word document to: {docx_path}")


# ---------------------------------------------------------------------------
# 3. Export Word Document to Native PDF via Word COM Automation
# ---------------------------------------------------------------------------
def convert_docx_to_pdf(docx_path: Path, pdf_path: Path):
    print(f"[*] Converting Word document to PDF via Word COM automation...")
    import subprocess
    ps_cmd = f"""
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open('{docx_path.resolve()}')
    $doc.SaveAs('{pdf_path.resolve()}', 17) # 17 = wdFormatPDF
    $doc.Close()
    $word.Quit()
    """
    res = subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, text=True)
    if res.returncode == 0 and pdf_path.exists():
        print(f"[+] Successfully exported native PDF to: {pdf_path}")
        print(f"    PDF File Size: {pdf_path.stat().st_size / (1024*1024):.2f} MB")
    else:
        print(f"[!] Warning: Word COM PDF conversion output: {res.stderr}")


def main():
    d1, d2, d3 = render_diagrams()
    docx_out = ROOT / "FULL_PROJECT_DOCUMENTATION.docx"
    pdf_out = ROOT / "FULL_PROJECT_DOCUMENTATION.pdf"
    create_word_document(docx_out, d1, d2, d3)
    convert_docx_to_pdf(docx_out, pdf_out)

if __name__ == '__main__':
    main()
