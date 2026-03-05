"use client";
import { useState, useEffect } from "react";
import { getPapers, analyzeSecurity } from "@/lib/api";
import Link from "next/link";

interface Paper {
  id: string;
  filename: string;
}

export default function SecurityPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(false);
  const [securityData, setSecurityData] = useState<any>(null);

  useEffect(() => {
    getPapers().then(setPapers);
  }, []);

  async function handleAnalyze() {
    if (!selectedPaper || loading) return;
    setLoading(true);
    try {
      const result = await analyzeSecurity(selectedPaper.id);
      setSecurityData(result);
    } catch (err) {
      alert("분석 실패: " + err);
    } finally {
      setLoading(false);
    }
  }

  function getBadgeColor(level: string) {
    if (level === "high") return "bg-red-900 text-red-100 border-red-700";
    if (level === "medium") return "bg-yellow-900 text-yellow-100 border-yellow-700";
    return "bg-blue-900 text-blue-100 border-blue-700";
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* 사이드바 */}
      <div className="w-72 border-r border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col p-4 gap-4">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 w-fit transition-colors">
          <span>←</span> 홈으로 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-white">🔐 보안 분석</h1>
        <p className="text-xs text-gray-400 leading-relaxed">데이터를 스캔하여 프롬프트 인젝션 취약점을 탐지합니다.</p>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 mt-2 pr-1">
          {papers.map((p) => (
            <div
              key={p.id}
              onClick={() => { setSelectedPaper(p); setSecurityData(null); }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer ${selectedPaper?.id === p.id
                  ? "bg-blue-600/20 border-l-2 border-blue-400 text-blue-100"
                  : "bg-gray-800/50 hover:bg-gray-700/70 hover:border-l-2 hover:border-blue-500 hover:translate-x-1"
                }`}
            >
              <div className="flex-1 text-sm truncate flex items-center">
                <span className="mr-1">📄</span> {p.filename}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-5 pb-2">
          <button
            onClick={handleAnalyze}
            disabled={!selectedPaper || loading}
            className={`w-full py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${!selectedPaper || loading
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
              }`}
          >
            {loading ? "분석 스캔 중..." : `보안 검사 실행`}
          </button>
        </div>
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="border-b border-gray-800 px-6 py-4 shadow-sm z-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-200">
              {selectedPaper ? `[${selectedPaper.filename}] 분석 결과` : "논문을 선택해주세요"}
            </h2>
            {selectedPaper && securityData && (
              <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${securityData.is_safe ? "bg-green-900/40 text-green-400 border-green-800/50" : "bg-red-900/40 text-red-400 border-red-800/50"
                }`}>
                {securityData.is_safe ? "SAFE" : "VULNERABLE"}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 p-6">
          {!securityData && !loading && (
            <div className="text-center text-gray-500 mt-32 flex flex-col items-center gap-4">
              <span className="text-5xl opacity-30">🛡️</span>
              <p className="max-w-sm leading-relaxed">분석할 논문을 왼쪽 패널에서 선택하고 '<span className="font-medium text-gray-400">보안 검사 실행</span>'을 눌러주세요.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center mt-32 text-gray-400 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="tracking-wide">보안 분석 엔진이 데이터를 스캔 중입니다...</span>
            </div>
          )}

          {securityData && !loading && (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* 요약 카드 */}
              <div className={`p-6 rounded-2xl border ${securityData.is_safe ? 'bg-green-950/20 border-green-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{securityData.is_safe ? "✅" : "⚠️"}</span>
                  <h3 className="text-xl font-bold">
                    {securityData.is_safe ? "안전한 논문" : "의심스러운 문구 발견"}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-900 p-4 rounded-xl">
                    <div className="text-sm text-gray-400">전체 청크</div>
                    <div className="text-2xl font-semibold mt-1">{securityData.total_chunks}개</div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-xl">
                    <div className="text-sm text-gray-400">안전한 청크</div>
                    <div className="text-2xl font-semibold mt-1 text-green-400">
                      {securityData.total_chunks - securityData.suspicious_chunks.length}개
                    </div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-xl">
                    <div className="text-sm text-gray-400">의심 청크</div>
                    <div className="text-2xl font-semibold mt-1 text-red-400">
                      {securityData.suspicious_chunks.length}개
                    </div>
                  </div>
                </div>
              </div>

              {/* 의심 목록 */}
              {!securityData.is_safe && (
                <div className="mt-4 flex flex-col gap-4">
                  <h3 className="font-semibold text-lg text-gray-300">탐지된 문구 ({securityData.suspicious_chunks.length}건)</h3>
                  <div className="grid gap-4">
                    {securityData.suspicious_chunks.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-800 border border-gray-700 p-5 rounded-xl flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                          <span className="text-sm text-gray-400">Chunk ID: {item.chunk_index}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">유사도: <span className="text-blue-400">{item.max_similarity.toFixed(3)}</span></span>
                            <span className={`px-2 py-1 text-xs uppercase font-bold rounded border ${getBadgeColor(item.risk_level)}`}>
                              {item.risk_level} RISK
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 leading-relaxed bg-gray-900 p-4 rounded-lg">
                          {item.chunk_text.slice(0, 200)}
                          {item.chunk_text.length > 200 ? "..." : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
