from fastapi import APIRouter

from app.schemas.models import SpaceWeather

router = APIRouter()


@router.get("/space-weather", response_model=SpaceWeather)
def space_weather() -> SpaceWeather:
    return SpaceWeather(
        risk_level="low",
        headline="The space weather looks calm today.",
        data_source="simulated",
        source_name="NASA DONKI",
        as_of="2026-01-01T00:00:00Z",
    )
