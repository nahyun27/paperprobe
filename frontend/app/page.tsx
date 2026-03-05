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
      <div className="w-72 border-r border-gray-800 flex flex-col p-4 gap-4">
        <h1 className="text-xl font-bold text-white">🔍 Paperprobe</h1>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {uploading ? "업로드 중..." : "+ 논문 업로드"}
        </button>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />

        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {papers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedPaper(p); setMessages([]); }}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedPaper?.id === p.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
              >
                {securityData?.paper_id === p.id && (
                  <span className="mr-1">{securityData.is_safe ? "✓ " : "⚠️ "}</span>
                )}
                📄 {p.filename}
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
          <a href="/compare" className="text-center bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">
            ⚖️ 논문 비교
          </a>
          <a href="/graph" className="text-center bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">
            🕸️ 관계도 그래프
          </a>
          <a href="/security" className="text-center bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">
            🔐 보안 분석
          </a>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 flex flex-col gap-2">
          <h2 className="font-semibold text-gray-200">
            {selectedPaper ? `📄 ${selectedPaper.filename}` : "논문을 선택해주세요"}
          </h2>

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

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              {selectedPaper ? "질문을 입력해보세요" : "왼쪽에서 논문을 선택하거나 업로드해주세요"}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-100"
                }`}>
                {m.content || (loading ? "▋" : "")}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-800 px-6 py-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={selectedPaper ? "논문에 대해 질문해보세요..." : "논문을 먼저 선택해주세요"}
            disabled={!selectedPaper || loading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!selectedPaper || loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-3 rounded-xl text-sm font-medium"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}