
import os
import re
import json
from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi


load_dotenv()


router = APIRouter(prefix="/video", tags=["video"])


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))




def clean_json_response(text: str) -> str:
   cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', text.strip())
   return cleaned




def call_ai(prompt: str) -> str:
   response = client.chat.completions.create(
       model="gpt-4o-mini",
       messages=[{"role": "user", "content": prompt}],
   )
   return response.choices[0].message.content




class QuestionRequest(BaseModel):
   transcript: str
   question: str


@router.post("/ask")
def ask_question(req: QuestionRequest):
   prompt = f"""You are a helpful tutor. Answer the question based only on the provided video transcript.


Transcript:
{req.transcript}


Question: {req.question}"""


   answer = call_ai(prompt)
   return {"answer": answer}




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


   recent_text = " ".join([
       s["text"] for s in req.segments
       if req.current_time - 90 <= s["start"] <= req.current_time
   ])
   if not recent_text.strip():
       recent_text = relevant_text


   level_guidance = {
       "basic": "Test simple recall of a specific fact, term, or step mentioned. The viewer should be able to answer just from remembering what was said.",
       "intermediate": "Test understanding of WHY something works the way it does, or how two concepts relate. Require the viewer to explain a mechanism or reasoning, not just recall a fact.",
       "mastery": "Test the viewer's ability to apply or extend the concept — e.g. predict what would happen in a related but different scenario, or identify a tradeoff/limitation. Do not accept a simple definition as a full answer."
   }
   guidance = level_guidance.get(req.focus_level.lower(), level_guidance["intermediate"])


   prompt = f"""You are a technical tutor generating a quiz question for someone actively watching this video.


Rules:
- Ask about ONE specific, concrete detail that was ACTUALLY mentioned in the transcript below. Do not invent details, and do not ask about topics not present in this transcript.
- Do NOT ask generic questions like "what is this video about" or "what is the main topic."
- The question must only be answerable by someone who watched this specific section.
- Difficulty level "{req.focus_level}": {guidance}
- Keep the question to one sentence.


Transcript (this is the ONLY source of truth for what to ask about):
{recent_text}


Return ONLY valid JSON:
{{
 "topic": "short topic label matching a concept actually mentioned in the transcript above",
 "question": "the question text"
}}"""


   result_text = call_ai(prompt)
   cleaned = clean_json_response(result_text)
   try:
       parsed = json.loads(cleaned)
       return {"result": parsed}
   except json.JSONDecodeError:
       return {"result": result_text}




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


   result_text = call_ai(prompt)
   cleaned = clean_json_response(result_text)
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
       return {"result": result_text, "timestamp": None}
