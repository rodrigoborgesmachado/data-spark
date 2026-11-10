import { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import Footer from "./Footer";

const FAVORITES_KEY = "dataSpark.favorites.v1";

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((path) => typeof path === "string") : [];
  } catch {
    return [];
  }
}

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [favorites, setFavorites] = useState(readFavorites);
  function toggleFavorite(path) {
    const next = favorites.includes(path) ? favorites.filter((item) => item !== path) : [...favorites, path];
    setFavorites(next);
    try {
      if (next.length) localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      else localStorage.removeItem(FAVORITES_KEY);
    } catch { /* Keep the favorites for this session. */ }
  }
  return <div className={`layout ${collapsed ? "layout--collapsed" : ""}`}>
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <aside className="sidebar"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} favorites={favorites} onToggleFavorite={toggleFavorite} /></aside>
    <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} className="mobile-sidebar" aria-labelledby="navigation-title">
      <Offcanvas.Header closeButton><Offcanvas.Title id="navigation-title">Navegação</Offcanvas.Title></Offcanvas.Header>
      <Offcanvas.Body><Sidebar onNavigate={() => setShowMenu(false)} favorites={favorites} onToggleFavorite={toggleFavorite} /></Offcanvas.Body>
    </Offcanvas>
    <div className="page-shell">
      <AppHeader onMenu={() => setShowMenu(true)} />
      <main className="content" id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  </div>;
}
