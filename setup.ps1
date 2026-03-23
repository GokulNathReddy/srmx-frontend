# Run this from inside C:\Users\NITHISHKUMAR\srmx-frontend
# It creates ALL files automatically

Write-Host "Creating all SRMX frontend files..." -ForegroundColor Cyan

# .env.local
Set-Content .env.local "NEXT_PUBLIC_API_URL=http://localhost:5000"

# lib/api.ts
Set-Content lib/api.ts @'
import axios from "axios";

const API = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000" });

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("srmx_token");
    if (token) config.headers["x-session-token"] = token;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    API.post("/api/login", { email, password }).then(r => r.data),
  logout: () => API.post("/api/logout").then(r => r.data),
};

export const dataAPI = {
  getAll: () => API.get("/api/all").then(r => r.data),
  getAttendance: () => API.get("/api/attendance").then(r => r.data),
  getMarks: () => API.get("/api/marks").then(r => r.data),
  getTimetable: (batch = 1) => API.get(`/api/timetable?batch=${batch}`).then(r => r.data),
  getProfile: () => API.get("/api/profile").then(r => r.data),
};
'@

# lib/store.ts
Set-Content lib/store.ts @'
import { create } from "zustand";

interface Profile {
  "Registration Number"?: string;
  "Name"?: string;
  "Semester"?: string;
  "Specialization"?: string;
}

interface AuthStore {
  token: string | null;
  profile: Profile | null;
  setToken: (token: string) => void;
  setProfile: (profile: Profile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("srmx_token") : null,
  profile: null,
  setToken: (token) => { localStorage.setItem("srmx_token", token); set({ token }); },
  setProfile: (profile) => set({ profile }),
  logout: () => { localStorage.removeItem("srmx_token"); set({ token: null, profile: null }); },
}));
'@

# components/Sidebar.tsx
Set-Content components/Sidebar.tsx @'
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",   icon: "⊞" },
  { href: "/attendance", label: "Attendance",   icon: "◷" },
  { href: "/marks",      label: "Marks",        icon: "◈" },
  { href: "/timetable",  label: "Timetable",    icon: "▦" },
  { href: "/ai",         label: "AI Assistant", icon: "◉" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const name = profile?.["Name"] || "Student";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  async function handleLogout() {
    try { await authAPI.logout(); } catch {}
    logout();
    router.push("/");
  }

  return (
    <div className="flex flex-col h-screen w-56 border-r" style={{background:"#111118",borderColor:"#2a2a3a"}}>
      <div className="p-5 border-b" style={{borderColor:"#2a2a3a"}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{background:"#6c63ff"}}>S</div>
          <div>
            <div className="font-bold text-white">SRM<span style={{color:"#6c63ff"}}>X</span></div>
            <div className="text-[10px] tracking-widest" style={{color:"#606080"}}>PORTAL</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{background: active ? "#6c63ff" : "transparent", color: active ? "#fff" : "#a0a0c0"}}>
              <span>{item.icon}</span>{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t" style={{borderColor:"#2a2a3a"}}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{background:"linear-gradient(135deg,#6c63ff,#f472b6)"}}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{name}</div>
            <div className="text-xs truncate" style={{color:"#606080"}}>{profile?.["Registration Number"] || ""}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full py-2 rounded-lg text-xs"
          style={{background:"#1a1a24",color:"#a0a0c0",border:"1px solid #2a2a3a"}}>
          Sign out
        </button>
      </div>
    </div>
  );
}
'@

# components/AttendanceCard.tsx
Set-Content components/AttendanceCard.tsx @'
"use client";
interface Course {
  "Course Code": string; "Course Title": string; "Faculty Name": string;
  "Slot": string; "Hours Conducted": string; "Hours Absent": string; "Attn %": string;
}
export default function AttendanceCard({ course }: { course: Course }) {
  const pct = parseFloat(course["Attn %"]) || 0;
  const color = pct >= 75 ? "#4ade80" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="p-4 rounded-xl border" style={{background:"#16161f",border:"1px solid #2a2a3a"}}>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" style={{transform:"rotate(-90deg)"}}>
            <circle cx="32" cy="32" r={r} fill="none" stroke="#2a2a3a" strokeWidth="5"/>
            <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{color}}>{pct.toFixed(0)}%</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">{course["Course Title"]}</div>
          <div className="text-xs mt-0.5" style={{color:"#606080"}}>{course["Course Code"]}</div>
          <div className="text-xs mt-1 truncate" style={{color:"#a0a0c0"}}>{course["Faculty Name"]}</div>
          <div className="mt-2 h-1 rounded-full" style={{background:"#2a2a3a"}}>
            <div className="h-full rounded-full" style={{width:`${pct}%`,background:color}}/>
          </div>
          <div className="text-xs mt-1" style={{color:"#606080"}}>{course["Hours Conducted"]} classes · {course["Hours Absent"]} absent</div>
        </div>
      </div>
    </div>
  );
}
'@

# app/layout.tsx
Set-Content app/layout.tsx @'
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SRMX — Student Portal", description: "Better SRM Academia" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
'@

# app/page.tsx (Login)
Set-Content app/page.tsx @'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

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
    <div className="min-h-screen flex items-center justify-center" style={{background:"#0a0a0f"}}>
      <div className="w-full max-w-md p-8 rounded-2xl border" style={{background:"#16161f",borderColor:"#2a2a3a"}}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{background:"#6c63ff"}}>S</div>
          <div>
            <div className="font-bold text-xl text-white">SRM<span style={{color:"#6c63ff"}}>X</span></div>
            <div className="text-xs tracking-widest" style={{color:"#606080"}}>STUDENT PORTAL</div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-sm mb-8" style={{color:"#a0a0c0"}}>Sign in with your SRM Academia credentials</p>
        {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-sm mb-2 block" style={{color:"#a0a0c0"}}>SRM Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="xxxxxx@srmist.edu.in"
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{background:"#1a1a24",border:"1px solid #2a2a3a",color:"#f0f0f8"}}/>
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{color:"#a0a0c0"}}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your SRM password"
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{background:"#1a1a24",border:"1px solid #2a2a3a",color:"#f0f0f8"}}
              onKeyDown={e => e.key === "Enter" && handleLogin()}/>
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{background: loading ? "#4a44b0" : "#6c63ff"}}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <p className="text-xs text-center mt-6" style={{color:"#606080"}}>Your credentials are never stored</p>
      </div>
    </div>
  );
}
'@

# app/dashboard/page.tsx
Set-Content app/dashboard/page.tsx @'
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import AttendanceCard from "@/components/AttendanceCard";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token, setProfile } = useAuthStore();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getAll().then(d => { setData(d); if (d.profile) setProfile(d.profile); setLoading(false); })
      .catch(() => router.push("/"));
  }, []);

  const attendance = data?.attendance || [];
  const avgAttn = attendance.length
    ? (attendance.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / attendance.length).toFixed(1) : "—";
  const atRisk = attendance.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const name = data?.profile?.["Name"]?.split(" ")[0] || "Student";

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{background:"#0a0a0f"}}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3"/>
        <p style={{color:"#606080"}}>Loading your data...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen" style={{background:"#0a0a0f"}}>
      <Sidebar/>
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 px-7 h-14 flex items-center justify-between border-b"
          style={{background:"#0a0a0fcc",borderColor:"#2a2a3a",backdropFilter:"blur(10px)"}}>
          <h1 className="font-bold text-lg text-white">Dashboard</h1>
          <div className="text-sm" style={{color:"#606080"}}>Sem {data?.profile?.["Semester"]} · {data?.profile?.["Specialization"]}</div>
        </div>
        <div className="p-7">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Good morning, <span style={{color:"#8b84ff"}}>{name}</span> 👋</h2>
            <p style={{color:"#606080"}}>Here is your academic overview</p>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-7">
            {[
              { label:"Overall Attendance", value:`${avgAttn}%`, color: parseFloat(avgAttn)>=75?"#4ade80":"#ef4444" },
              { label:"Total Courses", value:attendance.length, color:"#8b84ff" },
              { label:"Subjects at Risk", value:atRisk, color:atRisk>0?"#ef4444":"#4ade80" },
              { label:"Mark Entries", value:data?.marks?.length||0, color:"#22d3ee" },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl border" style={{background:"#16161f",borderColor:"#2a2a3a"}}>
                <div className="text-xs uppercase tracking-wider mb-2" style={{color:"#606080"}}>{s.label}</div>
                <div className="text-3xl font-bold" style={{color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Attendance</h3>
            <span className="text-xs" style={{color:"#606080"}}>{attendance.length} subjects</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {attendance.map((c: any) => <AttendanceCard key={c["Course Code"]+c["Category"]} course={c}/>)}
          </div>
        </div>
      </main>
    </div>
  );
}
'@

Write-Host "✓ All files created!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Yellow