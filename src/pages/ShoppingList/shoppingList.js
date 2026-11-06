const STORAGE_KEY = "dataSpark.shoppingList.v1";

const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const quantityFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatMoney(value) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatQuantity(value) {
  return quantityFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function parseDecimal(value) {
  let text = String(value ?? "").replace(/[R$\s]/g, "");
  if (!text) return null;
  if (text.includes(",")) text = text.replaceAll(".", "").replace(",", ".");
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function toInputValue(value) {
  return Number.isFinite(value) ? String(value).replace(".", ",") : "";
}

function createId() {
  return window.crypto.randomUUID();
}

export function createList(name) {
  return { id: createId(), name: name.trim() || "Lista de compras", createdAt: new Date().toISOString(), items: [] };
}

export function createItem(description, quantity, price) {
  return { id: createId(), description: description.trim(), quantity, price, picked: false };
}

export function itemTotal(item) {
  return (item.quantity || 0) * (item.price || 0);
}

export function getTotals(items) {
  return items.reduce((totals, item) => {
    const total = itemTotal(item);
    totals.expected += total;
    if (item.picked) {
      totals.cart += total;
      totals.picked += 1;
    }
    return totals;
  }, { cart: 0, expected: 0, picked: 0 });
}

export function finishList(list) {
  return { ...list, finishedAt: new Date().toISOString(), total: getTotals(list.items).cart };
}

export function duplicateList(list) {
  return {
    ...createList(list.name),
    items: list.items.map((item) => ({ ...item, id: createId(), picked: false })),
  };
}

function isValidItem(item) {
  return item && typeof item.id === "string" && typeof item.description === "string";
}

function normalizeList(list) {
  if (!list || typeof list.id !== "string" || !Array.isArray(list.items)) return null;
  return {
    ...list,
    name: typeof list.name === "string" ? list.name : "Lista de compras",
    items: list.items.filter(isValidItem).map((item) => ({
      ...item,
      quantity: Number.isFinite(item.quantity) ? item.quantity : 1,
      price: Number.isFinite(item.price) ? item.price : null,
      picked: Boolean(item.picked),
    })),
  };
}

export function normalizeState(value) {
  const history = Array.isArray(value?.history) ? value.history.map(normalizeList).filter(Boolean) : [];
  return {
    active: normalizeList(value?.active),
    history: history.map((list) => ({ ...list, total: Number.isFinite(list.total) ? list.total : getTotals(list.items).cart })),
  };
}

export function readState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return normalizeState({});
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
