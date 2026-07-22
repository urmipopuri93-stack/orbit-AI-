import os
import re
import json
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi

load_dotenv()

router = APIRouter(prefix="/video", tags=["video"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def clean_json_response(text: str) -> str:
    # strip markdown code fences like ```json ... ``` or ``` ... ```
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', text.strip())
    return cleaned


class QuestionRequest(BaseModel):
    transcript: str
    question: str

@router.post("/ask")
def ask_question(req: QuestionRequest):
    prompt = f"""You are a helpful tutor. Answer the question based only on the provided video transcript.

Transcript:
{req.transcript}

Question: {req.question}"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )
    return {"answer": response.text}


class TranscriptRequest(BaseModel):
    video_id: str

@router.post("/transcript")
def get_transcript(req: TranscriptRequest):
    ytt_api = YouTubeTranscriptApi()
    transcript_list = ytt_api.fetch(req.video_id)
    segments = [
        {"text": entry.text, "start": entry.start, "duration": entry.duration}
        for entry in transcript_list
    ]
    return {"segments": segments}


class QuestionGenRequest(BaseModel):
    segments: list[dict]
    current_time: float
    focus_level: str

@router.post("/generate-question")
def generate_question(req: QuestionGenRequest):
    relevant_text = " ".join([
        s["text"] for s in req.segments if s["start"] <= req.current_time
    ])

    prompt = f"""Based on this portion of a video transcript (up to the current point the viewer has watched), generate ONE open-ended question to test understanding, at a "{req.focus_level}" difficulty level. Base it on content from recent segments, ideally the last minute or two.

Return ONLY valid JSON:
{{
  "topic": "short topic label",
  "question": "the question text"
}}

Transcript so far:
{relevant_text}"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )

    cleaned = clean_json_response(response.text)
    try:
        parsed = json.loads(cleaned)
        return {"result": parsed}
    except json.JSONDecodeError:
        return {"result": response.text}


class AnswerCheckRequest(BaseModel):
    segments: list[dict]
    current_time: float
    question: str
    user_answer: str

@router.post("/check-answer")
def check_answer(req: AnswerCheckRequest):
    relevant_text = " ".join([
        s["text"] for s in req.segments if s["start"] <= req.current_time
    ])

    prompt = f"""Based on this video transcript, evaluate the user's answer to the question.

Transcript so far:
{relevant_text}

Question: {req.question}
User's answer: {req.user_answer}

Return ONLY valid JSON in this exact format:
{{
  "correct": true or false,
  "correct_answer": "the correct answer, stated clearly and concisely",
  "explanation": "a short explanation of why this is the correct answer",
  "relevant_text": "the exact sentence or phrase from the transcript that answers this question"
}}"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )

    cleaned = clean_json_response(response.text)
    try:
        parsed = json.loads(cleaned)
        relevant_snippet = parsed.get("relevant_text", "")
        timestamp = None
        for s in req.segments:
            if relevant_snippet and relevant_snippet[:20] in s["text"]:
                timestamp = s["start"]
                break
        parsed["timestamp"] = timestamp
        return {"result": parsed}
    except json.JSONDecodeError:
        return {"result": response.text, "timestamp": None}