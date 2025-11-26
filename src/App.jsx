import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home/Home.jsx";
import RandomInfoPage from "./pages/RandomInfoPage/RandomInfoPage.jsx";
import VerifyCompany from "./pages/VerifyCompany/VerifyCompany.jsx";
import NamesIbge from "./pages/NamesIbge/NamesIbge.jsx";
import Holidays from "./pages/Holidays/Holidays.jsx";
import Banks from "./pages/Banks/Banks.jsx";
import Cep from "./pages/Cep/Cep.jsx";
import { ROUTES } from "./routes/config";
import "./assets/css/index.css";

export default function App() {
  const verifyRoute = ROUTES.find((r) => r.type === "verify");
  const dataRoutes = ROUTES.filter((r) => r.type === "data");

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

          {verifyRoute && (
            <Route
              path={verifyRoute.path}
              element={<VerifyCompany title={verifyRoute.title} />}
            />
          )}

          {dataRoutes.map((r) => {
            if (r.path === "/ibge-nomes") {
              return <Route key={r.path} path={r.path} element={<NamesIbge />} />;
            }
            if (r.path === "/feriados") {
              return <Route key={r.path} path={r.path} element={<Holidays />} />;
            }
            if (r.path === "/bancos") {
              return <Route key={r.path} path={r.path} element={<Banks />} />;
            }
            if (r.path === "/cep") {
              return <Route key={r.path} path={r.path} element={<Cep />} />;
            }
            return null;
          })}
        </Routes>
      </main>
    </div>
  );
}
