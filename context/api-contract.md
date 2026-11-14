# API Contract (v1) — Unity <-> AI Service

Change this file first, in its own PR, before changing either side.
Base path `/v1`. JSON only. All numeric resources are 0–100.

## Shared types
GameSnapshot: { sol:int, mission_length:int, site:"moon"|"mars",
  resources:{power:int, oxygen:int, shielding:int}, crew:int,
  active_event:{type:string, severity:1-3}|null }
Decision: { id:string, label:string, deltas:{power:int, oxygen:int, shielding:int},
  delayed_effects:[{sol_offset:int, resource:string, delta:int}] }

## GET /v1/health -> { status:"ok", llm:bool, nasa_live:bool }

## GET /v1/space-weather -> 
{ risk_level:"low"|"medium"|"high", headline:string (kid-friendly),
  data_source:"live"|"curated", source_name:"NASA DONKI", as_of:ISO8601 }

## POST /v1/assistant/chat
Request: { snapshot:GameSnapshot, message:string(<=300 chars), history:[{role,text}] (<=6) }
Response: { reply:string (<=3 sentences), data_source, fallback_used:bool }

## POST /v1/evaluate/decision
Request: { before:GameSnapshot, after:GameSnapshot, decision:Decision, space_weather:{risk_level}|null }
Response: { rating:"great"|"ok"|"risky", survival_delta:int(-20..20),
  tradeoff:{gained:string, cost:string}, feedback:string (<=2 sentences),
  fact:{text:string, source:string}|null, data_source:"live"|"curated"|"simulated", fallback_used:bool }
  (data_source="simulated" = deterministic game-rules output, not NASA data)

## POST /v1/evaluate/mission
Request: { site, history:[{snapshot, decision_id, rating}], outcome:"survived"|"failed" }
Response: { survivability_score:int(0-100), strengths:[string<=3], lessons:[string<=3],
  summary:string, fallback_used:bool }

## Errors
4xx/5xx -> { error:string }. Unity treats ANY error or >3s timeout as "use local fallback text".
