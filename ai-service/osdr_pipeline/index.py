"""Topic index for the expert system: counts + traceable example studies per topic (no invented findings)."""
import json
from datetime import datetime, timezone

import pandas as pd

from .config import ROOT
from .tables import load_table


def build_topic_index(out_path=None, examples: int = 5) -> dict:
    df = load_table("studies_labeled")
    tax_version = str(df["label_method"].iloc[0]) if len(df) else "unknown"
    pubs = load_table("study_publications").groupby("osd_id").size().to_dict()
    topics = {}
    for topic in sorted(set(df["topics"].dropna().str.split(";").explode())):
        sub = df[df["topics"].fillna("").str.split(";").apply(lambda x: topic in x)].copy()
        sub["has_pub"] = sub["osd_id"].map(lambda i: pubs.get(i, 0) > 0)
        sub = sub.sort_values(["has_pub", "public_release_date", "osd_num"], ascending=[False, False, True])
        topics[topic] = {
            "n_studies": int(len(sub)),
            "by_organism_group": {k: int(v) for k, v in sub["organism_group"].value_counts().items()},
            "by_environment": {k: int(v) for k, v in sub["environment"].value_counts().items()},
            "game_domains": sorted(set(";".join(sub["game_domains"].dropna()).split(";")) - {""}),
            "example_studies": [
                {"osd_id": r.osd_id, "title": None if pd.isna(r.title) else r.title,
                 "organism_group": r.organism_group, "mission_name": None if pd.isna(r.mission_name) else r.mission_name,
                 "release_year": None if pd.isna(r.release_year) else int(r.release_year),
                 "url": r.url, "matched_terms": json.loads(r.topic_matches).get(topic, [])}
                for r in sub.head(examples).itertuples()],
        }
    index = {"generated_at": datetime.now(timezone.utc).isoformat(), "source": "NASA OSDR Developer API (study metadata)",
             "label_method": tax_version, "n_studies_total": int(len(df)),
             "kind": "curated", "verified_by_human": False,
             "caveat": "Counts are keyword-heuristic label counts over study metadata, not findings or effect sizes.",
             "topics": topics}
    out = out_path or (ROOT / "data" / "knowledge" / "osdr_topic_index.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(index, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"topic index: {len(topics)} topics -> {out}")
    return index
