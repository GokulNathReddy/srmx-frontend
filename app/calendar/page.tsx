"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";

function parseMonths(data: string[][][]) {
  const months: { name: string; days: { date: string; day: string; order: string; event: string; isHoliday: boolean }[] }[] = [];
  data.forEach(table => {
    if (!table.length) return;
    let monthName = "";
    let startRow = 0;
    const firstRow = table[0];
    if (firstRow.length <= 2 || (firstRow[0] && !firstRow[0].match(/^\d/))) {
      monthName = firstRow.join(" ").trim();
      startRow = 1;
    }
    if (!monthName) return;
    const days: any[] = [];
    for (let i = startRow; i < table.length; i++) {
      const row = table[i];
      if (row.length < 2) continue;
      const date = row[0]?.trim();
      const day = row[1]?.trim();
      const order = row[2]?.trim() || "-";
      const event = row[3]?.trim() || "";
      if (!date || !date.match(/^\d/)) continue;
      const isHoliday = order === "-" || order === "" || /holiday|holi|vacation|exam/i.test(event);
      days.push({ date, day, order, event, isHoliday });
    }
    if (days.length > 0) months.push({ name: monthName, days });
  });
  return months;
}

const DO_COLORS: Record<string, string> = {
  "1": "#6c63ff", "2": "#22c55e", "3": "#f59e0b", "4": "#ec4899", "5": "#06b6d4",
};

export default function CalendarPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthIdx, setMonthIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) return router.push("/");
    dataAPI.getCalendar()
      .then(d => { setRawData(d.data || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const months = parseMonths(rawData);

  useEffect(() => {
    if (!months.length) return;
    const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const curMonth = monthNames[new Date().getMonth()];
    const idx = months.findIndex(m => m.name.toLowerCase().includes(curMonth));
    if (idx !== -1) setMonthIdx(idx);
  }, [rawData]);

  const current = months[monthIdx];
  const today = new Date();

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#f4f4f5" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-100px", left: "200px", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(108,99,255,0.06)", filter: "blur(120px)" }} />
      </div>
      <Sidebar />
      <main style={{ paddingLeft: "272px", position: "relative", zIndex: 1 }}>
        <div style={{ position: "sticky", top: 0, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(8,8,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}>
          <h1 style={{ fontWeight: "600", fontSize: "16px" }}>Academic Calendar</h1>
          <span style={{ fontSize: "12px", color: "#a1a1aa" }}>2025–26 Even Semester</span>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px", color: "#a1a1aa" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(108,99,255,0.3)", borderTopColor: "#6c63ff", animation: "spin 0.8s linear infinite" }} />
              Loading calendar...
            </div>
          ) : months.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#606060", fontSize: "14px" }}>No calendar data found</div>
          ) : (
            <>
              {/* Month switcher */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "20px" }}>
                <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))}
                  style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "#f4f4f5", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <h2 style={{ fontSize: "32px", fontWeight: "300", minWidth: "200px", textAlign: "center" }}>{current?.name}</h2>
                <button onClick={() => setMonthIdx(i => Math.min(months.length - 1, i + 1))}
                  style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "#f4f4f5", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>

              {/* Month pills */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "28px" }}>
                {months.map((m, i) => (
                  <button key={i} onClick={() => setMonthIdx(i)}
                    style={{ padding: "4px 14px", borderRadius: "999px", fontSize: "12px", cursor: "pointer", border: "none", background: monthIdx === i ? "#6c63ff" : "rgba(255,255,255,0.05)", color: monthIdx === i ? "#fff" : "#a1a1aa" }}>
                    {m.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Days */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "720px", margin: "0 auto" }}>
                {current?.days.map((d, i) => {
                  const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
                  const isToday = d.date === today.getDate().toString() &&
                    current.name.toLowerCase().includes(monthNames[today.getMonth()]);
                  const doColor = DO_COLORS[d.order] || "#606060";

                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", borderRadius: "12px",
                      background: isToday ? "rgba(108,99,255,0.1)" : d.isHoliday ? "rgba(239,68,68,0.04)" : "rgba(20,20,30,0.5)",
                      border: isToday ? "1px solid rgba(108,99,255,0.4)" : d.isHoliday ? "1px solid rgba(239,68,68,0.12)" : "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {/* Date */}
                      <div style={{ width: "44px", textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: isToday ? "#8b84ff" : d.isHoliday ? "#ef4444" : "#f4f4f5", lineHeight: 1 }}>{d.date}</div>
                        <div style={{ fontSize: "10px", color: "#606060", marginTop: "2px" }}>{d.day}</div>
                      </div>
                      <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.06)" }} />
                      {/* Event */}
                      <div style={{ flex: 1, fontSize: "13px", color: d.isHoliday ? "#f87171" : "#a1a1aa" }}>
                        {d.event || (d.isHoliday ? "Holiday" : "Regular Classes")}
                      </div>
                      {/* Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isToday && (
                          <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "999px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", fontSize: "10px", color: "#60a5fa", fontWeight: "600" }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s infinite", display: "inline-block" }} />
                            Today
                          </span>
                        )}
                        <span style={{ padding: "3px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "700",
                          background: d.isHoliday ? "rgba(239,68,68,0.1)" : `${doColor}18`,
                          border: `1px solid ${d.isHoliday ? "rgba(239,68,68,0.2)" : doColor + "35"}`,
                          color: d.isHoliday ? "#ef4444" : doColor }}>
                          {d.isHoliday ? "Holiday" : `DO ${d.order}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}