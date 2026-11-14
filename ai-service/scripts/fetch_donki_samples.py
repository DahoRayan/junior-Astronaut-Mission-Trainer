"""Download real DONKI data for a controlled window, in <=30-day chunks, into data/samples/.

Run from ai-service/:   uv run python scripts/fetch_donki_samples.py --months 12
Uses NASA_API_KEY from the environment or from ai-service/.env (never printed).
Falls back to DEMO_KEY (very low rate limits: use your real key). Standard
library only. NOT yet tested against the live API by its author: if something
fails, send the printed error (without any key) to your agent/orchestrator.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "samples"


def load_key() -> str:
    key = os.environ.get("NASA_API_KEY")
    env = ROOT / ".env"
    if not key and env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("NASA_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
    return key or "DEMO_KEY"


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "space-trainer-sampler"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--months", type=int, default=12)
    ap.add_argument("--types", nargs="+", default=["FLR", "CME", "GST", "SEP"])
    a = ap.parse_args()
    key = load_key()
    end = date.today()
    start = end - timedelta(days=30 * a.months)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "window": [str(start), str(end)],
        "key_used": "personal" if key != "DEMO_KEY" else "DEMO_KEY",
        "files": [],
    }
    for t in a.types:
        rows, cur = [], start
        while cur < end:
            nxt = min(cur + timedelta(days=30), end)
            url = f"https://api.nasa.gov/DONKI/{t}?startDate={cur}&endDate={nxt}&api_key={key}"
            try:
                chunk = get(url)
                rows.extend(chunk if isinstance(chunk, list) else [])
                print(f"{t} {cur}..{nxt}: {len(chunk) if isinstance(chunk, list) else '?'} records")
            except urllib.error.HTTPError as e:
                print(f"{t} {cur}..{nxt}: HTTP {e.code} (key hidden)", file=sys.stderr)
            except Exception as e:  # noqa: BLE001
                print(f"{t} {cur}..{nxt}: {type(e).__name__}", file=sys.stderr)
            time.sleep(1.5)
            cur = nxt
        f = OUT / f"donki_{t}_{start}_{end}.json"
        f.write_text(json.dumps(rows, indent=1), encoding="utf-8")
        manifest["files"].append({"file": f.name, "type": t, "records": len(rows)})
    (OUT / "MANIFEST_donki.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print("Done. See data/samples/MANIFEST_donki.json")


if __name__ == "__main__":
    main()
