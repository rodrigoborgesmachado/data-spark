import { ErrorState } from "../../components/Feedback";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useMemo, useState } from "react";
import CalculationCard from "../../components/CalculationCard";

function linearUnit(label, factor) {
  return {
    label,
    toBase: (value) => value * factor,
    fromBase: (value) => value / factor,
  };
}

const CATEGORIES = {
  distance: {
    label: "Distância",
    units: {
      mm: linearUnit("Milímetro (mm)", 0.001),
      cm: linearUnit("Centímetro (cm)", 0.01),
      m: linearUnit("Metro (m)", 1),
      km: linearUnit("Quilômetro (km)", 1000),
      in: linearUnit("Polegada (in)", 0.0254),
      ft: linearUnit("Pé (ft)", 0.3048),
      yd: linearUnit("Jarda (yd)", 0.9144),
      mi: linearUnit("Milha (mi)", 1609.344),
    },
    defaults: ["km", "m"],
  },
  weight: {
    label: "Peso",
    units: {
      mg: linearUnit("Miligrama (mg)", 0.001),
      g: linearUnit("Grama (g)", 1),
      kg: linearUnit("Quilograma (kg)", 1000),
      t: linearUnit("Tonelada (t)", 1000000),
      oz: linearUnit("Onça (oz)", 28.349523125),
      lb: linearUnit("Libra (lb)", 453.59237),
    },
    defaults: ["kg", "g"],
  },
  temperature: {
    label: "Temperatura",
    units: {
      c: { label: "Celsius (°C)", toBase: (value) => value, fromBase: (value) => value },
      f: { label: "Fahrenheit (°F)", toBase: (value) => (value - 32) * 5 / 9, fromBase: (value) => value * 9 / 5 + 32 },
      k: { label: "Kelvin (K)", toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
    },
    defaults: ["c", "f"],
  },
  speed: {
    label: "Velocidade",
    units: {
      ms: linearUnit("Metros por segundo (m/s)", 1),
      kmh: linearUnit("Quilômetros por hora (km/h)", 1000 / 3600),
      mph: linearUnit("Milhas por hora (mph)", 0.44704),
      kn: linearUnit("Nós (kn)", 1852 / 3600),
    },
    defaults: ["kmh", "ms"],
  },
  storage: {
    label: "Armazenamento",
    units: {
      bit: linearUnit("Bit (b)", 1 / 8),
      b: linearUnit("Byte (B)", 1),
      kb: linearUnit("Kilobyte (KB)", 1024),
      mb: linearUnit("Megabyte (MB)", 1024 ** 2),
      gb: linearUnit("Gigabyte (GB)", 1024 ** 3),
      tb: linearUnit("Terabyte (TB)", 1024 ** 4),
    },
    defaults: ["gb", "mb"],
  },
};

const EMPTY_FORM = { category: "distance", value: "", from: "km", to: "m" };

function parseNumberValue(value) {
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
}

export default function UnitConverter({ title = "Conversor de unidades" }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const category = CATEGORIES[form.category];

  const error = useMemo(() => {
    if (String(form.value).trim() === "") return "";
    if (parseNumberValue(form.value) === null) return "Informe um valor numérico válido.";
    return "";
  }, [form.value]);

  const result = useMemo(() => {
    if (String(form.value).trim() === "" || error) return null;

    const value = parseNumberValue(form.value);
    const from = category.units[form.from];
    const to = category.units[form.to];

    return { value, converted: to.fromBase(from.toBase(value)), from, to };
  }, [category, error, form]);

  function handleFieldChange(field) {
    return (event) => {
      const { value } = event.target;
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    };
  }

  function handleCategoryChange(event) {
    const { value } = event.target;
    const [from, to] = CATEGORIES[value].defaults;
    setForm((current) => ({ ...current, category: value, from, to }));
  }

  return (
    <section className="verify">
      <PageHeader eyebrow="Utilidades" title={<>{title}</>} description={<>
            Converta unidades de distância, peso, temperatura, velocidade e armazenamento.
          </>} />

      <div className="calc-grid">
        <CalculationCard
          eyebrow={category.label}
          title="Converter unidades"
          description="Escolha a categoria, informe o valor e selecione as unidades de origem e destino."
          result={
            result ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  {formatNumber(result.value)} {result.from.label} equivale a{" "}
                  <span className="calc-result__value">{formatNumber(result.converted)}</span> {result.to.label}.
                </p>
              </div>
            ) : null
          }
        >
          <div className="form form--plain">
            <div className="form__grid">
              <div className="form__group">
                <label htmlFor="unit-category">Categoria</label>
                <Form.Select
                  id="unit-category"
                  className="input tool-select"
                  value={form.category}
                  onChange={handleCategoryChange}
                >
                  {Object.entries(CATEGORIES).map(([key, item]) => (
                    <option key={key} value={key}>{item.label}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="form__group">
                <label htmlFor="unit-value">Valor</label>
                <Form.Control
                  id="unit-value"
                  name="unit-value"
                  className="input"
                  type="text"
                  inputMode="decimal"
                  value={form.value}
                  onChange={handleFieldChange("value")}
                  placeholder="Ex.: 10"
                  autoComplete="off"
                />
              </div>
              <div className="form__group">
                <label htmlFor="unit-from">De</label>
                <Form.Select
                  id="unit-from"
                  className="input tool-select"
                  value={form.from}
                  onChange={handleFieldChange("from")}
                >
                  {Object.entries(category.units).map(([key, unit]) => (
                    <option key={key} value={key}>{unit.label}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="form__group">
                <label htmlFor="unit-to">Para</label>
                <Form.Select
                  id="unit-to"
                  className="input tool-select"
                  value={form.to}
                  onChange={handleFieldChange("to")}
                >
                  {Object.entries(category.units).map(([key, unit]) => (
                    <option key={key} value={key}>{unit.label}</option>
                  ))}
                </Form.Select>
              </div>
            </div>

            <div className="form__row">
              <Button variant="outline-secondary"
                className="btn btn--ghost"
                type="button"
                onClick={() => setForm((current) => ({ ...current, from: current.to, to: current.from }))}
              >
                Inverter
              </Button>
              <Button variant="outline-secondary"
                className="btn btn--ghost"
                type="button"
                onClick={() => setForm(EMPTY_FORM)}
                disabled={!form.value}
              >
                Limpar
              </Button>
            </div>
          </div>

          {error ? <ErrorState>{error}</ErrorState> : null}
        </CalculationCard>
      </div>
    </section>
  );
}
