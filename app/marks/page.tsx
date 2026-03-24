"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

const BASE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .srmx-blob { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
  .srmx-b1 { width: 500px; height: 500px; top: -150px; left: -150px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); opacity: 0.45; }
  .srmx-b2 { width: 400px; height: 400px; bottom: -100px; right: -100px; background: radial-gradient(circle, #ec4899 0%, transparent 70%); opacity: 0.35; }
  .srmx-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 40px 40px; }
  @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); }  to { opacity: 1; transform: translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

  /* ── BASE LAYOUT ── */
  .marks-root { min-height: 100vh; background: #0f0c29; font-family: 'Manrope', sans-serif; }
  .marks-main { margin-left: 256px; position: relative; z-index: 1; }

  .marks-topbar {
    position: sticky; top: 0; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    background: rgba(15,12,41,0.85); backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,0.07); z-index: 50;
  }
  .marks-topbar h1 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
  .marks-overall { display: flex; align-items: center; gap: 10px; }
  .marks-overall-bar { width: 80px; height: 4px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }

  .marks-body { padding: 24px 28px 80px; }
  .marks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 12px; }

  .mark-card {
    border-radius: 16px; overflow: hidden; cursor: pointer;
    background: rgba(13,13,32,0.8); border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(12px);
    transition: all 0.22s cubic-bezier(.22,1,.36,1);
  }
  .mark-card:hover { border-color: rgba(124,58,237,0.35); }
  .mark-card.open {
    background: rgba(20,20,40,0.95);
    border-color: rgba(124,58,237,0.4);
    box-shadow: 0 8px 32px rgba(124,58,237,0.15);
  }
  .sk-card {
    height: 200px; border-radius: 16px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
    animation: shimmer 1.8s infinite linear; background-size: 600px 100%;
  }

  /* ── MOBILE ── */
  @media (max-width: 768px) {
    .marks-main { margin-left: 0 !important; padding-bottom: 68px; }
    .marks-body { padding: 16px 14px 80px; }
    .marks-grid { grid-template-columns: 1fr; gap: 10px; }

    .marks-topbar { padding: 0 16px; height: 56px; }
    .marks-topbar h1 { font-size: 15px; }
    .marks-overall-bar { width: 56px; }
    /* Hide progress bar label on very small screens */
    .marks-overall-label { display: none; }
  }

  @media (max-width: 380px) {
    .marks-body { padding: 12px 10px 80px; }
    .marks-overall { gap: 6px; }
    .marks-overall-bar { display: none; }
  }
`;

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
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 800, color, lineHeight: 1 }}>{score.toFixed(0)}</span>
        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>/{max.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function MarksPage() {
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("srmx_token")) {
      router.push("/"); return;
    }
    Promise.all([dataAPI.getMarks(), dataAPI.getAttendance()])
      .then(([m, a]) => { setMarks(m.data || []); setAttendance(a.data || []); setLoading(false); })
      .catch(() => router.push("/"));
  }, []);

  const titleMap: Record<string, string> = {};
  attendance.forEach((c: any) => { titleMap[c["Course Code"]] = c["Course Title"]; });

  const totalScored = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);
  const overallPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
  const overallColor = overallPct >= 60 ? "#34d399" : overallPct >= 40 ? "#f59e0b" : "#f87171";

  return (
    <>
      <style>{BASE}</style>

      <div className="marks-root">
        <div className="srmx-blob srmx-b1" />
        <div className="srmx-blob srmx-b2" />
        <div className="srmx-grid" />
        <Sidebar />

        <main className="marks-main">
          {/* Topbar */}
          <div className="marks-topbar">
            <h1>Internal Marks</h1>
            {!loading && totalMax > 0 && (
              <div className="marks-overall">
                <span className="marks-overall-label" style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Overall</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: 800, color: overallColor }}>
                  {totalScored.toFixed(1)} / {totalMax.toFixed(0)}
                </span>
                <div className="marks-overall-bar">
                  <div style={{ height: "100%", width: `${Math.min(overallPct, 100)}%`, background: overallColor, borderRadius: "99px" }} />
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="marks-body">
            {loading ? (
              <div className="marks-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            ) : (
              <div className="marks-grid">
                {marks.map((m: any, i: number) => {
                  const title = titleMap[m.courseCode] || m.courseCode;
                  const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
                  const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
                  const totalPct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
                  const totalColor = totalPct >= 60 ? "#34d399" : totalPct >= 40 ? "#f59e0b" : "#f87171";
                  const isOpen = selected === i;
                  const isTheory = m.courseType === "Theory";

                  return (
                    <div key={i}
                      className={`mark-card${isOpen ? " open" : ""}`}
                      onClick={() => setSelected(isOpen ? null : i)}
                      style={{ animation: `cardIn 0.4s ${i * 0.05}s both` }}
                    >
                      {/* Color top bar */}
                      <div style={{ height: "2px", background: `linear-gradient(90deg,${totalColor},${totalColor}44)` }} />

                      <div style={{ padding: "16px 18px" }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0, marginRight: "10px" }}>
                            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.4, marginBottom: "4px" }}>{title}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{m.courseCode}</span>
                              <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                              <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "999px", background: isTheory ? "rgba(96,165,250,0.12)" : "rgba(167,139,250,0.12)", color: isTheory ? "#60a5fa" : "#a78bfa", border: `1px solid ${isTheory ? "rgba(96,165,250,0.25)" : "rgba(167,139,250,0.25)"}`, fontWeight: 600 }}>
                                {m.courseType}
                              </span>
                            </div>
                          </div>
                          {maxTotal > 0 && <ScoreRing score={scored} max={maxTotal} color={totalColor} />}
                        </div>

                        {/* Mini bars */}
                        <div style={{ display: "flex", gap: "3px", marginBottom: isOpen ? "14px" : "8px" }}>
                          {m.tests?.map((t: any, j: number) => {
                            const [, mx] = t.test.split("/");
                            const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                            const p = parseFloat(mx) > 0 ? (sc / parseFloat(mx)) * 100 : 0;
                            const c = t.score === "Abs" ? "#f87171" : p >= 60 ? "#34d399" : p >= 40 ? "#f59e0b" : "#f87171";
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
                              const color = isAbs ? "#f87171" : pct >= 60 ? "#34d399" : pct >= 40 ? "#f59e0b" : "#f87171";
                              return (
                                <div key={j}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                                    <span style={{ color: "rgba(255,255,255,0.45)" }}>{name} <span style={{ color: "rgba(255,255,255,0.2)" }}>/ {maxStr}</span></span>
                                    <span style={{ color, fontWeight: 700 }}>{isAbs ? "Absent" : t.score}</span>
                                  </div>
                                  <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", borderRadius: "999px", background: color, width: `${Math.min(pct, 100)}%`, transition: "width 0.8s ease" }} />
                                  </div>
                                </div>
                              );
                            })}
                            {maxTotal > 0 && (
                              <div style={{ paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                                  <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Total</span>
                                  <span style={{ fontFamily: "'Syne',sans-serif", color: totalColor, fontWeight: 800 }}>{scored.toFixed(1)} / {maxTotal.toFixed(0)}</span>
                                </div>
                                <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg,${totalColor},${totalColor}88)`, width: `${Math.min(totalPct, 100)}%`, transition: "width 0.8s ease" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!isOpen && (
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "4px" }}>tap to expand</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
