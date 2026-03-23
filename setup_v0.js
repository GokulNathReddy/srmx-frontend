const fs = require("fs");
const path = require("path");

const files = {

// ── globals.css with v0's design system ──────────────────────────────────────
"app/globals.css": `@import 'tailwindcss';

:root {
  --background: #0a0a0f;
  --foreground: #f4f4f5;
  --card: rgba(20, 20, 30, 0.6);
  --card-foreground: #f4f4f5;
  --primary: #6c63ff;
  --primary-foreground: #ffffff;
  --muted: rgba(255, 255, 255, 0.05);
  --muted-foreground: #a1a1aa;
  --border: rgba(255, 255, 255, 0.08);
  --destructive: #ef4444;
  --chart-2: #22c55e;
  --chart-3: #f59e0b;
  --chart-4: #ec4899;
  --chart-5: #06b6d4;
  --radius: 0.75rem;
  --sidebar: rgba(15, 15, 25, 0.7);
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-accent: rgba(108, 99, 255, 0.15);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--background); color: var(--foreground); font-family: 'Inter', system-ui, sans-serif; }
`,

// ── lib/utils.ts ─────────────────────────────────────────────────────────────
"lib/utils.ts": `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }`,

// ── Sidebar with real nav + auth ──────────────────────────────────────────────
"components/Sidebar.tsx": `"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";
import { LayoutDashboard, Clock, FileText, Calendar, Bot, LogOut, ChevronLeft, ChevronRight, GraduationCap, User } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/marks", label: "Marks", icon: FileText },
  { href: "/timetable", label: "Timetable", icon: Calendar },
  { href: "/ai", label: "AI Assistant", icon: Bot },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const name = profile?.["Name"] || "Student";
  const reg = profile?.["Registration Number"] || "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleLogout() {
    try { await authAPI.logout(); } catch {}
    logout();
    router.push("/");
  }

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, zIndex: 40, height: "100vh",
      width: collapsed ? "72px" : "256px",
      background: "var(--sidebar)",
      backdropFilter: "blur(20px)",
      borderRight: "1px solid var(--sidebar-border)",
      transition: "width 0.3s ease",
      display: "flex", flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", height: "72px", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid var(--sidebar-border)" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#fff" }}>SRM<span style={{ color: "#6c63ff" }}>X</span></div>
              <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Student Portal</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ margin: "0 auto", width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={20} color="#fff" />
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ padding: "8px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--muted-foreground)", flexShrink: 0 }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {nav.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "10px 14px", borderRadius: "12px", textDecoration: "none",
              background: active ? "rgba(108,99,255,0.15)" : "transparent",
              color: active ? "#6c63ff" : "var(--muted-foreground)",
              transition: "all 0.2s", position: "relative",
              fontSize: "14px", fontWeight: active ? "500" : "400",
            }}>
              {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "28px", background: "#6c63ff", borderRadius: "0 4px 4px 0" }} />}
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: "700", color: "#fff" }}>
            {initials || <User size={16} />}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reg}</div>
              </div>
              <button onClick={handleLogout} style={{ padding: "6px", border: "none", background: "transparent", cursor: "pointer", color: "var(--muted-foreground)", borderRadius: "6px" }}>
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}`,

// ── AttendanceCard with v0 animations + real data ─────────────────────────────
"components/AttendanceCard.tsx": `"use client";
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
    <div style={{
      borderRadius: "16px", padding: "20px",
      background: "var(--card)", backdropFilter: "blur(20px)",
      border: "1px solid var(--border)",
      transition: "all 0.5s ease, opacity 0.5s, transform 0.5s",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      cursor: "default", position: "relative", overflow: "hidden",
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(108,99,255,0.3)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(108,99,255,0.08)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Animated circle */}
        <div style={{ position: "relative", width: "96px", height: "96px", flexShrink: 0 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ filter: \`drop-shadow(0 0 8px \${color}50)\`, transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color }}>
            {Math.round(animPct)}%
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: "600", fontSize: "14px", color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course["Course Title"]}</div>
              <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>{course["Course Code"]}</div>
            </div>
            <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "500", flexShrink: 0, marginLeft: "8px",
              background: pct >= 75 ? "rgba(34,197,94,0.1)" : pct >= 65 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
              color: pct >= 75 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444" }}>
              {pct >= 75 ? "Safe" : pct >= 65 ? "Warning" : "Critical"}
            </span>
          </div>

          {/* P/A/T pills */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            {[{l:"P",v:present,c:"#22c55e"},{l:"A",v:absent,c:"#ef4444"},{l:"T",v:conducted,c:"#60a5fa"}].map(x => (
              <span key={x.l} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontSize: "11px" }}>
                <span style={{ color: x.c, fontWeight: "600" }}>{x.l}</span>
                <span style={{ color: "var(--muted-foreground)" }}>{x.v}</span>
              </span>
            ))}
          </div>

          {/* Required/Margin */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", color: isAtRisk ? "#ef4444" : "#22c55e", lineHeight: 1 }}>
              {isAtRisk ? required : margin}
            </span>
            <span style={{ fontSize: "11px", color: isAtRisk ? "#ef4444" : "#22c55e", fontWeight: "500" }}>
              {isAtRisk ? "classes needed" : "classes margin"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}`,

// ── Login page ────────────────────────────────────────────────────────────────
"app/page.tsx": `"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { GraduationCap, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setToken } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) return setError("Enter email and password");
    setLoading(true); setError("");
    try {
      const res = await authAPI.login(email, password);
      setToken(res.token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", position: "relative", overflow: "hidden" }}>
      {/* Animated background */}
      <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(108,99,255,0.1)", filter: "blur(100px)", animation: "pulse 4s infinite" }} />
      <div style={{ position: "absolute", bottom: "-100px", right: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(236,72,153,0.08)", filter: "blur(100px)", animation: "pulse 4s infinite 1s" }} />

      <div style={{ width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "24px", background: "rgba(20,20,30,0.8)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "36px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#fff" }}>SRM<span style={{ color: "#6c63ff" }}>X</span></div>
            <div style={{ fontSize: "12px", color: "#a1a1aa", letterSpacing: "1px" }}>STUDENT PORTAL</div>
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#fff", marginBottom: "6px" }}>Welcome back</h1>
        <p style={{ fontSize: "14px", color: "#a1a1aa", marginBottom: "28px" }}>Sign in with your SRM Academia credentials</p>

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>SRM Email</label>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#a1a1aa" }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="xxxxx@srmist.edu.in"
              style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f4f5", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>Password</label>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#a1a1aa" }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your SRM password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f4f5", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "13px", borderRadius: "12px", background: loading ? "#4a44b0" : "linear-gradient(135deg, #6c63ff, #8b84ff)", color: "#fff", fontWeight: "600", fontSize: "15px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight size={16} /></>}
        </button>

        <p style={{ fontSize: "12px", textAlign: "center", marginTop: "20px", color: "#606060" }}>Your credentials are never stored on our servers</p>
      </div>

      <style>{\`
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      \`}</style>
    </div>
  );
}`,

// ── Dashboard with v0 design + real data ──────────────────────────────────────
"app/dashboard/page.tsx": `"use client";
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
      <style>{\`@keyframes spin { to { transform: rotate(360deg); } }\`}</style>
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

      <style>{\`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      \`}</style>
    </div>
  );
}`,
};

let count = 0;
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("✓ " + file);
  count++;
}
console.log("\n✅ Done! " + count + " files created.");
console.log("Now run: npm install lucide-react clsx tailwind-merge && npm run dev");