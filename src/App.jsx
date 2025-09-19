import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home/Home.jsx";
import RandomInfoPage from "./pages/RandomInfoPage/RandomInfoPage.jsx";
import { ROUTES } from "./routes/config";
import "./assets/css/index.css";

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>

      <main className="content">
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Dynamic random pages */}
          {ROUTES.filter(r => r.type === "random").map(r => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <RandomInfoPage
                  title={r.title}
                  path={r.apiPath}
                  params={r.params}
                />
              }
            />
          ))}
        </Routes>
      </main>
    </div>
  );
}
