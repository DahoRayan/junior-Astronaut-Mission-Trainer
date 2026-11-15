# API Contract (v2) — Game Client <-> AI Service

Change this file first, in its own PR, before changing either side.
Base `/v1`, JSON only, resources 0-100. v2 replaces the free-form LLM chat endpoint with an expert system menu.
Endpoints and schemas: `/health`, `/space-weather`, `/events/profile`, `/assistant/questions`, `/assistant/answer`, `/evaluate/decision`, `/evaluate/mission`.

## Shared types
GameSnapshot: { sol:int, mission_length:int, site:"moon"|"mars", perspective_id:string, scene_id:string,
  resources:{power:int, oxygen:int, shielding:int}, crew:int,
  active_event:{type:string, severity:1-3}|null }
Decision: { id:string, label:string, deltas:{power:int, oxygen:int, shielding:int},
  delayed_effects:[{sol_offset:int, resource:string, delta:int}] }
Explanation: { rules_fired:[{rule_id:string, text:string}], inputs:object,
  sources:[{name:string, kind:"live"|"curated"|"simulated"}] }
DataSource = "live" | "curated" | "simulated"

## GET /v1/health
-> { status:"ok", nasa_live:bool, knowledge_base_version:string }

## GET /v1/space-weather
-> { science_status:"limited"|"moderate"|"rich", headline:string,
     evidence:[{topic:string, study_count:int}], data_source:DataSource,
     source_name:string, as_of:ISO8601 }

## GET /v1/events/profile?site=moon
-> { weights:[{event_type:string, weight:float, basis:string}], data_source:DataSource, as_of:ISO8601 }
(weights sum to 1; event_type values are OSDR topic labels from the curated metadata snapshot)

## POST /v1/assistant/questions
Request: { snapshot:GameSnapshot }
Response: { questions:[{id:string, text:string}] }  (3-5, relevant to scene/event/resources)

## POST /v1/assistant/answer
Request: { question_id:string, snapshot:GameSnapshot }
Response: { answer:string (<=3 sentences), fact:{text:string, source:string}|null,
  explanation:Explanation, data_source:DataSource }
Unknown question_id -> 404 { error }.

## POST /v1/evaluate/decision
Request: { before:GameSnapshot, after:GameSnapshot, decision:Decision, space_weather:{risk_level}|null }
Response: { rating:"great"|"ok"|"risky", survival_delta:int(-20..20),
  tradeoff:{gained:string, cost:string}, feedback:string (<=2 sentences),
  fact:{text:string, source:string}|null, explanation:Explanation, data_source:DataSource }

## POST /v1/evaluate/mission
Request: { site, perspective_id:string,
  history:[{snapshot:GameSnapshot, decision_id:string, rating:string}],
  outcome:"survived"|"failed",
  other_runs:[{perspective_id:string, survivability_score:int}] (optional) }
Response: { survivability_score:int(0-100), strengths:[string<=3], lessons:[string<=3], summary:string,
  stats:{ resource_stats:{power|oxygen|shielding:{mean:float, min:int, trend:"up"|"down"|"flat"}},
          rating_counts:{great:int, ok:int, risky:int}, most_costly_decision_id:string|null,
          event_exposure_sols:int, perspective_comparison:[{perspective_id, survivability_score}] }|null,
  explanation:Explanation }

## Errors
{ error:string } with 4xx/5xx. The Game Client treats any error or >3 s timeout as "use local fallback text".
