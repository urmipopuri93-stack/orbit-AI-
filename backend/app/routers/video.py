import os
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/video", tags=["video"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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