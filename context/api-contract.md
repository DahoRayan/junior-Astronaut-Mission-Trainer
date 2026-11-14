# API Contract (v2) — Client <-> AI Service

Base path `/v1`. JSON only. All rates in standard educational engineering units.
Client enforces strict $\le 3.0\text{ s}$ timeout and uses bundled local fallback on any error or timeout.

---

## 1. Shared Types

### `GameSnapshot`
```json
{
  "chapter": 1,
  "sol": 1,
  "power_kw_generated": 40.0,
  "power_kw_consumed": 25.0,
  "battery_charge_kwh": 80.0,
  "battery_capacity_kwh": 100.0,
  "oxygen_kg_remaining": 95.0,
  "crew_health_avg": 100,
  "crew_morale_avg": 90,
  "active_alert": "cable_disconnected"
}
```

---

## 2. Endpoints

### GET `/v1/health`
Health probe for service and provider status.
* **Response `200`**:
  ```json
  {
    "status": "ok",
    "llm": false,
    "nasa_live": false
  }
  ```

---

### GET `/v1/space-weather`
Returns current or curated solar flare and coronal mass ejection (CME) risk level derived from NASA DONKI.
* **Response `200`**:
  ```json
  {
    "risk_level": "low",
    "headline": "The Sun is calm today with low solar flare activity.",
    "recommendation": "Normal EVAs and construction permitted on Shackleton Rim.",
    "data_source": "curated",
    "source_name": "NASA DONKI",
    "as_of": "2026-01-01T00:00:00Z"
  }
  ```

---

### POST `/v1/assistant/chat`
Answers player questions in-character as **M.I.L.O.** (*Mission Intelligence & Logistics Operator*).
* **Request**:
  ```json
  {
    "snapshot": {
      "chapter": 1,
      "sol": 1,
      "power_kw_generated": 40.0,
      "power_kw_consumed": 25.0,
      "battery_charge_kwh": 80.0,
      "battery_capacity_kwh": 100.0,
      "oxygen_kg_remaining": 95.0,
      "crew_health_avg": 100,
      "crew_morale_avg": 90,
      "active_alert": null
    },
    "message": "Why is the oxygen generator not running?",
    "history": []
  }
  ```
* **Response `200`**:
  ```json
  {
    "reply": "M.I.L.O. reporting: Check our power cable connection to the solar array. The oxygen electrolyzer needs 10 kW of electricity to split lunar ice water into breathable air!",
    "speaker": "M.I.L.O.",
    "data_source": "curated",
    "fallback_used": true
  }
  ```
* **Constraints**: `message` $\le 300$ chars, `history` $\le 6$ entries. `reply` $\le 3$ short sentences at reading level for ages 7–12.

---

### POST `/v1/evaluate/decision`
Deterministically evaluates a building placement, cable routing, load-shedding switch, or event decision.
* **Request**:
  ```json
  {
    "chapter": 1,
    "sol": 1,
    "action_type": "build",
    "building_type": "solar_array",
    "power_balance_kw": 15.0,
    "battery_charge_kwh": 80.0,
    "oxygen_balance_kg_h": 5.0,
    "crew_sheltered": true,
    "active_alert": null
  }
  ```
* **Response `200`**:
  ```json
  {
    "rating": "great",
    "efficiency_score": 85,
    "tradeoff": {
      "gained": "+20 kW of clean solar power in direct sunlight",
      "cost": "50 Materials from our landing reserves"
    },
    "feedback": "Excellent placement! Our power generation now exceeds base consumption, allowing battery banks to charge before nightfall.",
    "science_fact": {
      "text": "At the Moon's South Pole, solar panels on high crater rims receive near-constant sunlight even when crater floors remain in permanent shadow.",
      "source": "NASA Lunar Reconnaissance Orbiter (LRO)"
    },
    "data_source": "curated",
    "fallback_used": true
  }
  ```
* **Constraints**: `rating` is `"great" | "ok" | "risky"`. `efficiency_score` is $0\text{--}100$.

---

### POST `/v1/evaluate/mission`
Provides a comprehensive final mission debrief certificate and educational evaluation upon completing a chapter or the full campaign.
* **Request**:
  ```json
  {
    "chapter": 1,
    "sols_completed": 3,
    "total_kwh_generated": 240.0,
    "total_o2_produced_kg": 45.0,
    "total_water_recycled_l": 30.0,
    "radiation_dose_mitigated_pct": 85,
    "crew_final_health": 95,
    "crew_final_morale": 90,
    "anomalies_resolved": 1
  }
  ```
* **Response `200`**:
  ```json
  {
    "survivability_score": 92,
    "strengths": [
      "Maintained a continuous power surplus before the solar angle dipped.",
      "Quickly diagnosed and reconnected the loose electrolyzer cable with Amir."
    ],
    "lessons": [
      "Remember to store extra energy in battery banks for the prolonged lunar night."
    ],
    "summary": "Outstanding work, Commander! You established First Light Outpost and guaranteed life support for the entire crew.",
    "nasa_badge_awarded": "Artemis Junior Power Specialist",
    "fallback_used": true
  }
  ```

---

## 3. Error Handling
All 4xx and 5xx errors return:
```json
{
  "error": "Human-readable description of error"
}
```
If the AI service fails or times out ($>3\text{ s}$), the client automatically switches to bundled local deterministic fallback responses.
