"use client";
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
              placeholder="xxxxxx@srmist.edu.in"
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

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}