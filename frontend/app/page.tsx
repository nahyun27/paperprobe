"use client";
import { useState, useEffect, useRef } from "react";
import { uploadPaper, getPapers, queryPaper } from "@/lib/api";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
            <button
              key={p.id}
              onClick={() => { setSelectedPaper(p); setMessages([]); }}
              className={`text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                selectedPaper?.id === p.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              📄 {p.filename}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
          <a href="/compare" className="text-center bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">
            ⚖️ 논문 비교
          </a>
          <a href="/graph" className="text-center bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">
            🕸️ 관계도 그래프
          </a>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4">
          <h2 className="font-semibold text-gray-200">
            {selectedPaper ? `📄 ${selectedPaper.filename}` : "논문을 선택해주세요"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              {selectedPaper ? "질문을 입력해보세요" : "왼쪽에서 논문을 선택하거나 업로드해주세요"}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
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