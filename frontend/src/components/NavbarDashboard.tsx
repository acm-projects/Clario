import BrandMark from "./BrandMark";
import { useState } from "react";
import { Link, NavLink, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";


const items = [
  { to: "/dashboard", label: "Dashboard", kind: "home" },
  { to: "/interview", label: "Interview", kind: "mic" },
  { to: "/problems", label: "Problem Library", kind: "library" },
  { to: "/report", label: "Feedback Report", kind: "feedback" },
] as const;

export default function NavbarDashboard() {
  const context = useOutletContext<ProfileContext | undefined>();
  const name = context?.profile.display_name?.trim();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("clario:sidebar-collapsed") === "true"; }
    catch { return false; }
  });

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("clario:sidebar-collapsed", String(next)); }
    catch { /* Navigation still works when browser storage is unavailable. */ }
  }

  return (
    <aside className={`app-sidebar studio-sidebar${collapsed ? " sidebar-collapsed" : ""}`} aria-label="Clario navigation">
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand" aria-label="Clario dashboard"><BrandMark /></Link>
        <div className="sidebar-brand-copy"><span>Clario<span className="text-[#2378db]">.</span></span><small>Interview studio</small></div>
        <button type="button" className="sidebar-collapse" onClick={toggle} aria-expanded={!collapsed} aria-controls="workspace-navigation" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m14 7-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <p className="sidebar-section-label">YOUR WORKSPACE</p>
      <nav id="workspace-navigation" className="sidebar-links" aria-label="Main navigation">
        {items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"} title={item.label} aria-label={item.label}
          className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link-active" : ""}`}>
          <NavIcon kind={item.kind} /><span className="sidebar-tooltip">{item.label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-account">
        <NavLink to="/settings" title="Settings" aria-label="Settings" className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link-active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m9 3-.6 2.2-2 .9-2-.6-2 3.5 1.5 1.6v2.8L2.4 15l2 3.5 2-.6 2 .9L9 21h6l.6-2.2 2-.9 2 .6 2-3.5-1.5-1.6v-2.8L21.6 9l-2-3.5-2 .6-2-.9L15 3Z" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></svg>
          <span className="sidebar-tooltip">Settings</span>
        </NavLink>
        <div className="sidebar-person"><span className="sidebar-avatar" aria-hidden="true">{name ? name.charAt(0).toUpperCase() : "C"}</span><div className="sidebar-person-copy"><strong>{name || "Your space"}</strong><small>Find your flow.</small></div></div>
      </div>
    </aside>
  );
}

function NavIcon({ kind }: { kind: "home" | "mic" | "library" | "feedback" }) {
  const paths = { home: "M3 10 12 3l9 7M6 9v12h5v-7h3v7h4V9", mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM6 10v2a6 6 0 0 0 12 0v-2M12 18v4m-3 0h6", library: "m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5m-18 5 9 5 9-5", feedback: "M4 14h3v7H4Zm7-6h3v13h-3Zm7-5h3v18h-3Z" };
  return <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}