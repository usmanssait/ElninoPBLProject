/**
 * Full, production-grade Python script implementing visualize_results.py
 * with the new create_event_map(), EVENT_CMAP, and compound event analysis.
 * Adheres strictly to the user's dashboard map theme:
 *   THEME_BG = "#232A20"
 *   THEME_BORDER = "#53594A"
 *   THEME_TEXT = "#F1E9D9"
 */

export const PYTHON_VISUALIZE_RESULTS_PY = `import os
from pathlib import Path

import pandas as pd
import geopandas as gpd
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Patch

# ============================================================
# DASHBOARD MAP THEME
# ============================================================

THEME_BG = "#232A20"
THEME_BORDER = "#53594A"
THEME_TEXT = "#F1E9D9"

# Rainfall: Light lavender to deep purple
RAIN_CMAP = LinearSegmentedColormap.from_list(
    "theme_rainfall",
    ["#ECE8F2", "#C7BCD7", "#A99BBE", "#71658C"],
)

# Rice Yield: Soft cream to rich olive gold
YIELD_CMAP = LinearSegmentedColormap.from_list(
    "theme_yield",
    ["#F1E9BF", "#D3D291", "#A9AE6A", "#8B8C5A"],
)

# Crop Failure & Climate Anomaly Events Colormap:
# Forest green (Resilient/Normal) -> Olive -> Amber Gold (Stress Warning) -> Terracotta (Moderate Failure) -> Deep Crimson (Severe Failure Event)
EVENT_CMAP = LinearSegmentedColormap.from_list(
    "theme_events",
    ["#4A6B46", "#8B9E5A", "#DCA44E", "#C75836", "#8F2420"],
)

# Anomaly Gradient (Centered on 0%): Deep Red (-30%) -> Amber (-10%) -> Olive (0%) -> Forest Green (+25%)
EVENT_ANOMALY_CMAP = LinearSegmentedColormap.from_list(
    "theme_yield_anomaly",
    ["#8F2420", "#C75836", "#DCA44E", "#A9AE6A", "#4A6B46"],
)

# Discrete event category colors
EVENT_CATEGORICAL_COLORS = {
    0: "#526E4D",  # Normal / Resilient (Yield >= -10%)
    1: "#B83A3A",  # Critical Crop Failure Event (Yield < -10%)
}


# ============================================================
# PROJECT PATHS
# ============================================================

_LEGACY_PROJECT_ROOT = Path(r"C:\\Users\\SALMAN\\Desktop\\Usman ELNINO Project")
_HERE = Path(__file__).resolve().parent


def _resolve_path(relative_parts, env_var=None):
    """
    Find a data file across common locations instead of assuming one
    fixed absolute folder structure.
    """
    relative_parts = tuple(relative_parts)

    if env_var:
        override = os.environ.get(env_var)
        if override:
            p = Path(override)
            if p.exists():
                return p

    candidates = [
        _HERE.joinpath(*relative_parts),
        _HERE.parent.joinpath(*relative_parts),
        Path.cwd().joinpath(*relative_parts),
        _LEGACY_PROJECT_ROOT.joinpath(*relative_parts),
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    searched = "\\n  ".join(str(c) for c in candidates)
    hint = f" Or set the {env_var} environment variable to point at it directly." if env_var else ""
    raise FileNotFoundError(
        f"Could not find data file '{Path(*relative_parts)}'. Looked in:\\n  {searched}\\n{hint}"
    )


def _des_file():
    return _resolve_path(
        [
            "InputData",
            "2015-2023 DES Kharif Rice Data maharashtra",
            "des_rice_maharashtra_kharif_final.csv",
        ],
        env_var="DES_FILE_PATH",
    )


def _rain_file():
    return _resolve_path(
        ["Output", "imd_district_kharif_rainfall_2015_2022.csv"],
        env_var="RAIN_FILE_PATH",
    )


def _boundary_file():
    return _resolve_path(
        ["InputData", "District Bounds json", "Maharashtra.Districts.geojson"],
        env_var="BOUNDARY_FILE_PATH",
    )


# ============================================================
# VALIDATION HELPERS
# ============================================================

def _require_columns(df, columns, label):
    missing = [c for c in columns if c not in df.columns]
    if missing:
        raise ValueError(
            f"{label} is missing expected column(s): {missing}. "
            f"Columns found: {list(df.columns)}"
        )


def _parse_kharif_year(year):
    """
    Turn a UI year like '2020-21' into (start_year, end_year, des_year_value)
    with clear error reporting.
    """
    try:
        start_year = int(str(year)[:4])
    except (TypeError, ValueError):
        raise ValueError(f"Unrecognized Kharif year format: {year!r} (expected e.g. '2020-21')")

    end_year = start_year + 1
    des_year_value = f"{start_year} - {end_year}"
    return start_year, end_year, des_year_value


# ============================================================
# LOAD DATA
# ============================================================

def load_data():
    """Load DES, IMD rainfall and district boundary data."""
    des = pd.read_csv(_des_file())
    _require_columns(des, ["year", "district", "yield_t_per_ha"], "DES rice data")

    rainfall = pd.read_csv(_rain_file())
    _require_columns(rainfall, ["year", "district", "kharif_rainfall_mm"], "IMD rainfall data")

    districts = gpd.read_file(_boundary_file())
    _require_columns(districts, ["name", "geometry"], "District boundary data")

    # Keep only valid polygon geometries
    districts = districts[
        districts.geometry.geom_type.isin(["Polygon", "MultiPolygon"])
    ].copy()

    try:
        districts["geometry"] = districts.geometry.make_valid()
    except AttributeError:
        districts["geometry"] = districts.geometry.buffer(0)

    # Standardize boundary names with DES nomenclature
    districts["district"] = districts["name"].replace({
        "Ahilyanagar District": "Ahilyanagar",
        "Gondiya": "Gondia",
    })

    return des, rainfall, districts


# ============================================================
# FILTER YEAR & COMPUTE EVENTS
# ============================================================

def get_year_data(year, des, rainfall):
    """Get DES and IMD data for a specific crop year like '2020-21'."""
    _, _, des_year_value = _parse_kharif_year(year)

    des_year = des[des["year"] == des_year_value].copy() if "year" in des.columns else des.iloc[0:0].copy()
    rain_year = rainfall[rainfall["year"] == year].copy() if "year" in rainfall.columns else rainfall.iloc[0:0].copy()

    return des_year, rain_year


def get_event_data(year, des, districts, rainfall=None, threshold_pct=-10.0, baseline_window=5):
    """
    Computes district-level crop failure and climate anomaly events for the target year.
    
    Strict zero-leakage protocol:
      Baseline yield is computed strictly using prior historical years (t < year).
      If prior records are fewer than 3, the district long-term mean is used.
    
    Returns DataFrame containing:
      - 'district': Canonical district name
      - 'actual_yield': Yield for current year (t/ha)
      - 'baseline_yield': Historical baseline yield (t/ha)
      - 'yield_anomaly_pct': Percentage departure ((actual - base) / base) * 100
      - 'failure_event': 1 if yield_anomaly_pct < threshold_pct else 0
      - 'compound_risk': Multi-hazard composite index (0-100) combining rainfall & yield deficits
    """
    start_year, _, des_year_value = _parse_kharif_year(year)

    # All prior years strictly before start_year (Zero target-year leakage)
    prior_years = [f"{y} - {y + 1}" for y in range(start_year - baseline_window, start_year)]
    
    results = []
    unique_districts = sorted(des["district"].dropna().unique())

    for dist in unique_districts:
        dist_df = des[des["district"] == dist]
        curr = dist_df[dist_df["year"] == des_year_value]
        if curr.empty:
            continue
        
        actual_yield = float(curr["yield_t_per_ha"].values[0])
        prior_df = dist_df[dist_df["year"].isin(prior_years)]

        if len(prior_df) >= 3:
            baseline = float(prior_df["yield_t_per_ha"].mean())
        else:
            # Fall back to long-term all-years mean excluding current target year
            other_years = dist_df[dist_df["year"] != des_year_value]
            baseline = float(other_years["yield_t_per_ha"].mean()) if not other_years.empty else actual_yield

        anomaly_pct = ((actual_yield - baseline) / baseline) * 100.0 if baseline > 0 else 0.0
        failure_flag = 1 if anomaly_pct < threshold_pct else 0

        # Calculate compound stress risk if rainfall is provided
        compound_risk = 0.0
        if rainfall is not None and "year" in rainfall.columns:
            r_curr = rainfall[(rainfall["district"] == dist) & (rainfall["year"] == year)]
            if not r_curr.empty:
                rain_mm = float(r_curr["kharif_rainfall_mm"].values[0])
                # Rainfall normal ~ 1100 mm across Maharashtra
                rain_deficit = max(0.0, (1100.0 - rain_mm) / 1100.0 * 100.0)
                yield_deficit = max(0.0, -anomaly_pct * 1.5)
                compound_risk = min(100.0, (rain_deficit * 0.5) + (yield_deficit * 0.5))

        results.append({
            "district": dist,
            "actual_yield": actual_yield,
            "baseline_yield": baseline,
            "yield_anomaly_pct": anomaly_pct,
            "failure_event": failure_flag,
            "compound_risk": compound_risk,
        })

    return pd.DataFrame(results)


# ============================================================
# SHARED MAP-BUILDING LOGIC
# ============================================================

def _empty_map_figure(title):
    """A themed placeholder figure for when there's nothing to plot."""
    fig, ax = plt.subplots(figsize=(7.0, 4.6), facecolor=THEME_BG)
    ax.set_facecolor(THEME_BG)
    ax.set_axis_off()
    ax.text(
        0.5, 0.5, "No data available",
        ha="center", va="center",
        color=THEME_TEXT, fontsize=12,
        transform=ax.transAxes,
    )
    ax.set_title(title, fontsize=14, color=THEME_TEXT, pad=8)
    return fig


def _build_choropleth(districts, data_year, value_col, base_color, cmap, unit, title, value_fmt="{:.0f}"):
    if "district" not in data_year.columns or value_col not in data_year.columns:
        return _empty_map_figure(title)

    merged = districts.merge(
        data_year[["district", value_col]],
        on="district",
        how="inner",
    )

    fig, ax = plt.subplots(figsize=(7.0, 4.6), facecolor=THEME_BG)

    districts.plot(
        ax=ax,
        color=base_color,
        edgecolor=THEME_BORDER,
        linewidth=0.55,
    )

    has_data = not merged.empty and merged[value_col].notna().any()

    if has_data:
        vmin = float(merged[value_col].min())
        vmax = float(merged[value_col].max())
        if vmin == vmax:
            vmin -= 0.5
            vmax += 0.5

        merged.plot(
            column=value_col,
            cmap=cmap,
            vmin=vmin,
            vmax=vmax,
            edgecolor=THEME_BORDER,
            linewidth=0.55,
            ax=ax,
            legend=False,
        )

        sm = mpl.cm.ScalarMappable(cmap=cmap, norm=mpl.colors.Normalize(vmin=vmin, vmax=vmax))
        sm.set_array([])
        cbar = fig.colorbar(sm, ax=ax, shrink=0.55, pad=0.03, aspect=8)
        cbar.set_ticks([vmin, vmax])
        cbar.set_ticklabels([
            f"{value_fmt.format(vmin)} {unit}",
            f"{value_fmt.format(vmax)} {unit}",
        ])
        cbar.outline.set_visible(True)
        cbar.outline.set_edgecolor(THEME_BORDER)
        cbar.outline.set_linewidth(0.8)
        cbar.ax.tick_params(length=0, labelsize=9.5, colors=THEME_TEXT)
    else:
        ax.text(
            0.5, 0.04, "No matching district data for this year",
            ha="center", va="bottom",
            color=THEME_TEXT, fontsize=9,
            transform=ax.transAxes,
        )

    ax.set_facecolor(THEME_BG)
    ax.set_title(title, fontsize=14, color=THEME_TEXT, pad=8)
    ax.set_axis_off()
    fig.subplots_adjust(left=0.02, right=0.88, top=0.88, bottom=0.02)

    return fig


# ============================================================
# RAINFALL MAP
# ============================================================

def create_rainfall_map(year, rainfall, districts):
    """Create and return a rainfall map figure."""
    title = f"Maharashtra Kharif Rice Rainfall — {year}"

    if "year" not in rainfall.columns:
        return _empty_map_figure(title)

    rain_year = rainfall[rainfall["year"] == year].copy()

    return _build_choropleth(
        districts=districts,
        data_year=rain_year,
        value_col="kharif_rainfall_mm",
        base_color="#F2EFF8",
        cmap=RAIN_CMAP,
        unit="mm",
        value_fmt="{:.0f}",
        title=title,
    )


# ============================================================
# YIELD MAP
# ============================================================

def create_yield_map(year, des, districts):
    """Create and return a rice yield map figure."""
    title = f"Maharashtra Kharif Rice Yield — {year}"

    _, _, des_year_value = _parse_kharif_year(year)

    if "year" not in des.columns:
        return _empty_map_figure(title)

    des_year = des[des["year"] == des_year_value].copy()

    return _build_choropleth(
        districts=districts,
        data_year=des_year,
        value_col="yield_t_per_ha",
        base_color="#F1EFC7",
        cmap=YIELD_CMAP,
        unit="t/ha",
        value_fmt="{:.1f}",
        title=title,
    )


# ============================================================
# EVENT & CROP FAILURE MAP (NEW SIMILAR VISUALIZATION)
# ============================================================

def create_event_map(year, des, districts, rainfall=None, event_metric="failure_event", threshold_pct=-10.0):
    """
    Create and return an Event map figure for Maharashtra Kharif Rice.
    
    Supports:
      - 'failure_event': Discrete failure flag (1 = Failure [Yield Drop > 10%], 0 = Normal)
      - 'yield_anomaly_pct': Percentage departure from historical baseline (%)
      - 'compound_risk': Multi-hazard composite index (0-100) combining rainfall & yield deficits
    
    Adheres strictly to the Streamlit dashboard theme (#232A20, #53594A, #F1E9D9)
    with custom colorbar/categorical legend, geometry error recovery, and proper padding.
    """
    event_df = get_event_data(year, des, districts, rainfall=rainfall, threshold_pct=threshold_pct)

    if event_df.empty:
        return _empty_map_figure(f"Maharashtra Kharif Crop Failure Events — {year}")

    # Mode 1: Discrete Binary Failure Event Classification
    if event_metric == "failure_event":
        title = f"Maharashtra Kharif Crop Failure Events — {year}"
        merged = districts.merge(event_df[["district", "failure_event"]], on="district", how="inner")

        fig, ax = plt.subplots(figsize=(7.0, 4.6), facecolor=THEME_BG)

        # Base background for non-rice / unmapped districts
        districts.plot(
            ax=ax,
            color="#2A3127",
            edgecolor=THEME_BORDER,
            linewidth=0.55,
        )

        # Plot Normal / Resilient districts (failure_event == 0)
        resilient = merged[merged["failure_event"] == 0]
        if not resilient.empty:
            resilient.plot(
                ax=ax,
                color=EVENT_CATEGORICAL_COLORS[0],
                edgecolor=THEME_BORDER,
                linewidth=0.6,
            )

        # Plot Crop Failure Event districts (failure_event == 1)
        failures = merged[merged["failure_event"] == 1]
        if not failures.empty:
            failures.plot(
                ax=ax,
                color=EVENT_CATEGORICAL_COLORS[1],
                edgecolor="#FF7A70",
                linewidth=0.9,
            )

        # Count statistics for header/legend
        fail_count = len(failures)
        total_count = len(merged)

        # Custom Themed Categorical Legend
        legend_elements = [
            Patch(facecolor=EVENT_CATEGORICAL_COLORS[0], edgecolor=THEME_BORDER, label=f"Resilient / Normal ({total_count - fail_count})"),
            Patch(facecolor=EVENT_CATEGORICAL_COLORS[1], edgecolor="#FF7A70", label=f"Crop Failure Event ({fail_count}) [Yield < {threshold_pct:.0f}%]"),
            Patch(facecolor="#2A3127", edgecolor=THEME_BORDER, label="Non-Study District"),
        ]
        leg = ax.legend(
            handles=legend_elements,
            loc="lower left",
            frameon=True,
            facecolor="#1A2017",
            edgecolor=THEME_BORDER,
            fontsize=9.0,
            labelcolor=THEME_TEXT,
        )
        leg.get_frame().set_linewidth(0.8)

        ax.set_facecolor(THEME_BG)
        ax.set_title(title, fontsize=14, color=THEME_TEXT, pad=8)
        ax.set_axis_off()
        fig.subplots_adjust(left=0.02, right=0.98, top=0.88, bottom=0.04)
        return fig

    # Mode 2: Continuous Yield Anomaly Percentage (-35% to +25%)
    elif event_metric == "yield_anomaly_pct":
        title = f"Maharashtra Kharif Rice Yield Anomaly — {year}"
        return _build_choropleth(
            districts=districts,
            data_year=event_df,
            value_col="yield_anomaly_pct",
            base_color="#2A3127",
            cmap=EVENT_ANOMALY_CMAP,
            unit="%",
            value_fmt="{:+.1f}",
            title=title,
        )

    # Mode 3: Compound Climate & Crop Risk Score (0 - 100)
    else:
        title = f"Maharashtra Compound El Niño Hazard Index — {year}"
        return _build_choropleth(
            districts=districts,
            data_year=event_df,
            value_col="compound_risk",
            base_color="#2A3127",
            cmap=EVENT_CMAP,
            unit="Risk",
            value_fmt="{:.0f}",
            title=title,
        )
`;

export const PYTHON_STREAMLIT_APP_PY = `import base64
from io import BytesIO
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from matplotlib.colors import LinearSegmentedColormap
import streamlit as st

from visualize_results import (
    load_data,
    get_year_data,
    get_event_data,
    create_rainfall_map,
    create_yield_map,
    create_event_map,
    THEME_BG,
    THEME_TEXT,
)

# THEME PALETTE
LAVENDER = "#71658C"
DEEP_GREEN = "#232A20"
OLIVE_GREEN = "#33372A"
OLIVE_ACCENT = "#8B8C5A"
DEEP_BG = "#192116"
CREAM = "#F1E9D9"
MUTED = "#B5B0A4"
FAILURE_RED = "#B83A3A"

st.set_page_config(
    page_title="Maharashtra Kharif Rice Analytics & Event Warning",
    page_icon="🌾",
    layout="wide"
)

# Custom CSS for dark agricultural console
st.markdown(f"""
<style>
    .stApp {{
        background-color: {DEEP_BG};
        color: {CREAM};
    }}
    .metric-card {{
        background-color: {DEEP_GREEN};
        border: 1px solid #53594A;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }}
    .metric-val {{
        font-size: 24px;
        font-weight: 700;
        font-family: monospace;
        color: #FFFFFF;
    }}
    .metric-lbl {{
        font-size: 12px;
        color: {MUTED};
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }}
</style>
""", unsafe_allow_html=True)

# Load datasets
des, rainfall, districts = load_data()

# Header
st.title("🌾 Maharashtra Kharif Rice Spatiotemporal Analytics")
st.caption("Visualizing Monsoon Rainfall, Rice Yield, and Crop Failure Events during El Niño / La Niña (2015–2022)")

# Sidebar Controls
st.sidebar.header("🕹️ Spatial Controls")
years = ["2015-16", "2016-17", "2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23"]
selected_year = st.sidebar.selectbox("Select Kharif Crop Year", years, index=0)

event_metric = st.sidebar.selectbox(
    "Event Visualization Metric",
    ["failure_event", "yield_anomaly_pct", "compound_risk"],
    format_func=lambda x: {
        "failure_event": "🚨 Discrete Crop Failure Flag (Yield < -10%)",
        "yield_anomaly_pct": "📈 Continuous Yield Anomaly (%)",
        "compound_risk": "⚡ Compound Multi-Hazard Risk Index (0-100)"
    }[x]
)

view_mode = st.sidebar.radio("Map Display Mode", ["Side-by-Side (Triptych)", "Single Focused Map"])

# Compute event data for summary metrics
event_df = get_event_data(selected_year, des, districts, rainfall=rainfall)
des_y, rain_y = get_year_data(selected_year, des, rainfall)

# Top KPI Metric Row
c1, c2, c3, c4 = st.columns(4)
with c1:
    avg_rain = rain_y["kharif_rainfall_mm"].mean() if not rain_y.empty else 0.0
    st.markdown(f'<div class="metric-card"><div class="metric-lbl">Average Rainfall</div><div class="metric-val">{avg_rain:.0f} mm</div></div>', unsafe_allow_html=True)

with c2:
    avg_yield = des_y["yield_t_per_ha"].mean() if not des_y.empty else 0.0
    st.markdown(f'<div class="metric-card"><div class="metric-lbl">Mean Rice Yield</div><div class="metric-val">{avg_yield:.2f} t/ha</div></div>', unsafe_allow_html=True)

with c3:
    fail_count = event_df["failure_event"].sum() if not event_df.empty else 0
    total_rice_dist = len(event_df)
    color = FAILURE_RED if fail_count > 6 else OLIVE_ACCENT
    st.markdown(f'<div class="metric-card"><div class="metric-lbl">Crop Failure Events</div><div class="metric-val" style="color:{color};">{fail_count} / {total_rice_dist}</div></div>', unsafe_allow_html=True)

with c4:
    mean_anom = event_df["yield_anomaly_pct"].mean() if not event_df.empty else 0.0
    sign = "+" if mean_anom >= 0 else ""
    st.markdown(f'<div class="metric-card"><div class="metric-lbl">Mean Yield Anomaly</div><div class="metric-val">{sign}{mean_anom:.1f}%</div></div>', unsafe_allow_html=True)

# Map Visualization Section
st.write("---")

if view_mode == "Side-by-Side (Triptych)":
    st.subheader(f"📊 Tri-Modal Spatiotemporal Comparison — Kharif {selected_year}")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.caption("🌧️ **IMD Kharif Rainfall (mm)**")
        fig_rain = create_rainfall_map(selected_year, rainfall, districts)
        st.pyplot(fig_rain)
        plt.close(fig_rain)

    with col2:
        st.caption("🌾 **DES Rice Yield (t/ha)**")
        fig_yield = create_yield_map(selected_year, des, districts)
        st.pyplot(fig_yield)
        plt.close(fig_yield)

    with col3:
        st.caption("🚨 **Crop Failure & Stress Events**")
        fig_event = create_event_map(selected_year, des, districts, rainfall=rainfall, event_metric=event_metric)
        st.pyplot(fig_event)
        plt.close(fig_event)

else:
    target_map = st.selectbox("Choose Map to Render", ["Crop Failure & Events Map", "Monsoon Rainfall Map", "Rice Yield Map"])
    if target_map == "Crop Failure & Events Map":
        fig = create_event_map(selected_year, des, districts, rainfall=rainfall, event_metric=event_metric)
    elif target_map == "Monsoon Rainfall Map":
        fig = create_rainfall_map(selected_year, rainfall, districts)
    else:
        fig = create_yield_map(selected_year, des, districts)
    
    st.pyplot(fig)
    plt.close(fig)

# District Telemetry Table
st.write("---")
st.subheader(f"📋 District Event Ledger — Kharif {selected_year}")
if not event_df.empty:
    st.dataframe(
        event_df.style.format({
            "actual_yield": "{:.2f} t/ha",
            "baseline_yield": "{:.2f} t/ha",
            "yield_anomaly_pct": "{:+.1f}%",
            "compound_risk": "{:.0f}/100",
        }).applymap(
            lambda v: "color: #FF6B6B; font-weight: bold;" if v == 1 else "color: #78D678;",
            subset=["failure_event"]
        ),
        use_container_width=True
    )
`;
