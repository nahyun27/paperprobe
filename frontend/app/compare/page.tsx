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

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {papers.map((p) => (
            <div
              key={p.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer ${selected.has(p.id)
                  ? "bg-blue-600/10 border border-blue-500/50 text-blue-100"
                  : "bg-gray-800/50 hover:bg-gray-700/70 border border-transparent"
                }`}
              onClick={() => togglePaper(p.id)}
            >
              <div className="flex-1 text-sm truncate flex items-center">
                <span className={`mr-2 flex items-center justify-center w-4 h-4 rounded-sm border transition-colors ${selected.has(p.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-600 border-gray-500/50'}`}>
                  {selected.has(p.id) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </span>
                📄 {p.filename}
              </div>
              <button
                onClick={(e) => handleDelete(e, p.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-all"
                title="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
          <label className="text-xs font-semibold text-gray-400">비교 기준 (수정 가능)</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <button
            onClick={handleCompare}
            disabled={selected.size < 2 || loading}
            className={`py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${selected.size < 2 || loading
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
              }`}
          >
            {loading ? "비교 분석 중..." : `${selected.size}개 논문 비교하기`}
          </button>
        </div>
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="border-b border-gray-800 px-6 py-4 shadow-sm z-10 flex items-center gap-3">
          <h2 className="font-semibold text-gray-200">비교 분석 결과</h2>
          {selected.size > 0 && (
            <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-xs font-bold rounded-md border border-blue-800/50">
              {selected.size} papers
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 p-6">
          {result ? (
            <div className="max-w-4xl mx-auto bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl px-8 py-6 text-[15px] whitespace-pre-wrap leading-relaxed shadow-sm text-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {result}
              {loading && <span className="animate-pulse ml-1 text-blue-400">▍</span>}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-32 flex flex-col items-center gap-4">
              <span className="text-4xl opacity-50">⚖️</span>
              <p>
                {selected.size < 2
                  ? "왼쪽 패널에서 비교할 논문을 2개 이상 선택해주세요."
                  : "하단의 '논문 비교하기' 버튼을 눌러 분석을 시작하세요."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}