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
  @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; cursor: pointer; }
  .int-range::-webkit-slider-thumb { background: #7c3aed; box-shadow: 0 0 8px rgba(124,58,237,0.6); }
  .ext-range::-webkit-slider-thumb { background: #34d399; box-shadow: 0 0 8px rgba(52,211,153,0.6); }
`;

const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10, color: "#22c55e" },
  { min: 81, grade: "A+", points: 9,  color: "#10b981" },
  { min: 71, grade: "A",  points: 8,  color: "#60a5fa" },
  { min: 61, grade: "B+", points: 7,  color: "#a78bfa" },
  { min: 51, grade: "B",  points: 6,  color: "#f59e0b" },
  { min: 0,  grade: "C",  points: 5,  color: "#f87171" },
];

function getGrade(pct: number) {
  return GRADE_TABLE.find(g => pct >= g.min) || GRADE_TABLE[GRADE_TABLE.length - 1];
}

export default function GPAPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internals, setInternals] = useState<Record<string, number>>({});
  const [externals, setExternals] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    Promise.all([dataAPI.getAttendance(), dataAPI.getMarks()])
      .then(([a, m]) => {
        setAttendance(a.data || []);
        setMarks(m.data || []);
        const init: Record<string, number> = {};
        ;(m.data || []).forEach((mk: any) => {
          const scored = mk.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
          const maxTotal = mk.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
          if (maxTotal > 0) init[mk.courseCode] = Math.round((scored / maxTotal) * 50);
        });
        setInternals(init);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, []);

  const theorySubjects = attendance.filter(c => c["Category"] === "Theory");

  const rows = theorySubjects.map(c => {
    const code = c["Course Code"];
    const intMark = internals[code] ?? 25;
    const extMark = externals[code] ?? 60;
    const total = Math.min(intMark, 50) + Math.min(extMark, 50);
    const grade = getGrade(total);
    return { code, title: c["Course Title"], intMark, extMark, total, grade };
  });

  const gpa = rows.length > 0 ? rows.reduce((s, r) => s + r.grade.points, 0) / rows.length : 0;
  const gpaColor = gpa >= 9 ? "#22c55e" : gpa >= 7 ? "#60a5fa" : gpa >= 6 ? "#f59e0b" : "#f87171";
  const gpaStatus = gpa >= 9 ? "Outstanding 🏆" : gpa >= 8 ? "Excellent 🌟" : gpa >= 7 ? "Good 👍" : gpa >= 6 ? "Average" : "Needs improvement";

  return (
    <>
      <style>{BASE + `
        .gpa-root { min-height: 100vh; background: #0f0c29; font-family: 'Manrope', sans-serif; }
        .gpa-main { margin-left: 256px; position: relative; z-index: 1; }
        .gpa-topbar { position: sticky; top: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; background: rgba(15,12,41,0.85); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.07); z-index: 50; }
        .gpa-topbar h1 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
        .gpa-topbar-hint { font-size: 11px; color: rgba(255,255,255,0.28); }
        .gpa-hero { border-radius: 20px; padding: 26px 30px; background: rgba(13,13,32,0.9); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(12px); position: relative; overflow: hidden; }
        .gpa-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #7c3aed, #ec4899); }
        .gpa-rows { display: flex; flex-direction: column; gap: 10px; }
        .gpa-row { border-radius: 14px; padding: 14px 18px; background: rgba(13,13,32,0.8); border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 14px; backdrop-filter: blur(8px); transition: border-color 0.2s; }
        .gpa-row:hover { border-color: rgba(124,58,237,0.3); }
        .grade-badge { width: 40px; height: 40px; border-radius: 11px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .grade-letter { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; }
        .grade-pts { font-size: 9px; color: rgba(255,255,255,0.3); }
        .slider-col { text-align: center; width: 96px; flex-shrink: 0; }
        .slider-lbl { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
        .slider-val { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; }
      `}</style>

      <div className="gpa-root">
        <div className="srmx-blob srmx-b1" />
        <div className="srmx-blob srmx-b2" />
        <div className="srmx-grid" />
        <Sidebar />

        <main className="gpa-main">
          <div className="gpa-topbar">
            <h1>GPA Calculator</h1>
            <span className="gpa-topbar-hint">Internal (0–50) + External (0–50)</span>
          </div>

          <div style={{ padding: "24px 28px 80px" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "'Manrope',sans-serif" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
                Loading...
              </div>
            ) : (
              <>
                {/* GPA Hero */}
                <div className="gpa-hero">
                  <div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Estimated GPA</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "64px", fontWeight: 800, color: gpaColor, lineHeight: 1, letterSpacing: "-2px" }}>
                      {gpa.toFixed(2)}
                    </div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>{gpaStatus}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px", alignItems: "flex-end" }}>
                    {GRADE_TABLE.map(g => (
                      <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: "8px", opacity: rows.some(r => r.grade.grade === g.grade) ? 1 : 0.2 }}>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.35)", width: "50px", textAlign: "right" }}>{g.min === 0 ? "< 51" : `≥ ${g.min}`}%</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: 800, color: g.color, width: "24px" }}>{g.grade}</span>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}>{g.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.28)", marginBottom: "14px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Drag sliders to simulate your GPA
                </div>

                {/* Subject rows */}
                <div className="gpa-rows">
                  {rows.map((r, i) => (
                    <div key={r.code} className="gpa-row" style={{ animation: `cardIn 0.35s ${i * 0.04}s both` }}>
                      <div className="grade-badge" style={{ background: `${r.grade.color}15`, border: `1px solid ${r.grade.color}30` }}>
                        <span className="grade-letter" style={{ color: r.grade.color }}>{r.grade.grade}</span>
                        <span className="grade-pts">{r.grade.points}</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginTop: "2px" }}>{r.code}</div>
                      </div>

                      <div className="slider-col">
                        <div className="slider-lbl">Internal</div>
                        <input type="range" min={0} max={50} value={r.intMark} className="int-range"
                          style={{ width: "80px" }}
                          onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))} />
                        <div className="slider-val" style={{ color: "#a78bfa" }}>{r.intMark}</div>
                      </div>

                      <div className="slider-col">
                        <div className="slider-lbl">External</div>
                        <input type="range" min={0} max={50} value={r.extMark} className="ext-range"
                          style={{ width: "80px" }}
                          onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))} />
                        <div className="slider-val" style={{ color: "#34d399" }}>{r.extMark}</div>
                      </div>

                      <div style={{ textAlign: "right", width: "48px", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.28)", marginBottom: "3px" }}>Total</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: 800, color: r.grade.color }}>{r.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
