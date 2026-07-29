from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import video
from app.routers.youtube import router as youtube_router


app = FastAPI(
    title="Orbit AI API",
    version="0.1.0",
)


# Allow your Chrome extension and local React frontend
# to communicate with the FastAPI backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "chrome-extension://fcnemdljoeofeifmnmpajhdiphoheohc",
    ],
    # Allows the backend to work even if Chrome assigns
    # the extension a different ID later.
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(youtube_router)
app.include_router(video.router)


@app.get("/")
def home() -> dict[str, str]:
    return {
        "status": "Orbit AI API is running",
    }


@app.get("/health")

def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "orbit-ai-api",
    }