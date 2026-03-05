const BASE_URL = "http://localhost:8000/api";

export async function uploadPaper(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPapers() {
  const res = await fetch(`${BASE_URL}/papers`);
  return res.json();
}

export async function deletePaper(paper_id: string) {
  const res = await fetch(`${BASE_URL}/papers/${paper_id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeSecurity(paper_id: string) {
  const res = await fetch(`${BASE_URL}/security/${paper_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function queryPaper(
  paper_id: string,
  question: string,
  onChunk: (text: string) => void
) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper_id, question }),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}

export async function comparePapers(
  papers: { paper_id: string; title: string }[],
  question: string,
  onChunk: (text: string) => void
) {
  const res = await fetch(`${BASE_URL}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ papers, question }),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}

export async function getSimilarityGraph(
  papers: { paper_id: string; title: string }[]
) {
  const res = await fetch(`${BASE_URL}/graph`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ papers }),
  });
  return res.json();
}