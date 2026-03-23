"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Course {
  "Course Code": string;
  "Course Title": string;
  "Faculty Name": string;
  "Slot": string;
  "Room No": string;
  "Category": string;
  "Attn %": string;
  "Hours Conducted": string;
  "Hours Absent": string;
}
interface ScheduleItem {
  slot: string;
  startTime: string;
  endTime: string;
  course: Course;
  type: "theory" | "lab" | "practical";
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT MAP
// Separates attendance into:
//   letterMap  : "B" → Course, "C" → Course … (theory / lab-based-theory)
//   labCourses : ordered list of P-slot courses (lab / practical)
// ─────────────────────────────────────────────────────────────────────────────
function buildSlotMap(attendance: Course[]) {
  const letterMap: Record<string, Course> = {};
  const labCourses: Course[] = [];

  attendance.forEach(c => {
    const raw = c["Slot"]?.trim() || "";
    if (!raw) return;

    if (/P\d+/i.test(raw)) {
      // P-slot course (lab / practical) — store once, in order
      labCourses.push(c);
    } else {
      // Theory or lab-based-theory — register each base letter
      raw.toUpperCase().split("/").forEach(part => {
        const letter = part.trim().replace(/[^A-Z]/g, "")[0];
        if (letter && letter !== "X") letterMap[letter] = c;
      });
    }
  });

  // Debug: log what we parsed
  if (typeof window !== "undefined") {
    console.log("[SRMX] letterMap keys:", Object.keys(letterMap));
    console.log("[SRMX] labCourses:", labCourses.map(c => `${c["Course Title"]} (${c["Slot"]})`));
  }

  return { letterMap, labCourses };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE BUILDER
//
// HOW LAB SLOTS WORK:
//   The unified timetable has P-cells (P6,P7,P8… or P26,P27… etc).
//   These are just "this period is a lab block".
//   We group CONSECUTIVE P-cells per day into "sessions".
//   Each session gets the NEXT lab course from labCourses[].
//   The session card shows startTime of first P-cell → endTime of last P-cell.
//
// Example DO3:  P26 P27 P28  →  one session (3 consecutive) → Chemistry Lab
//         DO5:  P46 P47 P48 P49 P50 → one session (5 consecutive) → Workshop
//         DO1:  P6 P7 P8 P9 P10  →  split into sessions per labCourses order
//
// THEORY DEDUP:
//   Same letter + same time = same slot (A and A/X column) → show once
//   Same letter + different time = genuinely repeated slot → show each
// ─────────────────────────────────────────────────────────────────────────────
function buildSchedule(
  rows: any[],
  letterMap: Record<string, Course>,
  labCourses: Course[]
): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = rows.find(r => r[0] === "FROM");
  const times: string[] = timeRow
    ? timeRow.slice(1).map((t: string) =>
        t.replace(/\t/g, "").trim().replace(/\n+/g, " ")
      )
    : [];

  const dayRows = rows.filter(
    r => typeof r[0] === "string" && r[0].startsWith("Day")
  );

  return dayRows.map((row, dayIndex) => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];

    // ── STEP 1: collect all P-cell groups (consecutive runs) ──
    // A "run" = consecutive P-cells in this day's columns
    type Run = { startTime: string; endTime: string; slot: string };
    const runs: Run[] = [];
    let inRun = false;
    let runStart = "";
    let runEnd   = "";
    let runSlot  = "";

    cells.forEach((cell, ci) => {
      const s  = cell?.trim();
      const up = s?.toUpperCase() || "";
      const isP = s && /^P\d+$/i.test(up) && up[0] === "P";

      if (isP) {
        if (!inRun) {
          inRun    = true;
          runStart = times[ci] || "";
          runSlot  = s;
        }
        runEnd = times[ci] || "";
      } else {
        if (inRun) {
          runs.push({ startTime: runStart, endTime: runEnd, slot: runSlot });
          inRun = false;
        }
      }
    });
    if (inRun) runs.push({ startTime: runStart, endTime: runEnd, slot: runSlot });

    // ── STEP 2: assign lab courses to runs sequentially ──
    runs.forEach((run, ri) => {
      const course = labCourses[ri % Math.max(labCourses.length, 1)];
      if (!course) return;
      const isPrac = /practical|workshop/i.test(course["Category"] || "");
      classes.push({
        slot: run.slot,
        startTime: run.startTime,
        endTime: run.endTime,
        course,
        type: isPrac ? "practical" : "lab",
      });
    });

    // Debug
    if (typeof window !== "undefined") {
      console.log(`[SRMX] Day ${dayIndex+1} P-runs:`, runs.length, runs);
    }

    // ── STEP 3: theory / lab-based-theory cells ──
    const seenKeys = new Set<string>(); // letter__time

    cells.forEach((cell, ci) => {
      const s  = cell?.trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      const fc = up[0];

      // Skip L-slots and P-slots (already handled)
      if (fc === "L") return;
      if (/^P\d+$/i.test(up)) return;

      // Extract base letter
      const baseLetter = up.split("/")[0].trim().replace(/[^A-Z]/g, "")[0] || "";
      if (!baseLetter || baseLetter === "X") return;

      const course = letterMap[baseLetter];
      if (!course) return;

      const time = times[ci] || "";
      const key  = `${baseLetter}__${time}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      classes.push({
        slot: s, startTime: time, endTime: time,
        course, type: "theory",
      });
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME UTILS
// ─────────────────────────────────────────────────────────────────────────────
function parseStart(t: string): number {
  const m = t.match(/(\d+):(\d+)/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0;
}
function parseEndTime(t: string): number {
  const parts = t.split(/\s*[-–]\s*/);
  const last  = (parts[parts.length - 1] || "").trim();
  const m     = last.match(/(\d+):(\d+)/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0;
}
function isNowIn(s: string, e: string): boolean {
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  return now >= parseStart(s) && now <= parseEndTime(e);
}
function fmtH(t: string): string {
  const m = t.match(/(\d+):(\d+)/);
  return m ? `${parseInt(m[1])}:${m[2]}` : t;
}
function fmtRange(s: string, e: string): string {
  const a = fmtH(s);
  const parts = e.split(/\s*[-–]\s*/);
  const b = fmtH(parts[parts.length - 1] || e);
  return a === b ? a : `${a} – ${b}`;
}
function slotMins(s: string, e: string): number {
  return Math.max(0, parseEndTime(e) - parseStart(s));
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
function attnInfo(pct: number) {
  if (!pct)      return { color: "#52525b", label: "No data" };
  if (pct >= 85) return { color: "#10b981", label: "Excellent" };
  if (pct >= 75) return { color: "#22c55e", label: "Safe" };
  if (pct >= 65) return { color: "#f59e0b", label: "At risk" };
  return           { color: "#ef4444",  label: "Critical" };
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TC = {
  theory:    { accent: "#60a5fa", bg: "rgba(96,165,250,0.1)",  label: "Theory",    icon: "T" },
  lab:       { accent: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Lab",       icon: "L" },
  practical: { accent: "#f472b6", bg: "rgba(244,114,182,0.1)", label: "Practical", icon: "P" },
};

// ─────────────────────────────────────────────────────────────────────────────
// RING
// ─────────────────────────────────────────────────────────────────────────────
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
        style={{ fontSize: "9px", fontWeight: 700, fontFamily: "inherit" }}>
        {pct > 0 ? `${Math.round(pct)}%` : "–"}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS CARD
// ─────────────────────────────────────────────────────────────────────────────
function ClassCard({ item, idx, active, cRef }: {
  item: ScheduleItem; idx: number; active: boolean;
  cRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const cfg  = TC[item.type] || TC.theory;
  const attn = parseFloat(item.course["Attn %"]) || 0;
  const cond = parseInt(item.course["Hours Conducted"]) || 0;
  const abs  = parseInt(item.course["Hours Absent"]) || 0;
  const pres = cond - abs;
  const need = cond > 0 ? Math.max(0, Math.ceil((0.75 * cond - pres) / 0.25)) : 0;
  const skip = cond > 0 ? Math.max(0, Math.floor((pres - 0.75 * cond) / 0.75)) : 0;
  const { color: ac, label: al } = attnInfo(attn);
  const isRisk = attn > 0 && attn < 75;
  const mins   = slotMins(item.startTime, item.endTime);
  const multi  = mins > 58;
  const fac    = (item.course["Faculty Name"] || "").replace(/\s*\(\d+\)/, "");
  const room   = item.course["Room No"] || "TBA";

  return (
    <div ref={cRef}
      style={{
        borderRadius: "18px", overflow: "hidden", position: "relative",
        background: active
          ? "linear-gradient(150deg,rgba(108,99,255,0.15) 0%,rgba(12,12,22,0.95) 55%)"
          : "rgba(13,13,21,0.85)",
        border: active
          ? "1px solid rgba(108,99,255,0.55)"
          : "1px solid rgba(255,255,255,0.068)",
        boxShadow: active
          ? "0 0 0 1px rgba(108,99,255,0.14),0 8px 32px rgba(108,99,255,0.18)"
          : "none",
        backdropFilter: "blur(20px)",
        animation: "cardIn 0.42s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${idx * 0.055}s`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = active
          ? "0 0 0 1px rgba(108,99,255,0.22),0 16px 40px rgba(108,99,255,0.24)"
          : `0 12px 36px rgba(0,0,0,0.55),0 0 0 1px ${cfg.accent}28`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = active
          ? "0 0 0 1px rgba(108,99,255,0.14),0 8px 32px rgba(108,99,255,0.18)"
          : "none";
      }}
    >
      {/* Left accent stripe */}
      <div style={{ position:"absolute",left:0,top:0,bottom:0,width:"3px",background:cfg.accent,borderRadius:"0 2px 2px 0" }}/>

      {/* Active top glow */}
      {active && <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg,transparent,${cfg.accent}aa,transparent)` }}/>}

      {/* Multi-slot dots */}
      {multi && (
        <div style={{ position:"absolute",top:12,right:14,display:"flex",gap:"3px" }}>
          {[0.35,0.6,0.9].map((o,k) => (
            <div key={k} style={{ width:"5px",height:"5px",borderRadius:"50%",background:cfg.accent,opacity:o }}/>
          ))}
        </div>
      )}

      {/* Badge row */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 14px 8px 18px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
          <span style={{ display:"inline-flex",alignItems:"center",gap:"4px",padding:"2px 9px",borderRadius:"999px",fontSize:"10px",fontWeight:700,letterSpacing:"0.04em",background:cfg.bg,color:cfg.accent,border:`1px solid ${cfg.accent}35` }}>
            <span style={{ width:"14px",height:"14px",borderRadius:"50%",background:`${cfg.accent}20`,border:`1px solid ${cfg.accent}40`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:800 }}>
              {cfg.icon}
            </span>
            {cfg.label}
          </span>
          <span style={{ fontSize:"10px",color:"rgba(255,255,255,0.28)",fontFamily:"monospace",background:"rgba(255,255,255,0.04)",padding:"1px 7px",borderRadius:"5px",border:"1px solid rgba(255,255,255,0.07)" }}>
            {item.slot}
          </span>
        </div>
        {active && (
          <span style={{ display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 10px",borderRadius:"999px",background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.4)",fontSize:"10px",fontWeight:700,color:"#60a5fa" }}>
            <span style={{ width:"5px",height:"5px",borderRadius:"50%",background:"#3b82f6",animation:"pulse 1.5s infinite" }}/>
            NOW
          </span>
        )}
      </div>

      {/* Title + code */}
      <div style={{ padding:"0 14px 8px 18px" }}>
        <div style={{ fontSize:"14px",fontWeight:600,color:"#f1f5f9",lineHeight:1.4,marginBottom:"3px" }}>
          {item.course["Course Title"]}
        </div>
        <div style={{ fontSize:"10px",color:"rgba(255,255,255,0.24)",fontFamily:"monospace" }}>
          {item.course["Course Code"]}
        </div>
      </div>

      {/* Faculty + Room */}
      <div style={{ padding:"0 14px 11px 18px",display:"flex",flexDirection:"column",gap:"5px" }}>
        <IRow icon="person" text={fac}/>
        <IRow icon="room"   text={`Room ${room}`}/>
      </div>

      <div style={{ height:"1px",background:"rgba(255,255,255,0.055)",margin:"0 14px 0 18px" }}/>

      {/* Footer */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px 12px 18px" }}>
        <div>
          <div style={{ fontSize:"9px",color:"rgba(255,255,255,0.22)",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:"2px" }}>Time</div>
          <div style={{ fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.75)",fontFamily:"monospace" }}>
            {fmtRange(item.startTime, item.endTime)}
          </div>
          {multi && (
            <div style={{ fontSize:"9px",color:cfg.accent,marginTop:"2px",opacity:0.85 }}>
              {Math.round(mins / 55)} hr session
            </div>
          )}
        </div>

        {attn > 0 ? (
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"9px",color:"rgba(255,255,255,0.22)",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:"2px" }}>Attendance</div>
              <div style={{ fontSize:"11px",fontWeight:700,color:ac }}>{al}</div>
              <div style={{ fontSize:"10px",marginTop:"2px" }}>
                {isRisk
                  ? <span style={{ color:"#ef4444" }}>Need {need} more</span>
                  : <span style={{ color:"#22c55e" }}>{skip} can skip</span>}
              </div>
            </div>
            <Ring pct={attn}/>
          </div>
        ) : (
          <span style={{ fontSize:"10px",color:"rgba(255,255,255,0.2)" }}>No data</span>
        )}
      </div>

      {/* Lab duration bar */}
      {multi && (
        <div style={{ height:"2px",margin:"0 18px 11px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${Math.min(100,(mins/240)*100)}%`,background:cfg.accent,borderRadius:"99px",opacity:0.6 }}/>
        </div>
      )}
    </div>
  );
}

function IRow({ icon, text }: { icon:"person"|"room"; text:string }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
      {icon === "person" ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0 }}>
          <circle cx="6" cy="4" r="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
          <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0 }}>
          <rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
          <path d="M4 6h4M6 4v4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
      )}
      <span style={{ fontSize:"11px",color:"rgba(255,255,255,0.44)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON / EMPTY / CHIP
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:"14px" }}>
      {[...Array(4)].map((_,i) => (
        <div key={i} style={{ height:"210px",borderRadius:"18px",border:"1px solid rgba(255,255,255,0.05)",background:"linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%)",backgroundSize:"600px 100%",animation:`shimmer 1.8s ${i*0.12}s infinite linear` }}/>
      ))}
    </div>
  );
}
function Empty({ day }: { day:number }) {
  return (
    <div style={{ textAlign:"center",padding:"80px 0",animation:"fadeUp 0.5s ease" }}>
      <div style={{ fontSize:"48px",marginBottom:"16px" }}>🎉</div>
      <div style={{ fontSize:"18px",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"8px" }}>No classes — Day {day}</div>
      <div style={{ fontSize:"13px",color:"rgba(255,255,255,0.28)" }}>Enjoy your free time!</div>
    </div>
  );
}
function Chip({ label, value, color }: { label:string; value:string|number; color:string }) {
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ fontSize:"9px",color:"rgba(255,255,255,0.22)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"3px" }}>{label}</div>
      <div style={{ fontSize:"24px",fontWeight:800,color,lineHeight:1 }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Course[]>([]);
  const [batch, setBatch]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [day, setDay]               = useState(1);
  const nowRef  = useRef<HTMLDivElement>(null);
  const router  = useRouter();
  const weekend = [0, 6].includes(new Date().getDay());

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) { router.push("/"); return; }
    setLoading(true);
    Promise.all([dataAPI.getTimetable(batch), dataAPI.getAttendance()])
      .then(([tt, att]) => {
        // Debug: log raw API data shape
        if (typeof window !== "undefined") {
          console.log("[SRMX] timetable rows sample:", (tt.data || []).slice(0,3));
          console.log("[SRMX] attendance sample:", (att.data || []).slice(0,3));
        }
        setRows(tt.data || []);
        setAttendance(att.data || []);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [batch]);

  useEffect(() => {
    const t = setTimeout(() =>
      nowRef.current?.scrollIntoView({ behavior:"smooth", block:"center" }), 400);
    return () => clearTimeout(t);
  }, [day, loading]);

  const { letterMap, labCourses } = buildSlotMap(attendance);
  const schedule = buildSchedule(rows, letterMap, labCourses);
  const classes  = schedule[day - 1]?.classes || [];

  const nowMin  = new Date().getHours() * 60 + new Date().getMinutes();
  const nowItem = classes.find(c => isNowIn(c.startTime, c.endTime));
  const nxtItem = classes.find(c => parseStart(c.startTime) > nowMin);
  const labCnt  = classes.filter(c => c.type !== "theory").length;
  const thryCnt = classes.filter(c => c.type === "theory").length;

  return (
    <div style={{ minHeight:"100vh",background:"#08080f",color:"#f4f4f5",fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* Ambient bg */}
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"5%",left:"20%",width:"700px",height:"700px",borderRadius:"50%",background:"radial-gradient(circle,rgba(108,99,255,0.065) 0%,transparent 65%)" }}/>
        <div style={{ position:"absolute",bottom:"5%",right:"5%",width:"500px",height:"500px",borderRadius:"50%",background:"radial-gradient(circle,rgba(244,114,182,0.04) 0%,transparent 65%)" }}/>
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",backgroundSize:"64px 64px" }}/>
      </div>

      <Sidebar/>

      <main style={{ paddingLeft:"272px",position:"relative",zIndex:1,minHeight:"100vh" }}>

        {/* Header */}
        <header style={{ position:"sticky",top:0,zIndex:20,height:"60px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",background:"rgba(8,8,15,0.9)",backdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.055)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"14px" }}>
            <span style={{ fontSize:"15px",fontWeight:700,letterSpacing:"-0.02em" }}>Timetable</span>
            <div style={{ width:"1px",height:"14px",background:"rgba(255,255,255,0.1)" }}/>
            <span style={{ fontSize:"12px",color:"rgba(255,255,255,0.38)" }}>
              {weekend ? "Holiday" : `Day Order ${day}`}
            </span>
            {nowItem && !weekend && (
              <span style={{ display:"inline-flex",alignItems:"center",gap:"5px",padding:"2px 10px",borderRadius:"999px",background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)",fontSize:"11px",color:"#60a5fa",fontWeight:600 }}>
                <span style={{ width:"5px",height:"5px",borderRadius:"50%",background:"#3b82f6",animation:"pulse 1.5s infinite" }}/>
                In class
              </span>
            )}
          </div>
          <div style={{ display:"flex",padding:"3px",gap:"3px",background:"rgba(255,255,255,0.04)",borderRadius:"11px",border:"1px solid rgba(255,255,255,0.07)" }}>
            {[1,2].map(b => (
              <button key={b} onClick={() => setBatch(b)} style={{ padding:"5px 20px",borderRadius:"8px",fontSize:"12px",fontWeight:600,background:batch===b?"#6c63ff":"transparent",color:batch===b?"#fff":"rgba(255,255,255,0.38)",border:"none",cursor:"pointer",transition:"all 0.18s",fontFamily:"inherit" }}>
                Batch {b}
              </button>
            ))}
          </div>
        </header>

        <div style={{ padding:"28px 28px 80px" }}>

          {/* Day selector */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"32px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
              <span style={{ fontSize:"11px",color:"rgba(255,255,255,0.28)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:500 }}>Day Order</span>
              <div style={{ display:"flex",gap:"6px" }}>
                {[1,2,3,4,5].map(d => {
                  const on = day===d;
                  return (
                    <button key={d} onClick={()=>setDay(d)} style={{ width:"46px",height:"46px",borderRadius:"14px",fontSize:"16px",fontWeight:800,background:on?"linear-gradient(135deg,#6c63ff,#9b8fff)":"rgba(255,255,255,0.04)",color:on?"#fff":"rgba(255,255,255,0.32)",border:on?"1px solid rgba(108,99,255,0.6)":"1px solid rgba(255,255,255,0.07)",cursor:"pointer",transition:"all 0.2s cubic-bezier(.22,1,.36,1)",boxShadow:on?"0 6px 24px rgba(108,99,255,0.4),inset 0 1px 0 rgba(255,255,255,0.2)":"none",transform:on?"scale(1.08)":"scale(1)",fontFamily:"inherit" }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display:"flex",gap:"6px" }}>
              {[{ic:"‹",fn:()=>setDay(d=>d>1?d-1:5)},{ic:"›",fn:()=>setDay(d=>d<5?d+1:1)}].map(({ic,fn})=>(
                <button key={ic} onClick={fn} style={{ width:"36px",height:"36px",borderRadius:"10px",fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.45)",cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit" }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Title + stats */}
          <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"22px" }}>
            <div>
              <div style={{ fontSize:"10px",color:"rgba(255,255,255,0.22)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"6px" }}>
                {weekend ? "Weekend — No classes" : "Showing schedule for"}
              </div>
              <h2 style={{ fontSize:"38px",fontWeight:300,color:"rgba(255,255,255,0.88)",letterSpacing:"-0.025em",lineHeight:1,margin:0 }}>
                Day <span style={{ fontWeight:800,color:"#fff" }}>{day}</span>
              </h2>
            </div>
            {!loading && classes.length > 0 && (
              <div style={{ display:"flex",gap:"20px",alignItems:"flex-end" }}>
                {thryCnt > 0 && <Chip label="Theory" value={thryCnt} color="#60a5fa"/>}
                {labCnt  > 0 && <Chip label="Labs"   value={labCnt}  color="#a78bfa"/>}
                {nxtItem && !nowItem && <Chip label="Next at" value={fmtH(nxtItem.startTime)} color="#f472b6"/>}
              </div>
            )}
          </div>

          {/* Legend */}
          {!loading && classes.length > 0 && (
            <div style={{ display:"flex",gap:"16px",marginBottom:"20px" }}>
              {(["theory","lab","practical"] as const)
                .filter(tp => classes.some(c=>c.type===tp))
                .map(tp => (
                  <div key={tp} style={{ display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",color:"rgba(255,255,255,0.36)" }}>
                    <div style={{ width:"8px",height:"8px",borderRadius:"2px",background:TC[tp].accent,opacity:0.85 }}/>
                    {TC[tp].label}
                  </div>
                ))}
            </div>
          )}

          {/* Cards */}
          {loading ? <Skeleton/> : classes.length===0 ? <Empty day={day}/> : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:"14px" }}>
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes cardIn  { from{opacity:0;transform:translateY(18px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}