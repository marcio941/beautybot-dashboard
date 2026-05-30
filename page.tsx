"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import Appointments from "@/components/Appointments";
import Conversations from "@/components/Conversations";
import Services from "@/components/Services";
import Settings from "@/components/Settings";

export type Page = "dashboard" | "appointments" | "conversations" | "services" | "settings";

export default function Home() {
  const [activePage, setActivePage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "appointments": return <Appointments />;
      case "conversations": return <Conversations />;
      case "services": return <Services />;
      case "settings": return <Settings />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0F] overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}
