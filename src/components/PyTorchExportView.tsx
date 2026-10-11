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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#F1E9D9]">
      {/* 1. Header Banner */}
      <div className="border border-[#444D3E] bg-[#232A20] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8B8C5A]">
              <span className="font-semibold tracking-wider uppercase">Deep Learning Artifacts</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Python 3.11 / PyTorch 2.x</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Reproducible PyTorch Pipeline Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Modular PyTorch implementation ready to train on your local workstation with GPU acceleration (CUDA or DirectML).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#192116] hover:bg-[#2C3428] text-[#F1E9D9] text-xs font-mono font-semibold transition-colors border border-[#444D3E] cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#8B8C5A]" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B8C5A] hover:bg-[#9FA068] text-[#192116] text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hardware Acceleration Guide */}
      <div className="p-5 rounded-2xl bg-[#232A20] border border-[#444D3E] shadow-sm flex items-start gap-3.5 text-xs text-slate-300">
        <Cpu className="w-5 h-5 text-[#8B8C5A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white font-mono">
            Hardware Acceleration Compatibility:
          </span>
          <p className="text-slate-400 leading-relaxed font-sans">
            To enable hardware acceleration on Windows with AMD Radeon GPUs, install{' '}
            <code className="px-1.5 py-0.5 rounded bg-[#192116] font-mono text-[#8B8C5A] text-[11px] border border-[#444D3E]">
              pip install torch-directml
            </code>. On NVIDIA systems, standard CUDA is automatically detected in <code>train.py</code>.
          </p>
        </div>
      </div>

      {/* 3. Code Viewer Container */}
      <div className="border border-[#444D3E] rounded-2xl overflow-hidden bg-[#141911] shadow-xl">
        {/* File Tabs */}
        <div className="flex items-center overflow-x-auto bg-[#192116] border-b border-[#3B4335] px-3 py-2 gap-1.5">
          {Object.keys(files).map(filename => (
            <button
              key={filename}
              onClick={() => setActiveFile(filename)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeFile === filename
                  ? 'bg-[#8B8C5A] text-[#192116] font-bold shadow-xs'
                  : 'text-[#B5B0A4] hover:text-[#F1E9D9]'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>{filename}</span>
            </button>
          ))}
        </div>

        {/* File Description Header */}
        <div className="px-4 py-2.5 bg-[#192116]/60 border-b border-[#3B4335] flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{files[activeFile].desc}</span>
          <span className="text-[10px] text-[#8B8C5A] uppercase font-bold">{files[activeFile].ext} source</span>
        </div>

        {/* Code Content */}
        <pre className="p-4 sm:p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
          <code>{files[activeFile].content}</code>
        </pre>
      </div>
    </div>
  );
};
