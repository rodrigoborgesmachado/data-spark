import { EmptyState, ErrorState } from "../../components/Feedback";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useState } from "react";
import { ACQUIRERS } from "./sandboxCards";

const formatAmount = (amount) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);

export default function SandboxCards({ title = "Cartões de sandbox" }) {
  const [acquirerKey, setAcquirerKey] = useState(ACQUIRERS[0].key);
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [copyError, setCopyError] = useState("");

  const acquirer = ACQUIRERS.find((a) => a.key === acquirerKey);
  const brands = [...new Set(acquirer.cards.map((c) => c.brand))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const types = [...new Set(acquirer.cards.map((c) => c.type))];
  const cards = acquirer.cards.filter((c) => (!brand || c.brand === brand) && (!type || c.type === type));

  function handleAcquirerChange(value) {
    setAcquirerKey(value);
    setBrand("");
    setType("");
  }

  async function handleCopy(id, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setCopyError("");
    } catch {
      setCopiedId(null);
      setCopyError("Não foi possível copiar. Selecione o valor e copie manualmente.");
    }
  }

  function renderCopy(id, value, label) {
    return (
      <Button variant="outline-secondary"
        className="btn icon-btn"
        type="button"
        aria-label={`Copiar ${label}`}
        title={`Copiar ${label}`}
        onClick={() => handleCopy(id, value)}
      >
        <i className={`bi ${copiedId === id ? "bi-check2" : "bi-clipboard"}`} aria-hidden="true" />
      </Button>
    );
  }

  return (
    <section className="verify">
      <PageHeader eyebrow="Geradores de dados" title={<>{title}</>} description={<>
            Cartões aceitos pelo ambiente sandbox dos adquirentes e os valores
            que simulam cada erro.
          </>} />

      <Form className="form" onSubmit={(e) => e.preventDefault()}>
        <div className="form__grid">
          <div className="form__group">
            <label htmlFor="sandbox-acquirer">Adquirente</label>
            <Form.Select id="sandbox-acquirer" value={acquirerKey} onChange={(e) => handleAcquirerChange(e.target.value)}>
              {ACQUIRERS.map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </Form.Select>
          </div>
          <div className="form__group">
            <label htmlFor="sandbox-brand">Bandeira</label>
            <Form.Select id="sandbox-brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">Todas</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Form.Select>
          </div>
          <div className="form__group">
            <label htmlFor="sandbox-type">Tipo</label>
            <Form.Select id="sandbox-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Form.Select>
          </div>
        </div>
        <p className="hint">
          Fonte: <a href={acquirer.source} target="_blank" rel="noreferrer">documentação oficial</a>, conferida em {acquirer.checkedAt}.
        </p>
      </Form>

      {copyError && <ErrorState>{copyError}</ErrorState>}

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">{acquirer.label}</p>
            <h2 className="panel__title">Cartões de teste ({cards.length})</h2>
          </div>
        </div>

        {cards.length ? (
          <Table responsive hover className="data-table sandbox-table">
            <thead><tr>
              <th scope="col">Bandeira</th>
              <th scope="col">Tipo</th>
              <th scope="col">Número</th>
              <th scope="col">Validade</th>
              <th scope="col">CVV</th>
              <th scope="col">tokenCode</th>
              <th scope="col">tokenCryptogram</th>
            </tr></thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.number} className="table__row">
                  <td className="text-strong">{c.brand}</td>
                  <td>{c.type}</td>
                  <td><div className="actions">{c.number}{renderCopy(`number-${c.number}`, c.number, "número")}</div></td>
                  <td><div className="actions">{c.expiration}{renderCopy(`expiration-${c.number}`, c.expiration, "validade")}</div></td>
                  <td><div className="actions">{c.cvv}{renderCopy(`cvv-${c.number}`, c.cvv, "CVV")}</div></td>
                  <td>{c.tokenCode || "—"}</td>
                  <td>{c.tokenCryptogram || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="Nenhum cartão encontrado">Altere os filtros para ver outros cartões.</EmptyState>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Atenção</p>
            <h2 className="panel__title">Regras do sandbox</h2>
          </div>
        </div>
        <ul className="muted">
          {acquirer.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Simular erros</p>
            <h2 className="panel__title">Valores que retornam erro</h2>
          </div>
        </div>
        <p className="hint">Envie a transação com o amount indicado para receber o código de erro correspondente.</p>
        <Table responsive hover className="data-table sandbox-table">
          <thead><tr>
            <th scope="col">amount</th>
            <th scope="col">Valor</th>
            <th scope="col">Código</th>
            <th scope="col">Descrição</th>
          </tr></thead>
          <tbody>
            {acquirer.errors.map((e) => (
              <tr key={e.code} className="table__row">
                <td><div className="actions">{e.amount}{renderCopy(`amount-${e.code}`, String(e.amount), "amount")}</div></td>
                <td>{formatAmount(e.amount)}</td>
                <td className="text-strong">{e.code}</td>
                <td>{e.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </section>
  );
}
