"use client";
import { useEffect, useState } from "react";

export default function AttendanceCard({ course }: { course: any }) {
  const pct = parseFloat(course["Attn %"]) || 0;
  const conducted = parseInt(course["Hours Conducted"]) || 0;
  const absent = parseInt(course["Hours Absent"]) || 0;
  const present = conducted - absent;
  const required = Math.ceil((0.75 * conducted - present) / 0.25);
  const margin = Math.floor((present - 0.75 * conducted) / 0.75);
  const isAtRisk = pct < 75;

  const [animPct, setAnimPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      const steps = 60;
      const inc = pct / steps;
      let cur = 0;
      const iv = setInterval(() => {
        cur += inc;
        if (cur >= pct) { setAnimPct(pct); clearInterval(iv); }
        else setAnimPct(cur);
      }, 1500 / steps);
      return () => clearInterval(iv);
    }, 100);
    return () => clearTimeout(t);
  }, [pct]);

  const color = pct >= 75 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (animPct / 100) * circ;

  return (
    <>
      <style>{`
        .att-card {
          border-radius: 16px;
          padding: 20px;
          background: var(--card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          transition: all 0.5s ease, opacity 0.5s, transform 0.5s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .att-card:hover {
          border-color: rgba(108,99,255,0.3);
          box-shadow: 0 8px 32px rgba(108,99,255,0.08);
        }
        .att-card-inner {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .att-ring-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          flex-shrink: 0;
        }
        .att-info { flex: 1; min-width: 0; }
        .att-title {
          font-weight: 600;
          font-size: 14px;
          color: #f4f4f5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .att-pills { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }

        /* ── MOBILE ── */
        @media (max-width: 480px) {
          .att-card { padding: 16px; }
          .att-card-inner { gap: 14px; }
          .att-ring-wrap { width: 72px; height: 72px; }
          .att-ring-wrap svg { width: 72px; height: 72px; }
          .att-ring-pct { font-size: 13px !important; }
          .att-title { font-size: 13px; }
          .att-pills { gap: 5px; }
        }
      `}</style>

      <div className="att-card"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <div className="att-card-inner">
          {/* Animated ring */}
          <div className="att-ring-wrap">
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ filter: `drop-shadow(0 0 8px ${color}50)`, transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="att-ring-pct" style={{ fontSize: "18px", fontWeight: 700, color }}>{Math.round(animPct)}%</span>
            </div>
          </div>

          {/* Info */}
          <div className="att-info">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="att-title">{course["Course Title"]}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{course["Course Code"]}</div>
              </div>
              <span style={{
                padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 500,
                flexShrink: 0, marginLeft: "8px",
                background: pct >= 75 ? "rgba(34,197,94,0.1)" : pct >= 65 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                color: pct >= 75 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444",
              }}>
                {pct >= 75 ? "Safe" : pct >= 65 ? "Warning" : "Critical"}
              </span>
            </div>

            {/* P / A / T pills */}
            <div className="att-pills">
              {[{ l: "P", v: present, c: "#22c55e" }, { l: "A", v: absent, c: "#ef4444" }, { l: "T", v: conducted, c: "#60a5fa" }].map(x => (
                <span key={x.l} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px" }}>
                  <span style={{ color: x.c, fontWeight: 600 }}>{x.l}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{x.v}</span>
                </span>
              ))}
            </div>

            {/* Required / margin */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: isAtRisk ? "#ef4444" : "#22c55e", lineHeight: 1 }}>
                {isAtRisk ? required : margin}
              </span>
              <span style={{ fontSize: "11px", color: isAtRisk ? "#ef4444" : "#22c55e", fontWeight: 500 }}>
                {isAtRisk ? "classes needed" : "classes margin"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
