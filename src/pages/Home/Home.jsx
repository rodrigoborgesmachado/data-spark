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

      <div className="quick-links-group">
        <div>
          <h2 className="quick-links__title">Consultas</h2>
          <div className="quick-links">
            <Link to="/verify-company" className="card-link">Verificar empresa</Link>
            <Link to="/ibge-nomes" className="card-link">IBGE - Nomes</Link>
            <Link to="/feriados" className="card-link">Feriados</Link>
            <Link to="/bancos" className="card-link">Bancos</Link>
            <Link to="/cep" className="card-link">CEP</Link>
            <Link to="/cnj" className="card-link">Consulta CNJ</Link>
            <Link to="/fipe" className="card-link">FIPE</Link>
          </div>
        </div>

        <div>
          <h2 className="quick-links__title">Geradores</h2>
          <div className="quick-links">
            <Link to="/person" className="card-link">Pessoa Fisica</Link>
            <Link to="/company" className="card-link">Empresa</Link>
            <Link to="/card" className="card-link">Cartao de credito</Link>
            <Link to="/vehicle" className="card-link">Veiculo</Link>
            <Link to="/school" className="card-link">Escola</Link>
          </div>
        </div>

        <div>
          <h2 className="quick-links__title">Ferramentas</h2>
          <div className="quick-links">
            <Link to="/texto" className="card-link">Texto (contadores)</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
