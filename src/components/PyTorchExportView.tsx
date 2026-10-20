import React, { useState } from 'react';
import {
  AUDIT_BASELINE_PY,
  MODEL_PY,
  DATASET_PY,
  TRAIN_PY,
  REQUIREMENTS_TXT,
} from '../data/pytorchCodeTemplates';
import { FileCode2, Copy, Check, Download, Terminal, Cpu } from 'lucide-react';

export const PyTorchExportView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('audit_baseline.py');
  const [copied, setCopied] = useState<boolean>(false);

  const files: Record<string, { content: string; desc: string; ext: string }> = {
    'audit_baseline.py': {
      content: AUDIT_BASELINE_PY,
      desc: 'Reproduces the baseline audit and zero-leakage yield anomaly labels in pure Python/Pandas.',
      ext: 'py',
    },
    'model.py': {
      content: MODEL_PY,
      desc: 'SpatiotemporalCNNLSTM PyTorch module with TimeDistributed Conv2D and BiLSTM core.',
      ext: 'py',
    },
    'dataset.py': {
      content: DATASET_PY,
      desc: 'Custom PyTorch Dataset for [B, 6, 8, 32, 32] spatial tensors and exogenous climate vectors.',
      ext: 'py',
    },
    'train.py': {
      content: TRAIN_PY,
      desc: 'Training pipeline with year-based GroupKFold cross-validation and DirectML / CUDA support.',
      ext: 'py',
    },
    'requirements.txt': {
      content: REQUIREMENTS_TXT,
      desc: 'Python 3.11 dependency specifications including torch, torchvision, and DirectML.',
      ext: 'txt',
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([files[activeFile].content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeFile;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#16221B]">
      {/* 1. Header Banner */}
      <div className="border border-[#CCD2C4] bg-[#E2E6DC] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#12382B]">
              <span className="font-semibold tracking-wider uppercase">Deep Learning Artifacts</span>
              <span aria-hidden="true" className="text-[#889B8F]">·</span>
              <span className="text-[#526458]">Python 3.11 / PyTorch 2.x</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16221B] font-serif">
              Reproducible PyTorch Pipeline Suite
            </h1>
            <p className="text-xs sm:text-sm text-[#526458] max-w-3xl leading-relaxed">
              Modular PyTorch implementation ready to train on your local workstation with GPU acceleration (CUDA or DirectML).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#12382B] hover:text-white text-[#12382B] text-xs font-mono font-semibold transition-colors border border-[#CCD2C4] cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#12382B]" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12382B] hover:bg-[#1b4e3d] text-white text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hardware Acceleration Guide */}
      <div className="p-5 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs flex items-start gap-3.5 text-xs text-[#526458]">
        <Cpu className="w-5 h-5 text-[#12382B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#16221B] font-mono">
            Hardware Acceleration Compatibility:
          </span>
          <p className="text-[#526458] leading-relaxed font-sans">
            To enable hardware acceleration on Windows with AMD Radeon GPUs, install{' '}
            <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[#12382B] text-[11px] border border-[#CCD2C4]">
              pip install torch-directml
            </code>. On NVIDIA systems, standard CUDA is automatically detected in <code>train.py</code>.
          </p>
        </div>
      </div>

      {/* 3. Code Viewer Container */}
      <div className="border border-[#CCD2C4] rounded-2xl overflow-hidden bg-[#0E1712] shadow-xs">
        {/* File Tabs */}
        <div className="flex items-center overflow-x-auto bg-[#EAECE4] border-b border-[#CCD2C4] px-3 py-2 gap-1.5">
          {Object.keys(files).map(filename => (
            <button
              key={filename}
              onClick={() => setActiveFile(filename)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeFile === filename
                  ? 'bg-[#12382B] text-white font-bold shadow-xs'
                  : 'text-[#526458] hover:text-[#16221B] bg-white border border-[#CCD2C4]'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>{filename}</span>
            </button>
          ))}
        </div>

        {/* File Description Header */}
        <div className="px-4 py-2.5 bg-[#080E0B] border-b border-[#1A2E24] flex items-center justify-between text-xs font-mono text-[#80978E]">
          <span>{files[activeFile].desc}</span>
          <span className="text-[10px] text-[#22C55E] uppercase font-bold">{files[activeFile].ext} source</span>
        </div>

        {/* Code Content */}
        <pre className="p-4 sm:p-5 text-xs font-mono text-[#D4E2D9] overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
          <code>{files[activeFile].content}</code>
        </pre>
      </div>
    </div>
  );
};
