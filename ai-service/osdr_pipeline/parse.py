"""Raw OSDR metadata JSON -> clean, normalized tables (one row per study, plus long tables).

Parsing is defensive (.get everywhere) because the real schema must be confirmed against live responses.
Anything unexpected is counted in the parse report, never silently dropped.
"""
import json
import re

import pandas as pd

from .config import raw_dir
from .tables import save_table


def _clean(v):
    if v is None:
        return pd.NA
    if isinstance(v, str):
        v = re.sub(r"\s+", " ", v).strip()
        return v if v else pd.NA
    return v

def _comments(items) -> dict:
    out = {}
    for c in items or []:
        if isinstance(c, dict) and c.get("name"):
            out[str(c["name"]).strip()] = _clean(c.get("value"))
    return out

def _org_text(v, fallback: str) -> str:
    if not isinstance(v, str):
        return fallback
    s = re.sub(r"<[^>]*>", "", v)
    if ">" in s:
        s = s.rsplit(">", 1)[1]
    s = s.strip().strip('"').strip()
    return s or fallback

def organisms_of(block: dict) -> list[str]:
    organisms = set()
    links = (((block.get("additionalInformation") or {}).get("organisms") or {}).get("links")) or {}
    organisms.update(_org_text(v, k) for k, v in links.items())
    study = (block.get("studies") or [{}])[0] or {}
    samples = ((study.get("materials") or {}).get("samples")) or []
    for sample in samples:
        for characteristic in sample.get("characteristics") or []:
            value = characteristic.get("value") if isinstance(characteristic, dict) else None
            if not isinstance(value, dict):
                continue
            accession = str(value.get("termAccession") or "")
            if value.get("termSource") == "NCBITAXON" or "NCBITAXON" in accession.upper():
                name = _clean(value.get("annotationValue"))
                if pd.notna(name):
                    organisms.add(str(name))
    return sorted(organisms)

def assay_parts(key: str | dict) -> tuple[str, str]:
    if isinstance(key, dict):
        measurement = key.get("measurementType") or {}
        technology = key.get("technologyType") or {}
        if isinstance(measurement, dict):
            measurement = measurement.get("annotationValue") or measurement.get("@id") or ""
        if isinstance(technology, dict):
            technology = technology.get("annotationValue") or technology.get("@id") or ""
        return str(measurement).strip(), str(technology or key.get("technologyPlatform") or "").strip()
    parts = key.split("_")
    measurement = parts[2] if len(parts) > 2 else ""
    tech = parts[3] if len(parts) > 3 else ""
    tech = re.sub(r"-txt$", "", tech)
    return measurement, tech

def factor_names(s0: dict, block: dict) -> list[str]:
    names: list[str] = []
    for f in s0.get("factors") or []:
        if isinstance(f, dict):
            n = f.get("factorName") or f.get("name") or f.get("value")
            if n:
                names.append(str(n).strip())
        elif isinstance(f, str):
            names.append(f.strip())
    extra = (((block.get("additionalInformation") or {}).get("description") or {}).get("factors")) or []
    for f in extra:
        if isinstance(f, str):
            names.append(f.strip())
    return sorted(set(names))

def parse_one(d: dict):
    study = d.get("study") or {}
    if not study:
        return None
    osd_id, block = next(iter(study.items()))
    s0 = (block.get("studies") or [{}])[0] or {}
    c = _comments(s0.get("comments"))
    orgs = organisms_of(block)
    assay_data = s0.get("assays")
    if isinstance(assay_data, list):
        assays = [assay_parts(item) for item in assay_data if isinstance(item, dict)]
    else:
        assays = [
            assay_parts(k)
            for k in (((block.get("additionalInformation") or {}).get("assays")) or {})
        ]
    facs = factor_names(s0, block)
    pubs = s0.get("publications") or []
    row = {
        "osd_id": osd_id,
        "osd_num": int(re.sub(r"\D", "", osd_id) or 0),
        "title": _clean(s0.get("title")),
        "description": _clean(s0.get("description")),
        "version": block.get("version"),
        "public_release_date": _clean(s0.get("publicReleaseDate")),
        "flight_program": c.get("Flight Program", pd.NA),
        "mission_name": c.get("Mission Name", pd.NA),
        "project_title": c.get("Project Title", pd.NA),
        "project_type": c.get("Project Type", pd.NA),
        "space_program": c.get("Space Program", pd.NA),
        "managing_center": c.get("Managing NASA Center", pd.NA),
        "experiment_platform": c.get("Experiment Platform", pd.NA),
        "mission_start": c.get("Mission Start", pd.NA),
        "mission_end": c.get("Mission End", pd.NA),
        "doi": c.get("DOI", pd.NA),
        "organisms": ";".join(orgs) if orgs else pd.NA,
        "n_organisms": len(orgs),
        "n_assays": len(assays),
        "n_factors": len(facs),
        "n_publications": len(pubs),
        "url": f"https://osdr.nasa.gov/bio/repo/data/studies/{osd_id}",
    }
    factors = [{"osd_id": osd_id, "factor": f} for f in facs]
    assay_rows = [{"osd_id": osd_id, "measurement_type": m, "technology": t} for m, t in assays]
    pub_rows = [{"osd_id": osd_id, "title": _clean(p.get("title")), "doi": _clean(p.get("doi")),
                 "pubmed_id": _clean(p.get("pubMedID"))} for p in pubs if isinstance(p, dict)]
    org_rows = [{"osd_id": osd_id, "organism": o} for o in orgs]
    return row, factors, assay_rows, pub_rows, org_rows

def build_tables() -> dict:
    rows, factors, assays, pubs, orgs, bad = [], [], [], [], [], []
    for p in sorted((raw_dir() / "meta").glob("OSD-*.json")):
        try:
            res = parse_one(json.loads(p.read_text(encoding="utf-8")))
        except Exception as e:  # noqa: BLE001
            bad.append({"file": p.name, "error": type(e).__name__}); continue
        if res is None:
            bad.append({"file": p.name, "error": "no 'study' key"}); continue
        r, f, a, pb, o = res
        rows.append(r); factors += f; assays += a; pubs += pb; orgs += o
    studies = pd.DataFrame(rows)
    if studies.empty:
        raise SystemExit("No studies parsed. Run fetch first or check raw/meta/ (see parse errors).")
    # Normalization: dates, durations, dedupe (keep highest version per osd_id)
    studies["public_release_date"] = pd.to_datetime(studies["public_release_date"], format="%d-%b-%Y", errors="coerce")
    studies["release_year"] = studies["public_release_date"].dt.year.astype("Int64")
    for c in ("mission_start", "mission_end"):
        studies[c] = pd.to_datetime(studies[c], format="%m/%d/%Y", errors="coerce")
    studies["mission_days"] = (studies["mission_end"] - studies["mission_start"]).dt.days.astype("Int64")
    studies.loc[studies["mission_days"] < 0, "mission_days"] = pd.NA  # impossible durations -> missing
    studies = studies.sort_values(["osd_id", "version"]).drop_duplicates("osd_id", keep="last")
    studies = studies.sort_values("osd_num").reset_index(drop=True)
    out = {"studies": studies, "study_factors": pd.DataFrame(factors, columns=["osd_id", "factor"]),
           "study_assays": pd.DataFrame(assays, columns=["osd_id", "measurement_type", "technology"]),
           "study_publications": pd.DataFrame(pubs, columns=["osd_id", "title", "doi", "pubmed_id"]),
           "study_organisms": pd.DataFrame(orgs, columns=["osd_id", "organism"])}
    # Optional: file listing summary (names/sizes only, nothing downloaded)
    fl = []
    for p in sorted((raw_dir() / "files").glob("OSD-*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        sf = d.get("study_files") or []
        fl.append({"osd_id": d.get("osd_id"), "file_count": d.get("file_count"), "listed_files": len(sf),
                   "total_bytes": sum(int(x.get("file_size") or 0) for x in sf),
                   "largest_file_bytes": max([int(x.get("file_size") or 0) for x in sf] or [0]),
                   "listing_truncated": d.get("truncated", False)})
    if fl:
        out["study_files_summary"] = pd.DataFrame(fl)
    for name, df in out.items():
        files = save_table(df, name)
        print(f"{name}: {len(df)} rows -> {', '.join(files)}")
    if bad:
        print(f"WARNING: {len(bad)} raw files could not be parsed: {bad[:5]}")
    return {"studies": len(studies), "unparsed": bad}
