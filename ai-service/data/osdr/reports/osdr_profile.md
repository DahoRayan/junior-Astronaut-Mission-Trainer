# OSDR studies: data-quality and descriptive report

- rows: 424; unique osd_id: 424 (duplicates: 0)
- release years: 2004 to 2025

## Missing values (% per column)

- mission_start: 73.1%
- mission_days: 73.1%
- mission_end: 72.9%
- mission_name: 55.2%
- experiment_platform: 52.4%
- project_title: 50.5%
- managing_center: 50.5%
- flight_program: 49.1%
- space_program: 34.2%
- doi: 15.8%
- topics: 6.8%
- game_domains: 6.8%
- topic_matches: 6.8%
- public_release_date: 3.3%
- organisms: 3.3%
- release_year: 3.3%
- version: 1.9%
- project_type: 0.2%

## Studies per release year

- 2004: 2
- 2006: 1
- 2007: 3
- 2008: 7
- 2009: 3
- 2010: 12
- 2011: 14
- 2012: 10
- 2013: 13
- 2014: 18
- 2015: 15
- 2016: 31
- 2017: 47
- 2018: 39
- 2019: 26
- 2020: 44
- 2021: 40
- 2022: 46
- 2023: 23
- 2024: 15
- 2025: 1

## Organism groups

- mouse: 142
- human: 85
- plant: 64
- other: 59
- microbe: 32
- invertebrate_or_fish: 25
- rat: 17

## Environment (heuristic)

- spaceflight: 225
- ground_radiation: 78
- unknown: 74
- ground_analog: 47

## Flight programs

- (missing): 208
- International Space Station (ISS): 148
- Space Transportation System (STS): 17
- Internation Space Station (ISS): 10
- ISS: 6
- Space Transportation System (Shuttle): 3
- NA: 3
- BION-M1 biosatellite: 3
- International Space Station: 2
- Soyuz: 2
- Space Transportation System (Shuttle), STS-62: 2
- Space Shuttle, International Space Station (ISS): 1
- Shuttle Program: 1
- Space Transporation System (STS): 1
- Space Transportation System (STS), International Space Station (ISS): 1

## Topic labels (multi-label, keyword_v1)

- gravity_effects: 179
- radiation: 113
- metabolism_organs: 99
- immune: 98
- microbes: 77
- plants_food: 73
- bone: 53
- muscle: 53
- cardiovascular: 37
- brain_neuro: 30
- vision_eye: 26
- sleep_circadian: 1

- studies with NO topic label: 29

## Mission duration (days) where start/end dates exist

- n=114, mean=31.1, median=32.0, std=26.9, p25=15.0, p75=34.0, p95=42.8
- IQR outlier bounds: [-13.5, 62.5]; outliers: 5
- NOTE: outliers are reported, NOT removed (long missions are real data, not errors).

## Chi-square: topic vs organism group

- chi2=674.9, dof=60, p=7.14e-105 (topic labels are multi-label, so rows are not fully independent: treat as exploratory, not as proof)
