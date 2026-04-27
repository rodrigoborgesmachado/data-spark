import { useMemo, useState } from "react";
import CalculationCard from "../../components/CalculationCard";
import ClassificationTable from "../../components/ClassificationTable";
import {
  calculateAverageSpeed,
  calculateEstimatedTime,
  calculateMetersPerKm,
  calculateVam,
  classifyRouteByMetersPerKm,
  classifyVam,
  convertDurationToHours,
  formatDurationFromHours,
} from "../../utils/cyclingCalculations";

const EMPTY_RIDE_FORM = {
  distanceKm: "",
  elevationMeters: "",
  hours: "",
  minutes: "",
};

const EMPTY_ESTIMATED_TIME_FORM = {
  distanceKm: "",
  averageSpeedKmH: "",
};

const VAM_ROWS = [
  { key: "iniciante", range: "Ate 300 m/h", label: "Leve / iniciante" },
  { key: "moderado", range: "300 a 600 m/h", label: "Moderado" },
  { key: "forte", range: "600 a 900 m/h", label: "Forte" },
  { key: "muito-forte", range: "Acima de 900 m/h", label: "Muito forte / performance alta" },
];

const ROUTE_ROWS = [
  { key: "leve", range: "0 a 10 m/km", label: "Leve / plano" },
  { key: "moderado", range: "10 a 20 m/km", label: "Moderado" },
  { key: "dificil", range: "20 a 30 m/km", label: "Dificil" },
  { key: "muito-dificil", range: "30 a 40 m/km", label: "Muito dificil" },
  { key: "extremo", range: "Acima de 40 m/km", label: "Extremo / montanha" },
];

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function hasAnyInput(values) {
  return Object.values(values).some((value) => !isBlank(value));
}

function parseNumberValue(value) {
  if (isBlank(value)) return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value, maximumFractionDigits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits,
  });
}

function validatePositiveField(value, label) {
  if (isBlank(value)) {
    return `Informe ${label}.`;
  }

  const parsed = parseNumberValue(value);

  if (parsed === null) {
    return `${label} invalido.`;
  }

  if (parsed <= 0) {
    return `${label} deve ser maior que zero.`;
  }

  return "";
}

function validateDuration(hoursValue, minutesValue, required = true) {
  const hasHours = !isBlank(hoursValue);
  const hasMinutes = !isBlank(minutesValue);

  if (!hasHours && !hasMinutes) {
    return required ? "Informe o tempo em horas ou minutos." : "";
  }

  const hours = hasHours ? parseNumberValue(hoursValue) : 0;
  const minutes = hasMinutes ? parseNumberValue(minutesValue) : 0;

  if (hours === null || minutes === null) {
    return "Tempo invalido.";
  }

  if (hours < 0 || minutes < 0) {
    return "Tempo nao pode ser negativo.";
  }

  if (convertDurationToHours(hours, minutes) <= 0) {
    return "O tempo precisa ser maior que zero.";
  }

  return "";
}

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
}) {
  return (
    <div className="form__group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        className="input"
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

function SummaryMetrics({ metrics }) {
  const cards = [
    { key: "distance", label: "Distancia", value: `${formatNumber(metrics.distanceKm)} km` },
    { key: "elevation", label: "Elevacao", value: `${formatNumber(metrics.elevationMeters)} m` },
    { key: "duration", label: "Tempo", value: formatDurationFromHours(metrics.timeInHours) },
    { key: "speed", label: "Velocidade media", value: `${formatNumber(metrics.averageSpeed)} km/h` },
    { key: "vam", label: "VAM", value: `${formatNumber(metrics.vam)} m/h` },
    { key: "metersPerKm", label: "Subida por km", value: `${formatNumber(metrics.metersPerKm)} m/km` },
  ];

  return (
    <div className="calc-summary">
      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.key} className="stat-card">
            <div className="stat-card__value calc-summary__value">{card.value}</div>
            <div className="stat-card__label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="calc-result">
        <p className="calc-result__label">Resumo do pedal</p>
        <p className="calc-result__text">
          Esse pedal teve {formatNumber(metrics.distanceKm)} km, {formatNumber(metrics.elevationMeters)}m de elevacao
          e {formatDurationFromHours(metrics.timeInHours)} de duracao. A velocidade media foi de{" "}
          <span className="calc-result__value">{formatNumber(metrics.averageSpeed)} km/h</span>, o VAM foi de{" "}
          <span className="calc-result__value">{formatNumber(metrics.vam)} m/h</span> e a rota teve{" "}
          <span className="calc-result__value">{formatNumber(metrics.metersPerKm)} m/km</span>, sendo classificada
          como <span className="calc-result__value">{metrics.routeClassification.label.toLowerCase()}</span>.
        </p>
      </div>
    </div>
  );
}

export default function CyclingCalculators({ title = "Calculos para Ciclistas" }) {
  const [summaryForm, setSummaryForm] = useState(EMPTY_RIDE_FORM);
  const [vamForm, setVamForm] = useState({ elevationMeters: "", hours: "", minutes: "" });
  const [metersPerKmForm, setMetersPerKmForm] = useState({ distanceKm: "", elevationMeters: "" });
  const [averageSpeedForm, setAverageSpeedForm] = useState({ distanceKm: "", hours: "", minutes: "" });
  const [estimatedTimeForm, setEstimatedTimeForm] = useState(EMPTY_ESTIMATED_TIME_FORM);

  const [vamSubmitted, setVamSubmitted] = useState(false);
  const [metersPerKmSubmitted, setMetersPerKmSubmitted] = useState(false);
  const [averageSpeedSubmitted, setAverageSpeedSubmitted] = useState(false);
  const [estimatedTimeSubmitted, setEstimatedTimeSubmitted] = useState(false);

  const summaryError = useMemo(() => {
    if (!hasAnyInput(summaryForm)) return "";

    if (!isBlank(summaryForm.distanceKm)) {
      const distanceError = validatePositiveField(summaryForm.distanceKm, "a distancia");
      if (distanceError) return distanceError;
    }

    if (!isBlank(summaryForm.elevationMeters)) {
      const elevationError = validatePositiveField(summaryForm.elevationMeters, "a elevacao positiva");
      if (elevationError) return elevationError;
    }

    return validateDuration(summaryForm.hours, summaryForm.minutes, false);
  }, [summaryForm]);

  const summaryCanCalculate = useMemo(() => {
    return (
      !isBlank(summaryForm.distanceKm) &&
      !isBlank(summaryForm.elevationMeters) &&
      (!isBlank(summaryForm.hours) || !isBlank(summaryForm.minutes))
    );
  }, [summaryForm]);

  const summaryMetrics = useMemo(() => {
    if (!summaryCanCalculate || summaryError) return null;

    const distanceKm = parseNumberValue(summaryForm.distanceKm);
    const elevationMeters = parseNumberValue(summaryForm.elevationMeters);
    const hours = parseNumberValue(summaryForm.hours) ?? 0;
    const minutes = parseNumberValue(summaryForm.minutes) ?? 0;
    const timeInHours = convertDurationToHours(hours, minutes);
    const averageSpeed = calculateAverageSpeed(distanceKm, timeInHours);
    const vam = calculateVam(elevationMeters, timeInHours);
    const metersPerKm = calculateMetersPerKm(elevationMeters, distanceKm);

    return {
      distanceKm,
      elevationMeters,
      timeInHours,
      averageSpeed,
      vam,
      metersPerKm,
      routeClassification: classifyRouteByMetersPerKm(metersPerKm),
    };
  }, [summaryCanCalculate, summaryError, summaryForm]);

  const vamError = useMemo(() => {
    return (
      validatePositiveField(vamForm.elevationMeters, "a elevacao positiva") ||
      validateDuration(vamForm.hours, vamForm.minutes)
    );
  }, [vamForm]);

  const vamResult = useMemo(() => {
    if (vamError) return null;

    const elevationMeters = parseNumberValue(vamForm.elevationMeters);
    const hours = parseNumberValue(vamForm.hours) ?? 0;
    const minutes = parseNumberValue(vamForm.minutes) ?? 0;
    const timeInHours = convertDurationToHours(hours, minutes);
    const value = calculateVam(elevationMeters, timeInHours);

    return {
      value,
      classification: classifyVam(value),
    };
  }, [vamError, vamForm]);

  const metersPerKmError = useMemo(() => {
    return (
      validatePositiveField(metersPerKmForm.distanceKm, "a distancia") ||
      validatePositiveField(metersPerKmForm.elevationMeters, "a elevacao positiva")
    );
  }, [metersPerKmForm]);

  const metersPerKmResult = useMemo(() => {
    if (metersPerKmError) return null;

    const distanceKm = parseNumberValue(metersPerKmForm.distanceKm);
    const elevationMeters = parseNumberValue(metersPerKmForm.elevationMeters);
    const value = calculateMetersPerKm(elevationMeters, distanceKm);

    return {
      value,
      classification: classifyRouteByMetersPerKm(value),
    };
  }, [metersPerKmError, metersPerKmForm]);

  const averageSpeedError = useMemo(() => {
    return (
      validatePositiveField(averageSpeedForm.distanceKm, "a distancia") ||
      validateDuration(averageSpeedForm.hours, averageSpeedForm.minutes)
    );
  }, [averageSpeedForm]);

  const averageSpeedResult = useMemo(() => {
    if (averageSpeedError) return null;

    const distanceKm = parseNumberValue(averageSpeedForm.distanceKm);
    const hours = parseNumberValue(averageSpeedForm.hours) ?? 0;
    const minutes = parseNumberValue(averageSpeedForm.minutes) ?? 0;
    const timeInHours = convertDurationToHours(hours, minutes);

    return calculateAverageSpeed(distanceKm, timeInHours);
  }, [averageSpeedError, averageSpeedForm]);

  const estimatedTimeError = useMemo(() => {
    return (
      validatePositiveField(estimatedTimeForm.distanceKm, "a distancia") ||
      validatePositiveField(estimatedTimeForm.averageSpeedKmH, "a velocidade media esperada")
    );
  }, [estimatedTimeForm]);

  const estimatedTimeResult = useMemo(() => {
    if (estimatedTimeError) return null;

    const distanceKm = parseNumberValue(estimatedTimeForm.distanceKm);
    const averageSpeedKmH = parseNumberValue(estimatedTimeForm.averageSpeedKmH);

    return calculateEstimatedTime(distanceKm, averageSpeedKmH);
  }, [estimatedTimeError, estimatedTimeForm]);

  function handleFieldChange(setter, field) {
    return (event) => {
      const { value } = event.target;
      setter((current) => ({
        ...current,
        [field]: value,
      }));
    };
  }

  function resetRideForm(setter, initialState, submittedSetter) {
    setter(initialState);

    if (submittedSetter) {
      submittedSetter(false);
    }
  }

  return (
    <section className="verify cycling-tools">
      <header className="verify__header">
        <div>
          <p className="eyebrow">Utilidades</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            Ferramentas simples para analisar subida, velocidade media e dificuldade de rotas de estrada ou MTB.
          </p>
        </div>
      </header>

      <div className="calc-grid">
        <CalculationCard
          className="calc-card--summary"
          title="Resumo geral do pedal"
          description="Preencha distancia, elevacao e tempo. O resumo aparece automaticamente quando os tres dados estiverem validos."
          aside={
            summaryMetrics ? <span className="pill pill--accent">{summaryMetrics.routeClassification.label}</span> : null
          }
          result={summaryMetrics ? <SummaryMetrics metrics={summaryMetrics} /> : null}
          footer={
            !summaryMetrics && !summaryError ? (
              <p className="hint">Use esse bloco para ver a leitura geral da rota e do seu ritmo.</p>
            ) : null
          }
        >
          <div className="form form--plain">
            <div className="form__grid">
              <NumberField
                id="summary-distance"
                label="Distancia (km)"
                value={summaryForm.distanceKm}
                onChange={handleFieldChange(setSummaryForm, "distanceKm")}
                placeholder="Ex.: 42"
              />
              <NumberField
                id="summary-elevation"
                label="Elevacao positiva (m)"
                value={summaryForm.elevationMeters}
                onChange={handleFieldChange(setSummaryForm, "elevationMeters")}
                placeholder="Ex.: 780"
              />
              <NumberField
                id="summary-hours"
                label="Horas"
                value={summaryForm.hours}
                onChange={handleFieldChange(setSummaryForm, "hours")}
                placeholder="Ex.: 2"
                inputMode="numeric"
              />
              <NumberField
                id="summary-minutes"
                label="Minutos"
                value={summaryForm.minutes}
                onChange={handleFieldChange(setSummaryForm, "minutes")}
                placeholder="Ex.: 30"
                inputMode="numeric"
              />
            </div>

            <div className="form__row">
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => resetRideForm(setSummaryForm, EMPTY_RIDE_FORM)}
                disabled={!hasAnyInput(summaryForm)}
              >
                Limpar resumo
              </button>
            </div>
          </div>

          {summaryError ? <div className="error">{summaryError}</div> : null}
        </CalculationCard>

        <CalculationCard
          title="Calculo de VAM"
          description="VAM e a taxa de subida vertical em metros por hora."
          aside={vamResult && vamSubmitted ? <span className="pill pill--accent">{vamResult.classification.label}</span> : null}
          result={
            vamResult && vamSubmitted ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  Seu VAM foi de <span className="calc-result__value">{formatNumber(vamResult.value)} m/h</span>.
                </p>
              </div>
            ) : null
          }
          footer={
            <ClassificationTable
              headingLeft="Faixa"
              headingRight="Leitura"
              rows={VAM_ROWS}
              activeKey={vamResult && vamSubmitted ? vamResult.classification.key : ""}
            />
          }
        >
          <form
            className="form form--plain"
            onSubmit={(event) => {
              event.preventDefault();
              setVamSubmitted(true);
            }}
          >
            <div className="form__grid">
              <NumberField
                id="vam-elevation"
                label="Elevacao positiva (m)"
                value={vamForm.elevationMeters}
                onChange={handleFieldChange(setVamForm, "elevationMeters")}
                placeholder="Ex.: 600"
              />
              <NumberField
                id="vam-hours"
                label="Horas"
                value={vamForm.hours}
                onChange={handleFieldChange(setVamForm, "hours")}
                placeholder="Ex.: 2"
                inputMode="numeric"
              />
              <NumberField
                id="vam-minutes"
                label="Minutos"
                value={vamForm.minutes}
                onChange={handleFieldChange(setVamForm, "minutes")}
                placeholder="Ex.: 0"
                inputMode="numeric"
              />
            </div>

            <div className="form__row">
              <button className="btn" type="submit">
                Calcular VAM
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => resetRideForm(setVamForm, { elevationMeters: "", hours: "", minutes: "" }, setVamSubmitted)}
                disabled={!hasAnyInput(vamForm)}
              >
                Limpar
              </button>
            </div>
          </form>

          {vamSubmitted && vamError ? <div className="error">{vamError}</div> : null}
        </CalculationCard>

        <CalculationCard
          title="Metros de subida por km"
          description="Essa relacao ajuda a entender rapidamente o quanto a rota sobe a cada quilometro."
          aside={
            metersPerKmResult && metersPerKmSubmitted ? (
              <span className="pill pill--accent">{metersPerKmResult.classification.label}</span>
            ) : null
          }
          result={
            metersPerKmResult && metersPerKmSubmitted ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  Sua rota teve <span className="calc-result__value">{formatNumber(metersPerKmResult.value)} m de subida por km</span>.
                </p>
              </div>
            ) : null
          }
          footer={
            <ClassificationTable
              headingLeft="Faixa"
              headingRight="Dificuldade"
              rows={ROUTE_ROWS}
              activeKey={metersPerKmResult && metersPerKmSubmitted ? metersPerKmResult.classification.key : ""}
            />
          }
        >
          <form
            className="form form--plain"
            onSubmit={(event) => {
              event.preventDefault();
              setMetersPerKmSubmitted(true);
            }}
          >
            <div className="form__grid">
              <NumberField
                id="meters-per-km-distance"
                label="Distancia (km)"
                value={metersPerKmForm.distanceKm}
                onChange={handleFieldChange(setMetersPerKmForm, "distanceKm")}
                placeholder="Ex.: 50"
              />
              <NumberField
                id="meters-per-km-elevation"
                label="Elevacao positiva (m)"
                value={metersPerKmForm.elevationMeters}
                onChange={handleFieldChange(setMetersPerKmForm, "elevationMeters")}
                placeholder="Ex.: 900"
              />
            </div>

            <div className="form__row">
              <button className="btn" type="submit">
                Calcular dificuldade
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => resetRideForm(setMetersPerKmForm, { distanceKm: "", elevationMeters: "" }, setMetersPerKmSubmitted)}
                disabled={!hasAnyInput(metersPerKmForm)}
              >
                Limpar
              </button>
            </div>
          </form>

          {metersPerKmSubmitted && metersPerKmError ? <div className="error">{metersPerKmError}</div> : null}
        </CalculationCard>

        <CalculationCard
          title="Velocidade media"
          description="Use distancia e tempo total para ter uma nocao rapida do pace medio do pedal."
          result={
            averageSpeedResult && averageSpeedSubmitted ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  Sua velocidade media foi de <span className="calc-result__value">{formatNumber(averageSpeedResult)} km/h</span>.
                </p>
              </div>
            ) : null
          }
        >
          <form
            className="form form--plain"
            onSubmit={(event) => {
              event.preventDefault();
              setAverageSpeedSubmitted(true);
            }}
          >
            <div className="form__grid">
              <NumberField
                id="average-speed-distance"
                label="Distancia (km)"
                value={averageSpeedForm.distanceKm}
                onChange={handleFieldChange(setAverageSpeedForm, "distanceKm")}
                placeholder="Ex.: 42"
              />
              <NumberField
                id="average-speed-hours"
                label="Horas"
                value={averageSpeedForm.hours}
                onChange={handleFieldChange(setAverageSpeedForm, "hours")}
                placeholder="Ex.: 2"
                inputMode="numeric"
              />
              <NumberField
                id="average-speed-minutes"
                label="Minutos"
                value={averageSpeedForm.minutes}
                onChange={handleFieldChange(setAverageSpeedForm, "minutes")}
                placeholder="Ex.: 30"
                inputMode="numeric"
              />
            </div>

            <div className="form__row">
              <button className="btn" type="submit">
                Calcular velocidade
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() =>
                  resetRideForm(setAverageSpeedForm, { distanceKm: "", hours: "", minutes: "" }, setAverageSpeedSubmitted)
                }
                disabled={!hasAnyInput(averageSpeedForm)}
              >
                Limpar
              </button>
            </div>
          </form>

          {averageSpeedSubmitted && averageSpeedError ? <div className="error">{averageSpeedError}</div> : null}
        </CalculationCard>

        <CalculationCard
          title="Tempo estimado"
          description="Informe a distancia e a velocidade esperada para prever o tempo da rota."
          result={
            estimatedTimeResult && estimatedTimeSubmitted ? (
              <div className="calc-result">
                <p className="calc-result__label">Resultado</p>
                <p className="calc-result__text">
                  O tempo estimado para essa rota e <span className="calc-result__value">{formatDurationFromHours(estimatedTimeResult)}</span>.
                </p>
              </div>
            ) : null
          }
          footer={<p className="hint">Formula: tempo = distancia / velocidade media.</p>}
        >
          <form
            className="form form--plain"
            onSubmit={(event) => {
              event.preventDefault();
              setEstimatedTimeSubmitted(true);
            }}
          >
            <div className="form__grid">
              <NumberField
                id="estimated-time-distance"
                label="Distancia (km)"
                value={estimatedTimeForm.distanceKm}
                onChange={handleFieldChange(setEstimatedTimeForm, "distanceKm")}
                placeholder="Ex.: 65"
              />
              <NumberField
                id="estimated-time-speed"
                label="Velocidade media esperada (km/h)"
                value={estimatedTimeForm.averageSpeedKmH}
                onChange={handleFieldChange(setEstimatedTimeForm, "averageSpeedKmH")}
                placeholder="Ex.: 18"
              />
            </div>

            <div className="form__row">
              <button className="btn" type="submit">
                Estimar tempo
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => resetRideForm(setEstimatedTimeForm, EMPTY_ESTIMATED_TIME_FORM, setEstimatedTimeSubmitted)}
                disabled={!hasAnyInput(estimatedTimeForm)}
              >
                Limpar
              </button>
            </div>
          </form>

          {estimatedTimeSubmitted && estimatedTimeError ? <div className="error">{estimatedTimeError}</div> : null}
        </CalculationCard>
      </div>
    </section>
  );
}
