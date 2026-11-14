import json
import logging
import time
from pathlib import Path
from typing import Any, Callable

LOGGER = logging.getLogger(__name__)
SERVICE_ROOT = Path(__file__).resolve().parents[2]
INDEX_PATH = SERVICE_ROOT / "data" / "knowledge" / "osdr_topic_index.json"
FALLBACK_PATH = SERVICE_ROOT / "data" / "curated" / "osdr_topic_snapshot.json"


class SnapshotUnavailable(RuntimeError):
    """Raised when neither the primary nor curated OSDR snapshot is usable."""


def _validate_snapshot(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("OSDR snapshot must be an object")
    topics = value.get("topics")
    total = value.get("n_studies_total")
    if not isinstance(topics, dict) or not topics:
        raise ValueError("OSDR snapshot has no topics")
    if not isinstance(total, int) or total < 0:
        raise ValueError("OSDR snapshot has an invalid study count")
    for topic, data in topics.items():
        if not isinstance(topic, str) or not isinstance(data, dict):
            raise ValueError("OSDR topic entry is invalid")
        count = data.get("n_studies")
        if not isinstance(count, int) or count < 0:
            raise ValueError("OSDR topic count is invalid")
    return value


class TTLCache:
    def __init__(self, ttl_seconds: float, clock: Callable[[], float] = time.monotonic):
        self.ttl_seconds = ttl_seconds
        self.clock = clock
        self._entries: dict[str, tuple[float, dict[str, Any]]] = {}

    def get(self, key: str) -> dict[str, Any] | None:
        entry = self._entries.get(key)
        if entry is None:
            return None
        loaded_at, value = entry
        if self.clock() - loaded_at >= self.ttl_seconds:
            del self._entries[key]
            return None
        return value

    def put(self, key: str, value: dict[str, Any]) -> None:
        self._entries[key] = (self.clock(), value)


class OSDRClient:
    def __init__(
        self,
        index_path: Path = INDEX_PATH,
        fallback_path: Path = FALLBACK_PATH,
        ttl_seconds: float = 300,
        clock: Callable[[], float] = time.monotonic,
    ):
        self.index_path = Path(index_path)
        self.fallback_path = Path(fallback_path)
        self.cache = TTLCache(ttl_seconds, clock)

    def _read(self, path: Path) -> dict[str, Any]:
        cached = self.cache.get(str(path))
        if cached is not None:
            return cached
        with path.open(encoding="utf-8") as handle:
            value = _validate_snapshot(json.load(handle))
        self.cache.put(str(path), value)
        return value

    def snapshot(self) -> tuple[dict[str, Any], str]:
        try:
            return self._read(self.index_path), "curated"
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            LOGGER.warning(
                "OSDR snapshot unavailable; using curated fallback: %s",
                type(exc).__name__,
            )
            try:
                return self._read(self.fallback_path), "curated"
            except (OSError, ValueError, json.JSONDecodeError) as fallback_exc:
                raise SnapshotUnavailable("No usable OSDR snapshot is available") from fallback_exc


def science_status(snapshot: dict[str, Any]) -> str:
    total = snapshot["n_studies_total"]
    if total >= 100:
        return "rich"
    if total >= 25:
        return "moderate"
    return "limited"


def evidence(snapshot: dict[str, Any]) -> list[dict[str, int | str]]:
    return [
        {"topic": topic, "study_count": data["n_studies"]}
        for topic, data in sorted(
            snapshot["topics"].items(),
            key=lambda item: (-item[1]["n_studies"], item[0]),
        )
    ]


def topic_weights(snapshot: dict[str, Any], site: str) -> list[dict[str, float | str]]:
    counts = {
        topic: data["n_studies"]
        for topic, data in snapshot["topics"].items()
        if data["n_studies"] > 0
    }
    total = sum(counts.values())
    if not counts or total <= 0:
        raise ValueError("OSDR snapshot has no positive topic counts")
    topics = sorted(counts)
    weights = [
        {
            "event_type": topic,
            "weight": round(counts[topic] / total, 12),
            "basis": (
                f"Curated OSDR metadata snapshot: {snapshot['n_studies_total']} studies; "
                f"normalized keyword-topic counts for the {site} site."
            ),
        }
        for topic in topics
    ]
    weights[-1]["weight"] = round(
        1.0 - sum(item["weight"] for item in weights[:-1]),
        12,
    )
    return weights
