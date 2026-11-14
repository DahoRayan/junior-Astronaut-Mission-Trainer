import json

from app.nasa.osdr import OSDRClient, science_status, topic_weights


def snapshot(total=10, topics=None):
    return {
        "generated_at": "2026-11-14T00:00:00Z",
        "n_studies_total": total,
        "topics": topics or {"bone": {"n_studies": 2}, "muscle": {"n_studies": 1}},
    }


def write(path, value):
    path.write_text(json.dumps(value), encoding="utf-8")


def test_cache_hit_and_expiry(tmp_path):
    now = [0.0]
    path = tmp_path / "index.json"
    write(path, snapshot(total=10))
    client = OSDRClient(index_path=path, fallback_path=path, ttl_seconds=5, clock=lambda: now[0])

    first, _ = client.snapshot()
    write(path, snapshot(total=20))
    cached, _ = client.snapshot()
    now[0] = 5.0
    refreshed, _ = client.snapshot()

    assert first["n_studies_total"] == 10
    assert cached["n_studies_total"] == 10
    assert refreshed["n_studies_total"] == 20


def test_invalid_primary_uses_curated_fallback(tmp_path):
    primary = tmp_path / "index.json"
    fallback = tmp_path / "fallback.json"
    primary.write_text("{", encoding="utf-8")
    write(fallback, snapshot(total=30))

    data, source = OSDRClient(index_path=primary, fallback_path=fallback).snapshot()

    assert data["n_studies_total"] == 30
    assert source == "curated"


def test_science_status_levels():
    assert science_status(snapshot(total=10)) == "limited"
    assert science_status(snapshot(total=25)) == "moderate"
    assert science_status(snapshot(total=100)) == "rich"


def test_topic_weights_are_non_negative_and_sum_to_one():
    weights = topic_weights(
        snapshot(total=30, topics={"bone": {"n_studies": 2}, "muscle": {"n_studies": 1}}),
        "moon",
    )

    assert all(item["weight"] >= 0 for item in weights)
    assert sum(item["weight"] for item in weights) == 1
    assert weights == topic_weights(
        snapshot(total=30, topics={"bone": {"n_studies": 2}, "muscle": {"n_studies": 1}}),
        "moon",
    )
