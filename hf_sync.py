"""
=============================================================================
Hugging Face Hub Sync Script
Project: Spatiotemporal CNN-LSTM Framework for Maharashtra Kharif Crop Failure
Repository: UsmanSait/elnino-crop-failure-pbl
=============================================================================
Uploads and synchronizes all project datasets, multi-spectral rasters (*.tif),
PyTorch deep learning checkpoints (*.pt), and documentation to the Hugging
Face Hub Dataset repository with Git LFS tracking.
=============================================================================
Usage:
    & "C:\\Users\\USMAN\\AppData\\Local\\Python\\bin\\python.exe" hf_sync.py
    (Uses cached Hugging Face token automatically, or specify --token <token>)
=============================================================================
"""

import os
import sys
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Upload project data and models to Hugging Face Hub.")
    parser.add_argument("--repo-id", type=str, default="UsmanSait/elnino-crop-failure-pbl", help="HF Repo ID in format: username/repo-name")
    parser.add_argument("--repo-type", type=str, choices=["dataset", "model", "space"], default="dataset", help="Repository type on Hugging Face")
    parser.add_argument("--token", type=str, default=None, help="Hugging Face User Access Token (write permission)")
    parser.add_argument("--private", action="store_true", help="Create repository as private if it does not exist")
    
    args = parser.parse_args()
    
    try:
        from huggingface_hub import HfApi, login, get_token
    except ImportError:
        print("[!] Error: 'huggingface_hub' is not installed. Run: pip install huggingface_hub")
        sys.exit(1)
    
    token = args.token or os.environ.get("HF_TOKEN") or get_token()
    if token:
        login(token=token)
        print(f"[+] Authenticated with Hugging Face Hub (token: {token[:6]}...)")
    else:
        print("[!] Warning: No Hugging Face token found. Provide --token or set HF_TOKEN environment variable.")
    
    api = HfApi()
    
    print(f"[*] Ensuring Hugging Face repository exists: {args.repo_id} (type: {args.repo_type})")
    try:
        api.create_repo(
            repo_id=args.repo_id,
            repo_type=args.repo_type,
            private=args.private,
            exist_ok=True
        )
        print("[+] Repository ready.")
    except Exception as e:
        print(f"[!] Warning while checking/creating repo: {e}")

    # Root directory of this project
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Patterns to ignore during upload (temporary / build / private files)
    ignore_patterns = [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        ".env*",
        "__pycache__/**",
        "*.py[cod]",
        ".venv/**",
        "venv/**",
        "*.log",
        ".DS_Store",
        "Thumbs.db",
        ".pytest_cache/**",
        ".ipynb_checkpoints/**",
        "scratch/**",
        "docs/PROJECT_CHAT_ARCHIVE.md",  # Avoid HF secret scanner false alarms
        "FULL_PROJECT_DOCUMENTATION.pdf"
    ]
    
    print(f"[*] Uploading folder '{root_dir}' to {args.repo_id}...")
    print("[*] Note: Large files (*.tif, *.pt, *.geojson) will be uploaded smoothly via Hugging Face Hub LFS.")
    
    try:
        api.upload_folder(
            folder_path=root_dir,
            repo_id=args.repo_id,
            repo_type=args.repo_type,
            ignore_patterns=ignore_patterns,
            commit_message="Update Maharashtra Kharif Crop Failure dataset, documentation, and models"
        )
        print(f"\n[SUCCESS] Upload completed successfully! View your files at:")
        if args.repo_type == "dataset":
            print(f"    👉 https://huggingface.co/datasets/{args.repo_id}")
        elif args.repo_type == "model":
            print(f"    👉 https://huggingface.co/{args.repo_id}")
        else:
            print(f"    👉 https://huggingface.co/spaces/{args.repo_id}")
    except Exception as e:
        print(f"[ERROR] Upload failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
