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
