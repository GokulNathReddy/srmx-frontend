"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10 },
  { min: 81, grade: "A+", points: 9 },
  { min: 71, grade: "A",  points: 8 },
  { min: 61, grade: "B+", points: 7 },
  { min: 51, grade: "B",  points: 6 },
  { min: 0,  grade: "C",  points: 5 },
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
        // Pre-fill internals from marks data
        const initInternals: Record<string, number> = {};
        ;(m.data || []).forEach((mk: any) => {
          const scored = mk.tests?.reduce((s: number, t: any) =>
            s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
          const maxTotal = mk.tests?.reduce((s: number, t: any) => {
            const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0);
          }, 0) || 0;
          if (maxTotal > 0) initInternals[mk.courseCode] = Math.round((scored / maxTotal) * 50);
        });
        setInternals(initInternals);
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

  const gpa = rows.length > 0
    ? rows.reduce((s, r) => s + r.grade.points, 0) / rows.length
    : 0;

  const gpaColor = gpa >= 9 ? "#22c55e" : gpa >= 7 ? "#60a5fa" : gpa >= 6 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: "#07070e", color: "#f4f4f5", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "20%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>
      <Sidebar />
      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>
        <header style={{ position: "sticky", top: 0, height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(7,7,14,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.055)", zIndex: 10 }}>
          <h1 style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.01em" }}>GPA Calculator</h1>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Internal (0–50) + External (0–50)</div>
        </header>

        <div style={{ padding: "28px 32px 80px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "rgba(255,255,255,0.3)" }}>Loading...</div>
          ) : (
            <>
              {/* GPA Summary Card */}
              <div style={{ borderRadius: "20px", padding: "28px 32px", background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Estimated GPA</div>
                  <div style={{ fontSize: "64px", fontWeight: 800, color: gpaColor, lineHeight: 1, letterSpacing: "-0.03em" }}>
                    {gpa.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
                    {gpa >= 9 ? "Outstanding 🏆" : gpa >= 8 ? "Excellent 🌟" : gpa >= 7 ? "Good 👍" : gpa >= 6 ? "Average" : "Needs improvement"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  {GRADE_TABLE.map(g => (
                    <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: "8px", opacity: rows.some(r => r.grade.grade === g.grade) ? 1 : 0.25 }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", width: "50px", textAlign: "right" }}>{g.min === 0 ? "< 51" : `≥ ${g.min}`}%</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#f4f4f5", width: "24px" }}>{g.grade}</span>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{g.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Adjust marks to simulate your GPA
              </div>

              {/* Subject rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rows.map((r, i) => (
                  <div key={r.code} style={{ borderRadius: "14px", padding: "16px 20px", background: "rgba(13,13,20,0.8)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "16px", animation: `cardIn 0.35s ${i * 0.04}s both` }}>
                    {/* Grade badge */}
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${getGradeColor(r.grade.grade)}15`, border: `1px solid ${getGradeColor(r.grade.grade)}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: getGradeColor(r.grade.grade) }}>{r.grade.grade}</span>
                      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{r.grade.points}</span>
                    </div>

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginTop: "2px" }}>{r.code}</div>
                    </div>

                    {/* Internal slider */}
                    <div style={{ textAlign: "center", width: "100px" }}>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>Internal</div>
                      <input type="range" min={0} max={50} value={r.intMark}
                        onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                        style={{ width: "100%", accentColor: "#6c63ff" }} />
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#6c63ff" }}>{r.intMark}</div>
                    </div>

                    {/* External slider */}
                    <div style={{ textAlign: "center", width: "100px" }}>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>External</div>
                      <input type="range" min={0} max={50} value={r.extMark}
                        onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                        style={{ width: "100%", accentColor: "#22c55e" }} />
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{r.extMark}</div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: "right", width: "48px", flexShrink: 0 }}>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Total</div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: getGradeColor(r.grade.grade) }}>{r.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <style>{`@keyframes cardIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

function getGradeColor(grade: string) {
  const map: Record<string, string> = { O: "#22c55e", "A+": "#10b981", A: "#60a5fa", "B+": "#a78bfa", B: "#f59e0b", C: "#ef4444" };
  return map[grade] || "#a1a1aa";
}