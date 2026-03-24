"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Manrope:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .srmx-blob { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
  .srmx-b1 { width: 500px; height: 500px; top: -150px; left: -150px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); opacity: 0.5; }
  .srmx-b2 { width: 400px; height: 400px; bottom: -100px; right: -100px; background: radial-gradient(circle, #ec4899 0%, transparent 70%); opacity: 0.4; }
  .srmx-b3 { width: 300px; height: 300px; top: 40%; left: 45%; background: radial-gradient(circle, #2563eb 0%, transparent 70%); opacity: 0.25; }
  .srmx-grid { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 40px 40px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes srmx-fadeUp { to { opacity: 1; transform: translateY(0); } }
`;

function StatCard({ title, value, subtitle, icon, color, delay = 0 }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const colors: any = {
    purple: { bg: "rgba(124,58,237,0.12)", top: "linear-gradient(90deg,#7c3aed,#a855f7)", text: "#a78bfa", icon: "rgba(124,58,237,0.2)" },
    green:  { bg: "rgba(52,211,153,0.1)",  top: "linear-gradient(90deg,#059669,#34d399)", text: "#34d399", icon: "rgba(52,211,153,0.15)" },
    red:    { bg: "rgba(248,113,113,0.1)",  top: "linear-gradient(90deg,#dc2626,#f87171)", text: "#f87171", icon: "rgba(248,113,113,0.15)" },
    cyan:   { bg: "rgba(99,153,255,0.1)",   top: "linear-gradient(90deg,#2563eb,#60a5fa)", text: "#60a5fa", icon: "rgba(99,153,255,0.15)" },
  };
  const c = colors[color] || colors.purple;

  return (
    <div style={{ borderRadius: "14px", padding: "18px", background: c.bg, border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "all 0.5s ease", backdropFilter: "blur(10px)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: c.top }} />
      <div style={{ position: "absolute", top: 14, right: 14, width: "34px", height: "34px", borderRadius: "9px", background: c.icon, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>{title}</p>
      <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "28px", fontWeight: "800", color: c.text, marginBottom: "4px" }}>{value}</p>
      {subtitle && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{subtitle}</p>}
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
    dataAPI.getAll().then(d => { setData(d); if (d.profile) setProfile(d.profile); setLoading(false); }).catch(() => router.push("/"));
  }, []);

  const att = data?.attendance || [];
  const avg = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1) : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";

  if (loading) return (
    <>
      <style>{SHARED_STYLES}</style>
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0f0c29" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: "'Manrope',sans-serif" }}>Loading your portal...</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{SHARED_STYLES + `
        .dash-root { min-height: 100vh; background: #0f0c29; font-family: 'Manrope', sans-serif; }
        .dash-main { margin-left: 256px; position: relative; z-index: 1; }
        .dash-topbar { position: sticky; top: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; background: rgba(15,12,41,0.8); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.07); z-index: 50; }
        .dash-topbar h2 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
        .dash-topbar-sub { font-size: 12px; color: rgba(255,255,255,0.3); }
        .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 28px; }
        .att-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .sec-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .sec-heading h3 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; }
        .sec-heading span { font-size: 11px; color: rgba(255,255,255,0.3); }
        @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      <div className="dash-root">
        <div className="srmx-blob srmx-b1" />
        <div className="srmx-blob srmx-b2" />
        <div className="srmx-blob srmx-b3" />
        <div className="srmx-grid" />

        <Sidebar />

        <main className="dash-main">
          <div className="dash-topbar">
            <h2>Dashboard</h2>
            <span className="dash-topbar-sub">
              Sem {data?.profile?.["Semester"]} · {data?.profile?.["Specialization"]}
            </span>
          </div>

          <div style={{ padding: "28px 28px 60px" }}>
            {/* Greeting */}
            <div style={{ marginBottom: "28px", opacity: 0, transform: "translateY(14px)", animation: "srmx-fadeUp 0.5s ease forwards 0.1s" }}>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "26px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>
                Welcome back,{" "}
                <span style={{ background: "linear-gradient(90deg,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {firstName}
                </span>{" "}👋
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Here's your academic snapshot for today.</p>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              <StatCard title="Avg Attendance" value={avg + "%"} subtitle="This semester" color={parseFloat(avg) >= 75 ? "green" : "red"} delay={0}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} />
              <StatCard title="Total Courses" value={att.length} subtitle={att.filter((c:any)=>c["Category"]==="Theory").length+" Theory · "+att.filter((c:any)=>c["Category"]==="Practical").length+" Lab"} color="purple" delay={80}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>} />
              <StatCard title="At Risk" value={risk} subtitle={risk > 0 ? "Need attention" : "All safe!"} color={risk > 0 ? "red" : "green"} delay={160}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v5M8 10.5v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 1l7 13H1L8 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>} />
              <StatCard title="Mark Entries" value={data?.marks?.length || 0} subtitle="Recorded tests" color="cyan" delay={240}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>} />
            </div>

            {/* Attendance */}
            <div className="sec-heading">
              <h3>Subject-wise Attendance</h3>
              <span>{att.length} subjects</span>
            </div>
            <div className="att-grid-2">
              {att.map((c: any) => <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />)}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
