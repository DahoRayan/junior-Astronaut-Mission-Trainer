"""Data-quality + simple statistics report (data-scientist checklist), written to data/osdr/reports/."""
import pandas as pd

from .config import ensure, reports_dir
from .tables import load_table


def _iqr_bounds(s: pd.Series):
    q1, q3 = s.quantile(0.25), s.quantile(0.75)
    iqr = q3 - q1
    return q1 - 1.5 * iqr, q3 + 1.5 * iqr

def make_report() -> str:
    df = load_table("studies_labeled")
    L = ["# OSDR studies: data-quality and descriptive report", "",
         f"- rows: {len(df)}; unique osd_id: {df['osd_id'].nunique()} (duplicates: {len(df) - df['osd_id'].nunique()})",
         f"- release years: {df['release_year'].min()} to {df['release_year'].max()}", "",
         "## Missing values (% per column)", ""]
    miss = (df.isnull().mean() * 100).round(1).sort_values(ascending=False)
    L += [f"- {c}: {v}%" for c, v in miss.items() if v > 0] or ["- none"]
    L += ["", "## Studies per release year", ""]
    L += [f"- {int(y)}: {n}" for y, n in df["release_year"].value_counts().sort_index().items()]
    for col, title in (("organism_group", "Organism groups"), ("environment", "Environment (heuristic)"),
                       ("flight_program", "Flight programs")):
        L += ["", f"## {title}", ""]
        L += [f"- {k}: {v}" for k, v in df[col].fillna("(missing)").value_counts().head(15).items()]
    L += ["", "## Topic labels (multi-label, keyword_v1)", ""]
    exploded = df["topics"].dropna().str.split(";").explode()
    L += [f"- {k}: {v}" for k, v in exploded.value_counts().items()]
    L += ["", "- studies with NO topic label: " + str(int(df['topics'].isna().sum()))]
    md = df["mission_days"].dropna().astype(float)
    L += ["", "## Mission duration (days) where start/end dates exist", ""]
    if len(md) >= 4:
        lo, hi = _iqr_bounds(md)
        L += [f"- n={len(md)}, mean={md.mean():.1f}, median={md.median():.1f}, std={md.std():.1f}, "
              f"p25={md.quantile(.25):.1f}, p75={md.quantile(.75):.1f}, p95={md.quantile(.95):.1f}",
              f"- IQR outlier bounds: [{lo:.1f}, {hi:.1f}]; outliers: {int(((md < lo) | (md > hi)).sum())}",
              "- NOTE: outliers are reported, NOT removed (long missions are real data, not errors)."]
    else:
        L += ["- not enough dated missions for statistics"]
    try:
        from scipy.stats import chi2_contingency
        sub = df.dropna(subset=["topics"]).copy()
        sub["topic"] = sub["topics"].str.split(";")
        sub = sub.explode("topic").reset_index(drop=True)
        tab = pd.crosstab(sub["topic"], sub["organism_group"])
        tab = tab.loc[tab.sum(axis=1) >= 5, tab.sum(axis=0) >= 5]
        if tab.shape[0] > 1 and tab.shape[1] > 1:
            chi2, p, dof, _ = chi2_contingency(tab)
            L += ["", "## Chi-square: topic vs organism group", "",
                  f"- chi2={chi2:.1f}, dof={dof}, p={p:.3g} (topic labels are multi-label, so rows are not fully independent: "
                  "treat as exploratory, not as proof)"]
    except ImportError:
        L += ["", "(scipy not installed: chi-square skipped)"]
    ensure(reports_dir())
    text = "\n".join(L) + "\n"
    (reports_dir() / "osdr_profile.md").write_text(text, encoding="utf-8")
    print(text)
    return text
