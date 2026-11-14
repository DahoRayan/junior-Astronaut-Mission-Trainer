# Unit 04: NASA Data Layer + Curated Dataset

## Goal

Add an OSDR-backed NASA science data layer for the AI service. It must read the
reviewed OSDR metadata snapshot, cache loaded results in memory with a TTL, and
return a curated snapshot when the source files are unavailable. The layer
supplies science evidence for `/v1/space-weather` and normalized OSDR topic
weights for `/v1/events/profile`.

Do not write NASA findings or guessed response fields. The implementation must be
based on the real tables and topic index saved under `ai-service/data/osdr/` and
`ai-service/data/knowledge/`.

## Design

- OSDR data is public snapshot data; no NASA API key is needed for this unit.
- Keep the client, cache, normalization, and routers in separate small modules.
- Cache the loaded OSDR snapshot in memory with a configurable TTL. Cache entries
  must include the snapshot path and retrieval time.
- On missing files, invalid JSON, invalid table/index data, or stale snapshot
  metadata, use the reviewed curated index and label it `curated`.
- Never label curated data as `live`.
- Do not silently turn malformed snapshot data into a successful response. Log the
  fallback reason without logging raw study content.
- The service remains stateless apart from the in-memory cache.

## Implementation

### 1. Use the collected OSDR snapshot

The human has already collected real OSDR metadata under `ai-service/data/osdr/`.
The committed CSV/Parquet tables contain study metadata, not experimental findings.
The topic index records the deterministic keyword labels and their matched terms.
Do not use the deleted raw JSON files or invent study findings.

### 2. Curated data

 - Use `data/knowledge/osdr_topic_index.json` as the reviewed, versioned fallback
   snapshot. It includes source, label method, caveat, and verification metadata.
 - The science-status response must contain topic counts from the snapshot only.
 - The event profile must normalize `n_studies` counts from the snapshot only.
 - Do not present topic counts as health effects, hazard levels, or experimental
   findings.
 - Tests must load the committed topic index rather than duplicating NASA data.

### 3. OSDR snapshot loader and TTL cache

- Add a small OSDR loader under `ai-service/app/nasa/`.
- Read the committed JSON index without importing pandas or `osdr_pipeline`.
- Add an in-memory TTL cache with injectable clock/TTL values for deterministic tests.
- Test cache hits, expiration, and a missing/invalid snapshot falling back to the
  curated index.
- Validate the topic index shape before returning it.

### 4. `/v1/space-weather`

- Replace the Unit 02 mock implementation with the OSDR snapshot service.
- Map evidence coverage to `limited`, `moderate`, or `rich` using a documented,
  deterministic rule based on snapshot counts.
- Preserve the contract fields exactly: kid-friendly `headline`, evidence topic
  counts, `data_source`, source name, and ISO-8601 `as_of`.
- Always mark this snapshot response as `curated`; it is not live space weather.

### 5. `/v1/events/profile`

- Use the endpoint specified in `context/api-contract.md`.
- Normalize the observed OSDR topic counts so weights sum to exactly 1, and retain
  the snapshot row count and counting method in `basis`.
- Return only topic labels present in the committed index.
- Cache the derived profile and use the same curated snapshot if loading fails.
- Add tests proving weights are non-negative, sum to 1 within a strict tolerance,
  and remain reproducible for the same snapshot.

### 6. Tests and documentation

- Add unit tests for snapshot validation, evidence-status mapping, TTL behavior,
  curated fallback, and topic-weight normalization.
- Add router tests for curated responses from both endpoints.
- Update the AI service README with the OSDR snapshot workflow and the two endpoints.
- The shared contract was updated before implementation to reflect OSDR semantics.

## Manual steps for the human

1. Review the committed OSDR profile and topic index for domain correctness:
   `ai-service/data/osdr/reports/osdr_profile.md` and
   `ai-service/data/knowledge/osdr_topic_index.json`.
2. Approve any taxonomy changes before they are applied. The current index is
   explicitly marked `verified_by_human: false`.
3. Run the service checks from `ai-service/`:

   ```powershell
   uv sync
   uv run pytest
   uv run ruff check .
   ```

## Dependencies

- Unit 02 contract v2 migration completed and verified.
- Unit 04b OSDR pipeline completed with a committed 424-study snapshot.
- `data/knowledge/osdr_topic_index.json` is present and includes source, caveat,
  label method, and verification metadata.
- `httpx`, `pydantic-settings`, `pytest`, and `ruff` available through uv.

## Verify when done

- [ ] `uv run pytest` passes, including snapshot validation, cache hit/expiry,
  curated fallback, science-status mapping, and topic-weight normalization tests.
- [ ] `uv run ruff check .` passes.
- [ ] `uv run uvicorn app.main:app --reload` starts and `/docs` lists the v2
  endpoints, including `/v1/space-weather` and `/v1/events/profile`.
- [ ] `/v1/space-weather` returns `data_source: "curated"`, a neutral
  `science_status`, topic evidence counts, and ISO-8601 `as_of`.
- [ ] With the snapshot forced to fail, both endpoints return curated values from
  `data/knowledge/osdr_topic_index.json`.
- [ ] `/v1/events/profile?site=moon` returns non-negative OSDR topic weights whose
  sum is 1 and whose `basis` identifies the metadata snapshot.
- [ ] The event profile is reproducible from the same committed index.
- [ ] The service never imports pandas or `osdr_pipeline`.
- [ ] `data/knowledge/osdr_topic_index.json` retains `verified_by_human: false`
  and its caveat.
- [ ] `git diff --stat` shows only Unit 04 service, data, tests, README, and
  directly related context changes.
- [ ] `context/progress-tracker.md` is updated.
