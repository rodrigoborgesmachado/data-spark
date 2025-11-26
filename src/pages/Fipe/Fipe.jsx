import { useEffect, useMemo, useState } from "react";
import {
  fetchFipeBrands,
  fetchFipeModels,
  fetchFipePrice,
  fetchFipeYears,
} from "../../services/api";

export default function Fipe() {
  const [brands, setBrands] = useState([]);
  const [brand, setBrand] = useState("");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [years, setYears] = useState([]);
  const [year, setYear] = useState("");
  const [price, setPrice] = useState(null);

  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [errBrands, setErrBrands] = useState("");
  const [errModels, setErrModels] = useState("");
  const [errYears, setErrYears] = useState("");
  const [errPrice, setErrPrice] = useState("");

  // Load brands when type changes
  useEffect(() => {
    async function load() {
      try {
        setErrBrands("");
        setLoadingBrands(true);
        const data = await fetchFipeBrands();
        setBrands(data || []);
      } catch (err) {
        setErrBrands(err?.message || "Erro ao carregar marcas.");
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    }
    load();
    setBrand("");
    setModels([]);
    setModel("");
    setYears([]);
    setYear("");
    setPrice(null);
  }, []);

  const loadModels = async (brandCode) => {
    try {
      setErrModels("");
      setLoadingModels(true);
      const data = await fetchFipeModels(brandCode);
      setModels(data?.modelos || data || []);
    } catch (err) {
      setErrModels(err?.message || "Erro ao carregar modelos.");
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadYears = async (brandCode, modelCode) => {
    try {
      setErrYears("");
      setLoadingYears(true);
      const data = await fetchFipeYears(brandCode, modelCode);
      setYears(data || []);
    } catch (err) {
      setErrYears(err?.message || "Erro ao carregar anos.");
      setYears([]);
    } finally {
      setLoadingYears(false);
    }
  };

  const loadPrice = async () => {
    try {
      setErrPrice("");
      setLoadingPrice(true);
      const data = await fetchFipePrice(brand, model, year);
      setPrice(data || null);
    } catch (err) {
      setPrice(null);
      setErrPrice(err?.message || "Erro ao carregar preco.");
    } finally {
      setLoadingPrice(false);
    }
  };

  const summary = useMemo(() => {
    if (!price) return [];
    return [
      { label: "Marca", value: price.marca },
      { label: "Modelo", value: price.modelo },
      { label: "Ano modelo", value: price.anoModelo },
      { label: "Combustivel", value: price.combustivel },
      { label: "Referencia", value: price.mesReferencia },
      { label: "Codigo FIPE", value: price.codigoFipe },
      { label: "Valor", value: price.valor },
    ].filter((item) => item.value);
  }, [price]);

  return (
    <section className="verify">
      <header className="verify__header">
        <div>
          <p className="eyebrow">FIPE</p>
          <h1 className="page-title">Consulta FIPE</h1>
          <p className="muted">
            Selecione marca, modelo e ano para ver o preco FIPE.
          </p>
        </div>
      </header>

      <div className="panel">
        <div className="form__group">
          <label htmlFor="marca">Marca</label>
          <div className="form__row">
            <select
              id="marca"
              className="input select--dark"
              value={brand}
              onChange={(e) => {
                const code = e.target.value;
                setBrand(code);
                setModel("");
                setModels([]);
                setYear("");
                setYears([]);
                setPrice(null);
                if (code) loadModels(code);
              }}
              disabled={loadingBrands}
            >
              <option value="" disabled hidden>
                Selecione a marca
              </option>
              {brands.map((b) => (
                <option key={`${b.codigo}-${b.nome}`} value={b.codigo}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
          {errBrands && <div className="error">{errBrands}</div>}
          {loadingBrands && <div className="skeleton">Carregando marcas...</div>}
        </div>

        <div className="form__group">
          <label htmlFor="modelo">Modelo</label>
          <div className="form__row">
            <select
              id="modelo"
              className="input select--dark"
              value={model}
              onChange={(e) => {
                const code = e.target.value;
                setModel(code);
                setYear("");
                setYears([]);
                setPrice(null);
                if (code) loadYears(brand, code);
              }}
              disabled={!brand || loadingModels}
            >
              <option value="" disabled hidden>
                Selecione o modelo
              </option>
              {models.map((m) => (
                <option key={`${m.codigo}-${m.nome}`} value={m.codigo}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          {errModels && <div className="error">{errModels}</div>}
          {loadingModels && <div className="skeleton">Carregando modelos...</div>}
        </div>

        <div className="form__group">
          <label htmlFor="ano">Ano/Combustivel</label>
          <div className="form__row">
            <select
              id="ano"
              className="input select--dark"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPrice(null);
              }}
              disabled={!model || loadingYears}
            >
              <option value="" disabled hidden>
                Selecione o ano
              </option>
              {years.map((y) => (
                <option key={`${y.codigo}-${y.nome}`} value={y.codigo}>
                  {y.nome}
                </option>
              ))}
            </select>
            <button
              className="btn"
              type="button"
              onClick={loadPrice}
              disabled={!year || loadingPrice}
            >
              {loadingPrice ? "Buscando..." : "Buscar preco"}
            </button>
          </div>
          {errYears && <div className="error">{errYears}</div>}
          {loadingYears && <div className="skeleton">Carregando anos...</div>}
          {errPrice && <div className="error">{errPrice}</div>}
        </div>
      </div>

      {price && (
        <div className="result-card">
          <div className="result-card__head">
            <div>
              <p className="eyebrow">Resultado</p>
              <h2 className="result-card__title">
                {price.modelo || "Modelo"} - {price.valor || "Valor"}
              </h2>
              <p className="muted">
                {price.marca} • {price.anoModelo} • {price.combustivel}
              </p>
            </div>
          </div>

          {summary.length > 0 && (
            <ul className="kv kv--compact">
              {summary.map((row) => (
                <li key={row.label} className="kv__row">
                  <div className="kv__key">{row.label}</div>
                  <div className="kv__val">{row.value}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
