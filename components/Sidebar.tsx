"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: HomeIcon },
  { href: "/attendance", label: "Attendance",  icon: ChartIcon },
  { href: "/marks",      label: "Marks",       icon: StarIcon },
  { href: "/timetable",  label: "Timetable",   icon: CalIcon },
  { href: "/gpa",        label: "GPA Calc",    icon: GpaIcon },
  { href: "/ai",         label: "AI Assistant",icon: BotIcon },
];

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuthStore();

  const initials = profile?.["Name"]
    ? profile["Name"].split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        position: "fixed", top: 0, left: 0, width: "256px", height: "100vh",
        background: "rgba(9,9,15,0.97)", borderRight: "1px solid rgba(255,255,255,0.055)",
        backdropFilter: "blur(24px)", display: "flex", flexDirection: "column",
        zIndex: 100, fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
          <div style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff" }}>
            SRM<span style={{ color: "#6c63ff" }}>X</span>
          </div>
          <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginTop: "2px" }}>
            Student Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/dashboard" && path.startsWith(href));
            return (
              <button key={href} onClick={() => router.push(href)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "10px", marginBottom: "2px",
                  background: active ? "rgba(108,99,255,0.15)" : "transparent",
                  border: active ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
                  color: active ? "#a08fff" : "rgba(255,255,255,0.4)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  fontFamily: "inherit", fontSize: "13px", fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; } }}
              >
                <Icon active={active} />
                {label}
                {active && <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: "#6c63ff" }} />}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.055)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg,#6c63ff,#9b8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.["Name"] || "Student"}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Sem {profile?.["Semester"] || "—"}</div>
            </div>
            <button onClick={handleLogout}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", padding: "4px", borderRadius: "6px", display: "flex", transition: "color 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0, height: "60px",
        background: "rgba(9,9,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.055)",
        backdropFilter: "blur(24px)", zIndex: 100, alignItems: "center", justifyContent: "space-around",
        fontFamily: "'Inter', system-ui, sans-serif",
      }} className="mobile-nav">
        {NAV.filter(n => n.href !== "/ai").map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <button key={href} onClick={() => router.push(href)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", color: active ? "#6c63ff" : "rgba(255,255,255,0.35)", padding: "8px", fontFamily: "inherit" }}>
              <Icon active={active} />
              <span style={{ fontSize: "9px", fontWeight: active ? 700 : 400 }}>{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          aside { display: none !important; }
          .mobile-nav { display: flex !important; }
          main, [style*="paddingLeft: 272px"], [style*="padding-left: 272px"] {
            padding-left: 0 !important;
            padding-bottom: 68px !important;
          }
        }
      `}</style>
    </>
  );
}

// ── Icons ──────────────────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function ChartIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>;
}
function StarIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function CalIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
}
function GpaIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
}
function BotIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
}