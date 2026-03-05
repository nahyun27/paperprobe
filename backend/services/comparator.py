from services.retriever import retrieve_chunks
from typing import List

def build_comparison_prompt(papers: List[dict], question: str = None) -> str:
    sections = []
    for p in papers:
        chunks = retrieve_chunks(p["paper_id"], question or "main contribution methodology results")
        content = "\n".join(chunks[:3])
        sections.append(f"=== 논문: {p['title']} ===\n{content}")

    combined = "\n\n".join(sections)
    return f"""다음은 여러 논문의 내용입니다:

{combined}

위 논문들을 아래 기준으로 비교 분석해주세요:
1. 연구 목적 (Research Goal)
2. 방법론 (Methodology)
3. 주요 결과 (Key Results)
4. 한계점 (Limitations)

각 항목별로 논문들을 비교하여 명확하게 설명해주세요."""