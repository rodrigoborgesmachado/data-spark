import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home.jsx";
import RandomInfoPage from "./pages/RandomInfoPage/RandomInfoPage.jsx";
import VerifyCompany from "./pages/VerifyCompany/VerifyCompany.jsx";
import NamesIbge from "./pages/NamesIbge/NamesIbge.jsx";
import Holidays from "./pages/Holidays/Holidays.jsx";
import Banks from "./pages/Banks/Banks.jsx";
import Cep from "./pages/Cep/Cep.jsx";
import Fipe from "./pages/Fipe/Fipe.jsx";
import TextTools from "./pages/TextTools/TextTools.jsx";
import MarkdownRenderer from "./pages/MarkdownRenderer/MarkdownRenderer.jsx";
import Cnj from "./pages/Cnj/Cnj.jsx";
import QrCode from "./pages/QrCode/QrCode.jsx";
import CyclingCalculators from "./pages/CyclingCalculators/CyclingCalculators.jsx";
import MobillsAnalyzer from "./pages/MobillsAnalyzer/MobillsAnalyzer.jsx";
import About from "./pages/About/About.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy.jsx";
import TermsOfUse from "./pages/TermsOfUse/TermsOfUse.jsx";
import { ROUTES } from "./routes/config";
import "./assets/css/index.css";

export default function App() {
  const verifyRoute = ROUTES.find((r) => r.type === "verify");
  const dataRoutes = ROUTES.filter((r) => r.type === "data");
  const toolsRoutes = ROUTES.filter((r) => r.type === "tools");
  const qrRoute = ROUTES.find((r) => r.type === "qr");

  return (
    <div className="layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>

      <div className="page-shell">
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
              if (r.path === "/fipe") {
                return <Route key={r.path} path={r.path} element={<Fipe />} />;
              }
              if (r.path === "/cnj") {
                return <Route key={r.path} path={r.path} element={<Cnj />} />;
              }
              return null;
            })}

            {toolsRoutes.map((r) => (
              r.path === "/calculos-ciclistas" ? (
                <Route
                  key={r.path}
                  path={r.path}
                  element={<CyclingCalculators title={r.title} />}
                />
              ) : r.path === "/ferramentas/analisador-mobills" ? (
                <Route
                  key={r.path}
                  path={r.path}
                  element={<MobillsAnalyzer title={r.title} />}
                />
              ) : r.path === "/markdown" ? (
                <Route
                  key={r.path}
                  path={r.path}
                  element={<MarkdownRenderer title={r.title} />}
                />
              ) : (
                <Route
                  key={r.path}
                  path={r.path}
                  element={<TextTools title={r.title} />}
                />
              )
            ))}

            {qrRoute && (
              <Route
                path={qrRoute.path}
                element={<QrCode title={qrRoute.title} />}
              />
            )}

            <Route path="/sobre" element={<About />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermsOfUse />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
}
