from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.retriever import retrieve_chunks
from typing import List
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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

    # 스트리밍 응답 생성기
    def generate():
        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            for text in stream.text_stream:
                yield text

    return StreamingResponse(generate(), media_type="text/plain")