RESOURCE_LABELS = {
    "power": "power",
    "oxygen": "oxygen",
    "shielding": "shielding",
}


def gained_text(resource: str) -> str:
    return f"more {RESOURCE_LABELS[resource]}"


def cost_text(resource: str) -> str:
    return f"less {RESOURCE_LABELS[resource]}"


def delayed_cost_text(resource: str) -> str:
    return f"a delayed loss of {RESOURCE_LABELS[resource]}"


def extra_risk_text() -> str:
    return "an extra risk later"


def feedback_text(rating: str, gained: str, cost: str) -> str:
    if rating == "great":
        return f"You gained {gained} and paid {cost}. That was a strong mission choice."
    if rating == "risky":
        return f"You gained {gained}, but paid {cost}. Watch the mission closely after this choice."
    return f"You gained {gained}, but paid {cost}. Keep balancing all three resources."


def mission_summary(outcome: str) -> str:
    if outcome == "survived":
        return "You completed the mission lesson. Your careful choices helped the crew."
    return "The mission became a lesson. Next time, watch the resource that falls fastest."
