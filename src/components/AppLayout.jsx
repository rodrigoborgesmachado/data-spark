import { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import Footer from "./Footer";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  return <div className={`layout ${collapsed ? "layout--collapsed" : ""}`}>
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <aside className="sidebar"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /></aside>
    <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} className="mobile-sidebar" aria-labelledby="navigation-title">
      <Offcanvas.Header closeButton><Offcanvas.Title id="navigation-title">Navegação</Offcanvas.Title></Offcanvas.Header>
      <Offcanvas.Body><Sidebar onNavigate={() => setShowMenu(false)} /></Offcanvas.Body>
    </Offcanvas>
    <div className="page-shell">
      <AppHeader onMenu={() => setShowMenu(true)} />
      <main className="content" id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  </div>;
}
