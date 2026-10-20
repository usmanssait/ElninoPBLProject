# Spatiotemporal CNN-LSTM Crop Failure Prediction (Maharashtra Kharif Rice)

An end-to-end early warning and crop failure prediction platform combining **Sentinel-2 multi-spectral satellite imagery**, meteorological indices (**IMD rainfall, SPI, temperature**), and climate shock telemetry (**El Niño / NOAA ONI, Indian Ocean Dipole**) to forecast Kharif crop yield failure before harvest.

---

## 🌟 Key Highlights & Repositories

* **Live Datasets & Models**: Hosted on **Hugging Face Hub** (with Git LFS for large satellite rasters):  
  👉 **[huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl](https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl)**
* **Frontend Dashboard**: React 18 + Vite + TypeScript + TailwindCSS + Recharts.
* **Deep Learning Model**: Spatiotemporal CNN-BiLSTM trained on 2019–2022 Sentinel-2 imagery and multi-season climate time-series.
* **Continuous AI Collaboration**: Full chat logs and context are preserved in [`AGENTS.md`](./AGENTS.md) and [`docs/PROJECT_CHAT_ARCHIVE.md`](./docs/PROJECT_CHAT_ARCHIVE.md).

---

## 🚀 Quickstart

### 1. Dashboard Application
```bash
# Install dependencies
npm install

# Start local development server (runs on http://localhost:3000)
npm run dev

# Lint and build for production
npm run lint
npm run build
```

### 2. Standalone PyTorch Inference & Python Pipeline
```powershell
# Navigate to model workspace
cd CNN_LSTM_Training\CropFailureProject

# Run inference across satellite seasons (2019-2022)
& "C:\Users\USMAN\AppData\Local\Python\bin\python.exe" predict_crop_failure.py --years 2022
```

### 3. Sync to Hugging Face Hub
To sync code, datasets, and satellite rasters:
```powershell
& "C:\Users\USMAN\AppData\Local\Python\bin\python.exe" hf_sync.py --repo-id UsmanSait/elnino-crop-failure-pbl --repo-type dataset --token <YOUR_HF_TOKEN>
```

---

## 📂 Project Structure

```
├── AGENTS.md                            # Universal instructions for AI coding assistants
├── src/
│   ├── components/
│   │   ├── charts/RainfallYieldChart.tsx # Dual-axis synchronized rainfall & yield trends
│   │   ├── map/DistrictChoropleth.tsx    # Interactive Maharashtra GeoJSON risk map
│   │   ├── panels/DistrictDetailPanel.tsx# Deep district agronomic insights
│   │   └── Sidebar.tsx                   # Grouped & collapsible navigation
│   ├── context/DashboardContext.tsx      # Unified year, district, & prediction state
│   └── pages/                            # Overview, Model Predictions, Future El Niño, etc.
├── CNN_LSTM_Training/
│   ├── CropFailureProject/               # PyTorch training, weights (.pt), GeoJSON patches
│   └── SatteliteImagery/                 # 10m Sentinel-2 rasters & GEE sampling scripts
├── docs/
│   └── PROJECT_CHAT_ARCHIVE.md           # Up-to-date dialogue & implementation archive
├── hf_sync.py                           # Resumable Hugging Face Hub dataset uploader
└── sync_chat.py                         # Chat archive synchronizer
```

---

## 🤖 For AI Agents & Continuing the Conversation

If you or an AI assistant (Antigravity, Cursor, Claude Code, GitHub Copilot) open this directory:

1. **Read [`AGENTS.md`](./AGENTS.md)** to instantly understand active state, canonical district rules, and the Phase 2 roadmap.
2. **Review [`docs/PROJECT_CHAT_ARCHIVE.md`](./docs/PROJECT_CHAT_ARCHIVE.md)** to inspect past prompts, decisions, and discussions.
3. **Keep Chat Up-to-Date Rule**:
   Whenever a major feature or iteration is completed, the agent must run:
   ```powershell
   & "C:\Users\USMAN\AppData\Local\Python\bin\python.exe" sync_chat.py
   ```
   This ensures new prompts, feedback, and implementations are automatically saved for the next session.
