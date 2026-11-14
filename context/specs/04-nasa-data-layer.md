# Unit 04: NASA Data Layer + Curated Dataset

## Goal

Add a NASA DONKI data layer for the AI service. It must fetch real DONKI samples,
cache successful results in memory with a TTL, and return a curated fallback when
NASA is unavailable. The layer supplies `/v1/space-weather` and the real-frequency
event weights required by `/v1/events/profile`.

Do not write NASA facts, guessed DONKI fields, or guessed response examples before
the manual sample-collection step. The implementation must be based on the real
files saved in `ai-service/data/samples/`, and only then produce reviewed files in
`ai-service/data/curated/`.

## Design

- NASA access is server-side only; the NASA API key must never be sent to Unity or
  committed to Git.
- Use an async HTTP client with an explicit timeout of no more than 3 seconds.
- Keep the client, cache, normalization, and routers in separate small modules.
- Cache successful NASA responses in memory with a configurable TTL. Cache entries
  must include the request parameters and retrieval time.
- On timeout, network failure, non-success HTTP status, invalid JSON, or invalid
  observed sample data, use the reviewed curated data and label it `curated`.
- Never label curated data as `live`.
- Do not silently turn malformed live data into a successful live response. Log the
  fallback reason without logging the API key or full raw response.
- The service remains stateless apart from the in-memory cache.

## Implementation

### 1. Collect real samples before coding the parser

The human must first create `ai-service/data/samples/` and save 2–3 raw DONKI
responses there using the commands in **Manual steps for the human**. Keep the
retrieval date, endpoint URL without the API key, query parameters, and HTTP status
in a nearby metadata file. Do not edit the raw JSON to make it easier to parse.

Inspect the saved samples and document the actual fields, nullability, event names,
date formats, and pagination or date-window behavior found in those files. If the
samples do not contain enough information to derive the required outputs, stop and
collect additional real samples instead of inventing fields.

### 2. Curated data

- Add `ai-service/data/curated/` and store reviewed, versioned fallback data derived
  only from the collected samples.
- Include source URL, retrieval date, query window, transformation notes, and the
  original sample filenames in metadata.
- Store at least one reviewed fallback input for space weather and one reviewed
  frequency dataset for event profiles.
- Do not add a NASA fact, event frequency, event name, or API response field unless
  it is present in the collected samples or explicitly required by the v2 contract.
- Tests must load the curated files rather than duplicating NASA data in Python test
  code.

### 3. DONKI client and TTL cache

- Add an async DONKI client under `ai-service/app/nasa/`.
- Read `NASA_API_KEY` from the existing settings mechanism in `app/config.py`.
- Use the real endpoint paths and parameter names observed in the saved samples and
  the official NASA documentation; do not guess them from memory.
- Add an in-memory TTL cache with injectable clock/TTL values for deterministic tests.
- Test cache hits, expiration, and a failed live request falling back to curated
  data.
- Validate the live payload against schemas built from the observed samples before
  returning it.

### 4. `/v1/space-weather`

- Replace the Unit 02 mock implementation with a service call to the DONKI client.
- Map the observed live event data to the contract's `low`, `medium`, or `high`
  risk levels using a documented, deterministic rule.
- The rule must be based on fields actually present in the collected samples and
  must have tests for every risk level.
- Preserve the contract fields exactly: kid-friendly `headline`, `data_source`,
  source name, and ISO-8601 `as_of`.
- When live data is unavailable, return the reviewed curated fallback and mark
  `data_source` as `curated`.

### 5. `/v1/events/profile`

- Add the endpoint specified in `context/api-contract.md`.
- Build event frequencies from a documented real DONKI sample window. Count the
  observed event categories, normalize counts so weights sum to exactly 1, and
  retain the sample window and counting method in the `basis` text.
- Do not hardcode event types or frequencies before inspecting the samples.
- Return only event categories supported by the collected data and the game's
  approved event vocabulary. If these sets do not overlap, stop and report the
  mismatch rather than inventing a mapping.
- Cache the live-derived profile. If live collection or validation fails, use the
  reviewed curated profile and mark it `curated`.
- Add tests proving weights are non-negative, sum to 1 within a strict tolerance,
  and remain reproducible for the same sample set.

### 6. Tests and documentation

- Add unit tests for sample parsing, risk mapping, TTL behavior, curated fallback,
  and event-weight normalization.
- Add router tests for live and fallback responses for both endpoints.
- Update the AI service README with the sample-collection workflow and the two NASA
  endpoints.
- Do not change `context/api-contract.md` in this unit.

## Manual steps for the human (keys, env, installs)

1. From the repository root, open the NASA API signup page:
   `https://api.nasa.gov/`
   Request an API key using an email address you control. NASA will show or email
   the key; keep it private.

2. From the repository root, create the environment file without printing its
   contents:

   ```powershell
   Set-Location .\ai-service
   Copy-Item .env.example .env
   notepad .env
   ```

   In Notepad, replace the empty value after `NASA_API_KEY=` with your NASA key,
   save, and close Notepad. Never paste the key into chat.

3. Confirm Git ignores the environment file:

   ```powershell
   git check-ignore -v .\ai-service\.env
   ```

   Expected output contains `ai-service/.gitignore` and `.env`. If there is no
   output, stop and fix the ignore rule before continuing. Do not run
   `git add .env`.

4. Create the raw sample directory:

   ```powershell
   New-Item -ItemType Directory -Force .\ai-service\data\samples | Out-Null
   ```

5. From `ai-service/`, use these Windows PowerShell commands to save real DONKI
   responses. They read the key from `.env` without printing the key. Replace only
   the endpoint URLs and query parameters after checking the official NASA
   documentation if the service reports that the requested resource is unavailable.

   ```powershell
   Set-Location .\ai-service
   $apiKey = (Get-Content .env | Where-Object { $_ -match '^NASA_API_KEY=' }) -replace '^NASA_API_KEY=', ''
   $endDate = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
   $startDate = (Get-Date).ToUniversalTime().AddDays(-30).ToString('yyyy-MM-dd')
   curl.exe -sS -G "https://api.nasa.gov/DONKI/CME" `
     --data-urlencode "startDate=$startDate" `
     --data-urlencode "endDate=$endDate" `
     --data-urlencode "api_key=$apiKey" `
     -o .\data\samples\donki-cme-30-days.json
   curl.exe -sS -G "https://api.nasa.gov/DONKI/FLR" `
     --data-urlencode "startDate=$startDate" `
     --data-urlencode "endDate=$endDate" `
     --data-urlencode "api_key=$apiKey" `
     -o .\data\samples\donki-flr-30-days.json
   curl.exe -sS -G "https://api.nasa.gov/DONKI/GST" `
     --data-urlencode "startDate=$startDate" `
     --data-urlencode "endDate=$endDate" `
     --data-urlencode "api_key=$apiKey" `
     -o .\data\samples\donki-gst-30-days.json
   Remove-Variable apiKey
   Remove-Variable startDate, endDate
   ```

   These commands use documented DONKI resource names but make no assumptions
   about the returned JSON fields. Confirm each file is non-empty and valid JSON,
   then add retrieval metadata without adding the key:

   ```powershell
   Get-ChildItem .\data\samples\*.json | Select-Object Name,Length
   Get-Content .\data\samples\donki-sample-1.json -Raw | ConvertFrom-Json | Out-Null
   ```

6. Install and run the service checks with uv from `ai-service/`:

   ```powershell
   uv sync
   uv run pytest
   uv run ruff check .
   ```

## Dependencies

- Unit 02 contract v2 migration completed and verified.
- A NASA API key stored only in `ai-service/.env`.
- 2–3 real DONKI JSON responses saved in `ai-service/data/samples/`.
- Current official NASA DONKI documentation inspected before implementing endpoint
  requests and parsers.
- `httpx`, `pydantic-settings`, `pytest`, and `ruff` available through uv.

## Verify when done

- [ ] `uv run pytest` passes, including live-sample parsing, cache hit/expiry,
  curated fallback, risk mapping, and event-weight normalization tests.
- [ ] `uv run ruff check .` passes.
- [ ] `uv run uvicorn app.main:app --reload` starts and `/docs` lists the v2
  endpoints, including `/v1/space-weather` and `/v1/events/profile`.
- [ ] With a valid key and reachable NASA service, `curl.exe` calls return
  `data_source: "live"` and ISO-8601 `as_of` values.
- [ ] With the NASA request forced to fail, both endpoints return reviewed
  `data_source: "curated"` values from `ai-service/data/curated/`.
- [ ] `/v1/events/profile?site=moon` returns non-negative weights whose sum is 1
  and whose `basis` identifies the real sample window.
- [ ] The event profile is reproducible from the same saved samples.
- [ ] `ai-service/data/samples/` contains 2–3 real DONKI responses and metadata;
  no API key appears in any saved file.
- [ ] `ai-service/data/curated/` contains reviewed fallback samples with source and
  retrieval metadata; no NASA content was invented.
- [ ] `git check-ignore -v ai-service/.env` confirms `.env` is ignored.
- [ ] `git diff --stat` shows only Unit 04 service, data, tests, README, and
  directly related context changes.
- [ ] `context/progress-tracker.md` is updated.
