"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { setToken } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  async function handleLogin() {
    if (!email || !password) return setError("Please enter your email and password.");
    setLoading(true); setError("");
    try {
      const res = await authAPI.login(email, password);
      setToken(res.token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .srmx-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #07070e;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          position: relative;
          overflow: hidden;
          background: #07070e;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
        }

        .grid-lines {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(245,166,35,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,166,35,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .orb-1 {
          position: absolute; top: -80px; left: -80px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .orb-2 {
          position: absolute; bottom: -120px; right: -60px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand-logo {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 60px;
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.6s ease forwards 0.1s;
        }

        .brand-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, #f5a623, #f7c068);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 32px rgba(245,166,35,0.3);
        }

        .brand-icon svg { width: 26px; height: 26px; }

        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .brand-name span { color: #f5a623; }

        .brand-sub {
          font-size: 11px; font-weight: 500; letter-spacing: 3px;
          color: rgba(255,255,255,0.3); text-transform: uppercase;
          margin-top: 2px;
        }

        .hero-text {
          opacity: 0; transform: translateY(16px);
          animation: fadeUp 0.6s ease forwards 0.25s;
        }

        .hero-text h2 {
          font-family: 'Playfair Display', serif;
          font-size: 48px; line-height: 1.15;
          color: #fff; font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 18px;
        }

        .hero-text h2 em {
          font-style: italic; color: #f5a623;
        }

        .hero-text p {
          font-size: 15px; line-height: 1.7;
          color: rgba(255,255,255,0.45);
          max-width: 340px;
        }

        .stats-row {
          display: flex; gap: 32px;
          margin-top: 52px;
          opacity: 0; transform: translateY(16px);
          animation: fadeUp 0.6s ease forwards 0.4s;
        }

        .stat-item {}
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 30px; font-weight: 700;
          color: #f5a623;
        }
        .stat-label {
          font-size: 12px; color: rgba(255,255,255,0.35);
          letter-spacing: 1px; text-transform: uppercase;
          margin-top: 2px;
        }

        .divider-v {
          width: 1px; background: rgba(255,255,255,0.08);
          align-self: stretch;
        }

        .preview-cards {
          margin-top: 52px;
          display: flex; flex-direction: column; gap: 12px;
          opacity: 0; transform: translateY(16px);
          animation: fadeUp 0.6s ease forwards 0.55s;
        }

        .pcard {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex; align-items: center; gap: 16px;
          transition: border-color 0.2s;
        }
        .pcard:hover { border-color: rgba(245,166,35,0.25); }

        .pcard-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .pcard-icon.att { background: rgba(245,166,35,0.15); }
        .pcard-icon.marks { background: rgba(99,205,160,0.15); }
        .pcard-icon.time { background: rgba(99,153,255,0.15); }

        .pcard-icon svg { width: 18px; height: 18px; }

        .pcard-label { font-size: 13px; color: rgba(255,255,255,0.4); }
        .pcard-val { font-size: 15px; font-weight: 600; color: #fff; margin-top: 1px; }

        .pcard-bar {
          margin-left: auto; width: 80px; height: 5px;
          background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden;
        }
        .pcard-bar-fill {
          height: 100%; border-radius: 99px;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          background: #0d0d18;
          border-left: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          padding: 60px 56px;
        }

        .form-container {
          width: 100%; max-width: 400px;
          opacity: 0; transform: translateY(20px);
          animation: fadeUp 0.7s ease forwards 0.3s;
        }

        .form-header {
          margin-bottom: 36px;
        }

        .form-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: #f5a623;
          margin-bottom: 12px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 700;
          color: #fff; line-height: 1.2; letter-spacing: -0.5px;
          margin-bottom: 10px;
        }

        .form-sub {
          font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.6;
        }

        .error-box {
          margin-bottom: 20px;
          padding: 13px 16px;
          border-radius: 12px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          font-size: 13px;
          display: flex; align-items: center; gap: 10px;
        }

        .field { margin-bottom: 18px; }

        .field-label {
          display: block;
          font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.5px;
          margin-bottom: 9px;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute; left: 15px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
          display: flex;
        }

        .srmx-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #f4f4f5;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .srmx-input::placeholder { color: rgba(255,255,255,0.2); }

        .srmx-input:focus {
          border-color: rgba(245,166,35,0.5);
          background: rgba(245,166,35,0.04);
          box-shadow: 0 0 0 3px rgba(245,166,35,0.08);
        }

        .pass-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25);
          display: flex; padding: 4px;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: rgba(255,255,255,0.6); }

        .srmx-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, #f5a623, #f7c068);
          color: #0d0d18;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 28px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(245,166,35,0.2);
          letter-spacing: 0.2px;
        }

        .srmx-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(245,166,35,0.3);
        }
        .srmx-btn:active:not(:disabled) { transform: translateY(0); }
        .srmx-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .srmx-btn .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(13,13,24,0.3);
          border-top-color: #0d0d18;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .form-footer {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .footer-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }

        .footer-text {
          font-size: 12px; color: rgba(255,255,255,0.25);
        }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .srmx-root { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .right-panel { min-height: 100vh; }
        }
      `}</style>

      <div className="srmx-root">
        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="grid-lines" />
          <div className="orb-1" />
          <div className="orb-2" />

          {/* Brand */}
          <div className="brand-logo">
            <div className="brand-icon">
              <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 7v6c0 5.55 4.28 10.74 10 12 5.72-1.26 10-6.45 10-12V7L13 2z" fill="#0d0d18" fillOpacity="0.4"/>
                <path d="M9 13l3 3 6-6" stroke="#0d0d18" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="brand-name">SRM<span>X</span></div>
              <div className="brand-sub">Student Portal</div>
            </div>
          </div>

          {/* Hero */}
          <div className="hero-text">
            <h2>Your campus,<br /><em>simplified.</em></h2>
            <p>Access attendance, marks, timetable, and more — all in one place, built for SRM students.</p>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num">98%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="divider-v" />
            <div className="stat-item">
              <div className="stat-num">12+</div>
              <div className="stat-label">Features</div>
            </div>
            <div className="divider-v" />
            <div className="stat-item">
              <div className="stat-num">SRM</div>
              <div className="stat-label">Official Data</div>
            </div>
          </div>

          {/* Preview cards */}
          <div className="preview-cards">
            <div className="pcard">
              <div className="pcard-icon att">
                <svg viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="2" stroke="#f5a623" strokeWidth="1.5"/><path d="M6 7h6M6 10h4" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="pcard-label">Attendance</div>
                <div className="pcard-val">87.4%</div>
              </div>
              <div className="pcard-bar">
                <div className="pcard-bar-fill" style={{ width: "87%", background: "linear-gradient(90deg, #f5a623, #f7c068)" }} />
              </div>
            </div>

            <div className="pcard">
              <div className="pcard-icon marks">
                <svg viewBox="0 0 18 18" fill="none"><path d="M9 2l1.8 3.6 4 .6-2.9 2.8.7 4L9 11l-3.6 1.9.7-4L3.2 6.2l4-.6L9 2z" stroke="#63cda0" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="pcard-label">GPA / Marks</div>
                <div className="pcard-val">8.6 CGPA</div>
              </div>
              <div className="pcard-bar">
                <div className="pcard-bar-fill" style={{ width: "86%", background: "linear-gradient(90deg, #63cda0, #8de8c0)" }} />
              </div>
            </div>

            <div className="pcard">
              <div className="pcard-icon time">
                <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="#6399ff" strokeWidth="1.5"/><path d="M9 5.5V9l2.5 2.5" stroke="#6399ff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="pcard-label">Next Class</div>
                <div className="pcard-val">OS Lab — 2:30 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-container">
            <div className="form-header">
              <div className="form-eyebrow">Secure Login</div>
              <h1 className="form-title">Welcome back</h1>
              <p className="form-sub">Use your SRM Academia credentials to sign in.</p>
            </div>

            {error && (
              <div className="error-box">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <div className="field">
              <label className="field-label">SRM Email</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="xxxxxx@srmist.edu.in"
                  className="srmx-input"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your SRM password"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="srmx-input"
                />
                <button className="pass-toggle" onClick={() => setShowPass(p => !p)} type="button" aria-label="Toggle password">
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                  }
                </button>
              </div>
            </div>

            <button className="srmx-btn" onClick={handleLogin} disabled={loading}>
              {loading
                ? <><div className="spinner" /> Signing in…</>
                : <>
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </>
              }
            </button>

            <div className="form-footer">
              <div className="footer-dot" />
              <span className="footer-text">Credentials are never stored on our servers</span>
              <div className="footer-dot" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
