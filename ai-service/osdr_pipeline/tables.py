from pathlib import Path

import pandas as pd

from .config import data_dir


def tables_dir() -> Path:
    path = data_dir() / "tables"
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_table(df: pd.DataFrame, name: str) -> list[str]:
    target = tables_dir()
    csv_path = target / f"{name}.csv"
    parquet_path = target / f"{name}.parquet"
    df.to_csv(csv_path, index=False)
    df.to_parquet(parquet_path, index=False)
    return [csv_path.name, parquet_path.name]


def load_table(name: str) -> pd.DataFrame:
    target = tables_dir()
    parquet_path = target / f"{name}.parquet"
    csv_path = target / f"{name}.csv"
    if parquet_path.exists():
        return pd.read_parquet(parquet_path)
    if csv_path.exists():
        return pd.read_csv(csv_path)
    raise FileNotFoundError(f"OSDR table not found: {name}")
