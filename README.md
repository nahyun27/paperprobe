# 🔍 Paperprobe

> RAG-powered academic paper Q&A system with multi-paper comparison and relationship graph visualization

---

## Overview

Paperprobe는 여러 편의 학술 논문을 업로드하고, 논문 내용을 기반으로 질의응답하거나 논문 간 비교 분석 및 관련도 시각화를 제공하는 RAG(Retrieval-Augmented Generation) 시스템입니다.

---

## Features

- 📥 **PDF Upload** — 여러 논문을 업로드하여 자동으로 텍스트 추출 및 임베딩
- 💬 **Paper Q&A** — 특정 논문을 선택하여 내용 기반 질의응답 (스트리밍 응답)
- ⚖️ **Multi-paper Comparison** — 선택한 논문들의 연구 목적 / 방법론 / 결과 / 한계를 구조화된 표로 비교
- 🕸️ **Relationship Graph** — 논문 간 의미적 유사도를 코사인 거리 기반으로 계산하여 인터랙티브 네트워크 그래프로 시각화
- 🔐 **Prompt Injection Analysis** — RAG 시스템의 보안 취약점(Prompt Injection) 분석 모듈 (WIP)

---

## System Architecture

```
┌─────────────┐        ┌──────────────────────────────────────┐
│  Next.js    │  HTTP  │            FastAPI Backend            │
│  Frontend   │◄──────►│                                      │
│             │        │  ┌────────────┐  ┌────────────────┐  │
│ - Upload    │        │  │ PDF Parser │  │   Embedder     │  │
│ - Chat      │        │  └─────┬──────┘  └───────┬────────┘  │
│ - Compare   │        │        │                 │           │
│ - Graph     │        │  ┌─────▼─────────────────▼────────┐  │
└─────────────┘        │  │         ChromaDB               │  │
                       │  │  (per-paper namespace)         │  │
                       │  └────────────────────────────────┘  │
                       │                                      │
                       │  ┌──────────────┐  ┌─────────────┐  │
                       │  │   SQLite     │  │  Claude API │  │
                       │  │  (metadata)  │  │  (LLM)      │  │
                       │  └──────────────┘  └─────────────┘  │
                       └──────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, D3.js |
| Backend | FastAPI, Python |
| Vector DB | ChromaDB |
| Metadata DB | SQLite + SQLAlchemy |
| Embedding | sentence-transformers |
| LLM | Claude API (Anthropic) |
| PDF Parsing | PyPDF2 |

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

---

## Project Structure

```
paperwise/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── upload.py
│   │   ├── query.py
│   │   ├── compare.py
│   │   └── graph.py
│   ├── services/
│   │   ├── pdf_parser.py
│   │   ├── embedder.py
│   │   ├── retriever.py
│   │   ├── comparator.py
│   │   └── graph_builder.py
│   ├── db/
│   │   ├── chroma.py
│   │   └── sqlite.py
│   └── requirements.txt
├── frontend/
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── compare.tsx
│   │   └── graph.tsx
│   └── components/
├── .env.example
└── README.md
```

---

## Roadmap

- [x] Project structure setup
- [ ] PDF upload & parsing
- [ ] Per-paper embedding & ChromaDB storage
- [ ] Single paper Q&A with streaming
- [ ] Multi-paper comparison
- [ ] Cosine similarity graph (D3.js)
- [ ] Prompt injection vulnerability module
- [ ] README update with demo screenshots

---

## Security Note

본 프로젝트는 RAG 시스템의 **Prompt Injection 취약점**을 분석하는 모듈을 포함합니다. 업로드된 논문 내에 악의적인 지시문이 삽입될 경우 LLM 응답이 조작될 수 있으며, 이에 대한 탐지 및 방어 기법을 함께 구현합니다.

---

## Author

Becky | AI Security Research @ Hanyang University ERICA, ACE-LAB  
GitHub: [paperprobe](https://github.com/your-username/paperprobe)
