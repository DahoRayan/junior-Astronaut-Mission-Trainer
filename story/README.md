# story/

- `story-bible.json`: the shared story bible in the project schema (see `context/game-design.md`): mission, characters,
  systems/thresholds, timeline, facts, decisions, perspectives, failure states, review flags, open questions.
- `dialogue.en.json`: all spoken lines, stage directions and ambient banter, keyed by the same `scene_id`s.

Source: `Beyond_Earth_First_Light_AR.md`. Status: DRAFT, not signed off by the story team.

Read before using:
1. Every sol and the mission length (15) are PROVISIONAL: the source has durations, not sol numbers.
2. Only `player_console` is faithful to the source. The four `crew_*` perspectives are mechanical drafts
   (scenes where the character speaks, facts they state) and need real authoring for the Kaleidoscope design.
3. Decisions have no numeric deltas: the story states effects only in words (`cost_status`: explicit / implied / missing).
4. `review_flags` lists inconsistencies and accuracy issues found while converting (radiation numbers, DONKI, oxygen variables...).
   They are suggestions for the team and the mentor, not changes to the story.
