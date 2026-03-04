from sentence_transformers import SentenceTransformer
from db.chroma import get_collection
from typing import List

# 모델 로드 (처음 실행 시 자동 다운로드 ~90MB)
model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_and_store(paper_id: str, chunks: List[str]) -> int:
    """청크 리스트를 임베딩해서 ChromaDB에 저장"""
    collection = get_collection(paper_id)

    # 기존 데이터 초기화 (재업로드 대비)
    existing = collection.get()
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    # 임베딩 생성
    embeddings = model.encode(chunks).tolist()

    # ChromaDB에 저장
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"{paper_id}_chunk_{i}" for i in range(len(chunks))]
    )

    return len(chunks)

def embed_query(query: str) -> List[float]:
    """질문을 임베딩으로 변환"""
    return model.encode([query])[0].tolist()