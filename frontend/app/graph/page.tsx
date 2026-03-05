"use client";
import { useState, useEffect, useRef } from "react";
import { getPapers, getSimilarityGraph, deletePaper } from "@/lib/api";
import Link from "next/link";
import * as d3 from "d3";

interface Paper {
  id: string;
  filename: string;
}

interface GraphNode {
  id: string;
  title: string;
}

interface GraphEdge {
  source: string;
  target: string;
  similarity: number;
}

export default function GraphPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasGraph, setHasGraph] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    getPapers().then(setPapers);
  }, []);

  function togglePaper(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (selected.size < 2 || loading) return;
    setLoading(true);

    const selectedPapers = papers
      .filter((p) => selected.has(p.id))
      .map((p) => ({ paper_id: p.id, title: p.filename }));

    const graph = await getSimilarityGraph(selectedPapers);
    setLoading(false);
    setHasGraph(true);
    setTimeout(() => drawGraph(graph.nodes, graph.edges), 100);
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

  function drawGraph(nodes: GraphNode[], edges: GraphEdge[]) {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>().on("zoom", (e) => {
        g.attr("transform", e.transform);
      }) as any
    );

    const simulation = d3
      .forceSimulation(nodes as any)
      .force("link", d3.forceLink(edges as any)
        .id((d: any) => d.id)
        .distance((d: any) => (1 - d.similarity) * 300))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g.append("g").selectAll("line").data(edges).join("line")
      .attr("stroke", "#4B5563")
      .attr("stroke-width", (d) => d.similarity * 4)
      .attr("stroke-opacity", 0.8);

    const linkLabel = g.append("g").selectAll("text").data(edges).join("text")
      .text((d) => d.similarity.toFixed(2))
      .attr("fill", "#9CA3AF")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle");

    const node = g.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", 28)
      .attr("fill", "#2563EB")
      .attr("stroke", "#60A5FA")
      .attr("stroke-width", 2)
      .call(
        d3.drag<SVGCircleElement, any>()
          .on("start", (e, d) => {
            if (!e.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end", (e, d) => {
            if (!e.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          }) as any
      );

    const label = g.append("g").selectAll("text").data(nodes).join("text")
      .text((d) => d.title.replace(".pdf", "").slice(0, 15) + "...")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", 45);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* 사이드바 */}
      <div className="w-72 border-r border-gray-800 flex flex-col p-4 gap-4">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
          ← 돌아가기
        </Link>
        <h1 className="text-xl font-bold">🕸️ 관계도 그래프</h1>
        <p className="text-xs text-gray-400">논문을 선택하면 유사도 기반 그래프를 생성해요</p>

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

        <div className="border-t border-gray-800 pt-5 pb-2">
          <button
            onClick={handleGenerate}
            disabled={selected.size < 2 || loading}
            className={`w-full py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${selected.size < 2 || loading
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
              }`}
          >
            {loading ? "생성 중..." : `그래프 생성하기 (${selected.size}개)`}
          </button>
        </div>
      </div>

      {/* 그래프 영역 */}
      <div className="flex-1 relative bg-gray-950">
        <div className="absolute top-0 left-0 w-full p-6 pointer-events-none z-10 flex justify-between items-start">
          <h2 className="font-semibold text-gray-200 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-xl border border-gray-800 shadow-sm">
            유사도 네트워크 시각화
          </h2>
        </div>

        <svg ref={svgRef} className="w-full h-full cursor-move" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="text-gray-300 font-medium tracking-wide">그래프 분석 중...</p>
            </div>
          </div>
        )}

        {!hasGraph && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center flex flex-col items-center gap-4">
              <span className="text-5xl opacity-30">🕸️</span>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                {selected.size < 2
                  ? "왼쪽 패널에서 2개 이상의 논문을 선택하여 노드 기반 관계도 그래프를 생성하세요."
                  : "하단의 '그래프 생성하기' 버튼을 눌러 시각화를 시작하세요."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}