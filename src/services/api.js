const BASE_URL = "https://apisunsale.azurewebsites.net";

/**
 * Fetches JSON and returns the *first* meaningful object.
 * Works for payloads like { object: [...] } or just objects.
 */
export async function getFirstObject(path, params = {}) {
  const qs = new URLSearchParams(params);
  const url = `${BASE_URL}${path}${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, { headers: { accept: "text/plain" } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  if (Array.isArray(data?.object)) return data.object[0] ?? null;
  if (data?.object && typeof data.object === "object") return data.object;
  return data;
}

/**
 * Fetch company data by CNPJ using backend proxy (ReceitaWS).
 * Accepts formatted CNPJ and strips non-digits before querying.
 */
export async function fetchCompanyByCnpj(rawCnpj) {
  const cnpj = String(rawCnpj ?? "").replace(/\D/g, "");

  if (!cnpj) throw new Error("Informe um CNPJ.");
  if (cnpj.length !== 14) throw new Error("CNPJ deve ter 14 digitos.");

  const url = `${BASE_URL}/api/ReceitaCnpj/${cnpj}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });

  if (!res.ok) {
    throw new Error(`Erro na consulta (${res.status}).`);
  }

  const data = await res.json();
  if (data?.status && data.status !== "OK") {
    throw new Error(data?.message || "Consulta nao autorizada.");
  }

  return data;
}

/**
 * Fetch national ranking of names (IBGE).
 */
export async function fetchNameRanking() {
  const url = "https://servicodados.ibge.gov.br/api/v2/censos/nomes/ranking";
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Erro ao buscar ranking (${res.status}).`);
  return res.json();
}

/**
 * Fetch historical frequencies of a given name (IBGE).
 */
export async function fetchNameHistory(rawName) {
  const name = String(rawName ?? "").trim();
  if (!name) throw new Error("Informe um nome.");
  const url = `https://servicodados.ibge.gov.br/api/v2/censos/nomes/${encodeURIComponent(
    name
  )}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Erro ao buscar nome (${res.status}).`);
  return res.json();
}

/**
 * Fetch Brazilian holidays for a given year.
 */
export async function fetchHolidays(year) {
  const y = Number(year);
  if (!y || Number.isNaN(y)) throw new Error("Informe um ano valido.");
  const url = `https://brasilapi.com.br/api/feriados/v1/${y}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Erro ao buscar feriados (${res.status}).`);
  return res.json();
}

/**
 * Fetch list of banks (BrasilAPI).
 */
export async function fetchBanks() {
  const url = "https://brasilapi.com.br/api/banks/v1";
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Erro ao buscar bancos (${res.status}).`);
  return res.json();
}

/**
 * Fetch a single bank by code (BrasilAPI).
 */
export async function fetchBankByCode(code) {
  const c = String(code ?? "").trim();
  if (!c) throw new Error("Informe o codigo do banco.");
  const url = `https://brasilapi.com.br/api/banks/v1/${encodeURIComponent(c)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Banco nao encontrado (${res.status}).`);
  return res.json();
}

/**
 * Fetch CEP info using backend proxy (ViaCep).
 */
export async function fetchCep(rawCep) {
  const cep = String(rawCep ?? "").replace(/\D/g, "");
  if (!cep) throw new Error("Informe um CEP.");
  if (cep.length !== 8) throw new Error("CEP deve ter 8 digitos.");

  const url = `${BASE_URL}/api/ViaCep/${cep}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Erro ao buscar CEP (${res.status}).`);
  return res.json();
}
