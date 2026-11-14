import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://osdr.nasa.gov/osdr/data"
USER_AGENT = "junior-astronaut-osdr-pipeline/1.0"


def data_dir() -> Path:
    return Path(os.environ.get("OSDR_DATA_DIR", ROOT / "data" / "osdr"))


def raw_dir() -> Path:
    return data_dir() / "raw"


def reports_dir() -> Path:
    return data_dir() / "reports"


def ensure(*paths: Path) -> None:
    for path in paths:
        path.mkdir(parents=True, exist_ok=True)


def parse_id_spec(spec: str) -> list[int]:
    result: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, end = (int(value) for value in part.split("-", 1))
            result.update(range(min(start, end), max(start, end) + 1))
        else:
            result.add(int(part))
    return sorted(result)
