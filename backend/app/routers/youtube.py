from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from yt_dlp import YoutubeDL


router = APIRouter(
    prefix="/api",
    tags=["YouTube"],
)


class VideoInfo(BaseModel):
    video_id: str
    title: str
    channel_name: str
    duration: str
    thumbnail_url: str


def format_duration(total_seconds: int | None) -> str:
    if total_seconds is None:
        return "Unknown"

    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"

    return f"{minutes}:{seconds:02d}"


@router.get("/video-info", response_model=VideoInfo)
def get_video_info(video_url: str) -> VideoInfo:
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }

    try:
        with YoutubeDL(options) as youtube:
            info = youtube.extract_info(
                video_url,
                download=False,
            )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not retrieve video information: {error}",
        ) from error

    if not info:
        raise HTTPException(
            status_code=404,
            detail="Video information was not found.",
        )

    channel_name = (
        info.get("channel")
        or info.get("uploader")
        or "Unknown channel"
    )

    return VideoInfo(
        video_id=info.get("id", ""),
        title=info.get("title", "Unknown title"),
        channel_name=channel_name,
        duration=format_duration(info.get("duration")),
        thumbnail_url=info.get("thumbnail", ""),
    )