"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Clock, BookCheck, AlertTriangle, FileText } from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, variant, delay = 0 }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const variants: any = {
    gold:  { bg: "rgba(245,166,35,0.08)",  iconBg: "rgba(245,166,35,0.14)",  text: "#f5a623",  bar: "#f5a623"  },
    green: { bg: "rgba(99,205,160,0.08)",  iconBg: "rgba(99,205,160,0.14)",  text: "#63cda0",  bar: "#63cda0"  },
    red:   { bg: "rgba(248,113,113,0.08)", iconBg: "rgba(248,113,113,0.14)", text: "#f87171",  bar: "#f87171"  },
    blue:  { bg: "rgba(99,153,255,0.08)",  iconBg: "rgba(99,153,255,0.14)",  text: "#6399ff",  bar: "#6399ff"  },
  };
  const v = variants[variant] || variants.gold;

  return (
    <div style={{
      borderRadius: "18px",
      padding: "22px 24px",
      background: v.bg,
      border: "1px solid rgba(255,255,255,0.06)",
      transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(18px)",
      position: "relative",
      overflow: "hidden",
      cursor: "default",
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.18)")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${v.bar}, transparent)`, borderRadius: "18px 18px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: "rgba(255,255,255,0.3)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "2px", fontFamily: "'DM Sans', sans-serif" }}>{title}</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: v.text, marginBottom: "6px", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</p>
          {subtitle && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
        </div>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: v.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={v.text} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setProfile } = useAuthStore();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getAll()
      .then(d => { setData(d); if (d.profile) setProfile(d.profile); setLoading(false); })
      .catch(() => router.push("/"));
  }, []);

  const att = data?.attendance || [];
  const avg = att.length
    ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const theoryCount = att.filter((c: any) => c["Category"] === "Theory").length;
  const labCount = att.filter((c: any) => c["Category"] === "Practical").length;
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#07070e", flexDirection: "column", gap: "18px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid rgba(245,166,35,0.2)", borderTopColor: "#f5a623", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "14px", letterSpacing: "0.3px" }}>Loading your portal…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .dash-root {
          min-height: 100vh;
          background: #07070e;
          font-family: 'DM Sans', sans-serif;
        }

        .dash-orb-1 {
          position: fixed; top: -120px; left: 100px;
          width: 520px; height: 520px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .dash-orb-2 {
          position: fixed; bottom: -150px; right: 0;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,153,255,0.04) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .dash-main {
          padding-left: 272px;
          position: relative;
          z-index: 1;
        }

        /* ── TOPBAR ── */
        .dash-topbar {
          position: sticky; top: 0;
          height: 68px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px;
          background: rgba(7,7,14,0.88);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          z-index: 10;
        }

        .dash-topbar-left {
          display: flex; align-items: center; gap: 12px;
        }

        .dash-topbar-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(245,166,35,0.12);
          display: flex; align-items: center; justify-content: center;
        }

        .dash-topbar-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: #fff; letter-spacing: -0.3px;
        }

        .dash-topbar-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 999px;
          padding: 5px 14px;
          letter-spacing: 0.3px;
        }

        /* ── CONTENT ── */
        .dash-content {
          padding: 36px;
        }

        /* ── GREETING ── */
        .dash-greeting {
          margin-bottom: 32px;
          opacity: 0; transform: translateY(14px);
          animation: fadeUp 0.6s ease forwards 0.1s;
        }

        .dash-greeting h1 {
          font-family: 'Playfair Display', serif;
          font-size: 32px; font-weight: 700;
          color: #fff; letter-spacing: -0.5px;
          margin-bottom: 6px; line-height: 1.2;
        }

        .dash-greeting h1 span { color: #f5a623; font-style: italic; }

        .dash-greeting p {
          font-size: 14px;
          color: rgba(255,255,255,0.3);
          line-height: 1.6;
        }

        /* ── STATS GRID ── */
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 36px;
        }

        /* ── SECTION HEADER ── */
        .dash-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .dash-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: #fff; letter-spacing: -0.3px;
        }

        .dash-section-badge {
          font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 999px;
          padding: 4px 12px;
          letter-spacing: 0.5px;
        }

        /* ── ATT GRID ── */
        .dash-att-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }

        @media (max-width: 1200px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .dash-main { padding-left: 0; }
          .dash-stats { grid-template-columns: 1fr; }
          .dash-att-grid { grid-template-columns: 1fr; }
          .dash-content { padding: 24px 20px; }
          .dash-topbar  { padding: 0 20px; }
        }
      `}</style>

      <div className="dash-root">
        <div className="dash-orb-1" />
        <div className="dash-orb-2" />

        <Sidebar />

        <main className="dash-main">

          {/* ── TOPBAR ── */}
          <div className="dash-topbar">
            <div className="dash-topbar-left">
              <div className="dash-topbar-icon">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#f5a623" strokeWidth="1.5"/>
                  <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#f5a623" strokeWidth="1.5"/>
                  <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#f5a623" strokeWidth="1.5"/>
                  <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#f5a623" strokeWidth="1.5"/>
                </svg>
              </div>
              <span className="dash-topbar-title">Dashboard</span>
            </div>
            <span className="dash-topbar-meta">
              Sem {data?.profile?.["Semester"]} · {data?.profile?.["Specialization"]}
            </span>
          </div>

          {/* ── CONTENT ── */}
          <div className="dash-content">

            {/* Greeting */}
            <div className="dash-greeting">
              <h1>Welcome back, <span>{firstName}</span></h1>
              <p>Here's what's happening with your academics today.</p>
            </div>

            {/* Stats */}
            <div className="dash-stats">
              <StatCard
                title="Overall Attendance"
                value={avg + "%"}
                subtitle="This semester"
                icon={Clock}
                variant={parseFloat(avg) >= 75 ? "green" : "red"}
                delay={0}
              />
              <StatCard
                title="Total Courses"
                value={att.length}
                subtitle={`${theoryCount} Theory · ${labCount} Lab`}
                icon={BookCheck}
                variant="gold"
                delay={100}
              />
              <StatCard
                title="Subjects at Risk"
                value={risk}
                subtitle={risk > 0 ? "Need attention" : "All safe!"}
                icon={AlertTriangle}
                variant={risk > 0 ? "red" : "green"}
                delay={200}
              />
              <StatCard
                title="Mark Entries"
                value={data?.marks?.length || 0}
                subtitle="Recorded tests"
                icon={FileText}
                variant="blue"
                delay={300}
              />
            </div>

            {/* Attendance Grid */}
            <div className="dash-section-header">
              <span className="dash-section-title">Subject-wise Attendance</span>
              <span className="dash-section-badge">{att.length} subjects</span>
            </div>

            <div className="dash-att-grid">
              {att.map((c: any) => (
                <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
