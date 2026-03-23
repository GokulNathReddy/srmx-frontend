"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { Send, Bot, User } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }

function buildContext(data: any): string {
  if (!data) return "";
  const name = data.profile?.["Name"] || "";
  const sem = data.profile?.["Semester"] || "";
  const att = (data.attendance || []).map((c: any) =>
    `${c["Course Code"]} - ${c["Course Title"]}: ${c["Attn %"]}% (${c["Hours Conducted"]} classes, ${c["Hours Absent"]} absent)`
  ).join("\n");
  const marks = (data.marks || []).map((m: any) =>
    `${m.courseCode} (${m.courseType}): ${(m.tests || []).map((t: any) => `${t.test}=${t.score}`).join(", ")}`
  ).join("\n");
  return `Student: ${name}\nSemester: ${sem}\n\nAttendance:\n${att}\n\nMarks:\n${marks}`;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I am your SRM AI assistant. Ask me anything about your attendance, marks, or timetable!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicData, setAcademicData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) { router.push("/"); return; }
    dataAPI.getAll().then(setAcademicData).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const context = buildContext(academicData);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `You are a helpful SRM University student assistant. Academic data:\n\n${context}\n\nAnswer concisely.`,
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "Sorry, try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again!" }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <Sidebar />
      <main style={{ paddingLeft: "272px", height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ height: "64px", display: "flex", alignItems: "center", gap: "10px", padding: "0 32px", background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontWeight: "600", fontSize: "15px", color: "#f4f4f5" }}>AI Assistant</h1>
            <p style={{ fontSize: "11px", color: "#a1a1aa" }}>Powered by Claude</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "12px", color: "#a1a1aa" }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-end" }}>
              {m.role === "assistant" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} color="#fff" />
                </div>
              )}
              <div style={{ maxWidth: "560px", padding: "12px 16px", fontSize: "14px", color: "#f4f4f5", lineHeight: "1.6",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "linear-gradient(135deg, #6c63ff, #8b84ff)" : "rgba(20,20,30,0.8)",
                border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={14} color="#a1a1aa" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={14} color="#fff" />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(20,20,30,0.8)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "4px", alignItems: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6c63ff", animation: `bounce 1s infinite ${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 32px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "8px 8px 8px 16px", borderRadius: "16px", background: "rgba(20,20,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about your attendance, marks, or timetable..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f4f4f5", fontSize: "14px", padding: "4px 0" }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ width: "36px", height: "36px", borderRadius: "10px", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "linear-gradient(135deg, #6c63ff, #8b84ff)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
              <Send size={15} color={input.trim() && !loading ? "#fff" : "#606060"} />
            </button>
          </div>
        </div>
      </main>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}