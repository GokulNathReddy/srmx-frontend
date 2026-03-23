const fs = require("fs");
const path = require("path");

const files = {
".env.local": `NEXT_PUBLIC_API_URL=http://localhost:5000`,

"lib/api.ts": `import axios from "axios";
const API = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("srmx_token");
  if (token) config.headers["x-session-token"] = token;
  return config;
});
export const authAPI = {
  login: (email, password) => API.post("/api/login", { email, password }).then(r => r.data),
  logout: () => API.post("/api/logout").then(r => r.data),
};
export const dataAPI = {
  getAll: () => API.get("/api/all").then(r => r.data),
  getAttendance: () => API.get("/api/attendance").then(r => r.data),
  getMarks: () => API.get("/api/marks").then(r => r.data),
  getTimetable: (batch = 1) => API.get("/api/timetable?batch=" + batch).then(r => r.data),
};`,

"lib/store.ts": `import { create } from "zustand";
interface AuthStore {
  token: string | null;
  profile: any;
  setToken: (token: string) => void;
  setProfile: (profile: any) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthStore>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("srmx_token") : null,
  profile: null,
  setToken: (token) => { localStorage.setItem("srmx_token", token); set({ token }); },
  setProfile: (profile) => set({ profile }),
  logout: () => { localStorage.removeItem("srmx_token"); set({ token: null, profile: null }); },
}));`,

"components/AttendanceCard.tsx": `"use client";
export default function AttendanceCard({ course }: { course: any }) {
  const pct = parseFloat(course["Attn %"]) || 0;
  const color = pct >= 75 ? "#4ade80" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="p-4 rounded-xl" style={{background:"#16161f",border:"1px solid #2a2a3a"}}>
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
          <div className="text-xs mt-0.5" style={{color:"#606080"}}>{course["Course Code"]} · {course["Category"]}</div>
          <div className="text-xs mt-1 truncate" style={{color:"#a0a0c0"}}>{course["Faculty Name"]}</div>
          <div className="mt-2 h-1 rounded-full" style={{background:"#2a2a3a"}}>
            <div className="h-full rounded-full" style={{width:pct+"%",background:color}}/>
          </div>
          <div className="text-xs mt-1" style={{color:"#606080"}}>{course["Hours Conducted"]} classes · {course["Hours Absent"]} absent</div>
        </div>
      </div>
    </div>
  );
}`,

"components/Sidebar.tsx": `"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const nav = [
  { href:"/dashboard", label:"Dashboard" },
  { href:"/attendance", label:"Attendance" },
  { href:"/marks", label:"Marks" },
  { href:"/timetable", label:"Timetable" },
  { href:"/ai", label:"AI Assistant" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const name = profile?.["Name"] || "Student";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0,2);
  function handleLogout() { logout(); router.push("/"); }
  return (
    <div className="flex flex-col h-screen w-56 border-r" style={{background:"#111118",borderColor:"#2a2a3a"}}>
      <div className="p-5 border-b" style={{borderColor:"#2a2a3a"}}>
        <div className="font-bold text-white text-xl">SRM<span style={{color:"#6c63ff"}}>X</span></div>
        <div className="text-xs" style={{color:"#606080"}}>STUDENT PORTAL</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{background:pathname===item.href?"#6c63ff":"transparent", color:pathname===item.href?"#fff":"#a0a0c0"}}>
            {item.label}
          </Link>
        ))}
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
          style={{background:"#1a1a24",color:"#a0a0c0",border:"1px solid #2a2a3a"}}>Sign out</button>
      </div>
    </div>
  );
}`,

"app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SRMX", description: "Better SRM Portal" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{margin:0,background:"#0a0a0f"}}>{children}</body></html>;
}`,

"app/page.tsx": `"use client";
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
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f"}}>
      <div style={{width:"100%",maxWidth:"420px",padding:"32px",borderRadius:"16px",background:"#16161f",border:"1px solid #2a2a3a"}}>
        <div style={{marginBottom:"32px"}}>
          <div style={{fontSize:"24px",fontWeight:"bold",color:"#fff"}}>SRM<span style={{color:"#6c63ff"}}>X</span></div>
          <div style={{fontSize:"12px",color:"#606080",letterSpacing:"2px"}}>STUDENT PORTAL</div>
        </div>
        <h1 style={{fontSize:"22px",fontWeight:"bold",color:"#fff",marginBottom:"8px"}}>Welcome back</h1>
        <p style={{fontSize:"14px",color:"#a0a0c0",marginBottom:"24px"}}>Sign in with your SRM Academia credentials</p>
        {error && <div style={{marginBottom:"16px",padding:"12px",borderRadius:"8px",background:"rgba(239,68,68,0.1)",color:"#ef4444",fontSize:"14px"}}>{error}</div>}
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",color:"#a0a0c0",display:"block",marginBottom:"8px"}}>SRM Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="xxxxx@srmist.edu.in"
            style={{width:"100%",padding:"12px 16px",borderRadius:"12px",background:"#1a1a24",border:"1px solid #2a2a3a",color:"#f0f0f8",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:"24px"}}>
          <label style={{fontSize:"13px",color:"#a0a0c0",display:"block",marginBottom:"8px"}}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Your SRM password"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{width:"100%",padding:"12px 16px",borderRadius:"12px",background:"#1a1a24",border:"1px solid #2a2a3a",color:"#f0f0f8",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"13px",borderRadius:"12px",background:loading?"#4a44b0":"#6c63ff",color:"#fff",fontWeight:"600",fontSize:"15px",border:"none",cursor:"pointer"}}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p style={{fontSize:"12px",textAlign:"center",marginTop:"20px",color:"#606080"}}>Your credentials are never stored on our servers</p>
      </div>
    </div>
  );
}`,

"app/dashboard/page.tsx": `"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setProfile } = useAuthStore();
  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getAll().then(d => { setData(d); if (d.profile) setProfile(d.profile); setLoading(false); })
      .catch(() => router.push("/"));
  }, []);
  const att = data?.attendance || [];
  const avg = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"]||0), 0) / att.length).toFixed(1) : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";
  if (loading) return <div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",background:"#0a0a0f",color:"#606080"}}>Loading your data...</div>;
  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0f"}}>
      <Sidebar/>
      <main style={{flex:1,overflowY:"auto"}}>
        <div style={{position:"sticky",top:0,padding:"0 28px",height:"56px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,10,15,0.8)",borderBottom:"1px solid #2a2a3a",backdropFilter:"blur(10px)"}}>
          <h1 style={{fontWeight:"bold",fontSize:"18px",color:"#fff"}}>Dashboard</h1>
          <span style={{fontSize:"13px",color:"#606080"}}>Sem {data?.profile?.["Semester"]} · {data?.profile?.["Specialization"]}</span>
        </div>
        <div style={{padding:"28px"}}>
          <div style={{marginBottom:"24px"}}>
            <h2 style={{fontSize:"24px",fontWeight:"bold",color:"#fff",marginBottom:"4px"}}>Good morning, <span style={{color:"#8b84ff"}}>{firstName}</span> 👋</h2>
            <p style={{color:"#606080",fontSize:"14px"}}>Here is your academic overview</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"28px"}}>
            {[
              {label:"Overall Attendance",value:avg+"%",color:parseFloat(avg)>=75?"#4ade80":"#ef4444"},
              {label:"Total Courses",value:att.length,color:"#8b84ff"},
              {label:"Subjects at Risk",value:risk,color:risk>0?"#ef4444":"#4ade80"},
              {label:"Mark Entries",value:data?.marks?.length||0,color:"#22d3ee"},
            ].map(s => (
              <div key={s.label} style={{padding:"16px",borderRadius:"12px",background:"#16161f",border:"1px solid #2a2a3a"}}>
                <div style={{fontSize:"11px",color:"#606080",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>{s.label}</div>
                <div style={{fontSize:"28px",fontWeight:"bold",color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <h3 style={{fontWeight:"600",color:"#fff"}}>Attendance</h3>
            <span style={{fontSize:"12px",color:"#606080"}}>{att.length} subjects</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            {att.map((c: any) => <AttendanceCard key={c["Course Code"]+c["Category"]} course={c}/>)}
          </div>
        </div>
      </main>
    </div>
  );
}`,

"app/attendance/page.tsx": `"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
export default function AttendancePage() {
  const [att, setAtt] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getAttendance().then(d => { setAtt(d.data||[]); setLoading(false); }).catch(() => router.push("/"));
  }, []);
  const filtered = att.filter(c => filter==="all" ? true : filter==="safe" ? parseFloat(c["Attn %"])>=75 : parseFloat(c["Attn %"])<75);
  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0f"}}>
      <Sidebar/>
      <main style={{flex:1,overflowY:"auto"}}>
        <div style={{position:"sticky",top:0,padding:"0 28px",height:"56px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,10,15,0.8)",borderBottom:"1px solid #2a2a3a",backdropFilter:"blur(10px)"}}>
          <h1 style={{fontWeight:"bold",fontSize:"18px",color:"#fff"}}>Attendance</h1>
          <div style={{display:"flex",gap:"8px"}}>
            {["all","safe","risk"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{padding:"4px 12px",borderRadius:"8px",fontSize:"12px",background:filter===f?"#6c63ff":"#1a1a24",color:filter===f?"#fff":"#a0a0c0",border:"1px solid #2a2a3a",cursor:"pointer"}}>
                {f==="all"?"All":f==="safe"?"Safe ≥75%":"At Risk"}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"28px"}}>
          {loading ? <p style={{color:"#606080"}}>Loading...</p> : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {filtered.map((c: any) => <AttendanceCard key={c["Course Code"]+c["Category"]} course={c}/>)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}`,

"app/marks/page.tsx": `"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
export default function MarksPage() {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getMarks().then(d => { setMarks(d.data||[]); setLoading(false); }).catch(() => router.push("/"));
  }, []);
  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0f"}}>
      <Sidebar/>
      <main style={{flex:1,overflowY:"auto"}}>
        <div style={{position:"sticky",top:0,padding:"0 28px",height:"56px",display:"flex",alignItems:"center",background:"rgba(10,10,15,0.8)",borderBottom:"1px solid #2a2a3a",backdropFilter:"blur(10px)"}}>
          <h1 style={{fontWeight:"bold",fontSize:"18px",color:"#fff"}}>Marks</h1>
        </div>
        <div style={{padding:"28px"}}>
          {loading ? <p style={{color:"#606080"}}>Loading...</p> : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px"}}>
              {marks.map((m: any,i: number) => (
                <div key={i} style={{padding:"16px",borderRadius:"12px",background:"#16161f",border:"1px solid #2a2a3a"}}>
                  <div style={{fontWeight:"500",color:"#fff",fontSize:"14px",marginBottom:"4px"}}>{m.courseCode}</div>
                  <div style={{fontSize:"11px",color:"#606080",marginBottom:"14px"}}>{m.courseType}</div>
                  {m.tests?.map((t: any,j: number) => {
                    const [name,maxStr] = t.test.split("/");
                    const max = parseFloat(maxStr)||100;
                    const score = parseFloat(t.score)||0;
                    const pct = (score/max)*100;
                    const color = t.score==="Abs"?"#ef4444":pct>=60?"#4ade80":pct>=40?"#f59e0b":"#ef4444";
                    return (
                      <div key={j} style={{marginBottom:"10px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"4px"}}>
                          <span style={{color:"#a0a0c0"}}>{name}</span>
                          <span style={{color,fontWeight:"500"}}>{t.score} / {maxStr}</span>
                        </div>
                        <div style={{height:"4px",background:"#2a2a3a",borderRadius:"2px"}}>
                          <div style={{height:"100%",borderRadius:"2px",background:color,width:Math.min(pct,100)+"%"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}`,

"app/timetable/page.tsx": `"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
export default function TimetablePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [batch, setBatch] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    setLoading(true);
    dataAPI.getTimetable(batch).then(d => { setRows(d.data||[]); setLoading(false); }).catch(() => router.push("/"));
  }, [batch]);
  const timeRow = rows.find((r: any) => r[0]==="FROM");
  const times = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g,"").trim()) : [];
  const dayRows = rows.filter((r: any) => r[0]?.startsWith("Day"));
  const colors: Record<string,string> = {A:"#6c63ff",B:"#22d3ee",C:"#f472b6",D:"#f59e0b",E:"#4ade80",F:"#6c63ff",G:"#22d3ee"};
  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0f"}}>
      <Sidebar/>
      <main style={{flex:1,overflowY:"auto"}}>
        <div style={{position:"sticky",top:0,padding:"0 28px",height:"56px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,10,15,0.8)",borderBottom:"1px solid #2a2a3a",backdropFilter:"blur(10px)"}}>
          <h1 style={{fontWeight:"bold",fontSize:"18px",color:"#fff"}}>Timetable</h1>
          <div style={{display:"flex",gap:"8px"}}>
            {[1,2].map(b => (
              <button key={b} onClick={() => setBatch(b)}
                style={{padding:"4px 12px",borderRadius:"8px",fontSize:"12px",background:batch===b?"#6c63ff":"#1a1a24",color:batch===b?"#fff":"#a0a0c0",border:"1px solid #2a2a3a",cursor:"pointer"}}>
                Batch {b}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"28px",overflowX:"auto"}}>
          {loading ? <p style={{color:"#606080"}}>Loading...</p> : (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
              <thead>
                <tr>
                  <th style={{padding:"8px",textAlign:"left",color:"#606080",minWidth:"70px"}}>Day</th>
                  {times.map((t: string,i: number) => <th key={i} style={{padding:"8px",textAlign:"center",color:"#606080",minWidth:"65px"}}>{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {dayRows.map((row: any,i: number) => (
                  <tr key={i} style={{borderTop:"1px solid #2a2a3a"}}>
                    <td style={{padding:"8px",color:"#a0a0c0",fontWeight:"500"}}>{row[0]}</td>
                    {row.slice(1).map((slot: string,j: number) => {
                      const s = slot?.trim();
                      const letter = s?.[0] || "";
                      const color = colors[letter] || "#a0a0c0";
                      return (
                        <td key={j} style={{padding:"4px",textAlign:"center"}}>
                          {s ? <span style={{display:"inline-block",padding:"3px 8px",borderRadius:"6px",background:color+"20",color,minWidth:"36px"}}>{s}</span>
                            : <span style={{color:"#2a2a3a"}}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}`,

"app/ai/page.tsx": `"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
export default function AIPage() {
  const [messages, setMessages] = useState([{role:"assistant",content:"Hi! I am your SRM AI assistant. Ask me anything about your attendance, marks, or timetable!"}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicData, setAcademicData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getAll().then(setAcademicData).catch(()=>{});
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);
  async function send() {
    if (!input.trim()||loading) return;
    const userMsg = input.trim(); setInput("");
    setMessages(prev => [...prev,{role:"user",content:userMsg}]);
    setLoading(true);
    try {
      const ctx = academicData ? "Student: "+academicData.profile?.["Name"]+"\nAttendance:\n"+(academicData.attendance||[]).map((c: any) => c["Course Code"]+": "+c["Attn %"]+"%").join("\n")+"\nMarks:\n"+(academicData.marks||[]).map((m: any) => m.courseCode+": "+m.tests?.map((t: any)=>t.test+"="+t.score).join(", ")).join("\n") : "";
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:"You are a helpful SRM student assistant. Academic data:\n"+ctx,messages:[{role:"user",content:userMsg}]})});
      const data = await res.json();
      setMessages(prev => [...prev,{role:"assistant",content:data.content?.[0]?.text||"Sorry, try again."}]);
    } catch { setMessages(prev => [...prev,{role:"assistant",content:"Something went wrong. Try again!"}]); }
    finally { setLoading(false); }
  }
  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0f"}}>
      <Sidebar/>
      <main style={{display:"flex",flexDirection:"column",flex:1}}>
        <div style={{padding:"0 28px",height:"56px",display:"flex",alignItems:"center",borderBottom:"1px solid #2a2a3a"}}>
          <h1 style={{fontWeight:"bold",fontSize:"18px",color:"#fff"}}>AI Assistant</h1>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"24px",display:"flex",flexDirection:"column",gap:"12px"}}>
          {messages.map((m,i) => (
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"500px",padding:"12px 16px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?"#6c63ff":"#16161f",color:"#f0f0f8",fontSize:"14px",border:m.role==="assistant"?"1px solid #2a2a3a":"none"}}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"12px 16px",borderRadius:"18px 18px 18px 4px",background:"#16161f",color:"#606080",fontSize:"14px",border:"1px solid #2a2a3a"}}>Thinking...</div></div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"16px",borderTop:"1px solid #2a2a3a",display:"flex",gap:"12px"}}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&send()}
            placeholder="Ask about your attendance, marks..."
            style={{flex:1,padding:"12px 16px",borderRadius:"12px",background:"#16161f",border:"1px solid #2a2a3a",color:"#f0f0f8",fontSize:"14px",outline:"none"}}/>
          <button onClick={send} disabled={loading}
            style={{padding:"12px 20px",borderRadius:"12px",background:loading?"#4a44b0":"#6c63ff",color:"#fff",fontWeight:"500",border:"none",cursor:"pointer"}}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}`,
};

let created = 0;
for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (dir !== ".") fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log("✓ Created: " + filePath);
  created++;
}
console.log("\n✅ Done! Created " + created + " files.");
console.log("👉 Now run: npm run dev");