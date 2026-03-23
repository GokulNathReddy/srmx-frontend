const fs = require("fs");
const path = require("path");

// ── manifest.json ──────────────────────────────────────────────
const manifest = {
  name: "SRMX - Student Portal",
  short_name: "SRMX",
  description: "SRM University student portal — attendance, marks, timetable",
  start_url: "/",
  display: "standalone",
  background_color: "#07070e",
  theme_color: "#6c63ff",
  orientation: "portrait-primary",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ],
  categories: ["education", "utilities"],
  screenshots: []
};

fs.writeFileSync("public/manifest.json", JSON.stringify(manifest, null, 2));
console.log("✓ Created public/manifest.json");

// ── service worker ─────────────────────────────────────────────
const sw = `
const CACHE = "srmx-v1";
const STATIC = ["/", "/dashboard", "/attendance", "/marks", "/timetable", "/gpa"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Don't cache API calls
  if (url.hostname.includes("onrender.com") || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
`;
fs.writeFileSync("public/sw.js", sw.trim());
console.log("✓ Created public/sw.js");

// ── SVG icons ──────────────────────────────────────────────────
const makeSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#07070e"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,sans-serif" font-weight="900"
    font-size="${size * 0.42}" fill="#6c63ff">S</text>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,sans-serif" font-weight="900"
    font-size="${size * 0.42}" fill="none" stroke="#9b8fff" stroke-width="${size * 0.012}">S</text>
</svg>`;

// Write a simple placeholder PNG note (real icons need canvas/sharp)
fs.writeFileSync("public/icon-192.svg", makeSVG(192));
fs.writeFileSync("public/icon-512.svg", makeSVG(512));
console.log("✓ Created SVG icons (use them directly or convert to PNG)");

// ── SW registration component ──────────────────────────────────
const swComponent = `"use client";
import { useEffect } from "react";
export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(r => console.log("[SRMX] SW registered", r.scope))
        .catch(e => console.log("[SRMX] SW failed", e));
    }
  }, []);
  return null;
}
`;
fs.mkdirSync("components", { recursive: true });
fs.writeFileSync("components/RegisterSW.tsx", swComponent);
console.log("✓ Created components/RegisterSW.tsx");

// ── Updated layout.tsx with PWA meta tags ──────────────────────
const layout = `import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "SRMX — Student Portal",
  description: "SRM University student portal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SRMX",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c63ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#07070e" }}>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
`;
fs.writeFileSync("app/layout.tsx", layout);
console.log("✓ Updated app/layout.tsx with PWA meta");

// ── GPA page folder ────────────────────────────────────────────
fs.mkdirSync("app/gpa", { recursive: true });
console.log("✓ Created app/gpa/ folder");

console.log("\n✅ PWA setup complete!");
console.log("👉 Next steps:");
console.log("   1. Copy gpa_page.tsx → app/gpa/page.tsx");
console.log("   2. Copy marks_page.tsx → app/marks/page.tsx");
console.log("   3. Add GPA link to Sidebar");
console.log("   4. npm run build && npx vercel --prod");