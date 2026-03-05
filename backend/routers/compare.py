from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.comparator import build_comparison_prompt
from typing import List
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

LLM_BACKEND = os.getenv("LLM_BACKEND", "ollama")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

class PaperRef(BaseModel):
    paper_id: str
    title: str

class CompareRequest(BaseModel):
    papers: List[PaperRef]
    question: str = None

def generate_ollama(prompt: str):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
        stream=True
    )
    for line in response.iter_lines():
        if line:
            data = json.loads(line)
            if "response" in data:
                yield data["response"]

def generate_gemini(prompt: str):
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    gemini = genai.GenerativeModel("gemini-2.0-flash")
    response = gemini.generate_content(prompt, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text

@router.post("/compare")
async def compare_papers(req: CompareRequest):
    if len(req.papers) < 2:
        raise HTTPException(status_code=400, detail="비교하려면 논문이 2개 이상 필요합니다.")
    if len(req.papers) > 5:
        raise HTTPException(status_code=400, detail="한 번에 최대 5개 논문까지 비교 가능합니다.")

    papers = [{"paper_id": p.paper_id, "title": p.title} for p in req.papers]
    prompt = build_comparison_prompt(papers, req.question)

    if LLM_BACKEND == "gemini":
        return StreamingResponse(generate_gemini(prompt), media_type="text/plain")
    else:
        return StreamingResponse(generate_ollama(prompt), media_type="text/plain")