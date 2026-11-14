"""Download small, size-capped samples from the RadLab Data API (no key needed).

Run from ai-service/:   uv run python scripts/fetch_radlab_samples.py
Docs: https://visualization.osdr.nasa.gov/radlab/gui/data-api/   Endpoint: https://visualization.osdr.nasa.gov/radlab/api
Each query is capped at --max-bytes so a huge table can't flood your disk; the manifest records if it was truncated.
Query 1 is the documented example (ISS, DosTel). Queries 2-3 are exploratory (Moon, BLEO): they may return little or
nothing; that is useful information too. NOT yet tested against the live API by its author.
"""
import argparse, json, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "samples"
BASE = "https://visualization.osdr.nasa.gov/radlab/api/"
QUERIES = {
    "radlab_iss_dostel": "spacecraft=ISS&instrument=DosTel&timestamp>=2022-04-01T23:00&timestamp<2022-04-02T01:05"
                         "&absorbed_dose_rate&dose_equivalent_rate&flux&format=json",
    "radlab_moon": "celestial_body=Moon&spacecraft&instrument&timestamp&absorbed_dose_rate&dose_equivalent_rate&format=json",
    "radlab_bleo": "trajectory=BLEO&celestial_body&spacecraft&instrument&timestamp&absorbed_dose_rate&dose_equivalent_rate&format=json",
}

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-bytes", type=int, default=200_000)
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"retrieved_at": datetime.now(timezone.utc).isoformat(), "files": []}
    for name, q in QUERIES.items():
        url = BASE + "?" + q
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "space-trainer-sampler"})
            with urllib.request.urlopen(req, timeout=60) as r:
                total = r.headers.get("Content-Length")
                data = r.read(a.max_bytes + 1)
            truncated = len(data) > a.max_bytes
            data = data[: a.max_bytes]
            (OUT / f"{name}.json.txt").write_bytes(data)  # .txt: may be cut mid-JSON when truncated
            manifest["files"].append({"file": f"{name}.json.txt", "query": q, "bytes_saved": len(data),
                                      "content_length_header": total, "truncated": truncated})
            print(f"{name}: saved {len(data)} bytes, header size={total}, truncated={truncated}")
        except Exception as e:  # noqa: BLE001
            print(f"{name}: failed ({type(e).__name__}: {e})")
            manifest["files"].append({"file": None, "query": q, "error": f"{type(e).__name__}"})
    (OUT / "MANIFEST_radlab.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
