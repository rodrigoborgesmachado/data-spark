import { NavLink } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import { CATEGORIES, ROUTES } from "../routes/config";

export default function Sidebar({ collapsed = false, onToggle, onNavigate }) {
  function navLink(route) {
    return <Nav.Link as={NavLink} end to={route.path} key={route.path} onClick={onNavigate}
      title={collapsed ? route.label : undefined} aria-label={route.label}
      className="menu__link">
      <i className={`bi bi-${route.icon}`} aria-hidden="true" /><span className="menu-label">{route.label}</span>
    </Nav.Link>;
  }
  return <nav className="menu" aria-label="Navegação principal">
    <NavLink to="/" className="menu__title" onClick={onNavigate} aria-label="Data Spark — início">
      <span className="brand-mark"><i className="bi bi-lightning-charge-fill" aria-hidden="true" /></span><span className="menu-label">Data Spark</span>
    </NavLink>
    <p className="sidebar-caption menu-label">Seu kit de ferramentas</p>
    <Nav className="menu__home">{navLink(ROUTES[0])}</Nav>
    <div className="menu__groups">{CATEGORIES.map((category) => <div key={category.key} className="menu__block">
      <div className="menu__group-title">{collapsed ? <i className={`bi bi-${category.icon}`} title={category.label} aria-label={category.label} /> : category.label}</div>
      <Nav className="menu__list">{ROUTES.filter((route) => route.category === category.key).map(navLink)}</Nav>
    </div>)}</div>
    <div className="sidebar-bottom">
      <Nav.Link as={NavLink} to="/sobre" onClick={onNavigate} className="menu__link" aria-label="Sobre o Data Spark" title={collapsed ? "Sobre" : undefined}><i className="bi bi-info-circle" aria-hidden="true" /><span className="menu-label">Sobre o Data Spark</span></Nav.Link>
      {onToggle && <Button variant="outline-secondary" className="sidebar-collapse" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>
        <i className={`bi bi-layout-sidebar${collapsed ? '-reverse' : ''}`} aria-hidden="true" /><span className="menu-label">Recolher menu</span>
      </Button>}
    </div>
  </nav>;
}
