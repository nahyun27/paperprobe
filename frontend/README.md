# 🔍 Paperprobe

> RAG-powered academic paper Q&A system with multi-paper comparison, relationship graph visualization, and prompt injection vulnerability analysis

---

## Overview

Paperprobe는 학술 논문 PDF를 업로드하고, 논문 내용 기반의 질의응답 · 논문 간 비교 분석 · 유사도 그래프 시각화 · 보안 취약점 분석을 제공하는 RAG(Retrieval-Augmented Generation) 시스템입니다.

---

## Features

- 📥 **PDF Upload & Parsing** — 논문 업로드 시 자동 텍스트 추출, 청킹, 임베딩 저장
- 💬 **Paper Q&A** — 논문 내용 기반 질의응답 (스트리밍 응답)
- ⚖️ **Multi-paper Comparison** — 최대 5개 논문의 연구 목적 / 방법론 / 결과 / 한계 비교
- 🕸️ **Relationship Graph** — 논문 간 코사인 유사도 기반 인터랙티브 네트워크 그래프 (D3.js)
- 🔐 **Prompt Injection Detection** — 시맨틱 유사도 기반 악성 지시문 탐지 및 방어 (한/영 지원)
- 🗑️ **Paper Management** — 논문 목록 조회 및 삭제

---

## System Architecture

```
┌─────────────────┐        ┌──────────────────────────────────────────┐
│   Next.js       │  HTTP  │             FastAPI Backend              │
│   Frontend      │◄──────►│                                          │
│                 │        │  ┌─────────────┐  ┌──────────────────┐   │
│ - Upload/Delete │        │  │  PDF Parser │  │    Embedder      │   │
│ - Chat (Q&A)    │        │  │ (pdfplumber)│  │(all-MiniLM-L6-v2)│   │
│ - Compare       │        │  └──────┬──────┘  └────────┬─────────┘   │
│ - Graph (D3.js) │        │         │                  │             │
│ - Security      │        │  ┌──────▼──────────────────▼──────────┐  │
└─────────────────┘        │  │           ChromaDB                 │  │
                           │  │     (per-paper collection)         │  │
                           │  └────────────────────────────────────┘  │
                           │                                          │
                           │  ┌──────────────┐  ┌──────────────────┐  │
                           │  │   SQLite     │  │  LLM Backend     │  │
                           │  │  (metadata)  │  │ Ollama / Gemini  │  │
                           │  └──────────────┘  └──────────────────┘  │
                           └──────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS, D3.js |
| Backend | FastAPI, Python 3.10 |
| Vector DB | ChromaDB 0.4.24 |
| Metadata DB | SQLite + SQLAlchemy |
| Embedding | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Ollama (llama3.2) / Gemini API |
| PDF Parsing | pdfplumber |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- LLM Backend (둘 중 하나 선택)
  - **Ollama** (무료, 로컬 실행) — 권장
  - **Gemini API Key** (Google AI Studio에서 발급)

---

### 1. LLM 백엔드 설정

#### Option A — Ollama (무료, 권장)

[https://ollama.com/download](https://ollama.com/download) 참고하거나 아래 명령어로 설치:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

모델 다운로드:

```bash
ollama pull llama3.2
```

#### Option B — Gemini API

[https://aistudio.google.com](https://aistudio.google.com) 에서 API 키 발급 후 `.env` 에 입력.

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# .env 파일에서 LLM_BACKEND, API 키 등 설정
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

접속: [http://localhost:3000](http://localhost:3000)
API 문서: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Environment Variables

```env
# LLM 설정
LLM_BACKEND=ollama          # "ollama" 또는 "gemini"
OLLAMA_MODEL=llama3.2       # Ollama 사용 시 모델명
GEMINI_API_KEY=your_key     # Gemini 사용 시 API 키

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db
ANONYMIZED_TELEMETRY=False
```

---

## Project Structure

```
paperprobe/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── upload.py          # POST /api/upload, GET/DELETE /api/papers
│   │   ├── query.py           # POST /api/query (streaming)
│   │   ├── compare.py         # POST /api/compare (streaming, max 5)
│   │   ├── graph.py           # POST /api/graph
│   │   └── security.py        # GET /api/security/{paper_id}
│   ├── services/
│   │   ├── pdf_parser.py      # 텍스트 추출 및 청킹
│   │   ├── embedder.py        # 임베딩 생성 및 ChromaDB 저장
│   │   ├── retriever.py       # 유사 청크 검색
│   │   ├── comparator.py      # 다중 논문 비교 프롬프트 생성
│   │   ├── graph_builder.py   # 코사인 유사도 계산
│   │   └── injection_detector.py  # 시맨틱 기반 Prompt Injection 탐지
│   ├── db/
│   │   ├── chroma.py
│   │   └── sqlite.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # 메인 Q&A 페이지
│   │   ├── compare/page.tsx   # 논문 비교 페이지
│   │   ├── graph/page.tsx     # 관계도 그래프 페이지
│   │   └── security/page.tsx  # 보안 분석 페이지
│   └── lib/
│       └── api.ts             # API 호출 함수 모음
├── .env.example
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | PDF 논문 업로드 |
| GET | `/api/papers` | 업로드된 논문 목록 조회 |
| DELETE | `/api/papers/{paper_id}` | 논문 삭제 |
| POST | `/api/query` | 단일 논문 질의응답 (스트리밍) |
| POST | `/api/compare` | 다중 논문 비교 (스트리밍) |
| POST | `/api/graph` | 논문 유사도 그래프 생성 |
| GET | `/api/security/{paper_id}` | Prompt Injection 취약점 분석 |

---

## Security Note

본 프로젝트는 RAG 시스템의 **Prompt Injection 취약점**을 연구 목적으로 분석합니다.

- **탐지**: 단순 패턴 매칭이 아닌 `all-MiniLM-L6-v2` 임베딩 기반 **시맨틱 유사도**로 악성 지시문 탐지 → 한국어/영어 모두 지원
- **방어**: 모든 RAG 쿼리에 시스템 방어 문구를 자동 삽입하여 논문 내 악성 명령 실행 차단
- **시각화**: 탐지된 의심 청크를 위험도(high/medium/low)별로 UI에서 확인 가능

---

## Author

Becky | AI Security Research @ Hanyang University ERICA, ACE-LAB
GitHub: [paperprobe](https://github.com/kimnahyun/paperprobe)
