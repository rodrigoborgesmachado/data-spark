import { parseDecimal } from "../ShoppingList/shoppingList.js";

export const MEASURES = {
  weight: { label: "Peso", base: "kg", units: { g: 0.001, kg: 1 }, defaultUnit: "g" },
  volume: { label: "Volume", base: "L", units: { ml: 0.001, L: 1 }, defaultUnit: "ml" },
  unit: { label: "Unidade", base: "un", units: { un: 1 }, defaultUnit: "un" },
};

const percentFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

export function formatPercent(value) {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

export function createOption(measure) {
  return { id: window.crypto.randomUUID(), name: "", price: "", quantity: "", unit: MEASURES[measure].defaultUnit };
}

export function getUnitPrice(price, quantity, factor) {
  if (!price || !quantity || !factor) return null;
  return price / (quantity * factor);
}

export function compareOptions(options, measure) {
  const { units } = MEASURES[measure];
  const results = options.map((option) => ({
    ...option,
    unitPrice: getUnitPrice(parseDecimal(option.price), parseDecimal(option.quantity), units[option.unit]),
  }));
  const prices = results.map((option) => option.unitPrice).filter((value) => value !== null);
  const best = prices.length ? Math.min(...prices) : null;

  return results.map((option) => {
    if (option.unitPrice === null) return { ...option, best: false, difference: null };
    const difference = option.unitPrice / best - 1;
    return { ...option, best: prices.length > 1 && difference < 1e-9, difference: difference < 1e-9 ? 0 : difference };
  });
}
