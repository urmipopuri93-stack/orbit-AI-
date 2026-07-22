from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import video
from app.routers.youtube import router as youtube_router

app = FastAPI(
    title="Orbit AI API",
    version="0.1.0",
)

app.include_router(youtube_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video.router)
 


@app.get("/")
def home() -> dict[str, str]:
    return {"status": "Orbit AI API is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "orbit-ai-api",
    }