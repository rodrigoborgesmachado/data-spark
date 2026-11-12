import { EmptyState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useMemo, useState } from "react";
import { formatMoney } from "../ShoppingList/shoppingList.js";
import { MEASURES, compareOptions, createOption, formatPercent } from "./priceComparator.js";

const INITIAL_MEASURE = "weight";

function createOptions(measure) {
  return [createOption(measure), createOption(measure)];
}

export default function PriceComparator({ title = "Comparador de preços" }) {
  const [measure, setMeasure] = useState(INITIAL_MEASURE);
  const [options, setOptions] = useState(() => createOptions(INITIAL_MEASURE));

  const { base, units } = MEASURES[measure];
  const results = useMemo(() => compareOptions(options, measure), [options, measure]);
  const bestOptions = results.filter((option) => option.best);
  const optionName = (option) => option.name.trim() || `Opção ${results.indexOf(option) + 1}`;

  function handleMeasureChange(event) {
    const value = event.target.value;
    setMeasure(value);
    setOptions((current) => current.map((option) => ({ ...option, unit: MEASURES[value].defaultUnit })));
  }

  function handleOptionChange(id, field, value) {
    setOptions((current) => current.map((option) => option.id === id ? { ...option, [field]: value } : option));
  }

  function handleRemove(id) {
    setOptions((current) => current.filter((option) => option.id !== id));
  }

  return (
    <section className="verify price-comparator">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Informe o preço e a quantidade de cada produto para descobrir qual
            sai mais barato por kg, litro ou unidade.
          </>} actions={<>
            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setOptions(createOptions(measure))}>
              Limpar
            </Button>
          </>} />

      <Form className="form" onSubmit={(event) => event.preventDefault()}>
        <div className="form__group">
          <label htmlFor="price-comparator-measure">Comparar por</label>
          <Form.Select
            id="price-comparator-measure"
            className="input tool-select"
            value={measure}
            onChange={handleMeasureChange}
          >
            {Object.entries(MEASURES).map(([key, item]) => (
              <option key={key} value={key}>{item.label} (preço por {item.base})</option>
            ))}
          </Form.Select>
        </div>

        <ul className="price-comparator__options">
          {results.map((option, index) => (
            <li key={option.id} className={`price-comparator__option${option.best ? " is-best" : ""}`}>
              <div className="price-comparator__head">
                <strong>Opção {index + 1}</strong>
                {option.best ? (
                  <span className="pill pill--success">Mais econômica</span>
                ) : option.difference !== null && bestOptions.length > 0 && (
                  <span className="pill">+{formatPercent(option.difference)}</span>
                )}
              </div>
              <div className="form__group">
                <label htmlFor={`price-comparator-name-${option.id}`}>Produto</label>
                <Form.Control
                  id={`price-comparator-name-${option.id}`}
                  className="input"
                  type="text"
                  placeholder="Marca ou embalagem"
                  value={option.name}
                  onChange={(event) => handleOptionChange(option.id, "name", event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="price-comparator__fields">
                <div className="form__group">
                  <label htmlFor={`price-comparator-price-${option.id}`}>Preço (R$)</label>
                  <Form.Control
                    id={`price-comparator-price-${option.id}`}
                    className="input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={option.price}
                    onChange={(event) => handleOptionChange(option.id, "price", event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="form__group">
                  <label htmlFor={`price-comparator-quantity-${option.id}`}>Quantidade</label>
                  <Form.Control
                    id={`price-comparator-quantity-${option.id}`}
                    className="input"
                    type="text"
                    inputMode="decimal"
                    value={option.quantity}
                    onChange={(event) => handleOptionChange(option.id, "quantity", event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="form__group">
                  <label htmlFor={`price-comparator-unit-${option.id}`}>Unidade</label>
                  <Form.Select
                    id={`price-comparator-unit-${option.id}`}
                    className="input tool-select"
                    value={option.unit}
                    onChange={(event) => handleOptionChange(option.id, "unit", event.target.value)}
                  >
                    {Object.keys(units).map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </Form.Select>
                </div>
              </div>
              <div className="price-comparator__result">
                <span className="muted">
                  {option.unitPrice === null ? "Informe preço e quantidade" : <><strong>{formatMoney(option.unitPrice)}</strong> por {base}</>}
                </span>
                {options.length > 2 && (
                  <Button variant="outline-secondary" className="btn btn--ghost btn--danger" type="button" onClick={() => handleRemove(option.id)}>
                    Remover
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="form__row">
          <Button className="btn" type="button" onClick={() => setOptions((current) => [...current, createOption(measure)])}>
            Adicionar opção
          </Button>
        </div>
      </Form>

      <section className="panel" aria-live="polite">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Resultado</p>
            <h2 className="panel__title">Opção mais econômica</h2>
          </div>
        </div>
        {bestOptions.length ? (
          <p>
            <strong>{bestOptions.map(optionName).join(", ")}</strong>
            {bestOptions.length > 1 ? " empatam" : " sai mais barato"} com <strong>{formatMoney(bestOptions[0].unitPrice)}</strong> por {base}.
          </p>
        ) : (
          <EmptyState>Preencha o preço e a quantidade de pelo menos duas opções.</EmptyState>
        )}
      </section>
    </section>
  );
}
