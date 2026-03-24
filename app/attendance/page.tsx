"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function AttendancePage() {
  const [att, setAtt] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    dataAPI.getAttendance()
      .then(d => { setAtt(d.data || []); setLoading(false); })
      .catch(() => router.push("/"));
  }, []);

  const filtered = att.filter(c =>
    filter === "all" ? true : filter === "safe" ? parseFloat(c["Attn %"]) >= 75 : parseFloat(c["Attn %"]) < 75
  );

  const safeCount = att.filter(c => parseFloat(c["Attn %"]) >= 75).length;
  const riskCount = att.filter(c => parseFloat(c["Attn %"]) < 75).length;
  const avgAtt = att.length
    ? (att.reduce((s, c) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";

  const filters = [
    { key: "all",  label: "All",     count: att.length },
    { key: "safe", label: "Safe",    count: safeCount  },
    { key: "risk", label: "At Risk", count: riskCount  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .att-root { min-height: 100vh; background: #07070e; font-family: 'DM Sans', sans-serif; }
        .att-main { padding-left: 272px; position: relative; z-index: 1; }

        .att-topbar { position: sticky; top: 0; height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; background: rgba(7,7,14,0.88); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 10; }
        .att-topbar-left { display: flex; align-items: center; gap: 12px; }
        .att-topbar-icon { width: 34px; height: 34px; border-radius: 10px; background: rgba(245,166,35,0.12); display: flex; align-items: center; justify-content: center; }
        .att-topbar-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }

        .att-filters { display: flex; gap: 6px; }
        .att-filter-btn { padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; display: flex; align-items: center; gap: 7px; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .att-filter-btn.active { background: linear-gradient(135deg, #f5a623, #f7c068); color: #07070e; border-color: transparent; }
        .att-filter-btn.inactive { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45); border-color: rgba(255,255,255,0.07); }
        .att-filter-btn.inactive:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
        .att-filter-count { padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        .att-filter-btn.active .att-filter-count { background: rgba(0,0,0,0.15); color: #07070e; }
        .att-filter-btn.inactive .att-filter-count { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.35); }

        .att-content { padding: 32px 36px; }

        .att-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
        .att-stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px 22px; position: relative; overflow: hidden; transition: border-color 0.2s; }
        .att-stat-card:hover { border-color: rgba(245,166,35,0.2); }
        .att-stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 16px 16px 0 0; }
        .att-stat-card.gold::before  { background: linear-gradient(90deg, #f5a623, #f7c068); }
        .att-stat-card.green::before { background: linear-gradient(90deg, #63cda0, #8de8c0); }
        .att-stat-card.red::before   { background: linear-gradient(90deg, #f87171, #fca5a5); }
        .att-stat-label { font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 10px; }
        .att-stat-num { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; line-height: 1; }
        .att-stat-card.gold  .att-stat-num { color: #f5a623; }
        .att-stat-card.green .att-stat-num { color: #63cda0; }
        .att-stat-card.red   .att-stat-num { color: #f87171; }
        .att-stat-sub { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 6px; }

        .att-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .att-section-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; text-transform: uppercase; }
        .att-section-count { font-size: 12px; color: rgba(255,255,255,0.2); }

        .att-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }

        .att-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 0; gap: 16px; }
        .att-spinner { width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(245,166,35,0.15); border-top-color: #f5a623; animation: spin 0.8s linear infinite; }
        .att-loading-text { font-size: 14px; color: rgba(255,255,255,0.25); letter-spacing: 0.3px; }

        .att-orb-1 { position: fixed; top: -100px; left: 200px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .att-orb-2 { position: fixed; bottom: -150px; right: 100px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(99,153,255,0.04) 0%, transparent 70%); pointer-events: none; z-index: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .att-main { padding-left: 0; }
          .att-stats { grid-template-columns: 1fr; }
          .att-grid  { grid-template-columns: 1fr; }
          .att-content { padding: 24px 20px; }
          .att-topbar { padding: 0 20px; }
        }
      `}</style>

      <div className="att-root">
        <div className="att-orb-1" />
        <div className="att-orb-2" />
        <Sidebar />

        <main className="att-main">
          <div className="att-topbar">
            <div className="att-topbar-left">
              <div className="att-topbar-icon">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="2" width="12" height="14" rx="2" stroke="#f5a623" strokeWidth="1.5"/>
                  <path d="M6 7h6M6 10h4" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="att-topbar-title">Attendance</span>
            </div>

            <div className="att-filters">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`att-filter-btn ${filter === f.key ? "active" : "inactive"}`}
                >
                  {f.label}
                  <span className="att-filter-count">{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="att-content">
            {!loading && (
              <div className="att-stats">
                <div className="att-stat-card gold">
                  <div className="att-stat-label">Average</div>
                  <div className="att-stat-num">{avgAtt}%</div>
                  <div className="att-stat-sub">Overall attendance</div>
                </div>
                <div className="att-stat-card green">
                  <div className="att-stat-label">Safe</div>
                  <div className="att-stat-num">{safeCount}</div>
                  <div className="att-stat-sub">Subjects ≥ 75%</div>
                </div>
                <div className="att-stat-card red">
                  <div className="att-stat-label">At Risk</div>
                  <div className="att-stat-num">{riskCount}</div>
                  <div className="att-stat-sub">Subjects &lt; 75%</div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="att-loading">
                <div className="att-spinner" />
                <span className="att-loading-text">Fetching attendance data…</span>
              </div>
            ) : (
              <>
                <div className="att-section-header">
                  <span className="att-section-title">Subjects</span>
                  <span className="att-section-count">{filtered.length} shown</span>
                </div>
                <div className="att-grid">
                  {filtered.map((c: any) => (
                    <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />
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
