import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="hero">
      <h1 className="hero__title">
        Bem-vindo ao <span className="brand">Data Spark</span>
      </h1>

      <p className="hero__subtitle">
        Gere informacoes aleatorias para testes e desenvolvimento.
        {" "}
        Escolha no menu lateral ou clique em uma das opcoes abaixo:
      </p>

      <div className="quick-links">
        <Link to="/person" className="card-link">Pessoa Fisica</Link>
        <Link to="/company" className="card-link">Empresa</Link>
        <Link to="/card" className="card-link">Cartao de credito</Link>
        <Link to="/vehicle" className="card-link">Veiculo</Link>
        <Link to="/school" className="card-link">Escola</Link>
        <Link to="/verify-company" className="card-link">Verificar empresa</Link>
      </div>
    </section>
  );
}
