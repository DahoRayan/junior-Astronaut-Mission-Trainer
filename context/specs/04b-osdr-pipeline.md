# Unit 04b: OSDR Dataset Pipeline (offline)

## Goal
Turn NASA OSDR study metadata into clean, labeled, normalized tables (CSV + Parquet) and a topic index
that the expert system (Unit 05) and the statistics/debrief (Unit 07) can use, with full provenance.
Requested by the mentor: use OSDR data as the evidence base, with explainability.

## Design
- Scope = study METADATA for all OSD studies reachable through the OSDR Developer API (GeneLab + ALSDA records
  that have an OSD accession). NOT the omics data files: single files reach tens to hundreds of GB.
  We store file LISTINGS (names, sizes) only, to document why raw data is out of scope.
- `ai-service/osdr_pipeline/` is OFFLINE tooling. The FastAPI service never imports it and never imports pandas;
  it only reads the produced files (`data/knowledge/osdr_topic_index.json`).
- Layers: raw JSON (`data/osdr/raw/`, git-ignored) -> tables (`data/osdr/tables/`) -> labels -> report -> topic index.
- Labels are deterministic keyword rules (`osdr_pipeline/taxonomy_v1.json`), each keeping the matched terms.
  They are heuristics: counts are "studies whose metadata mention X", not findings or effect sizes.
- Quantities for the evaluator come from game rules and RadLab/DONKI, NOT from OSDR metadata. OSDR provides
  context, evidence and explainability (e.g. "NASA has N studies on bone loss in space", listing OSD ids).

## Implementation
1. Dependencies (pipeline only): `uv add --group pipeline pandas pyarrow scipy`. Nothing else.
2. Pipeline code already exists in `ai-service/osdr_pipeline/` with tests in `tests/osdr/` (synthetic fixtures that mimic
   the documented structure). Keep the structure; adapt ONLY the parse layer if real responses differ.
3. Run `uv run python -m osdr_pipeline fetch --ids 1-30 --files --probe-search` and inspect 3 raw files plus
   `search_probe.json`. Compare real keys against `parse.py` assumptions (study -> OSD-N -> studies[0] -> comments,
   title, description, publicReleaseDate, factors, publications; additionalInformation -> assays / organisms).
   Write the differences into `data/osdr/reports/schema_notes.md`, then fix `parse.py` and add a test using one small
   REAL raw file (copy of a real response, saved as `tests/osdr/fixtures/real_OSD-<n>.json`).
4. Full fetch: `uv run python -m osdr_pipeline fetch --files` (resumable; scans ids until 40 consecutive misses after 100).
5. `uv run python -m osdr_pipeline all`. Read `reports/osdr_profile.md`: missing values, duplicates, year/organism/topic
   counts, mission-duration statistics (outliers reported, never removed), chi-square topic x organism (exploratory).
6. Review labels: print 20 random labeled studies with their matched terms; list the 20 most frequent unlabeled
   title words to extend `taxonomy_v1.json` (bump version to keyword_v2 when changed).
7. Preprocessing rules (data-scientist checklist applied where it makes sense for metadata): trim/collapse whitespace;
   empty -> missing; dates parsed with explicit formats; durations computed, negative -> missing; duplicates resolved
   by highest version; categorical normalization via controlled vocabularies; no scaling/imputation on text fields.
   Numeric techniques (outlier handling, scaling, imputation) apply to RadLab/DONKI time series in Units 04 and 07, not here.
8. Do not download any OSDR data file. Do not commit `data/osdr/raw/`.

## Manual steps for the human
- No API key is needed for OSDR. You need internet, about 1-2 GB of free disk for raw metadata (an estimate: check
  `du -sh data/osdr/raw` after the 30-study test and extrapolate), and patience: the full fetch can take a long time
  because it is rate-limited on purpose (about 0.4 s per request).
- After the 30-study test, send your orchestrator/agent the schema notes if anything looked different from the docs.
- Open `reports/osdr_profile.md` and 20 labeled studies and judge: do the labels make sense? You are the domain check.
- Commit tables + report + topic index (small), not raw.

## Dependencies
- Unit 02 merged. Independent from Units 03 and 04 (can run in parallel).

## Verify when done
- [ ] `uv run pytest tests/osdr` passes (including one test on a REAL raw response)
- [ ] `data/osdr/tables/` has studies, studies_labeled, study_factors, study_assays, study_publications, study_organisms
      (+ study_files_summary), each as CSV and Parquet
- [ ] `reports/osdr_profile.md` exists; row count equals number of raw meta files minus unparsed (listed)
- [ ] `grep -r pandas app/` finds nothing (service never imports pandas)
- [ ] `data/knowledge/osdr_topic_index.json` exists with `verified_by_human: false`, `caveat`, `label_method`
- [ ] `git status` shows no raw files; no OSDR data file was downloaded
- [ ] Re-running `all` twice gives identical tables (deterministic)
- [ ] `progress-tracker.md` updated; Teaching mode report given
