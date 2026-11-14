from fastapi import APIRouter

from app.nasa.osdr import OSDRClient, topic_weights
from app.schemas.models import EventProfileResponse, EventProfileWeight, Site

router = APIRouter()
client = OSDRClient()


@router.get("/events/profile", response_model=EventProfileResponse)
def event_profile(site: Site) -> EventProfileResponse:
    snapshot, data_source = client.snapshot()
    return EventProfileResponse(
        weights=[EventProfileWeight(**weight) for weight in topic_weights(snapshot, site)],
        data_source=data_source,
        as_of=snapshot.get("generated_at", "unknown"),
    )
