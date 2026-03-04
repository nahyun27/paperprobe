import chromadb
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

client = chromadb.PersistentClient(
    path=CHROMA_PERSIST_DIR,
)

def get_collection(paper_id: str):
    return client.get_or_create_collection(
        name=f"paper_{paper_id}",
        metadata={"hnsw:space": "cosine"}
    )

def delete_collection(paper_id: str):
    try:
        client.delete_collection(name=f"paper_{paper_id}")
    except:
        pass

def list_collections():
    return client.list_collections()