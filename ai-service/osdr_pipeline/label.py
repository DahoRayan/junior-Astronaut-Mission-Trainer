"""Deterministic keyword labeling with matched terms for explainability."""

import json
import re
from pathlib import Path

import pandas as pd

from .tables import load_table, save_table

TAXONOMY = Path(__file__).with_name("taxonomy_v1.json")


def _pattern(term: str) -> re.Pattern:
    if term.endswith("$"):
        return re.compile(rf"\b{re.escape(term[:-1])}s?\b", re.I)
    return re.compile(rf"\b{re.escape(term)}", re.I)


def label_studies() -> pd.DataFrame:
    tax = json.loads(TAXONOMY.read_text(encoding="utf-8"))
    topic_pats = {t: [(x, _pattern(x)) for x in terms] for t, terms in tax["topics"].items()}
    analog = [_pattern(x) for x in tax["ground_analog_terms"]]
    df = load_table("studies")
    facs = (
        load_table("study_factors")
        .groupby("osd_id")["factor"]
        .apply(lambda s: " ".join(map(str, s)))
    )
    topics_col, matches_col, domains_col, org_group, env = [], [], [], [], []
    for _, r in df.iterrows():
        text = " ".join(
            str(x)
            for x in (
                r.get("title"),
                r.get("description"),
                r.get("project_title"),
                facs.get(r["osd_id"], ""),
            )
            if pd.notna(x)
        )
        found, matched = [], {}
        for topic, pats in topic_pats.items():
            hits = sorted({term for term, p in pats if p.search(text)})
            if hits:
                found.append(topic)
                matched[topic] = hits
        topics_col.append(";".join(found) if found else pd.NA)
        matches_col.append(json.dumps(matched, sort_keys=True) if matched else pd.NA)
        domains_col.append(
            ";".join(sorted({tax["game_domain"][t] for t in found if t in tax["game_domain"]}))
            or pd.NA
        )
        orgs = str(r.get("organisms") or "").lower()
        grp = next(
            (g for g, keys in tax["organism_groups"].items() if any(k in orgs for k in keys)),
            "unknown" if not orgs.strip() else "other",
        )
        org_group.append(grp)
        ptype = str(r.get("project_type") or "").lower()
        if "spaceflight" in ptype:
            env.append("spaceflight")
        elif any(p.search(text) for p in analog):
            env.append("ground_analog")
        elif "radiation" in found:
            env.append("ground_radiation")
        else:
            env.append("unknown")
    df["topics"], df["topic_matches"], df["game_domains"] = topics_col, matches_col, domains_col
    df["organism_group"], df["environment"] = org_group, env
    df["label_method"] = tax["version"]
    save_table(df, "studies_labeled")
    print(f"labeled {len(df)} studies; with >=1 topic: {int(df['topics'].notna().sum())}")
    return df
