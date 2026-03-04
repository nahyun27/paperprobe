from sentence_transformers import SentenceTransformer
from db.chroma import get_collection
from typing import List

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_and_store(paper_id: str, chunks: List[str]) -> int:
    collection = get_collection(paper_id)

    existing = collection.get()
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    embeddings = model.encode(chunks).tolist()

    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"{paper_id}_chunk_{i}" for i in range(len(chunks))]
    )

    count = collection.count()
    print(f"[DEBUG] paper_id={paper_id}, stored={count} chunks")  # 확인용

    return count

def embed_query(query: str) -> List[float]:
    return model.encode([query])[0].tolist()