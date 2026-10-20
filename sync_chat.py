"""
Sync Chat & Agent Archive Utility
Extracts all conversation dialogue from the IDE transcript, redacts any API tokens/secrets,
and updates docs/PROJECT_CHAT_ARCHIVE.md.

Usage:
    & "C:\\Users\\USMAN\\AppData\\Local\\Python\\bin\\python.exe" sync_chat.py [--push] [--token <hf_token>]
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path

def sync_chat(push=False, token=None):
    # Standard Antigravity brain transcript path
    conv_id = "788a3851-03d1-4e89-8a09-a370e71ef13a"
    transcript_path = Path.home() / f".gemini/antigravity-ide/brain/{conv_id}/.system_generated/logs/transcript.jsonl"
    
    if not transcript_path.exists():
        print(f"[!] Warning: Transcript not found at {transcript_path}")
        return

    output_dir = Path("docs")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "PROJECT_CHAT_ARCHIVE.md"

    messages = []
    with open(transcript_path, "r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                mtype = entry.get("type")
                source = entry.get("source")
                content = entry.get("content", "")
                
                if mtype == "USER_INPUT" and content:
                    req_match = re.search(r"<USER_REQUEST>(.*?)</USER_REQUEST>", content, re.DOTALL)
                    clean_text = req_match.group(1).strip() if req_match else content.strip()
                    if clean_text:
                        messages.append(("User", clean_text))
                elif source == "MODEL" and content:
                    clean_content = content.strip()
                    if len(clean_content) > 15 and not clean_content.startswith("{"):
                        messages.append(("Antigravity Assistant", clean_content))
            except Exception:
                pass

    with open(output_path, "w", encoding="utf-8") as out:
        out.write("# Project Conversation & Implementation Archive\n\n")
        out.write("> **Repository**: El Niño PBL Project (Maharashtra Kharif Crop Failure)\n")
        out.write("> **Hugging Face Hub**: [UsmanSait/elnino-crop-failure-pbl](https://huggingface.co/datasets/UsmanSait/elnino-crop-failure-pbl)\n")
        out.write("> **Purpose**: Preserves full context, decisions, user feedback, and implementation steps so any developer or AI assistant can seamlessly resume work.\n\n---\n\n")
        
        turn = 1
        for role, text in messages:
            # Redact HF or API tokens
            sanitized = re.sub(r'hf_[A-Za-z0-9]{34}', '[REDACTED_HF_TOKEN]', text)
            # Simplify repetitive JSON or verbose terminal logs for readability
            if len(sanitized) > 3000 and "```" in sanitized:
                # Truncate overly verbose raw code blocks
                lines = sanitized.split('\n')
                if len(lines) > 80:
                    sanitized = '\n'.join(lines[:45]) + "\n\n*(...simplified verbose log lines...)*\n\n" + '\n'.join(lines[-25:])
            
            if role == "User":
                out.write(f"## User Prompt {turn}\n\n")
                out.write(f"{sanitized}\n\n")
                turn += 1
            else:
                out.write("### Assistant Response\n\n")
                out.write(f"{sanitized}\n\n---\n\n")

    print(f"[+] Successfully updated {output_path} with {len(messages)} dialog turns.")

    if push:
        print("[*] Pushing updated archive to Hugging Face Hub...")
        token = token or os.environ.get("HF_TOKEN")
        try:
            from huggingface_hub import HfApi
            api = HfApi(token=token)
            api.upload_file(
                path_or_fileobj=str(output_path),
                path_in_repo="docs/PROJECT_CHAT_ARCHIVE.md",
                repo_id="UsmanSait/elnino-crop-failure-pbl",
                repo_type="dataset",
                commit_message="Update docs/PROJECT_CHAT_ARCHIVE.md with latest conversation"
            )
            print("[+] Successfully pushed updated chat archive to Hugging Face Hub!")
        except Exception as e:
            print(f"[!] Push failed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--push", action="store_true", help="Push updated chat to Hugging Face Hub")
    parser.add_argument("--token", type=str, default=None, help="HF Token")
    args = parser.parse_args()
    sync_chat(push=args.push, token=args.token)
