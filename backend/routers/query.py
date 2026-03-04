from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.retriever import retrieve_chunks
from typing import List
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

router = APIRouter()

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

@router.post("/query")
async def query_paper(req: QueryRequest):
    chunks = retrieve_chunks(req.paper_id, req.question)

    if not chunks:
        raise HTTPException(status_code=404, detail="해당 논문을 찾을 수 없습니다.")

    prompt = build_prompt(chunks, req.question)

    def generate():
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text

    return StreamingResponse(generate(), media_type="text/plain")