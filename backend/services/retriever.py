from db.chroma import get_collection
from services.embedder import embed_query
from typing import List

def retrieve_chunks(paper_id: str, query: str, top_k: int = 5) -> List[str]:
    """질문과 가장 유사한 청크 top_k개 반환"""
    collection = get_collection(paper_id)
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count())
    )

    return results["documents"][0] if results["documents"] else []