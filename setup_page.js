const fs = require("fs");
const path = require("path");

const files = {

// ── app/layout.tsx - updated with mobile viewport ─────────────────────────────
"app/layout.tsx": `import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SRMX — Student Portal", description: "Better SRM Academia" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}`,

// ── Attendance page ────────────────────────────────────────────────────────────
"app/attendance/page.tsx": `"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";

export default function AttendancePage() {
  const [att, setAtt] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getAttendance().then(d => { setAtt(d.data || []); setLoading(false); }).catch(() => router.push("/"));
  }, []);

  const filtered = att.filter(c =>
    filter === "all" ? true : filter === "safe" ? parseFloat(c["Attn %"]) >= 75 : parseFloat(c["Attn %"]) < 75
  );

  const filters = [
    { key: "all", label: "All", count: att.length },
    { key: "safe", label: "Safe", count: att.filter(c => parseFloat(c["Attn %"]) >= 75).length },
    { key: "risk", label: "At Risk", count: att.filter(c => parseFloat(c["Attn %"]) < 75).length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "-160px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(108,99,255,0.06)", filter: "blur(120px)" }} />
      </div>
      <Sidebar />
      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>
        <div style={{ position: "sticky", top: 0, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
          <h1 style={{ fontWeight: "600", fontSize: "16px", color: "#f4f4f5" }}>Attendance</h1>
          <div style={{ display: "flex", gap: "6px" }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", cursor: "pointer", border: "none", background: filter === f.key ? "#6c63ff" : "rgba(255,255,255,0.05)", color: filter === f.key ? "#fff" : "#a1a1aa", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                {f.label}
                <span style={{ padding: "1px 6px", borderRadius: "999px", background: filter === f.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", fontSize: "10px" }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px", color: "#a1a1aa" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(108,99,255,0.3)", borderTopColor: "#6c63ff", animation: "spin 0.8s linear infinite" }} />
              Loading attendance...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "14px" }}>
              {filtered.map((c: any) => <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />)}
            </div>
          )}
        </div>
      </main>
      <style>{\`@keyframes spin { to { transform: rotate(360deg); } }\`}</style>
    </div>
  );
}`,

// ── Marks page with course titles + total ──────────────────────────────────────
"app/marks/page.tsx": `"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

export default function MarksPage() {
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    Promise.all([dataAPI.getMarks(), dataAPI.getAttendance()])
      .then(([m, a]) => { setMarks(m.data || []); setAttendance(a.data || []); setLoading(false); })
      .catch(() => router.push("/"));
  }, []);

  const titleMap: Record<string, string> = {};
  attendance.forEach((c: any) => { titleMap[c["Course Code"]] = c["Course Title"]; });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(236,72,153,0.05)", filter: "blur(120px)" }} />
      </div>
      <Sidebar />
      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>
        <div style={{ position: "sticky", top: 0, height: "64px", display: "flex", alignItems: "center", padding: "0 32px", background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
          <h1 style={{ fontWeight: "600", fontSize: "16px", color: "#f4f4f5" }}>Internal Marks</h1>
        </div>
        <div style={{ padding: "32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px", color: "#a1a1aa" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(108,99,255,0.3)", borderTopColor: "#6c63ff", animation: "spin 0.8s linear infinite" }} />
              Loading marks...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
              {marks.map((m: any, i: number) => {
                const title = titleMap[m.courseCode] || m.courseCode;
                // Calculate total scored and total max
                const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
                const maxTotal = m.tests?.reduce((s: number, t: any) => { const [,maxStr] = t.test.split("/"); return s + (parseFloat(maxStr) || 0); }, 0) || 0;
                const totalPct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
                const totalColor = totalPct >= 60 ? "#22c55e" : totalPct >= 40 ? "#f59e0b" : "#ef4444";

                return (
                  <div key={i} style={{ borderRadius: "16px", padding: "20px", background: "rgba(20,20,30,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                        <div style={{ fontWeight: "600", fontSize: "14px", color: "#f4f4f5", marginBottom: "3px", lineHeight: "1.4" }}>{title}</div>
                        <div style={{ fontSize: "11px", color: "#a1a1aa" }}>{m.courseCode} · {m.courseType}</div>
                      </div>
                      {/* Total score badge */}
                      {maxTotal > 0 && (
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div style={{ fontSize: "18px", fontWeight: "800", color: totalColor, lineHeight: 1 }}>{scored.toFixed(1)}</div>
                          <div style={{ fontSize: "10px", color: "#a1a1aa" }}>/ {maxTotal.toFixed(0)}</div>
                        </div>
                      )}
                    </div>

                    {/* Tests */}
                    {m.tests?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {m.tests.map((t: any, j: number) => {
                          const [name, maxStr] = t.test.split("/");
                          const max = parseFloat(maxStr) || 100;
                          const score = parseFloat(t.score) || 0;
                          const pct = t.score === "Abs" ? 0 : (score / max) * 100;
                          const isAbs = t.score === "Abs";
                          const color = isAbs ? "#ef4444" : pct >= 60 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
                          return (
                            <div key={j}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                                <span style={{ color: "#a1a1aa" }}>{name} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {maxStr}</span></span>
                                <span style={{ color, fontWeight: "600" }}>{isAbs ? "Absent" : t.score}</span>
                              </div>
                              <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "999px" }}>
                                <div style={{ height: "100%", borderRadius: "999px", background: color, width: Math.min(pct, 100) + "%", transition: "width 0.8s ease", boxShadow: \`0 0 8px \${color}40\` }} />
                              </div>
                            </div>
                          );
                        })}

                        {/* Total bar */}
                        {maxTotal > 0 && (
                          <div style={{ marginTop: "4px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                              <span style={{ color: "#a1a1aa", fontWeight: "500" }}>Total</span>
                              <span style={{ color: totalColor, fontWeight: "700" }}>{scored.toFixed(1)} / {maxTotal.toFixed(0)}</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px" }}>
                              <div style={{ height: "100%", borderRadius: "999px", background: \`linear-gradient(90deg, \${totalColor}, \${totalColor}cc)\`, width: Math.min(totalPct, 100) + "%", transition: "width 0.8s ease", boxShadow: \`0 0 10px \${totalColor}40\` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: "13px", color: "#606060", textAlign: "center", padding: "12px 0" }}>No marks recorded yet</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <style>{\`@keyframes spin { to { transform: rotate(360deg); } }\`}</style>
    </div>
  );
}`,

// ── AI page ────────────────────────────────────────────────────────────────────
"app/ai/page.tsx": `"use client";
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
    \`\${c["Course Code"]} - \${c["Course Title"]}: \${c["Attn %"]}% (\${c["Hours Conducted"]} classes, \${c["Hours Absent"]} absent)\`
  ).join("\\n");
  const marks = (data.marks || []).map((m: any) =>
    \`\${m.courseCode} (\${m.courseType}): \${(m.tests || []).map((t: any) => \`\${t.test}=\${t.score}\`).join(", ")}\`
  ).join("\\n");
  return \`Student: \${name}\\nSemester: \${sem}\\n\\nAttendance:\\n\${att}\\n\\nMarks:\\n\${marks}\`;
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
          system: \`You are a helpful SRM University student assistant. Academic data:\\n\\n\${context}\\n\\nAnswer concisely.\`,
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
                {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6c63ff", animation: \`bounce 1s infinite \${i * 0.15}s\` }} />)}
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
      <style>{\`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      \`}</style>
    </div>
  );
}`,

// ── globals.css with mobile support ───────────────────────────────────────────
"app/globals.css": `@import 'tailwindcss';

:root {
  --background: #0a0a0f;
  --foreground: #f4f4f5;
  --card: rgba(20, 20, 30, 0.6);
  --primary: #6c63ff;
  --muted-foreground: #a1a1aa;
  --border: rgba(255, 255, 255, 0.08);
  --destructive: #ef4444;
  --sidebar: rgba(15, 15, 25, 0.85);
  --sidebar-border: rgba(255, 255, 255, 0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--background); color: var(--foreground); font-family: 'Inter', system-ui, sans-serif; }

/* Mobile — sidebar becomes bottom nav */
@media (max-width: 768px) {
  aside { 
    width: 100% !important; 
    height: 64px !important; 
    top: auto !important; 
    bottom: 0 !important; 
    left: 0 !important;
    flex-direction: row !important;
    border-right: none !important;
    border-top: 1px solid var(--sidebar-border) !important;
  }
  main { 
    padding-left: 0 !important; 
    padding-bottom: 64px !important; 
  }
}
`,
};

let count = 0;
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("✓ " + file);
  count++;
}
console.log("\n✅ Done! " + count + " files.");
console.log("Run: npm run dev");