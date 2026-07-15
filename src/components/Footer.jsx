import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__copy">
          SunSale System © {currentYear} — Todos os direitos reservados.
        </p>

        <nav className="site-footer__nav" aria-label="Links institucionais">
          <Link to="/sobre">Sobre</Link>
          <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          <Link to="/termos-de-uso">Termos de Uso</Link>
        </nav>
      </div>
    </footer>
  );
}
