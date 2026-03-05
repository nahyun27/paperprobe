from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.retriever import retrieve_chunks
from services.injection_detector import sanitize_prompt
from typing import List, Optional
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

LLM_BACKEND = os.getenv("LLM_BACKEND", "ollama")  # "ollama" or "gemini"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

class QueryRequest(BaseModel):
    paper_id: str
    question: str

def build_prompt(chunks: List[str], question: str) -> str:
    context = "\n\n---\n\n".join(chunks)
    return f"""아래는 논문의 관련 내용입니다:

{context}

위 내용을 바탕으로 다음 질문에 답해주세요:
{question}

논문에 없는 내용은 추측하지 말고, 모르면 모른다고 해주세요."""

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

@router.post("/query")
async def query_paper(req: QueryRequest):
    chunks = retrieve_chunks(req.paper_id, req.question)

    if not chunks:
        raise HTTPException(status_code=404, detail="해당 논문을 찾을 수 없습니다.")

    prompt = build_prompt(chunks, req.question)
    safe_prompt = sanitize_prompt(prompt)

    if LLM_BACKEND == "gemini":
        return StreamingResponse(generate_gemini(safe_prompt), media_type="text/plain")
    else:
        return StreamingResponse(generate_ollama(safe_prompt), media_type="text/plain")