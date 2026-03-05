# Paperprobe — Backend

FastAPI 기반 백엔드. PDF 파싱, 임베딩, RAG 질의응답, 논문 비교, 유사도 계산, Prompt Injection 탐지를 제공합니다.

---

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.10
- **Vector DB**: ChromaDB 0.4.24
- **Metadata DB**: SQLite + SQLAlchemy
- **Embedding**: sentence-transformers (all-MiniLM-L6-v2)
- **PDF Parsing**: pdfplumber
- **LLM**: Ollama (llama3.2) / Gemini API

---

## Getting Started

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

```bash
cp ../.env.example .env
```

`.env` 파일 수정:

```env
# Ollama 사용 시
LLM_BACKEND=ollama
OLLAMA_MODEL=llama3.2

# Gemini 사용 시
LLM_BACKEND=gemini
GEMINI_API_KEY=your_key_here

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db
ANONYMIZED_TELEMETRY=False
```

### 4. LLM 백엔드 설정

#### Option A — Ollama (무료, 권장)

```bash
# 설치
curl -fsSL https://ollama.com/install.sh | sh

# 모델 다운로드 (~2GB)
ollama pull llama3.2

# 서버 실행 (백그라운드)
brew services start ollama  # Mac
# 또는
ollama serve &
```

#### Option B — Gemini API

[https://aistudio.google.com](https://aistudio.google.com) 에서 API 키 발급 후 `.env` 에 입력.

### 5. 서버 실행

```bash
uvicorn main:app --reload
```

API 문서: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Project Structure

```
backend/
├── main.py                        # FastAPI 앱, CORS, 라우터 등록
├── routers/
│   ├── upload.py                  # POST /api/upload, GET/DELETE /api/papers
│   ├── query.py                   # POST /api/query (스트리밍)
│   ├── compare.py                 # POST /api/compare (스트리밍, 최대 5개)
│   ├── graph.py                   # POST /api/graph
│   └── security.py                # GET /api/security/{paper_id}
├── services/
│   ├── pdf_parser.py              # pdfplumber로 텍스트 추출 및 청킹
│   ├── embedder.py                # 임베딩 생성 및 ChromaDB 저장
│   ├── retriever.py               # 질문 임베딩 후 유사 청크 검색 (top-k=5)
│   ├── comparator.py              # 다중 논문 비교 프롬프트 생성
│   ├── graph_builder.py           # 논문별 평균 임베딩으로 코사인 유사도 계산
│   └── injection_detector.py      # 시맨틱 유사도 기반 Prompt Injection 탐지
├── db/
│   ├── chroma.py                  # ChromaDB PersistentClient
│   └── sqlite.py                  # Paper 모델 (id, filename, title, uploaded_at)
└── requirements.txt
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

## Key Implementation Details

### PDF 청킹
- 500 단어 단위로 청킹, 50 단어 오버랩
- 논문당 평균 20~30개 청크 생성

### ChromaDB 구조
- 논문마다 별도 collection: `paper_{paper_id}`
- 업로드 시 자동 임베딩 및 저장
- 삭제 시 collection 전체 삭제

### LLM 전환
`.env` 의 `LLM_BACKEND` 값으로 런타임 전환:
- `ollama`: 로컬 Ollama 서버 사용
- `gemini`: Google Gemini API 사용

### Prompt Injection 탐지
- 한/영 혼합 공격 예시 문장 18개를 `all-MiniLM-L6-v2` 로 임베딩 후 캐싱
- 각 청크와의 코사인 유사도 계산
- 임계값: `>= 0.7` → high, `>= 0.5` → medium, `>= 0.35` → low
- 모든 쿼리에 방어 문구 자동 삽입

---

## Troubleshooting

**ChromaDB telemetry 경고 무시**
```
Failed to send telemetry event: capture() takes 1 positional argument but 3 were given
```
기능에 영향 없음. `.env` 에 `ANONYMIZED_TELEMETRY=False` 추가하면 억제 가능.

**Ollama 모델 에러 (`wrong number of tensors`)**
brew로 설치한 Ollama 버전 문제. 공식 스크립트로 재설치:
```bash
brew uninstall ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
```

**DB 초기화**
```bash
rm -rf chroma_db paperprobe.db
uvicorn main:app --reload
```
