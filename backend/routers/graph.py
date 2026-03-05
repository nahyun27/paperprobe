from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.graph_builder import build_similarity_graph
from typing import List

router = APIRouter()

class PaperRef(BaseModel):
    paper_id: str
    title: str

class GraphRequest(BaseModel):
    papers: List[PaperRef]

@router.post("/graph")
def get_similarity_graph(req: GraphRequest):
    if len(req.papers) < 2:
        raise HTTPException(status_code=400, detail="그래프 생성에 논문이 2개 이상 필요합니다.")

    papers = [{"paper_id": p.paper_id, "title": p.title} for p in req.papers]
    graph = build_similarity_graph(papers)

    return graph