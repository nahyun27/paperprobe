"use client";
import { useState, useEffect, useRef } from "react";
import { uploadPaper, getPapers, queryPaper, deletePaper, analyzeSecurity } from "@/lib/api";

interface Paper {
  id: string;
  filename: string;
  uploaded_at: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [securityData, setSecurityData] = useState<any>(null);
  const [expandedBanner, setExpandedBanner] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedPaper) {
      setSecurityData(null);
      setExpandedBanner(false);
      analyzeSecurity(selectedPaper.id).then(setSecurityData).catch(console.error);
    }
  }, [selectedPaper]);

  async function fetchPapers() {
    const data = await getPapers();
    setPapers(data);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadPaper(file);
      await fetchPapers();
    } catch (err) {
      alert("업로드 실패: " + err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !selectedPaper || loading) return;
    const question = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    let answer = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await queryPaper(selectedPaper.id, question, (chunk) => {
      answer += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: answer };
        return updated;
      });
    });
    setLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm("정말 이 논문을 삭제하시겠습니까?")) return;
    try {
      await deletePaper(id);
      if (selectedPaper?.id === id) {
        setSelectedPaper(null);
        setMessages([]);
      }
      await fetchPapers();
    } catch (err) {
      alert("삭제 실패: " + err);
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* 사이드바 */}
      <div className="w-72 border-r border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col p-4 gap-4">
        <h1 className="text-xl font-bold text-white">🔍 Paperprobe</h1>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {uploading ? "업로드 중..." : "+ 논문 업로드"}
        </button>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {papers.map((p) => (
            <div
              key={p.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer ${selectedPaper?.id === p.id
                  ? "bg-blue-600/20 border-l-2 border-blue-400 text-blue-100"
                  : "bg-gray-800/50 hover:bg-gray-700/70 hover:border-l-2 hover:border-blue-500 hover:translate-x-1"
                }`}
              onClick={() => { setSelectedPaper(p); setMessages([]); }}
            >
              <div className="flex-1 text-sm truncate flex items-center">
                {securityData?.paper_id === p.id && (
                  <span className="mr-1 inline-block">{securityData.is_safe ? "✓ " : "⚠️ "}</span>
                )}
                <span className="mr-1">📄</span> {p.filename}
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

        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <a href="/compare" className="text-center bg-gray-800/50 hover:bg-gray-700 hover:scale-105 transition-all duration-150 cursor-pointer py-2.5 rounded-xl text-sm font-medium">
            <span className="mr-2 opacity-80">⚖️</span> 논문 비교
          </a>
          <a href="/graph" className="text-center bg-gray-800/50 hover:bg-gray-700 hover:scale-105 transition-all duration-150 cursor-pointer py-2.5 rounded-xl text-sm font-medium">
            <span className="mr-2 opacity-80">🕸️</span> 관계도 그래프
          </a>
          <a href="/security" className="text-center bg-gray-800/50 hover:bg-gray-700 hover:scale-105 transition-all duration-150 cursor-pointer py-2.5 rounded-xl text-sm font-medium">
            <span className="mr-2 opacity-80">🔐</span> 보안 분석
          </a>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="border-b border-gray-800 px-6 py-4 flex flex-col gap-2 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-200">
              {selectedPaper ? `📄 ${selectedPaper.filename}` : "논문을 선택해주세요"}
            </h2>
            {selectedPaper && (
              <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-xs font-bold rounded-md border border-blue-800/50">
                RAG
              </span>
            )}
          </div>

          {selectedPaper && securityData && (
            <div className="text-sm">
              {securityData.is_safe ? (
                <div className="w-full bg-green-900/40 text-green-400 p-2 rounded flex items-center gap-2">
                  <span>✓ 안전한 논문입니다</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setExpandedBanner(!expandedBanner)}
                    className="w-full bg-red-900/40 hover:bg-red-900/60 transition-colors text-red-400 p-2 rounded text-left flex items-center justify-between"
                  >
                    <span>⚠️ {securityData.suspicious_chunks.length}개의 의심스러운 구문이 감지됐습니다 (클릭하여 확인)</span>
                    <span>{expandedBanner ? "▲" : "▼"}</span>
                  </button>

                  {expandedBanner && (
                    <div className="bg-red-950/50 rounded flex flex-col gap-2 p-2 max-h-48 overflow-y-auto">
                      {securityData.suspicious_chunks.map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-900 p-3 rounded text-xs text-gray-200 flex flex-col gap-1 border border-red-900/30">
                          <div className="flex justify-between items-center text-red-400 mb-1">
                            <span>Score: {item.max_similarity.toFixed(3)}</span>
                            <span className="uppercase px-1.5 py-0.5 bg-red-900/60 rounded">{item.risk_level}</span>
                          </div>
                          <div>{item.chunk_text.slice(0, 200)}...</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-32 flex flex-col items-center gap-4">
              <span className="text-4xl opacity-50">{selectedPaper ? "💬" : "📝"}</span>
              <p>{selectedPaper ? "이 논문에 대해 자유롭게 질문해보세요!" : "왼쪽에서 논문을 선택하거나 새 논문을 업로드해주세요."}</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-3xl px-5 py-4 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${m.role === "user"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-tr-sm"
                : "bg-gray-800/80 backdrop-blur-md text-gray-100 rounded-2xl rounded-tl-sm border border-gray-700/50"
                }`}>
                {m.content}
                {loading && m.role === "assistant" && !m.content && (
                  <div className="flex gap-1.5 items-center py-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>

        <div className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-lg px-6 py-4 flex gap-3 pb-8">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={selectedPaper ? "논문에 대해 질문해보세요..." : "논문을 먼저 선택해주세요"}
            disabled={!selectedPaper || loading}
            className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:bg-gray-800 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!selectedPaper || loading || !input.trim()}
            className={`px-6 py-3.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${!selectedPaper || loading || !input.trim()
                ? "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
              }`}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}