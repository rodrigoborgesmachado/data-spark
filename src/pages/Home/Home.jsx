import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="hero">
      <h1 className="hero__title">
        Bem-vindo ao <span className="brand">Data Spark</span>
      </h1>

      <p className="hero__subtitle">
        Gere informações aleatórias para testes e desenvolvimento. 
        Escolha no menu lateral ou clique em uma das opções abaixo:
      </p>

      <div className="quick-links">
        <Link to="/person" className="card-link">Pessoa Física</Link>
        <Link to="/company" className="card-link">Empresa</Link>
        <Link to="/card" className="card-link">Cartão de crédito</Link>
        <Link to="/vehicle" className="card-link">Veículo</Link>
        <Link to="/school" className="card-link">Escola</Link>
      </div>
    </section>
  );
}