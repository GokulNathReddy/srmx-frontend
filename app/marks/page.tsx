"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

export default function MarksPage() {
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    Promise.all([dataAPI.getMarks(), dataAPI.getAttendance()])
      .then(([m, a]) => {
        setMarks(m.data || []);
        setAttendance(a.data || []);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, []);

  const titleMap: Record<string, string> = {};
  attendance.forEach((c: any) => { titleMap[c["Course Code"]] = c["Course Title"]; });

  const totalScored = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);
  const overallPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#07070e", color: "#f4f4f5", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0", left: "10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>

      <Sidebar />
      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <header style={{ position: "sticky", top: 0, height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(7,7,14,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.055)", zIndex: 10 }}>
          <h1 style={{ fontWeight: 700, fontSize: "15px", color: "#f4f4f5", letterSpacing: "-0.01em" }}>Internal Marks</h1>
          {!loading && totalMax > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>Overall</span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: overallPct >= 60 ? "#22c55e" : overallPct >= 40 ? "#f59e0b" : "#ef4444" }}>
                {totalScored.toFixed(1)} / {totalMax.toFixed(0)}
              </span>
              <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(overallPct, 100)}%`, background: overallPct >= 60 ? "#22c55e" : overallPct >= 40 ? "#f59e0b" : "#ef4444", borderRadius: "99px" }} />
              </div>
            </div>
          )}
        </header>

        <div style={{ padding: "28px 32px 80px" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "14px" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: "200px", borderRadius: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", animation: `shimmer 1.8s ${i * 0.1}s infinite linear`, backgroundSize: "600px 100%" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "14px" }}>
              {marks.map((m: any, i: number) => {
                const title = titleMap[m.courseCode] || m.courseCode;
                const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
                const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
                const totalPct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
                const totalColor = totalPct >= 60 ? "#22c55e" : totalPct >= 40 ? "#f59e0b" : "#ef4444";
                const isOpen = selected === i;
                const isTheory = m.courseType === "Theory";

                return (
                  <div key={i}
                    onClick={() => setSelected(isOpen ? null : i)}
                    style={{
                      borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                      background: isOpen ? "rgba(20,20,32,0.95)" : "rgba(13,13,20,0.8)",
                      border: isOpen ? "1px solid rgba(108,99,255,0.35)" : "1px solid rgba(255,255,255,0.06)",
                      backdropFilter: "blur(20px)",
                      boxShadow: isOpen ? "0 8px 32px rgba(108,99,255,0.15)" : "none",
                      transition: "all 0.22s cubic-bezier(.22,1,.36,1)",
                      animation: `cardIn 0.4s ${i * 0.05}s both cubic-bezier(.22,1,.36,1)`,
                    }}
                    onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.12)"; }}
                    onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)"; }}
                  >
                    {/* Top color bar */}
                    <div style={{ height: "3px", background: `linear-gradient(90deg, ${totalColor}, ${totalColor}44)` }} />

                    <div style={{ padding: "18px 20px" }}>
                      {/* Header row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.4, marginBottom: "4px" }}>{title}</div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{m.courseCode}</span>
                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                            <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "999px", background: isTheory ? "rgba(96,165,250,0.12)" : "rgba(167,139,250,0.12)", color: isTheory ? "#60a5fa" : "#a78bfa", border: `1px solid ${isTheory ? "rgba(96,165,250,0.25)" : "rgba(167,139,250,0.25)"}` }}>
                              {m.courseType}
                            </span>
                          </div>
                        </div>

                        {/* Score ring */}
                        {maxTotal > 0 && (
                          <ScoreRing score={scored} max={maxTotal} color={totalColor} />
                        )}
                      </div>

                      {/* Mini progress bars preview (always visible) */}
                      <div style={{ display: "flex", gap: "3px", marginBottom: isOpen ? "14px" : "0" }}>
                        {m.tests?.map((t: any, j: number) => {
                          const [, mx] = t.test.split("/");
                          const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                          const p = parseFloat(mx) > 0 ? (sc / parseFloat(mx)) * 100 : 0;
                          const c = t.score === "Abs" ? "#ef4444" : p >= 60 ? "#22c55e" : p >= 40 ? "#f59e0b" : "#ef4444";
                          return (
                            <div key={j} style={{ flex: 1, height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(p, 100)}%`, background: c, borderRadius: "99px" }} />
                            </div>
                          );
                        })}
                      </div>

                      {/* Expanded detail */}
                      {isOpen && m.tests?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", animation: "fadeUp 0.25s ease" }}>
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
                                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{name} <span style={{ color: "rgba(255,255,255,0.2)" }}>/ {maxStr}</span></span>
                                  <span style={{ color, fontWeight: 700 }}>{isAbs ? "Absent" : t.score}</span>
                                </div>
                                <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "999px" }}>
                                  <div style={{ height: "100%", borderRadius: "999px", background: color, width: `${Math.min(pct, 100)}%`, transition: "width 0.8s ease", boxShadow: `0 0 8px ${color}50` }} />
                                </div>
                              </div>
                            );
                          })}
                          {maxTotal > 0 && (
                            <div style={{ marginTop: "4px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                                <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Total</span>
                                <span style={{ color: totalColor, fontWeight: 800 }}>{scored.toFixed(1)} / {maxTotal.toFixed(0)}</span>
                              </div>
                              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px" }}>
                                <div style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg,${totalColor},${totalColor}88)`, width: `${Math.min(totalPct, 100)}%`, transition: "width 0.8s ease", boxShadow: `0 0 10px ${totalColor}40` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isOpen && (!m.tests || m.tests.length === 0) && (
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "8px 0" }}>No marks recorded yet</div>
                      )}

                      {/* Expand hint */}
                      {!isOpen && (
                        <div style={{ marginTop: "10px", fontSize: "10px", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>tap to expand</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
      `}</style>
    </div>
  );
}

function ScoreRing({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const r = 18, sz = 50, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${color}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color, lineHeight: 1 }}>{score.toFixed(0)}</span>
        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>/{max.toFixed(0)}</span>
      </div>
    </div>
  );
}