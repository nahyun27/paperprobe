from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from db.sqlite import get_db, Paper
from services.pdf_parser import extract_text_from_pdf, chunk_text
from services.embedder import embed_and_store  # 이게 빠져있었어요!
from db.chroma import delete_collection
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)

    if not text:
        raise HTTPException(status_code=422, detail="텍스트를 추출할 수 없는 PDF입니다.")

    chunks = chunk_text(text)
    paper_id = str(uuid.uuid4())

    stored_count = embed_and_store(paper_id, chunks)  # 이것도 빠져있었어요!
    print(f"[DEBUG] upload complete: {stored_count} chunks stored")

    paper = Paper(id=paper_id, filename=file.filename, title=file.filename.replace(".pdf", ""))
    db.add(paper)
    db.commit()

    return {
        "paper_id": paper_id,
        "filename": file.filename,
        "chunk_count": stored_count,
        "preview": chunks[0][:200] if chunks else ""
    }

@router.get("/papers")
def list_papers(db: Session = Depends(get_db)):
    papers = db.query(Paper).order_by(Paper.uploaded_at.desc()).all()
    return [{"id": p.id, "filename": p.filename, "uploaded_at": p.uploaded_at} for p in papers]

@router.delete("/papers/{paper_id}")
def delete_paper(paper_id: str, db: Session = Depends(get_db)):
    # 1. ChromaDB에서 삭제
    delete_collection(paper_id)
    
    # 2. SQLite에서 삭제
    deleted_count = db.query(Paper).filter(Paper.id == paper_id).delete()
    db.commit()
    
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="논문을 찾을 수 없습니다.")
        
    return {"message": "정상적으로 삭제되었습니다.", "paper_id": paper_id}
