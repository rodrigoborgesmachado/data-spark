import { NavLink } from "react-router-dom";
import { ROUTES } from "../routes/config";

export default function Sidebar() {
  const links = ROUTES.filter(r => r.path !== "/");
  const groups = links.reduce((acc, route) => {
    const key = route.category || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(route);
    return acc;
  }, {});

  const groupLabels = {
    consultas: "Consultas",
    geradores: "Geradores",
    utilidades: "Utilidades",
  };

  return (
    <nav className="menu" aria-label="Main navigation">
      <NavLink to="/" className="menu__title">
        Data Spark
      </NavLink>
      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="menu__block">
          <div className="menu__group-title">
            {groupLabels[category] || category}
          </div>
          <ul className="menu__list">
            {items.map((r) => (
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
        </div>
      ))}
    </nav>
  );
}
