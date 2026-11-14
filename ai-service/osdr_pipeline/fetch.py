"""Download OSDR *metadata* (never the huge omics data files) into data/osdr/raw/.

Why not the data files: single files in OSDR can be tens or hundreds of GB (the
API docs show examples of ~15 GB and ~110 GB files). This pipeline stores study
metadata JSON and, optionally, file *listings* (names, sizes).
Resumable: existing raw files are skipped unless --refresh.
"""

import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

from .config import API, USER_AGENT, ensure, parse_id_spec, raw_dir

ERROR = object()


def get_json(url: str, retries: int = 3, timeout: int = 60):
    """dict/list on success, None if not found (404/400), ERROR after repeated failures."""
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (400, 404):
                return None
            time.sleep(2 * (i + 1))
        except Exception:  # noqa: BLE001
            time.sleep(2 * (i + 1))
    return ERROR


def fetch_files_listing(n: int, max_pages: int, sleep: float):
    combined = {"osd_id": f"OSD-{n}", "file_count": None, "study_files": [], "truncated": False}
    page, page_total = 0, 1
    while page < page_total:
        if page >= max_pages:
            combined["truncated"] = True
            break
        data = get_json(f"{API}/osd/files/{n}/?page={page}&size=25")
        if data is None or data is ERROR or not isinstance(data, dict):
            break
        block = (data.get("studies") or {}).get(f"OSD-{n}") or {}
        combined["file_count"] = block.get("file_count", combined["file_count"])
        combined["study_files"].extend(block.get("study_files") or [])
        page_total = int(data.get("page_total") or 1)
        page += 1
        time.sleep(sleep)
    return combined


def run(
    ids: str | None,
    start: int,
    end: int,
    max_miss: int,
    with_files: bool,
    refresh: bool,
    sleep: float,
    max_file_pages: int,
    probe_search: bool,
) -> None:
    meta_dir, files_dir = raw_dir() / "meta", raw_dir() / "files"
    ensure(meta_dir, files_dir)
    if probe_search:
        data = get_json(f"{API}/search?term=&from=0&size=1&type=cgene")
        (raw_dir() / "search_probe.json").write_text(
            json.dumps(data if data is not ERROR else {"error": True}, indent=1)
        )
        keys = list(data.keys()) if isinstance(data, dict) else data
        print("search probe saved; top-level keys:", keys)
    id_list = parse_id_spec(ids) if ids else list(range(start, end + 1))
    found, missing, errors, misses_in_row = [], [], [], 0
    for n in id_list:
        path = meta_dir / f"OSD-{n}.json"
        if path.exists() and not refresh:
            found.append(n)
            misses_in_row = 0
        else:
            data = get_json(f"{API}/osd/meta/{n}")
            time.sleep(sleep)
            if data is ERROR:
                errors.append(n)
                print(f"OSD-{n}: error (will retry on next run)")
                continue
            if isinstance(data, dict) and data.get("study"):
                path.write_text(json.dumps(data), encoding="utf-8")
                found.append(n)
                misses_in_row = 0
                print(f"OSD-{n}: saved ({len(found)} total)")
            else:
                missing.append(n)
                misses_in_row += 1
                if not ids and misses_in_row >= max_miss and n > 100:
                    print(f"Stopping: {max_miss} consecutive missing ids after OSD-{n}")
                    break
        if with_files and n in found:
            fpath = files_dir / f"OSD-{n}.json"
            if refresh or not fpath.exists():
                fpath.write_text(
                    json.dumps(fetch_files_listing(n, max_file_pages, sleep)), encoding="utf-8"
                )
    manifest = {
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "api": API,
        "found": len(found),
        "missing_ids": len(missing),
        "error_ids": errors,
        "files_listing": with_files,
        "found_ids": found,
    }
    (raw_dir() / "MANIFEST_osdr.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(
        f"Done: {len(found)} studies, {len(missing)} missing ids, "
        f"{len(errors)} errors. See raw/MANIFEST_osdr.json"
    )
