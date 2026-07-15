export default function PrivacyPolicy() {
  return (
    <article className="verify info-page">
      <header className="verify__header">
        <p className="eyebrow">Institucional</p>
        <h1 className="page-title">Política de Privacidade</h1>
      </header>

      <section className="panel info-page__content">
        <h2>1. Introdução</h2>
        <p>
          A privacidade dos usuários é importante para o Data Spark. Esta
          política explica, de forma simples, quais informações podem ser
          coletadas e como elas podem ser utilizadas durante o uso da plataforma.
        </p>

        <h2>2. Informações coletadas</h2>
        <p>
          O Data Spark não exige cadastro para utilização das ferramentas. Podem
          ser coletados apenas:
        </p>
        <ul>
          <li>informações enviadas pelo formulário de contato, caso exista futuramente;</li>
          <li>dados técnicos da requisição, como IP, navegador, data e horário;</li>
          <li>cookies estritamente necessários;</li>
          <li>métricas anônimas de utilização, quando aplicável.</li>
        </ul>

        <h2>3. Como utilizamos essas informações</h2>
        <ul>
          <li>funcionamento da plataforma;</li>
          <li>melhoria da experiência;</li>
          <li>correção de erros;</li>
          <li>estatísticas de uso.</li>
        </ul>

        <h2>4. Compartilhamento</h2>
        <p>
          O Data Spark não vende nem comercializa dados pessoais. Dados somente
          poderão ser compartilhados quando exigido por lei.
        </p>

        <h2>5. APIs de terceiros</h2>
        <p>
          Algumas funcionalidades dependem de APIs públicas de terceiros,
          incluindo:
        </p>
        <ul>
          <li>ReceitaWS</li>
          <li>ViaCEP</li>
          <li>BrasilAPI</li>
          <li>IBGE</li>
          <li>FIPE</li>
          <li>CNJ</li>
        </ul>
        <p>
          As consultas seguem as políticas de privacidade dos respectivos
          serviços.
        </p>

        <h2>6. Segurança</h2>
        <p>
          Medidas razoáveis são adotadas para proteger os dados e reduzir riscos
          de acesso indevido, perda, alteração ou uso não autorizado das
          informações.
        </p>

        <h2>7. Alterações</h2>
        <p>Esta política poderá ser atualizada futuramente.</p>
      </section>
    </article>
  );
}
