"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Course {
  "Course Code": string; "Course Title": string; "Faculty Name": string;
  "Slot": string; "Room No": string; "Category": string;
  "Attn %": string; "Hours Conducted": string; "Hours Absent": string;
}
interface ScheduleItem {
  slot: string; startTime: string; endTime: string;
  course: Course; type: "theory" | "lab" | "practical";
}

// ─── SLOT BUILDER (unchanged logic) ──────────────────────────────────────────
function buildSlotMap(attendance: Course[]) {
  const letterMap: Record<string, Course> = {};
  const labCourses: Course[] = [];
  attendance.forEach(c => {
    const raw = c["Slot"]?.trim() || "";
    if (!raw) return;
    if (/P\d+/i.test(raw)) { labCourses.push(c); }
    else {
      raw.toUpperCase().split("/").forEach(part => {
        const letter = part.trim().replace(/[^A-Z]/g, "")[0];
        if (letter && letter !== "X") letterMap[letter] = c;
      });
    }
  });
  return { letterMap, labCourses };
}

function buildSchedule(rows: any[], letterMap: Record<string, Course>, labCourses: Course[]): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = rows.find(r => r[0] === "FROM");
  const times: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = rows.filter(r => typeof r[0] === "string" && r[0].startsWith("Day"));
  return dayRows.map(row => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    type Run = { startTime: string; endTime: string; slot: string };
    const runs: Run[] = [];
    let inRun = false, runStart = "", runEnd = "", runSlot = "";
    cells.forEach((cell, ci) => {
      const s = cell?.trim(); const up = s?.toUpperCase() || "";
      const isP = s && /^P\d+$/i.test(up) && up[0] === "P";
      if (isP) { if (!inRun) { inRun = true; runStart = times[ci] || ""; runSlot = s; } runEnd = times[ci] || ""; }
      else { if (inRun) { runs.push({ startTime: runStart, endTime: runEnd, slot: runSlot }); inRun = false; } }
    });
    if (inRun) runs.push({ startTime: runStart, endTime: runEnd, slot: runSlot });
    runs.forEach((run, ri) => {
      const course = labCourses[ri % Math.max(labCourses.length, 1)];
      if (!course) return;
      const isPrac = /practical|workshop/i.test(course["Category"] || "");
      classes.push({ slot: run.slot, startTime: run.startTime, endTime: run.endTime, course, type: isPrac ? "practical" : "lab" });
    });
    const seenKeys = new Set<string>();
    cells.forEach((cell, ci) => {
      const s = cell?.trim(); if (!s || s === "-") return;
      const up = s.toUpperCase(); const fc = up[0];
      if (fc === "L") return; if (/^P\d+$/i.test(up)) return;
      const baseLetter = up.split("/")[0].trim().replace(/[^A-Z]/g, "")[0] || "";
      if (!baseLetter || baseLetter === "X") return;
      const course = letterMap[baseLetter]; if (!course) return;
      const time = times[ci] || ""; const key = `${baseLetter}__${time}`;
      if (seenKeys.has(key)) return; seenKeys.add(key);
      classes.push({ slot: s, startTime: time, endTime: time, course, type: "theory" });
    });
    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

// ─── TIME UTILS ───────────────────────────────────────────────────────────────
function parseStart(t: string): number { const m = t.match(/(\d+):(\d+)/); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0; }
function parseEndTime(t: string): number { const parts = t.split(/\s*[-–]\s*/); const last = (parts[parts.length - 1] || "").trim(); const m = last.match(/(\d+):(\d+)/); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0; }
function isNowIn(s: string, e: string): boolean { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(s) && now <= parseEndTime(e); }
function fmtH(t: string): string { const m = t.match(/(\d+):(\d+)/); return m ? `${parseInt(m[1])}:${m[2]}` : t; }
function fmtRange(s: string, e: string): string { const a = fmtH(s); const parts = e.split(/\s*[-–]\s*/); const b = fmtH(parts[parts.length - 1] || e); return a === b ? a : `${a} – ${b}`; }
function slotMins(s: string, e: string): number { return Math.max(0, parseEndTime(e) - parseStart(s)); }

// ─── CARD CONFIG ──────────────────────────────────────────────────────────────
const TC = {
  theory:    { accent: "#60a5fa", bg: "rgba(96,165,250,0.1)",  label: "Theory",    icon: "T" },
  lab:       { accent: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Lab",       icon: "L" },
  practical: { accent: "#f472b6", bg: "rgba(244,114,182,0.1)", label: "Practical", icon: "P" },
};

function attnInfo(pct: number) {
  if (!pct)      return { color: "#52525b", label: "No data" };
  if (pct >= 85) return { color: "#10b981", label: "Excellent" };
  if (pct >= 75) return { color: "#22c55e", label: "Safe" };
  if (pct >= 65) return { color: "#f59e0b", label: "At risk" };
  return           { color: "#f87171",  label: "Critical" };
}

// ─── RING ─────────────────────────────────────────────────────────────────────
function Ring({ pct }: { pct: number }) {
  const r = 17, sz = 46, circ = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * circ;
  const { color } = attnInfo(pct);
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ flexShrink: 0 }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5"/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${sz/2} ${sz/2})`}
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)" }}/>
      <text x={sz/2} y={sz/2+4} textAnchor="middle" fill={color}
        style={{ fontSize: "9px", fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
        {pct > 0 ? `${Math.round(pct)}%` : "–"}
      </text>
    </svg>
  );
}

// ─── CLASS CARD ───────────────────────────────────────────────────────────────
function ClassCard({ item, idx, active, cRef }: { item: ScheduleItem; idx: number; active: boolean; cRef?: React.RefObject<HTMLDivElement | null> }) {
  const cfg = TC[item.type] || TC.theory;
  const attn = parseFloat(item.course["Attn %"]) || 0;
  const cond = parseInt(item.course["Hours Conducted"]) || 0;
  const abs = parseInt(item.course["Hours Absent"]) || 0;
  const pres = cond - abs;
  const need = cond > 0 ? Math.max(0, Math.ceil((0.75 * cond - pres) / 0.25)) : 0;
  const skip = cond > 0 ? Math.max(0, Math.floor((pres - 0.75 * cond) / 0.75)) : 0;
  const { color: ac, label: al } = attnInfo(attn);
  const isRisk = attn > 0 && attn < 75;
  const mins = slotMins(item.startTime, item.endTime);
  const multi = mins > 58;
  const fac = (item.course["Faculty Name"] || "").replace(/\s*\(\d+\)/, "");
  const room = item.course["Room No"] || "TBA";

  return (
    <div ref={cRef}
      style={{
        borderRadius: "16px", overflow: "hidden", position: "relative",
        background: active ? "rgba(124,58,237,0.12)" : "rgba(13,13,32,0.8)",
        border: active ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: active ? "0 0 0 1px rgba(124,58,237,0.14), 0 8px 32px rgba(124,58,237,0.18)" : "none",
        backdropFilter: "blur(16px)",
        animation: "cardIn 0.42s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${idx * 0.055}s`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: cfg.accent, borderRadius: "0 2px 2px 0" }} />
      {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${cfg.accent}aa,transparent)` }} />}

      <div style={{ padding: "13px 14px 10px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "9px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.accent}35`, fontFamily: "'Manrope',sans-serif" }}>
            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}40`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{cfg.icon}</span>
            {cfg.label}
          </span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontFamily: "monospace", background: "rgba(255,255,255,0.04)", padding: "1px 7px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.07)" }}>{item.slot}</span>
          {active && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", background: "rgba(99,153,255,0.15)", border: "1px solid rgba(99,153,255,0.4)", fontSize: "10px", fontWeight: 700, color: "#60a5fa", marginLeft: "auto", fontFamily: "'Manrope',sans-serif" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s infinite" }} />
              NOW
            </span>
          )}
        </div>

        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.4, marginBottom: "3px" }}>{item.course["Course Title"]}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.24)", fontFamily: "monospace", marginBottom: "9px" }}>{item.course["Course Code"]}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "9px" }}>
          {[{ icon: "person", text: fac }, { icon: "room", text: `Room ${room}` }].map(({ icon, text }) => (
            <div key={icon} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                {icon === "person"
                  ? <><circle cx="6" cy="4" r="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/></>
                  : <><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.1" strokeLinecap="round"/></>
                }
              </svg>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.42)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.055)", margin: "0 14px 0 18px" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 12px 18px" }}>
        <div>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>Time</div>
          <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{fmtRange(item.startTime, item.endTime)}</div>
          {multi && <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "9px", color: cfg.accent, marginTop: "2px" }}>{Math.round(mins / 55)} hr session</div>}
        </div>
        {attn > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>Attendance</div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "11px", fontWeight: 700, color: ac }}>{al}</div>
              <div style={{ fontSize: "10px", marginTop: "2px" }}>
                {isRisk ? <span style={{ color: "#f87171", fontFamily: "'Manrope',sans-serif" }}>Need {need} more</span> : <span style={{ color: "#22c55e", fontFamily: "'Manrope',sans-serif" }}>{skip} can skip</span>}
              </div>
            </div>
            <Ring pct={attn} />
          </div>
        ) : <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>No data</span>}
      </div>

      {multi && (
        <div style={{ height: "2px", margin: "0 18px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (mins / 240) * 100)}%`, background: cfg.accent, borderRadius: "99px", opacity: 0.6 }} />
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Course[]>([]);
  const [batch, setBatch] = useState(1);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  const nowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const weekend = [0, 6].includes(new Date().getDay());

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) { router.push("/"); return; }
    setLoading(true);
    Promise.all([dataAPI.getTimetable(batch), dataAPI.getAttendance()])
      .then(([tt, att]) => { setRows(tt.data || []); setAttendance(att.data || []); setLoading(false); })
      .catch(() => router.push("/"));
  }, [batch]);

  useEffect(() => {
    const t = setTimeout(() => nowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    return () => clearTimeout(t);
  }, [day, loading]);

  const { letterMap, labCourses } = buildSlotMap(attendance);
  const schedule = buildSchedule(rows, letterMap, labCourses);
  const classes = schedule[day - 1]?.classes || [];
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nowItem = classes.find(c => isNowIn(c.startTime, c.endTime));
  const nxtItem = classes.find(c => parseStart(c.startTime) > nowMin);
  const labCnt = classes.filter(c => c.type !== "theory").length;
  const thryCnt = classes.filter(c => c.type === "theory").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@300;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .srmx-blob { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
        .srmx-b1 { width: 500px; height: 500px; top: -150px; left: -150px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); opacity: 0.45; }
        .srmx-b2 { width: 400px; height: 400px; bottom: -100px; right: -100px; background: radial-gradient(circle, #ec4899 0%, transparent 70%); opacity: 0.35; }
        .srmx-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 40px 40px; }
        .tt-root { min-height: 100vh; background: #0f0c29; font-family: 'Manrope', sans-serif; }
        .tt-main { margin-left: 256px; position: relative; z-index: 1; min-height: 100vh; }
        .tt-topbar { position: sticky; top: 0; z-index: 20; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; background: rgba(15,12,41,0.9); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.055); }
        .batch-toggle { display: flex; padding: 3px; gap: 3px; background: rgba(255,255,255,0.04); border-radius: 11px; border: 1px solid rgba(255,255,255,0.07); }
        .batch-btn { padding: 5px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; background: transparent; color: rgba(255,255,255,0.38); border: none; cursor: pointer; font-family: 'Manrope', sans-serif; transition: all 0.18s; }
        .batch-btn.active { background: #7c3aed; color: #fff; }
        .day-sel { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .day-btns { display: flex; gap: 6px; }
        .day-btn { width: 46px; height: 46px; border-radius: 13px; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.07); cursor: pointer; transition: all 0.2s cubic-bezier(.22,1,.36,1); display: flex; align-items: center; justify-content: center; }
        .day-btn.active { background: linear-gradient(135deg,#7c3aed,#a855f7); color: #fff; border-color: rgba(124,58,237,0.6); box-shadow: 0 6px 24px rgba(124,58,237,0.4); transform: scale(1.08); }
        .nav-arrow { width: 36px; height: 36px; border-radius: 10px; font-size: 20px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.15s; }
        .tt-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px,1fr)); gap: 12px; }
        .sk-card { height: 210px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%); animation: shimmer 1.8s infinite linear; background-size: 600px 100%; }
        .legend { display: flex; gap: 16px; margin-bottom: 18px; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.36); font-family: 'Manrope', sans-serif; }
        .legend-dot { width: 8px; height: 8px; border-radius: 2px; }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes pulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="tt-root">
        <div className="srmx-blob srmx-b1" />
        <div className="srmx-blob srmx-b2" />
        <div className="srmx-grid" />
        <Sidebar />

        <main className="tt-main">
          <header className="tt-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff" }}>Timetable</span>
              <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.38)" }}>
                {weekend ? "Holiday" : `Day Order ${day}`}
              </span>
              {nowItem && !weekend && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", background: "rgba(99,153,255,0.12)", border: "1px solid rgba(99,153,255,0.3)", fontFamily: "'Manrope',sans-serif", fontSize: "11px", color: "#60a5fa", fontWeight: 600 }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s infinite" }} />
                  In class
                </span>
              )}
            </div>
            <div className="batch-toggle">
              {[1, 2].map(b => (
                <button key={b} className={`batch-btn${batch === b ? " active" : ""}`} onClick={() => setBatch(b)}>
                  Batch {b}
                </button>
              ))}
            </div>
          </header>

          <div style={{ padding: "24px 28px 80px" }}>
            {/* Day selector */}
            <div className="day-sel">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.28)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>Day Order</span>
                <div className="day-btns">
                  {[1,2,3,4,5].map(d => (
                    <button key={d} className={`day-btn${day === d ? " active" : ""}`} onClick={() => setDay(d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                {[{ ic: "‹", fn: () => setDay(d => d > 1 ? d - 1 : 5) }, { ic: "›", fn: () => setDay(d => d < 5 ? d + 1 : 1) }].map(({ ic, fn }) => (
                  <button key={ic} className="nav-arrow" onClick={fn}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Title + stats */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.22)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                  {weekend ? "Weekend — No classes" : "Schedule for"}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "38px", fontWeight: 300, color: "rgba(255,255,255,0.85)", letterSpacing: "-1px", lineHeight: 1 }}>
                  Day <span style={{ fontWeight: 800, color: "#fff" }}>{day}</span>
                </div>
              </div>
              {!loading && classes.length > 0 && (
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
                  {thryCnt > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>Theory</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "26px", fontWeight: 800, color: "#60a5fa", lineHeight: 1 }}>{thryCnt}</div>
                    </div>
                  )}
                  {labCnt > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>Labs</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "26px", fontWeight: 800, color: "#a78bfa", lineHeight: 1 }}>{labCnt}</div>
                    </div>
                  )}
                  {nxtItem && !nowItem && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>Next at</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "26px", fontWeight: 800, color: "#f472b6", lineHeight: 1 }}>{fmtH(nxtItem.startTime)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            {!loading && classes.length > 0 && (
              <div className="legend">
                {(["theory", "lab", "practical"] as const).filter(tp => classes.some(c => c.type === tp)).map(tp => (
                  <div key={tp} className="legend-item">
                    <div className="legend-dot" style={{ background: TC[tp].accent, opacity: 0.85 }} />
                    {TC[tp].label}
                  </div>
                ))}
              </div>
            )}

            {/* Cards */}
            {loading ? (
              <div className="tt-cards">
                {[...Array(4)].map((_, i) => <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.12}s` }} />)}
              </div>
            ) : classes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", animation: "fadeUp 0.5s ease" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>No classes — Day {day}</div>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.28)" }}>Enjoy your free time!</div>
              </div>
            ) : (
              <div className="tt-cards">
                {classes.map((item, i) => {
                  const active = !weekend && isNowIn(item.startTime, item.endTime);
                  return (
                    <ClassCard
                      key={`${item.course["Course Code"]}-${item.type}-${i}`}
                      item={item} idx={i} active={active}
                      cRef={active ? nowRef : undefined}
                    />
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
