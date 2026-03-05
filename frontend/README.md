# Paperprobe — Frontend

Next.js 기반 프론트엔드. 논문 Q&A, 비교 분석, 유사도 그래프, 보안 분석 UI를 제공합니다.

---

## Demo

### 📄 Paper Q&A
![Q&A Demo](assets/demo_qa.gif)

### ⚖️ Multi-paper Comparison
![Compare Demo](assets/demo_compare.gif)

### 🕸️ Relationship Graph
![Graph Demo](assets/demo_graph.gif)

### 🔐 Prompt Injection Detection
![Security Demo](assets/demo_security.gif)



## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Graph**: D3.js
- **API**: Fetch API (스트리밍 지원)

---

## Pages

| 경로 | 설명 |
|------|------|
| `/` | 논문 업로드 · 선택 · Q&A 채팅 |
| `/compare` | 다중 논문 비교 분석 (최대 5개) |
| `/graph` | 논문 유사도 네트워크 그래프 |
| `/security` | Prompt Injection 보안 분석 |

---

## Getting Started

### 1. 패키지 설치

```bash
npm install
```

### 2. D3.js 설치

```bash
npm install d3
npm install --save-dev @types/d3
```

### 3. 개발 서버 실행

```bash
npm run dev
```

접속: [http://localhost:3000](http://localhost:3000)

> 백엔드가 `http://localhost:8000` 에서 실행 중이어야 합니다. 백엔드 설정은 루트 `README.md` 참고.

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx               # 메인 Q&A 페이지
│   ├── compare/
│   │   └── page.tsx           # 논문 비교 페이지
│   ├── graph/
│   │   └── page.tsx           # 관계도 그래프 (D3.js)
│   └── security/
│       └── page.tsx           # 보안 분석 페이지
└── lib/
    └── api.ts                 # 백엔드 API 호출 함수 모음
```

---

## API Functions (`lib/api.ts`)

| 함수 | 설명 |
|------|------|
| `uploadPaper(file)` | PDF 업로드 |
| `getPapers()` | 논문 목록 조회 |
| `deletePaper(paper_id)` | 논문 삭제 |
| `queryPaper(paper_id, question, onChunk)` | Q&A 스트리밍 |
| `comparePapers(papers, question, onChunk)` | 비교 분석 스트리밍 |
| `getSimilarityGraph(papers)` | 유사도 그래프 데이터 |
| `analyzeSecurity(paper_id)` | 보안 분석 |

---

## Environment

백엔드 주소는 `lib/api.ts` 의 `BASE_URL` 에서 변경:

```typescript
const BASE_URL = "http://localhost:8000/api";
```

배포 시 환경변수로 관리하려면:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
```

`.env.local` 생성:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```
