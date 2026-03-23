"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Clock, BookCheck, AlertTriangle, FileText, TrendingUp } from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, color, delay = 0 }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const colors: any = {
    purple: { bg: "rgba(108,99,255,0.15)", icon: "rgba(108,99,255,0.2)", text: "#8b84ff" },
    green: { bg: "rgba(34,197,94,0.1)", icon: "rgba(34,197,94,0.15)", text: "#22c55e" },
    amber: { bg: "rgba(245,158,11,0.1)", icon: "rgba(245,158,11,0.15)", text: "#f59e0b" },
    red: { bg: "rgba(239,68,68,0.1)", icon: "rgba(239,68,68,0.15)", text: "#ef4444" },
    cyan: { bg: "rgba(6,182,212,0.1)", icon: "rgba(6,182,212,0.15)", text: "#06b6d4" },
  };
  const c = colors[color] || colors.purple;
  return (
    <div style={{ borderRadius: "16px", padding: "20px", background: c.bg, border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.5s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: c.text, marginBottom: "4px" }}>{value}</p>
          {subtitle && <p style={{ fontSize: "12px", color: "#a1a1aa" }}>{subtitle}</p>}
        </div>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: c.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={c.text} />
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
    dataAPI.getAll().then(d => { setData(d); if (d.profile) setProfile(d.profile); setLoading(false); }).catch(() => router.push("/"));
  }, []);

  const att = data?.attendance || [];
  const avg = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"]||0), 0) / att.length).toFixed(1) : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(108,99,255,0.3)", borderTopColor: "#6c63ff", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#a1a1aa", fontSize: "14px" }}>Loading your portal...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", position: "relative" }}>
      {/* Animated background blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "-160px", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(108,99,255,0.08)", filter: "blur(120px)", animation: "pulse 6s infinite" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "400px", height: "400px", borderRadius: "50%", background: "rgba(236,72,153,0.06)", filter: "blur(120px)", animation: "pulse 6s infinite 2s" }} />
      </div>

      <Sidebar />

      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(10,10,15,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
          <h2 style={{ fontWeight: "600", fontSize: "16px", color: "#f4f4f5" }}>Dashboard</h2>
          <span style={{ fontSize: "13px", color: "#a1a1aa" }}>
            Sem {data?.profile?.["Semester"]} · {data?.profile?.["Specialization"]}
          </span>
        </div>

        <div style={{ padding: "32px" }}>
          {/* Greeting */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#f4f4f5", marginBottom: "4px" }}>
              Welcome back, <span style={{ color: "#8b84ff" }}>{firstName}</span> 👋
            </h1>
            <p style={{ color: "#a1a1aa", fontSize: "14px" }}>Here's what's happening with your academics today.</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
            <StatCard title="Overall Attendance" value={avg + "%"} subtitle="This semester" icon={Clock} color={parseFloat(avg) >= 75 ? "green" : "red"} delay={0} />
            <StatCard title="Total Courses" value={att.length} subtitle={att.filter((c:any)=>c["Category"]==="Theory").length + " Theory · " + att.filter((c:any)=>c["Category"]==="Practical").length + " Lab"} icon={BookCheck} color="purple" delay={100} />
            <StatCard title="Subjects at Risk" value={risk} subtitle={risk > 0 ? "Need attention" : "All safe!"} icon={AlertTriangle} color={risk > 0 ? "red" : "green"} delay={200} />
            <StatCard title="Mark Entries" value={data?.marks?.length || 0} subtitle="Recorded tests" icon={FileText} color="cyan" delay={300} />
          </div>

          {/* Attendance grid */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#f4f4f5" }}>Subject-wise Attendance</h2>
            <span style={{ fontSize: "13px", color: "#a1a1aa" }}>{att.length} subjects</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
            {att.map((c: any) => <AttendanceCard key={c["Course Code"]+c["Category"]} course={c} />)}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}