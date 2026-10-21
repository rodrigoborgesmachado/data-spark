import { ErrorState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useMemo, useState } from "react";
import CalculationCard from "../../components/CalculationCard";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const EMPTY_DIFFERENCE_FORM = { startDate: "", endDate: "" };
const EMPTY_SHIFT_FORM = { date: "", days: "", operation: "add" };

const OPERATIONS = {
  add: "Adicionar",
  subtract: "Subtrair",
};

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatWeekday(date) {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long" });
}

function formatDays(value) {
  return `${value.toLocaleString("pt-BR")} ${Math.abs(value) === 1 ? "dia" : "dias"}`;
}

export default function DateCalculator({ title = "Calculadora de datas" }) {
  const [differenceForm, setDifferenceForm] = useState(EMPTY_DIFFERENCE_FORM);
  const [shiftForm, setShiftForm] = useState(EMPTY_SHIFT_FORM);

  const differenceError = useMemo(() => {
    if (!differenceForm.startDate || !differenceForm.endDate) return "";
    if (!parseDate(differenceForm.startDate) || !parseDate(differenceForm.endDate)) return "Data inválida.";
    return "";
  }, [differenceForm]);

  const differenceResult = useMemo(() => {
    if (!differenceForm.startDate || !differenceForm.endDate || differenceError) return null;

    const startDate = parseDate(differenceForm.startDate);
    const endDate = parseDate(differenceForm.endDate);

    return {
      startDate,
      endDate,
      days: Math.round((endDate - startDate) / DAY_IN_MS),
    };
  }, [differenceError, differenceForm]);

  const shiftError = useMemo(() => {
    if (!shiftForm.date || String(shiftForm.days).trim() === "") return "";
    if (!parseDate(shiftForm.date)) return "Data inválida.";
    if (!/^\d+$/.test(String(shiftForm.days).trim())) return "Informe uma quantidade de dias inteira e positiva.";
    return "";
  }, [shiftForm]);

  const shiftResult = useMemo(() => {
    if (!shiftForm.date || String(shiftForm.days).trim() === "" || shiftError) return null;

    const date = parseDate(shiftForm.date);
    const days = Number(shiftForm.days) * (shiftForm.operation === "subtract" ? -1 : 1);
    const result = new Date(date.getTime() + days * DAY_IN_MS);

    return Number.isNaN(result.getTime()) ? null : { date, days, result };
  }, [shiftError, shiftForm]);

  function handleFieldChange(setter, field) {
    return (event) => {
      const { value } = event.target;
      setter((current) => ({
        ...current,
        [field]: value,
      }));
    };
  }

  return (
    <section className="verify">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Calcule a quantidade de dias entre duas datas ou adicione e subtraia dias de uma data.
          </>} />

      <div className="calc-grid">
        <CalculationCard
          eyebrow="Datas"
          title="Dias entre datas"
          description="Informe a data inicial e a data final para saber quantos dias existem entre elas."
          result={
            differenceResult ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  Entre {formatDate(differenceResult.startDate)} e {formatDate(differenceResult.endDate)} existem{" "}
                  <span className="calc-result__value">{formatDays(Math.abs(differenceResult.days))}</span>
                  {differenceResult.days < 0 ? " (a data final é anterior à inicial)" : ""}.
                </p>
              </div>
            ) : null
          }
        >
          <div className="form form--plain">
            <div className="form__grid">
              <div className="form__group">
                <label htmlFor="difference-start">Data inicial</label>
                <Form.Control
                  id="difference-start"
                  name="difference-start"
                  className="input"
                  type="date"
                  value={differenceForm.startDate}
                  onChange={handleFieldChange(setDifferenceForm, "startDate")}
                />
              </div>
              <div className="form__group">
                <label htmlFor="difference-end">Data final</label>
                <Form.Control
                  id="difference-end"
                  name="difference-end"
                  className="input"
                  type="date"
                  value={differenceForm.endDate}
                  onChange={handleFieldChange(setDifferenceForm, "endDate")}
                />
              </div>
            </div>

            <div className="form__row">
              <Button variant="outline-secondary"
                className="btn btn--ghost"
                type="button"
                onClick={() => setDifferenceForm(EMPTY_DIFFERENCE_FORM)}
                disabled={!differenceForm.startDate && !differenceForm.endDate}
              >
                Limpar
              </Button>
            </div>
          </div>

          {differenceError ? <ErrorState>{differenceError}</ErrorState> : null}
        </CalculationCard>

        <CalculationCard
          eyebrow="Datas"
          title="Adicionar ou subtrair dias"
          description="Informe uma data e a quantidade de dias para descobrir a nova data."
          result={
            shiftResult ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  {formatDate(shiftResult.date)} {shiftResult.days < 0 ? "menos" : "mais"} {formatDays(Math.abs(shiftResult.days))} é{" "}
                  <span className="calc-result__value">{formatDate(shiftResult.result)}</span> ({formatWeekday(shiftResult.result)}).
                </p>
              </div>
            ) : null
          }
        >
          <div className="form form--plain">
            <div className="form__grid">
              <div className="form__group">
                <label htmlFor="shift-date">Data</label>
                <Form.Control
                  id="shift-date"
                  name="shift-date"
                  className="input"
                  type="date"
                  value={shiftForm.date}
                  onChange={handleFieldChange(setShiftForm, "date")}
                />
              </div>
              <div className="form__group">
                <label htmlFor="shift-operation">Operação</label>
                <Form.Select
                  id="shift-operation"
                  className="input tool-select"
                  value={shiftForm.operation}
                  onChange={handleFieldChange(setShiftForm, "operation")}
                >
                  {Object.entries(OPERATIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="form__group">
                <label htmlFor="shift-days">Dias</label>
                <Form.Control
                  id="shift-days"
                  name="shift-days"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  value={shiftForm.days}
                  onChange={handleFieldChange(setShiftForm, "days")}
                  placeholder="Ex.: 30"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form__row">
              <Button variant="outline-secondary"
                className="btn btn--ghost"
                type="button"
                onClick={() => setShiftForm(EMPTY_SHIFT_FORM)}
                disabled={!shiftForm.date && !shiftForm.days}
              >
                Limpar
              </Button>
            </div>
          </div>

          {shiftError ? <ErrorState>{shiftError}</ErrorState> : null}
        </CalculationCard>
      </div>
    </section>
  );
}
