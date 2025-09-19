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
