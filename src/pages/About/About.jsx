export default function About() {
  return (
    <article className="verify info-page">
      <header className="verify__header">
        <p className="eyebrow">Institucional</p>
        <h1 className="page-title">Sobre o Data Spark</h1>
      </header>

      <section className="panel info-page__content">
        <p>
          O Data Spark é uma plataforma web criada para reunir ferramentas úteis
          em um único lugar, oferecendo consultas públicas, geradores de dados e
          utilidades para desenvolvimento, produtividade e tarefas do dia a dia.
        </p>

        <p>
          A proposta do projeto é simplificar o acesso a recursos que normalmente
          exigiriam navegar entre diversos sites ou integrar diferentes APIs. Em
          uma única interface é possível consultar informações públicas
          brasileiras, gerar dados fictícios para testes, utilizar ferramentas de
          texto, renderizar arquivos Markdown, gerar QR Codes e realizar cálculos
          para ciclistas.
        </p>

        <h2>Para quem foi pensado</h2>
        <ul>
          <li>Desenvolvedores</li>
          <li>Analistas</li>
          <li>QA/Testers</li>
          <li>Estudantes</li>
          <li>Usuários que precisam consultar dados rapidamente</li>
        </ul>

        <h2>Atualmente a plataforma oferece</h2>

        <h3>Consultas</h3>
        <ul>
          <li>Consulta de empresas por CNPJ</li>
          <li>FIPE</li>
          <li>CEP</li>
          <li>Bancos</li>
          <li>Feriados</li>
          <li>IBGE - Nomes</li>
          <li>Consulta CNJ</li>
        </ul>

        <h3>Geradores</h3>
        <ul>
          <li>Pessoa Física</li>
          <li>Empresa</li>
          <li>Cartão de Crédito</li>
          <li>Veículo</li>
          <li>Escola</li>
        </ul>

        <h3>Ferramentas</h3>
        <ul>
          <li>Contadores de texto</li>
          <li>Renderizador Markdown</li>
          <li>Gerador de QR Code</li>
          <li>Calculadoras para ciclistas</li>
        </ul>

        <p>
          O projeto continua em constante evolução, recebendo novas ferramentas
          e melhorias sempre que possível.
        </p>

        <p>Desenvolvido por SunSale System.</p>
      </section>
    </article>
  );
}
