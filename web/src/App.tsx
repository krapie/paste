import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import CreatePage from "./pages/CreatePage.tsx";
import ViewPage from "./pages/ViewPage.tsx";

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function PiMark({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="pi-mark" style={{ cursor: "pointer", border: "none" }} aria-label="Go to home">
      <span>π</span>
    </button>
  );
}


function AppShell() {
  const navigate = useNavigate();
  const [dark, setDark] = useState<boolean>(() => {
    // v2: theme is only persisted on explicit user toggle (not auto-saved from system)
    if (localStorage.getItem("theme-v") !== "2") {
      localStorage.removeItem("theme");
      localStorage.setItem("theme-v", "2");
    }
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Listen for system preference changes (only when no user override)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) setDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleToggle = () => {
    setDark(d => {
      const next = !d;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <PiMark onClick={() => navigate("/")} />
          <span className="header-title">paste</span>
          <button className="theme-toggle" onClick={handleToggle} aria-label="Toggle theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<CreatePage />} />
          <Route path="/:id" element={<ViewPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>© 2026 kevinprk</span>
          <span>π</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
