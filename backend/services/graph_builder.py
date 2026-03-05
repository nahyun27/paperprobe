import numpy as np
from db.chroma import get_collection
from typing import List

def get_paper_embedding(paper_id: str) -> np.ndarray:
    """논문의 모든 청크 임베딩을 평균내서 대표 벡터 반환"""
    collection = get_collection(paper_id)
    result = collection.get(include=["embeddings"])

    if not result["embeddings"]:
        return None

    embeddings = np.array(result["embeddings"])
    return embeddings.mean(axis=0)

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """코사인 유사도 계산"""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def build_similarity_graph(papers: List[dict]) -> dict:
    """
    papers: [{"paper_id": ..., "title": ...}, ...]
    반환: {"nodes": [...], "edges": [...]}
    """
    # 각 논문 임베딩 계산
    embeddings = {}
    for p in papers:
        emb = get_paper_embedding(p["paper_id"])
        if emb is not None:
            embeddings[p["paper_id"]] = emb

    nodes = [
        {"id": p["paper_id"], "title": p["title"]}
        for p in papers
        if p["paper_id"] in embeddings
    ]

    # 모든 논문 쌍의 유사도 계산
    edges = []
    ids = list(embeddings.keys())
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            sim = cosine_similarity(embeddings[ids[i]], embeddings[ids[j]])
            if sim > 0.3:  # 유사도 0.3 이상만 엣지로 표시
                edges.append({
                    "source": ids[i],
                    "target": ids[j],
                    "similarity": round(sim, 3)
                })

    return {"nodes": nodes, "edges": edges}