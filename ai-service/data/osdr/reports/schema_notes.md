# OSDR schema notes from bounded live probe

Retrieved: 2026-11-14  
Command: `uv run python -m osdr_pipeline fetch --ids 1-30 --files --probe-search`  
Sample metadata files inspected: `OSD-1.json`, `OSD-2.json`, `OSD-3.json`  
Sample file-listing files inspected: `OSD-1.json`, `OSD-2.json`, `OSD-3.json`  
Search file inspected: `search_probe.json`

## Fetch result

- 27 metadata records were found: IDs 1-9, 11-22, and 25-30.
- IDs 10, 23, and 24 were missing.
- No request errors were recorded.
- The raw directory was approximately 4.9 MB after this bounded fetch.
- No OSDR data files were downloaded. The `--files` output contains file-listing
  envelopes only; all three inspected listings had an empty `study_files` array.

## Comparison with `parse.py` assumptions

| Area | Assumption in parser | Live observation | Difference |
|---|---|---|---|
| Top level | `study` is the relevant top-level key | `study` exists, alongside `hits`, `input`, and `success` | Extra envelope keys are present and can be ignored |
| Study block | `study -> OSD-N -> studies[0]` | This path exists in all three samples | Matches |
| Comments | `studies[0].comments` is a list of `{name, value}` entries | All three samples contain 19-20 such entries | Matches; block-level `comments` is also present but empty |
| Factors | Factor entries provide `factorName` | All three samples contain factor dictionaries with `@id`, `comments`, `factorName`, and `factorType` | The current extraction of `factorName` is compatible |
| Publications | `studies[0].publications` is a list | Each inspected study has one publication entry | Matches |
| Assays | `additionalInformation.assays` is a mapping whose keys encode measurement and technology | All three studies have `studies[0].assays` as a list; each item has `measurementType`, `technologyPlatform`, `technologyType`, `filename`, and other fields | Major difference: the current parser misses the real assay list |
| Organisms | `additionalInformation.organisms.links` is available | `additionalInformation` is absent for OSD-1 and OSD-2; OSD-3 has `assays`, `description`, `id`, `ontologies`, `organisms`, and `samples`, with organism links nested below `organisms` | Major difference: organism metadata is not consistently available at the assumed path |
| Additional information | Expected to exist for assays and organisms | Absent on OSD-1 and OSD-2; present on OSD-3 | Must be optional and cannot be the only source for assays |
| Release date | `%d-%b-%Y` | Observed `11-Dec-2013`, `01-Apr-2011`, and `1-Sep-2011` | Same calendar format, with both zero-padded and single-digit days |
| File listings | `study_files` contains file entries when present | Listing envelopes have `osd_id`, `file_count`, `study_files`, and `truncated`; all three `study_files` arrays are empty and `file_count` is null | Envelope matches, but these records provide no file rows |

## Search probe

`search_probe.json` is an Elasticsearch-style response with top-level keys
`took`, `timed_out`, `_shards`, and `hits`. The `hits` object contains `total`,
`max_score`, and `hits`; the reported total was 577. This is a search-result
envelope, not a study-metadata record, so it should not be passed to
`parse_one`.

## Parser impact

The assay and organism differences are substantial enough that the parser must
be updated before building tables from live metadata. In particular, assay
rows must be derived from the observed `studies[0].assays` list, and organism
extraction must tolerate missing `additionalInformation` rather than assuming
that path is populated. No parser code has been changed yet.
