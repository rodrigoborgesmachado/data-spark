import Button from "react-bootstrap/Button";
import { useLocation } from "react-router-dom";
import { ROUTES } from "../routes/config";
import ThemeToggle from "./ThemeToggle";

export default function AppHeader({ onMenu }) {
  const { pathname } = useLocation();
  const title = ROUTES.find((route) => route.path === pathname)?.label || ({ "/sobre": "Sobre", "/politica-de-privacidade": "Política de Privacidade", "/termos-de-uso": "Termos de Uso" }[pathname]) || "Página não encontrada";
  return <header className="app-header">
    <div className="app-header__location">
      <Button variant="outline-secondary" className="mobile-menu" onClick={onMenu} aria-label="Abrir navegação"><i className="bi bi-list" aria-hidden="true" /></Button>
      <span>{title}</span>
    </div>
    <ThemeToggle />
  </header>;
}
