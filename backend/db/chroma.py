import chromadb
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

def get_collection(paper_id: str):
    # 논문마다 별도 collection 생성 (없으면 자동 생성)
    return client.get_or_create_collection(
        name=f"paper_{paper_id}",
        metadata={"hnsw:space": "cosine"}  # 유사도 계산 방식
    )

def delete_collection(paper_id: str):
    try:
        client.delete_collection(name=f"paper_{paper_id}")
    except:
        pass

def list_collections():
    return client.list_collections()