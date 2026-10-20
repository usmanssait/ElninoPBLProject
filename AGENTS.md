# Agent & Developer Guide: El Niño Kharif Crop Failure Project

> **Welcome!** If you or an AI coding assistant (Antigravity, Cursor, Claude Code, Copilot, etc.) have opened this directory, this file provides the complete context, architectural patterns, dataset links, and session history to continue working immediately.

---

## 1. Project Overview & Mission
This project predicts **Kharif crop failure (currently focused on Rice in Maharashtra)** driven by climate shocks, meteorological anomalies (El Niño / IOD), and spatiotemporal Sentinel-2 satellite imagery.

* **Frontend Dashboard**: React 18 + Vite + TypeScript + TailwindCSS + Lucide Icons + Recharts.
* **Modelling**: CNN-LSTM deep learning architecture combining multi-spectral Sentinel-2 patches with time-series rainfall/SPI/temperature indices.
* **Large Datasets & Models**: Hosted on **Hugging Face Hub** at:
  👉 **[https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl](https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl)**

---

## 2. Conversation & Chat History & Continuity Rule
The full, chronological chat history, design decisions, user feedback, and prompt iterations are recorded in:
📄 **[docs/PROJECT_CHAT_ARCHIVE.md](file:///c:/Users/USMAN/Desktop/Usman%20ELNINO%20Project/ElninoPBLProject-main/ElninoPBLProject-main/docs/PROJECT_CHAT_ARCHIVE.md)**

To resume a conversation or ask an AI to continue from where we left off:
> *"Read `AGENTS.md` and `docs/PROJECT_CHAT_ARCHIVE.md` to understand our previous work and implementation history, and let's continue with the next phase."*

### ⚠️ Mandatory Agent Rule: Keep Chat Archive Up-to-Date
Whenever completing a user request, significant task, or architectural refactor, the agent **MUST** run:
```powershell
& "C:\Users\USMAN\AppData\Local\Python\bin\python.exe" sync_chat.py
```
This automatically updates `docs/PROJECT_CHAT_ARCHIVE.md` with new dialogue turns and sanitizes tokens so that conversation history is never lost.

---

## 3. Current Architecture (Phase 1 Refactor Completed)

### Navigation & Layout
* **Sidebar** (`src/components/Sidebar.tsx`): The single navigation system with collapsible sections:
  * **Exploration**: Overview, District Risk Map, Historical Analysis, Rainfall & Crop Trends
  * **Modelling & Forecasting**: CNN–LSTM Predictions, Model & Architecture, LOSO Validation, Future El Niño
  * **Project**: Data Sources, About Project
* **Global State** (`src/context/DashboardContext.tsx`):
  * Centralizes `selectedYear` (default: 2020), `selectedDistrictId` (default: `pune`), and precomputed model predictions so state stays unified across page transitions.

### Core Components
* **Overview Page** (`src/pages/OverviewPage.tsx`):
  * 6 KPI summary cards.
  * Interactive GeoJSON Choropleth Map (`DistrictChoropleth.tsx`) with 530px vertical height and risk classification.
  * Dual-Axis Rainfall & Yield Chart (`RainfallYieldChart.tsx`) with synchronized Kharif month indicators and climate index docks.
  * District Insights Panel (`DistrictDetailPanel.tsx`).
* **Canonical District Definitions** (`src/data/canonicalDistricts.ts`):
  * Differentiates primary Kharif rice-growing districts from non-rice/arid districts per agronomic feedback.

---

## 4. Large Data Files & Hugging Face Hub Storage

GitHub restricts files larger than 100 MB. To support massive satellite rasters without losing local data:
* **`.gitattributes`**: Configured with Git LFS patterns for `*.tif`, `*.tiff`, `*.pt`, `*.zip`.
* **`.gitignore`**: Preserves local datasets while ignoring temporary builds (`node_modules/`, `dist/`, `.env`).
* **Hugging Face Hub Repository**:
  * Dataset URL: `https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl`
  * Includes the **3.14 GB** classification raster (`classified-10m-India-2020-Winter_rice-WGS84.tif`), Sentinel-2 pilot rasters, and PyTorch checkpoints.
* **Sync Script** (`hf_sync.py`):
  ```powershell
  & "C:\Users\USMAN\AppData\Local\Python\bin\python.exe" hf_sync.py --repo-id UsmanSait/elnino-crop-failure-pbl --repo-type dataset --token <HF_TOKEN>
  ```

---

## 5. Development & Running Locally

```bash
# Install dependencies
npm install

# Start local development server (runs on http://localhost:3000)
npm run dev

# Run linter and type-check
npm run lint

# Build for production
npm run build
```

---

## 6. Upcoming Roadmap (Next Phases)
1. **Phase 2 (All-Kharif Crops Expansion)**:
   * Expand from Rice-only to other primary Kharif crops (Soybean, Cotton, Bajra, Jowar).
   * Update data schema, canonical crop filters, and multi-crop yield anomaly predictions.
2. **Phase 3 (Live GEE Inference & Multi-district Retraining)**:
   * Connect live Google Earth Engine pipeline for real-time in-season patch extraction.
