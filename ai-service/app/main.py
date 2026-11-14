from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routers import assistant, evaluation, events, health, space_weather

MAX_BODY_SIZE = 20 * 1024

app = FastAPI(title="Junior Astronaut Mission Trainer AI Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def enforce_body_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length is not None and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"error": "Request body is too large."})
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": str(exc.errors())})


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


app.include_router(health.router, prefix="/v1")
app.include_router(space_weather.router, prefix="/v1")
app.include_router(events.router, prefix="/v1")
app.include_router(assistant.router, prefix="/v1")
app.include_router(evaluation.router, prefix="/v1")
