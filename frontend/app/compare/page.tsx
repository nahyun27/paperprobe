"use client";
import { useState, useEffect } from "react";
import { getPapers, comparePapers, deletePaper } from "@/lib/api";
import Link from "next/link";

interface Paper {
  id: string;
  filename: string;
}

export default function ComparePage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("main contribution, methodology, results, limitations");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPapers().then(setPapers);
  }, []);

  function togglePaper(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  }

  async function handleCompare() {
    if (selected.size < 2 || loading) return;
    setResult("");
    setLoading(true);

    const selectedPapers = papers
      .filter((p) => selected.has(p.id))
      .map((p) => ({ paper_id: p.id, title: p.filename }));

    await comparePapers(selectedPapers, question, (chunk) => {
      setResult((prev) => prev + chunk);
    });

    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm("정말 이 논문을 삭제하시겠습니까?")) return;
    try {
      await deletePaper(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const data = await getPapers();
      setPapers(data);
    } catch (err) {
      alert("삭제 실패: " + err);
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* 사이드바 */}
      <div className="w-72 border-r border-gray-800 flex flex-col p-4 gap-4">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
          ← 돌아가기
        </Link>
        <h1 className="text-xl font-bold">⚖️ 논문 비교</h1>
        <p className="text-xs text-gray-400">최대 5개 선택 가능</p>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {papers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <button
                onClick={() => togglePaper(p.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selected.has(p.id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
              >
                {selected.has(p.id) ? "✓ " : ""}📄 {p.filename}
              </button>
              <button
                onClick={(e) => handleDelete(e, p.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <label className="text-xs text-gray-400">비교 기준 (수정 가능)</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCompare}
            disabled={selected.size < 2 || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "비교 중..." : `${selected.size}개 논문 비교`}
          </button>
        </div>
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4">
          <h2 className="font-semibold text-gray-200">비교 결과</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {result ? (
            <div className="bg-gray-800 rounded-2xl px-6 py-5 text-sm whitespace-pre-wrap leading-relaxed text-gray-100">
              {result}
              {loading && <span className="animate-pulse">▋</span>}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              {selected.size < 2
                ? "왼쪽에서 논문을 2개 이상 선택해주세요"
                : "비교 버튼을 눌러주세요"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}