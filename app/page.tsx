"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import Appointments from "@/components/Appointments";
import Conversations from "@/components/Conversations";
import Services from "@/components/Services";
import Settings from "@/components/Settings";

export type Page = "dashboard" | "appointments" | "conversations" | "services" | "settings";

export default function Home() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("beautybot-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("beautybot-theme", next);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":     return <Dashboard />;
      case "appointments":  return <Appointments />;
      case "conversations": return <Conversations />;
      case "services":      return <Services />;
      case "settings":      return <Settings />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-deep)", overflow: "hidden" }}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main style={{ flex: 1, overflow: "auto" }}>
        {renderPage()}
      </main>
    </div>
  );
}
