from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Paper(Base):
    __tablename__ = "papers"
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    title = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

engine = create_engine("sqlite:///./paperprobe.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()