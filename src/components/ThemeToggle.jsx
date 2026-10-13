import Button from "react-bootstrap/Button";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = `Ativar tema ${theme === "light" ? "escuro" : "claro"}`;
  return <Button variant="outline-secondary" className="theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
    <i className={`bi bi-${theme === "light" ? "moon" : "sun"}`} aria-hidden="true" />
    <span>{theme === "light" ? "Claro" : "Escuro"}</span>
  </Button>;
}
