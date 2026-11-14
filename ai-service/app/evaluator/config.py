from typing import Final

SAFE_LEVEL: Final = 40
CRITICAL_LEVEL: Final = 20
BALANCE_SPREAD: Final = 50
BALANCE_PENALTY: Final = 10
DELAYED_DEBT_PENALTY: Final = 5
SURVIVAL_DELTA_LIMIT: Final = 20
MISSION_INDEX_WEIGHT: Final = 0.6
MISSION_RATING_WEIGHT: Final = 0.3
SURVIVED_BONUS: Final = 10
FAILED_SCORE_CAP: Final = 60

EVENT_PRESSURE: Final = {
    "solar_flare": ("shielding", (40, 60, 80)),
}

RATING_POINTS: Final = {
    "great": 100,
    "ok": 60,
    "risky": 20,
}
