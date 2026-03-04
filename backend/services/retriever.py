from db.chroma import get_collection
from services.embedder import embed_query
from typing import List

def retrieve_chunks(paper_id: str, query: str, top_k: int = 5) -> List[str]:
    collection = get_collection(paper_id)
    
    count = collection.count()
    if count == 0:
        return []
    
    actual_k = min(top_k, count)
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=actual_k
    )

    return results["documents"][0] if results["documents"] else []