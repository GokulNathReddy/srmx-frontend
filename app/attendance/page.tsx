"use client";
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
    dataAPI.getAttendance().then(d => { setAtt(d.data || []); setLoading(false); }).catch(() => router.push("/"));
  }, []);

  const filtered = att.filter(c =>
    filter === "all" ? true : filter === "safe" ? parseFloat(c["Attn %"]) >= 75 : parseFloat(c["Attn %"]) < 75
  );

  const filters = [
    { key: "all", label: "All", count: att.length },
    { key: "safe", label: "Safe", count: att.filter(c => parseFloat(c["Attn %"]) >= 75).length },
    { key: "risk", label: "At Risk", count: att.filter(c => parseFloat(c["Attn %"]) < 75).length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "-160px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(108,99,255,0.06)", filter: "blur(120px)" }} />
      </div>
      <Sidebar />
      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>
        <div style={{ position: "sticky", top: 0, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
          <h1 style={{ fontWeight: "600", fontSize: "16px", color: "#f4f4f5" }}>Attendance</h1>
          <div style={{ display: "flex", gap: "6px" }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", cursor: "pointer", border: "none", background: filter === f.key ? "#6c63ff" : "rgba(255,255,255,0.05)", color: filter === f.key ? "#fff" : "#a1a1aa", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                {f.label}
                <span style={{ padding: "1px 6px", borderRadius: "999px", background: filter === f.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", fontSize: "10px" }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px", color: "#a1a1aa" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(108,99,255,0.3)", borderTopColor: "#6c63ff", animation: "spin 0.8s linear infinite" }} />
              Loading attendance...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "14px" }}>
              {filtered.map((c: any) => <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />)}
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}