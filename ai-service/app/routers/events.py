from fastapi import APIRouter

from app.schemas.models import EventProfileResponse, EventProfileWeight, Site

router = APIRouter()


@router.get("/events/profile", response_model=EventProfileResponse)
def event_profile(site: Site) -> EventProfileResponse:
    return EventProfileResponse(
        weights=[
            EventProfileWeight(
                event_type="solar-flare",
                weight=0.4,
                basis=f"Mock frequency profile for the {site} site.",
            ),
            EventProfileWeight(
                event_type="dust-storm",
                weight=0.35,
                basis=f"Mock frequency profile for the {site} site.",
            ),
            EventProfileWeight(
                event_type="equipment-fault",
                weight=0.25,
                basis=f"Mock frequency profile for the {site} site.",
            ),
        ],
        data_source="simulated",
        as_of="2026-01-01T00:00:00Z",
    )
