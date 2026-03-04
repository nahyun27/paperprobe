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
- Anthropic API Key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# .env에 ANTHROPIC_API_KEY 입력
uvicorn main:app --reload
```

### Frontend Setup

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
