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
    assert list(studies["osd_id"]) == ["OSD-9001", "OSD-9002", "OSD-9003"]
    s1 = studies[studies.osd_id == "OSD-9001"].iloc[0]
    assert s1["version"] == 2
    assert s1["organisms"] == "Mus musculus"
    assert int(s1["mission_days"]) == 33
    s2 = studies[studies.osd_id == "OSD-9002"].iloc[0]
    assert str(s2["organisms"]) == "Rattus norvegicus"
    assert str(s2["mission_days"]) in ("nan", "<NA>")
    assays = load_table("study_assays")
    assert ("transcription-profiling", "rna-sequencing-(rna-seq)") in set(
        map(tuple, assays[["measurement_type", "technology"]].values)
    )
    labeled = label.label_studies()
    row = lambda i: labeled[labeled.osd_id == i].iloc[0]  # noqa: E731
    assert {"bone", "muscle", "gravity_effects"} <= set(row("OSD-9001")["topics"].split(";"))
    assert row("OSD-9001")["environment"] == "spaceflight"
    assert row("OSD-9001")["organism_group"] == "mouse"
    assert {"radiation", "metabolism_organs"} <= set(row("OSD-9002")["topics"].split(";"))
    assert row("OSD-9002")["environment"] == "ground_radiation"
    assert "shielding" in row("OSD-9002")["game_domains"]
    assert "plants_food" not in str(row("OSD-9003")["topics"])
    assert json.loads(row("OSD-9001")["topic_matches"])["bone"]
    assert "Missing values" in report.make_report()
    out = data_dir / "kb" / "idx.json"
    idx = index.build_topic_index(out_path=out)
    assert idx["topics"]["bone"]["n_studies"] == 1
    assert idx["verified_by_human"] is False
    assert idx["topics"]["bone"]["example_studies"][0]["url"].endswith("OSD-9001")


def test_build_is_deterministic(data_dir):
    from osdr_pipeline import label, parse

    parse.build_tables()
    first = label.label_studies().to_csv(index=False)
    parse.build_tables()
    second = label.label_studies().to_csv(index=False)
    assert first == second


def test_parse_id_spec():
    from osdr_pipeline.config import parse_id_spec

    assert parse_id_spec("1-3,7,3") == [1, 2, 3, 7]


def test_parse_real_osd1_metadata():
    from osdr_pipeline.parse import parse_one

    raw = json.loads((FIX / "real_OSD-1.json").read_text(encoding="utf-8"))
    row, factors, assays, publications, organisms = parse_one(raw)

    assert row["osd_id"] == "OSD-1"
    assert row["title"] == "Expression data from drosophila melanogaster"
    assert row["organisms"] == "Drosophila melanogaster"
    assert ("transcription profiling", "DNA microarray") in {
        (item["measurement_type"], item["technology"]) for item in assays
    }
    assert any(item["factor"] == "Spaceflight" for item in factors)
    assert organisms == [{"osd_id": "OSD-1", "organism": "Drosophila melanogaster"}]
    assert publications and publications[0]["doi"]
