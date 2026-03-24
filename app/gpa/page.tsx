"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10, color: "#f5a623" },
  { min: 81, grade: "A+", points: 9,  color: "#f7c068" },
  { min: 71, grade: "A",  points: 8,  color: "#63cda0" },
  { min: 61, grade: "B+", points: 7,  color: "#6399ff" },
  { min: 51, grade: "B",  points: 6,  color: "#a78bfa" },
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
        (m.data || []).forEach((mk: any) => {
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
  const gpaColor = gpa >= 9 ? "#f5a623" : gpa >= 7 ? "#63cda0" : gpa >= 6 ? "#6399ff" : "#f87171";
  const gpaStatus = gpa >= 9 ? "Outstanding" : gpa >= 8 ? "Excellent" : gpa >= 7 ? "Good" : gpa >= 6 ? "Average" : "Needs improvement";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gpa-root { min-height: 100vh; background: #07070e; font-family: 'DM Sans', sans-serif; }
        .gpa-orb-1 { position: fixed; top: -120px; left: 100px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .gpa-orb-2 { position: fixed; bottom: -150px; right: 0; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, rgba(99,153,255,0.04) 0%, transparent 70%); pointer-events: none; z-index: 0; }

        .gpa-main { margin-left: 272px; position: relative; z-index: 1; }

        .gpa-topbar { position: sticky; top: 0; height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; background: rgba(7,7,14,0.88); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 50; }
        .gpa-topbar-left { display: flex; align-items: center; gap: 12px; }
        .gpa-topbar-icon { width: 34px; height: 34px; border-radius: 10px; background: rgba(245,166,35,0.12); display: flex; align-items: center; justify-content: center; }
        .gpa-topbar-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
        .gpa-topbar-hint { font-size: 12px; color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 999px; padding: 5px 14px; }

        .gpa-content { padding: 32px 36px 80px; }

        .gpa-hero { border-radius: 20px; padding: 28px 32px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
        .gpa-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #f5a623, #f7c068); border-radius: 20px 20px 0 0; }
        .gpa-hero:hover { border-color: rgba(245,166,35,0.2); }

        .gpa-num { font-family: 'Playfair Display', serif; font-size: 72px; font-weight: 700; line-height: 1; letter-spacing: -2px; }
        .gpa-label { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
        .gpa-status { font-size: 14px; color: rgba(255,255,255,0.35); margin-top: 10px; }

        .gpa-hint { font-size: 11px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }

        .gpa-rows { display: flex; flex-direction: column; gap: 10px; }
        .gpa-row { border-radius: 14px; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 14px; transition: border-color 0.2s; }
        .gpa-row:hover { border-color: rgba(245,166,35,0.2); }

        .grade-badge { width: 42px; height: 42px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .grade-letter { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; }
        .grade-pts { font-size: 9px; color: rgba(255,255,255,0.3); margin-top: 1px; }

        .slider-col { text-align: center; width: 96px; flex-shrink: 0; }
        .slider-lbl { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .slider-val { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; margin-top: 4px; }

        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.08); outline: none; cursor: pointer; width: 80px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; cursor: pointer; }
        .int-range::-webkit-slider-thumb { background: #f5a623; box-shadow: 0 0 8px rgba(245,166,35,0.5); }
        .ext-range::-webkit-slider-thumb { background: #63cda0; box-shadow: 0 0 8px rgba(99,205,160,0.5); }

        .gpa-loading { display: flex; align-items: center; justify-content: center; height: 200px; gap: 12px; color: rgba(255,255,255,0.25); }
        .gpa-spinner { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(245,166,35,0.15); border-top-color: #f5a623; animation: spin 0.8s linear infinite; }

        @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .gpa-main { margin-left: 0; }
          .gpa-content { padding: 24px 20px 60px; }
          .gpa-topbar { padding: 0 20px; }
          .gpa-hero { flex-direction: column; gap: 20px; align-items: flex-start; }
        }
      `}</style>

      <div className="gpa-root">
        <div className="gpa-orb-1" />
        <div className="gpa-orb-2" />
        <Sidebar />

        <main className="gpa-main">
          <div className="gpa-topbar">
            <div className="gpa-topbar-left">
              <div className="gpa-topbar-icon">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2l1.8 3.6 4 .6-2.9 2.8.7 4L9 11l-3.6 1.9.7-4L3.2 6.2l4-.6L9 2z" stroke="#f5a623" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="gpa-topbar-title">GPA Calculator</span>
            </div>
            <span className="gpa-topbar-hint">Internal (0–50) + External (0–50)</span>
          </div>

          <div className="gpa-content">
            {loading ? (
              <div className="gpa-loading">
                <div className="gpa-spinner" />
                <span>Loading subjects…</span>
              </div>
            ) : (
              <>
                {/* GPA Hero */}
                <div className="gpa-hero">
                  <div>
                    <div className="gpa-label">Estimated GPA</div>
                    <div className="gpa-num" style={{ color: gpaColor }}>{gpa.toFixed(2)}</div>
                    <div className="gpa-status">{gpaStatus}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    {GRADE_TABLE.map(g => (
                      <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: rows.some(r => r.grade.grade === g.grade) ? 1 : 0.2 }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", width: "50px", textAlign: "right" }}>
                          {g.min === 0 ? "< 51" : `≥ ${g.min}`}%
                        </span>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 700, color: g.color, width: "26px" }}>{g.grade}</span>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>{g.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="gpa-hint">Drag sliders to simulate your GPA</div>

                <div className="gpa-rows">
                  {rows.map((r, i) => (
                    <div key={r.code} className="gpa-row" style={{ animation: `cardIn 0.35s ${i * 0.04}s both` }}>
                      <div className="grade-badge" style={{ background: `${r.grade.color}15`, border: `1px solid ${r.grade.color}30` }}>
                        <span className="grade-letter" style={{ color: r.grade.color }}>{r.grade.grade}</span>
                        <span className="grade-pts">{r.grade.points} pts</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginTop: "2px" }}>{r.code}</div>
                      </div>

                      <div className="slider-col">
                        <div className="slider-lbl">Internal</div>
                        <input type="range" min={0} max={50} value={r.intMark} className="int-range"
                          onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))} />
                        <div className="slider-val" style={{ color: "#f5a623" }}>{r.intMark}</div>
                      </div>

                      <div className="slider-col">
                        <div className="slider-lbl">External</div>
                        <input type="range" min={0} max={50} value={r.extMark} className="ext-range"
                          onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))} />
                        <div className="slider-val" style={{ color: "#63cda0" }}>{r.extMark}</div>
                      </div>

                      <div style={{ textAlign: "right", width: "48px", flexShrink: 0 }}>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginBottom: "3px" }}>Total</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: r.grade.color }}>{r.total}</div>
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
