# Samples: how these were obtained (read before using)

- `donki_FLR_sample.json`: 5 real records copied verbatim from a DONKI `/DONKI/FLR` response (20 records in the full response, flares between 2026-08-10 and 2026-08-30).
- `donki_GST_sample.json`: 1 real record, verbatim, from `/DONKI/GST` (storm of 2026-10-31, Kp 6).
- Both were fetched on 2026-11-14 through an AI chat's web-fetch tool using `DEMO_KEY`. That tool rewrites URLs, so the date window was NOT controlled by us (default window). Use these ONLY to learn the field names and shapes (e.g. `classType`, `linkedEvents`, `sentNotifications`, `allKpIndex`).
- Do NOT compute frequencies or statistics from them. Run `scripts/fetch_donki_samples.py` for a controlled 12-month window.
- CME and SEP responses could not be fetched by the chat tool (client errors); the script fetches them from your machine. Check their field names in the saved files before writing parsers.
