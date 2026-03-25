"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface AttendanceCourse {
  "Course Code": string; "Course Title": string; "Faculty Name": string;
  "Slot": string; "Room No": string; "Category": string;
  "Attn %": string; "Hours Conducted": string; "Hours Absent": string;
}
interface MyTimetableCourse {
  courseCode: string; courseTitle: string; courseType: string;
  category: string; facultyName: string; slot: string;
  slots: string[]; roomNo: string; credit: string;
}
interface ScheduleItem {
  slot: string; startTime: string; endTime: string;
  courseTitle: string; courseCode: string; courseType: string;
  facultyName: string; roomNo: string; category: string;
  attn: number; hoursConducted: number; hoursAbsent: number;
  type: "theory" | "lab" | "practical";
}

// ─── SLOT → COURSE MAP BUILDER ───────────────────────────────────────────────
function buildSlotToCourseMap(myTT: MyTimetableCourse[]) {
  const map: Record<string, MyTimetableCourse> = {};
  myTT.forEach(c => {
    c.slots.forEach(s => {
      if (s) map[s.toUpperCase()] = c;
    });
  });
  return map;
}

// ─── ATTENDANCE LOOKUP ───────────────────────────────────────────────────────
function findAttendance(code: string, courseType: string, atts: AttendanceCourse[]) {
  return atts.find(a => {
    const aCode = a["Course Code"] || "";
    const aCat = (a["Category"] || "").toLowerCase();
    const isLabType = courseType.toLowerCase().includes("practical") || courseType.toLowerCase().includes("lab");
    return aCode === code && (isLabType ? aCat.includes("practical") : !aCat.includes("practical"));
  }) || atts.find(a => a["Course Code"] === code);
}

// ─── SCHEDULE BUILDER ────────────────────────────────────────────────────────
function buildSchedule(
  gridRows: any[],
  slotMap: Record<string, MyTimetableCourse>,
  attendance: AttendanceCourse[]
): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find(r => r[0] === "FROM");
  const times: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter(r => typeof r[0] === "string" && r[0].startsWith("Day"));

  return dayRows.map(row => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    const seenCourses = new Set<string>();

    // Process lab/practical slots: look up EACH P/L slot individually, group consecutive same-course slots
    type LabCell = { idx: number; slot: string; course: MyTimetableCourse };
    const labCells: LabCell[] = [];
    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      const up = s?.toUpperCase() || "";
      if (!s || !/^[PL]\d+$/i.test(up)) return;
      const course = slotMap[up];
      if (course) labCells.push({ idx: ci, slot: up, course });
    });

    // Group consecutive cells with the same courseCode+courseType
    const labGroups: { cells: LabCell[] }[] = [];
    for (let i = 0; i < labCells.length; i++) {
      const cell = labCells[i];
      const prev = i > 0 ? labCells[i - 1] : null;
      const sameGroup = prev &&
        prev.course.courseCode === cell.course.courseCode &&
        prev.course.courseType === cell.course.courseType &&
        cell.idx === prev.idx + 1;
      if (sameGroup) {
        labGroups[labGroups.length - 1].cells.push(cell);
      } else {
        labGroups.push({ cells: [cell] });
      }
    }

    labGroups.forEach(group => {
      const course = group.cells[0].course;
      const startTime = times[group.cells[0].idx] || "";
      const endTime = times[group.cells[group.cells.length - 1].idx] || "";
      const att = findAttendance(course.courseCode, course.courseType, attendance);
      const attn = att ? parseFloat(att["Attn %"]) || 0 : 0;
      const hoursConducted = att ? parseInt(att["Hours Conducted"]) || 0 : 0;
      const hoursAbsent = att ? parseInt(att["Hours Absent"]) || 0 : 0;
      const isPrac = /practical|workshop/i.test(course.courseType || course.category || "");

      classes.push({
        slot: group.cells.map(c => c.slot).join("-"),
        startTime, endTime,
        courseTitle: course.courseTitle,
        courseCode: course.courseCode,
        courseType: course.courseType,
        facultyName: course.facultyName,
        roomNo: course.roomNo,
        category: course.category,
        attn, hoursConducted, hoursAbsent,
        type: isPrac ? "practical" : "lab",
      });
    });

    // Process theory slots
    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      if (/^[PL]\d+$/i.test(up)) return; // Skip lab slots

      // Handle "A / X" format — take first letter
      const parts = up.split("/").map(p => p.trim());
      for (const part of parts) {
        const letter = part.replace(/[^A-Z]/g, "");
        if (!letter || letter === "X") continue;

        const course = slotMap[letter];
        if (!course) continue;

        const key = `${course.courseCode}-theory-${ci}`;
        if (seenCourses.has(key)) continue;
        seenCourses.add(key);

        const time = times[ci] || "";
        const att = findAttendance(course.courseCode, course.courseType, attendance);
        const attn = att ? parseFloat(att["Attn %"]) || 0 : 0;
        const hoursConducted = att ? parseInt(att["Hours Conducted"]) || 0 : 0;
        const hoursAbsent = att ? parseInt(att["Hours Absent"]) || 0 : 0;

        classes.push({
          slot: s,
          startTime: time, endTime: time,
          courseTitle: course.courseTitle,
          courseCode: course.courseCode,
          courseType: course.courseType,
          facultyName: course.facultyName,
          roomNo: course.roomNo,
          category: course.category,
          attn, hoursConducted, hoursAbsent,
          type: "theory",
        });
        break; // Only map first valid letter per cell
      }
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

// ─── TIME UTILS ───────────────────────────────────────────────────────────────
// SRM timetable uses 12-hour format: hours 1-7 are PM (13-19)
function to24(h: number): number { return (h >= 1 && h <= 7) ? h + 12 : h; }
function parseStart(t: string): number { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEndTime(t: string): number { const parts = t.split(/\s*[-–]\s*/); const last = (parts[parts.length - 1] || "").trim(); const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function isNowIn(s: string, e: string): boolean { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(s) && now <= parseEndTime(e); }
function fmt12(t: string): string { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "PM" : "AM"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]} ${suffix}`; }
function fmtRange(s: string, e: string): string { const a = fmt12(s); const parts = e.split(/\s*[-–]\s*/); const b = fmt12(parts[parts.length - 1] || e); return a === b ? a : `${a} – ${b}`; }
function slotMins(s: string, e: string): number { return Math.max(0, parseEndTime(e) - parseStart(s)); }

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

function ClassCard({ item, idx, active, cRef }: { item: ScheduleItem; idx: number; active: boolean; cRef?: React.RefObject<HTMLDivElement | null> }) {
  const cfg = TC[item.type] || TC.theory;
  const attn = item.attn;
  const cond = item.hoursConducted;
  const abs = item.hoursAbsent;
  const pres = cond - abs;
  const need = cond > 0 ? Math.max(0, Math.ceil((0.75 * cond - pres) / 0.25)) : 0;
  const skip = cond > 0 ? Math.max(0, Math.floor((pres - 0.75 * cond) / 0.75)) : 0;
  const { color: ac, label: al } = attnInfo(attn);
  const isRisk = attn > 0 && attn < 75;
  const mins = slotMins(item.startTime, item.endTime);
  const multi = mins > 58;
  const fac = (item.facultyName || "").replace(/\s*\(\d+\)/, "");
  const room = item.roomNo || "TBA";

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
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: cfg.accent }} />
      {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${cfg.accent}aa,transparent)` }} />}

      <div style={{ padding: "13px 14px 10px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "9px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}40`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800 }}>{cfg.icon}</span>
            {cfg.label}
          </span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontFamily: "monospace", background: "rgba(255,255,255,0.04)", padding: "1px 7px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.07)" }}>{item.slot}</span>
          {active && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", background: "rgba(99,153,255,0.15)", border: "1px solid rgba(99,153,255,0.4)", fontSize: "10px", fontWeight: 700, color: "#60a5fa", marginLeft: "auto" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s infinite" }} />
              NOW
            </span>
          )}
        </div>

        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.4, marginBottom: "3px" }}>{item.courseTitle}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.24)", fontFamily: "monospace", marginBottom: "9px" }}>{item.courseCode}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "9px" }}>
          {[{ icon: "person", text: fac }, { icon: "room", text: `Room ${room}` }].map(({ icon, text }) => (
            <div key={icon} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                {icon === "person"
                  ? <><circle cx="6" cy="4" r="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/></>
                  : <><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.1" strokeLinecap="round"/></>
                }
              </svg>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.42)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.055)", margin: "0 14px 0 18px" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 12px 18px" }}>
        <div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>Time</div>
          <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{fmtRange(item.startTime, item.endTime)}</div>
          {multi && <div style={{ fontSize: "9px", color: cfg.accent, marginTop: "2px" }}>{Math.round(mins / 55)} hr session</div>}
        </div>
        {attn > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.22)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>Attendance</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: ac }}>{al}</div>
              <div style={{ fontSize: "10px", marginTop: "2px" }}>
                {isRisk ? <span style={{ color: "#f87171" }}>Need {need} more</span> : <span style={{ color: "#22c55e" }}>{skip} can skip</span>}
              </div>
            </div>
            <Ring pct={attn} />
          </div>
        ) : <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>No data</span>}
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
  const [gridRows, setGridRows] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceCourse[]>([]);
  const [myTT, setMyTT] = useState<MyTimetableCourse[]>([]);
  const [batch, setBatch] = useState(1);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  useEffect(() => {
    const today = new Date().getDay();
    const map: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
    if (map[today]) setDay(map[today]);
  }, []);
  const nowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const weekend = [0, 6].includes(new Date().getDay());

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("srmx_token")) { router.push("/"); return; }
    setLoading(true);
    Promise.all([dataAPI.getTimetable(batch), dataAPI.getAttendance(), dataAPI.getMyTimetable()])
      .then(([tt, att, mytt]) => {
        setGridRows(tt.data || []);
        setAttendance(att.data || []);
        setMyTT(mytt.data || []);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [batch]);

  useEffect(() => {
    const t = setTimeout(() => nowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    return () => clearTimeout(t);
  }, [day, loading]);

  const slotMap = buildSlotToCourseMap(myTT);
  const schedule = buildSchedule(gridRows, slotMap, attendance);
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
        .tt-topbar-left { display: flex; align-items: center; gap: 14px; min-width: 0; overflow: hidden; }
        .tt-topbar-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; }
        .tt-topbar-divider { width: 1px; height: 14px; background: rgba(255,255,255,0.1); flex-shrink: 0; }
        .tt-topbar-sub { font-size: 12px; color: rgba(255,255,255,0.38); white-space: nowrap; }
        .tt-inclass { display: inline-flex; align-items: center; gap: 5px; padding: 2px 10px; border-radius: 999px; background: rgba(99,153,255,0.12); border: 1px solid rgba(99,153,255,0.3); font-size: 11px; color: #60a5fa; font-weight: 600; white-space: nowrap; }

        .batch-toggle { display: flex; padding: 3px; gap: 3px; background: rgba(255,255,255,0.04); border-radius: 11px; border: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .batch-btn { padding: 5px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; background: transparent; color: rgba(255,255,255,0.38); border: none; cursor: pointer; font-family: 'Manrope', sans-serif; transition: all 0.18s; }
        .batch-btn.active { background: #7c3aed; color: #fff; }

        .tt-body { padding: 24px 28px 80px; }

        .day-sel { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; gap: 12px; }
        .day-sel-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .day-order-label { font-size: 11px; color: rgba(255,255,255,0.28); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; white-space: nowrap; }
        .day-btns { display: flex; gap: 6px; }
        .day-btn { width: 46px; height: 46px; border-radius: 13px; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.07); cursor: pointer; transition: all 0.2s cubic-bezier(.22,1,.36,1); display: flex; align-items: center; justify-content: center; }
        .day-btn.active { background: linear-gradient(135deg,#7c3aed,#a855f7); color: #fff; border-color: rgba(124,58,237,0.6); box-shadow: 0 6px 24px rgba(124,58,237,0.4); transform: scale(1.08); }
        .nav-arrows { display: flex; gap: 5px; flex-shrink: 0; }
        .nav-arrow { width: 36px; height: 36px; border-radius: 10px; font-size: 20px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.45); cursor: pointer; }

        .tt-heading-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
        .tt-day-title { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 300; color: rgba(255,255,255,0.85); letter-spacing: -1px; line-height: 1; }
        .tt-day-title strong { font-weight: 800; color: #fff; }
        .tt-stats { display: flex; gap: 20px; align-items: flex-end; flex-shrink: 0; }
        .tt-stat { text-align: right; }
        .tt-stat-lbl { font-size: 9px; color: rgba(255,255,255,0.22); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px; }
        .tt-stat-val { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; line-height: 1; }

        .legend { display: flex; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.36); }
        .legend-dot { width: 8px; height: 8px; border-radius: 2px; }
        .tt-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px,1fr)); gap: 12px; }
        .sk-card { height: 210px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%); animation: shimmer 1.8s infinite linear; background-size: 600px 100%; }

        @keyframes cardIn  { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes pulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .tt-main { margin-left: 0 !important; padding-bottom: 68px; }
          .tt-topbar { padding: 0 14px; height: 54px; }
          .tt-topbar-divider { display: none; }
          .tt-topbar-sub { display: none; }
          .tt-inclass { padding: 2px 8px; font-size: 10px; }
          .batch-btn { padding: 5px 12px; font-size: 11px; }
          .tt-body { padding: 16px 14px 80px; }
          .day-sel { flex-wrap: wrap; margin-bottom: 18px; }
          .day-order-label { display: none; }
          .day-btn { width: 40px; height: 40px; border-radius: 11px; font-size: 16px; }
          .day-btns { gap: 5px; }
          .tt-heading-row { flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 14px; }
          .tt-day-title { font-size: 26px; }
          .tt-stats { gap: 14px; }
          .tt-stat-val { font-size: 20px; }
          .tt-cards { grid-template-columns: 1fr; gap: 10px; }
          .sk-card { height: 170px; }
        }

        @media (max-width: 380px) {
          .tt-topbar { padding: 0 10px; }
          .tt-body { padding: 12px 10px 80px; }
          .day-btn { width: 36px; height: 36px; font-size: 14px; border-radius: 9px; }
          .day-btns { gap: 4px; }
          .batch-btn { padding: 4px 10px; }
        }
      `}</style>

      <div className="tt-root">
        <div className="srmx-blob srmx-b1" />
        <div className="srmx-blob srmx-b2" />
        <div className="srmx-grid" />
        <Sidebar />

        <main className="tt-main">
          <header className="tt-topbar">
            <div className="tt-topbar-left">
              <span className="tt-topbar-title">Timetable</span>
              <div className="tt-topbar-divider" />
              <span className="tt-topbar-sub">{weekend ? "Holiday" : `Day Order ${day}`}</span>
              {nowItem && !weekend && (
                <span className="tt-inclass">
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

          <div className="tt-body">
            <div className="day-sel">
              <div className="day-sel-left">
                <span className="day-order-label">Day Order</span>
                <div className="day-btns">
                  {[1, 2, 3, 4, 5].map(d => (
                    <button key={d} className={`day-btn${day === d ? " active" : ""}`} onClick={() => setDay(d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="nav-arrows">
                {[{ ic: "‹", fn: () => setDay(d => d > 1 ? d - 1 : 5) }, { ic: "›", fn: () => setDay(d => d < 5 ? d + 1 : 1) }].map(({ ic, fn }) => (
                  <button key={ic} className="nav-arrow" onClick={fn}>{ic}</button>
                ))}
              </div>
            </div>

            <div className="tt-heading-row">
              <div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                  {weekend ? "Weekend — No classes" : "Schedule for"}
                </div>
                <div className="tt-day-title">Day <strong>{day}</strong></div>
              </div>
              {!loading && classes.length > 0 && (
                <div className="tt-stats">
                  {thryCnt > 0 && <div className="tt-stat"><div className="tt-stat-lbl">Theory</div><div className="tt-stat-val" style={{ color: "#60a5fa" }}>{thryCnt}</div></div>}
                  {labCnt > 0  && <div className="tt-stat"><div className="tt-stat-lbl">Labs</div><div className="tt-stat-val" style={{ color: "#a78bfa" }}>{labCnt}</div></div>}
                  {nxtItem && !nowItem && <div className="tt-stat"><div className="tt-stat-lbl">Next at</div><div className="tt-stat-val" style={{ color: "#f472b6" }}>{fmt24(nxtItem.startTime)}</div></div>}
                </div>
              )}
            </div>

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

            {loading ? (
              <div className="tt-cards">
                {[...Array(4)].map((_, i) => <div key={i} className="sk-card" style={{ animationDelay: `${i * 0.12}s` }} />)}
              </div>
            ) : classes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", animation: "fadeUp 0.5s ease" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>No classes — Day {day}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.28)" }}>Enjoy your free time!</div>
              </div>
            ) : (
              <div className="tt-cards">
                {classes.map((item, i) => {
                  const active = !weekend && isNowIn(item.startTime, item.endTime);
                  return (
                    <ClassCard
                      key={`${item.courseCode}-${item.type}-${i}`}
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
