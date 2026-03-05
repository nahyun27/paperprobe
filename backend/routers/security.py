from fastapi import APIRouter, HTTPException
from db.chroma import get_collection
from services.injection_detector import detect_injection

router = APIRouter()

@router.get("/security/{paper_id}")
async def analyze_security(paper_id: str):
    collection = get_collection(paper_id)
    existing = collection.get()
    
    if not existing["documents"]:
        raise HTTPException(status_code=404, detail="해당 논문을 찾을 수 없습니다.")
        
    chunks = existing["documents"]
    suspicious_chunks = detect_injection(chunks)
    
    return {
        "paper_id": paper_id,
        "total_chunks": len(chunks),
        "suspicious_chunks": suspicious_chunks,
        "is_safe": len(suspicious_chunks) == 0
    }
