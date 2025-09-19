import { NavLink } from "react-router-dom";
import { ROUTES } from "../routes/config";

export default function Sidebar() {
  const links = ROUTES.filter(r => r.path !== "/"); 
  return (
    <nav className="menu" aria-label="Main navigation">
      <NavLink to="/" className="menu__title">
        Data Spark
      </NavLink>
      <ul className="menu__list">
        {links.map(r => (
          <li key={r.path} className="menu__item">
            <NavLink
              to={r.path}
              className={({ isActive }) => `menu__link ${isActive ? "is-active" : ""}`}
            >
              {r.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
