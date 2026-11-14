from fastapi import APIRouter

from app.nasa.osdr import OSDRClient, evidence, science_status
from app.schemas.models import SpaceWeather

router = APIRouter()
client = OSDRClient()


@router.get("/space-weather", response_model=SpaceWeather)
def space_weather() -> SpaceWeather:
    snapshot, data_source = client.snapshot()
    total = snapshot["n_studies_total"]
    return SpaceWeather(
        science_status=science_status(snapshot),
        headline=f"NASA's science snapshot covers {total} studies for astronaut learning.",
        evidence=evidence(snapshot),
        data_source=data_source,
        source_name="NASA OSDR study metadata",
        as_of=snapshot.get("generated_at", "unknown"),
    )
