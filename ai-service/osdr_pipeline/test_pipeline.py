import json
import shutil
from pathlib import Path

import pytest

FIX = Path(__file__).parent / "fixtures"

@pytest.fixture()
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("OSDR_DATA_DIR", str(tmp_path))
    meta = tmp_path / "raw" / "meta"
    meta.mkdir(parents=True)
    for f in FIX.glob("OSD-*.json"):
        shutil.copy(f, meta / f.name)
    return tmp_path

def test_pipeline_end_to_end(data_dir):
    from osdr_pipeline import index, label, parse, report
    from osdr_pipeline.tables import load_table
    parse.build_tables()
    studies = load_table("studies")
    assert list(studies["osd_id"]) == ["OSD-9001", "OSD-9002", "OSD-9003"]  # duplicate removed
    s1 = studies[studies.osd_id == "OSD-9001"].iloc[0]
    assert s1["version"] == 2                      # highest version kept
    assert s1["organisms"] == "Mus musculus"       # HTML-ish organism text cleaned
    assert int(s1["mission_days"]) == 33
    s2 = studies[studies.osd_id == "OSD-9002"].iloc[0]
    assert str(s2["organisms"]) == "Rattus norvegicus"
    assert str(s2["mission_days"]) in ("nan", "<NA>")  # negative duration -> missing
    assays = load_table("study_assays")
    assert ("transcription-profiling", "rna-sequencing-(rna-seq)") in set(map(tuple, assays[["measurement_type", "technology"]].values))
    labeled = label.label_studies()
    row = lambda i: labeled[labeled.osd_id == i].iloc[0]  # noqa: E731
    assert {"bone", "muscle", "gravity_effects"} <= set(row("OSD-9001")["topics"].split(";"))
    assert row("OSD-9001")["environment"] == "spaceflight" and row("OSD-9001")["organism_group"] == "mouse"
    assert {"radiation", "metabolism_organs"} <= set(row("OSD-9002")["topics"].split(";"))
    assert row("OSD-9002")["environment"] == "ground_radiation" and "shielding" in row("OSD-9002")["game_domains"]
    assert "plants_food" not in str(row("OSD-9003")["topics"])  # 'plantaris' must not match 'plant'
    assert json.loads(row("OSD-9001")["topic_matches"])["bone"]  # matched terms kept (explainability)
    assert "Missing values" in report.make_report()
    out = data_dir / "kb" / "idx.json"
    idx = index.build_topic_index(out_path=out)
    assert idx["topics"]["bone"]["n_studies"] == 1 and idx["verified_by_human"] is False
    assert idx["topics"]["bone"]["example_studies"][0]["url"].endswith("OSD-9001")

def test_build_is_deterministic(data_dir):
    from osdr_pipeline import label, parse
    parse.build_tables(); a = label.label_studies().to_csv(index=False)
    parse.build_tables(); b = label.label_studies().to_csv(index=False)
    assert a == b

def test_parse_id_spec():
    from osdr_pipeline.config import parse_id_spec
    assert parse_id_spec("1-3,7,3") == [1, 2, 3, 7]
