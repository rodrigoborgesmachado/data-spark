import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

const key = "dataSpark.theme";
export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.bsTheme || "light");
  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = () => {
      try { if (localStorage.getItem(key)) return; } catch { /* Storage may be unavailable. */ }
      setTheme(media.matches ? "dark" : "light");
    };
    const sync = (event) => {
      if (event.key === key) {
        if (["light", "dark"].includes(event.newValue)) setTheme(event.newValue);
        else followSystem();
      }
    };
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.bsTheme = next;
    setTheme(next);
    try { localStorage.setItem(key, next); } catch { /* Keep the theme for this session. */ }
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
