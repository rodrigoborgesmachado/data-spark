import ExcelJS from "exceljs/dist/exceljs.min.js";
import { normalizeText, toIsoDate } from "./formatters.js";

export const REQUIRED_COLUMNS = ["date", "description", "value", "category"];

export const EXPECTED_COLUMNS = [
  { key: "date", label: "Data", aliases: ["data"] },
  { key: "description", label: "Descricao", aliases: ["descricao", "descrição"] },
  { key: "value", label: "Valor", aliases: ["valor"] },
  { key: "account", label: "Conta", aliases: ["conta"] },
  { key: "status", label: "Situacao", aliases: ["situacao", "situação"] },
  { key: "category", label: "Categoria", aliases: ["categoria"] },
  { key: "subcategory", label: "Subcategoria", aliases: ["subcategoria", "sub categoria"] },
  { key: "tags", label: "Tags", aliases: ["tags", "tag"] },
];

const ALIAS_TO_KEY = EXPECTED_COLUMNS.reduce((acc, column) => {
  column.aliases.forEach((alias) => {
    acc[normalizeText(alias)] = column.key;
  });
  return acc;
}, {});

function getExtension(fileName) {
  const parts = String(fileName ?? "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function cellToText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return toIsoDate(value);
  if (typeof value === "object") {
    if ("text" in value) return String(value.text ?? "");
    if ("result" in value) return cellToText(value.result);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text ?? "").join("");
    }
    if ("hyperlink" in value && "text" in value) return String(value.text ?? "");
  }
  return String(value);
}

function isEmptyRow(values) {
  return values.every((value) => cellToText(value).trim() === "");
}

function isTotalRow(row) {
  return row.some((value) => normalizeText(cellToText(value)).startsWith("total "));
}

function parseBrazilianDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  const text = cellToText(value).trim();
  if (!text) return null;

  const brMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const rawYear = Number(brMatch[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function parseMoneyValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "result" in value) return parseMoneyValue(value.result);

  const raw = cellToText(value).trim();
  if (!raw) return null;

  const hasParentheses = raw.includes("(") && raw.includes(")");
  const sanitized = raw
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/[()]/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!sanitized || sanitized === "-" || sanitized === ",") return null;

  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  let normalized = sanitized;

  if (decimalSeparator === ",") {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return hasParentheses ? -Math.abs(parsed) : parsed;
}

function parseTags(value) {
  const raw = cellToText(value).trim();
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function mapHeader(row) {
  const normalizedHeaders = row.map((value) => normalizeText(cellToText(value)));
  const columns = {};
  const recognized = [];
  const unknown = [];

  normalizedHeaders.forEach((header, index) => {
    if (!header) return;

    const key = ALIAS_TO_KEY[header];
    if (key && columns[key] === undefined) {
      columns[key] = index;
      recognized.push(EXPECTED_COLUMNS.find((column) => column.key === key).label);
      return;
    }

    unknown.push(cellToText(row[index]).trim());
  });

  const missing = REQUIRED_COLUMNS.filter((key) => columns[key] === undefined);

  return {
    columns,
    recognizedColumns: recognized,
    unknownColumns: unknown,
    missingRequired: missing,
    isValid: missing.length === 0,
  };
}

function findHeader(rows) {
  const limit = Math.min(rows.length, 20);

  for (let index = 0; index < limit; index += 1) {
    const header = mapHeader(rows[index]);
    if (header.isValid) {
      return { headerRowIndex: index, ...header };
    }
  }

  const best = rows.slice(0, limit).reduce(
    (currentBest, row, index) => {
      const header = mapHeader(row);
      const score = Object.keys(header.columns).length;
      return score > currentBest.score ? { score, index, header } : currentBest;
    },
    { score: 0, index: -1, header: null },
  );

  return {
    headerRowIndex: best.index,
    ...(best.header ?? mapHeader([])),
  };
}

function getValue(row, columns, key) {
  const index = columns[key];
  return index === undefined ? "" : row[index];
}

export function parseMobillsRows(rows, fileName = "Arquivo importado", sourceSheet = "") {
  if (!rows.length || rows.every(isEmptyRow)) {
    throw new Error("Arquivo vazio.");
  }

  const header = findHeader(rows);
  if (!header.isValid) {
    const missingLabels = header.missingRequired
      .map((key) => EXPECTED_COLUMNS.find((column) => column.key === key).label)
      .join(", ");
    throw new Error(`Colunas obrigatorias ausentes: ${missingLabels}.`);
  }

  const transactions = [];
  const ignoredRows = [];
  const counters = {
    totalRows: Math.max(rows.length - header.headerRowIndex - 1, 0),
    emptyRows: 0,
    totalizationRows: 0,
    invalidDates: 0,
    invalidValues: 0,
    missingRequiredFields: 0,
  };

  rows.slice(header.headerRowIndex + 1).forEach((row, relativeIndex) => {
    const rowNumber = header.headerRowIndex + relativeIndex + 2;

    if (isEmptyRow(row)) {
      counters.emptyRows += 1;
      return;
    }

    if (isTotalRow(row)) {
      counters.totalizationRows += 1;
      return;
    }

    const dateValue = getValue(row, header.columns, "date");
    const description = cellToText(getValue(row, header.columns, "description")).trim();
    const rawValue = getValue(row, header.columns, "value");
    const category = cellToText(getValue(row, header.columns, "category")).trim();

    const missing = [];
    if (!cellToText(dateValue).trim()) missing.push("Data");
    if (!description) missing.push("Descricao");
    if (!cellToText(rawValue).trim()) missing.push("Valor");
    if (!category) missing.push("Categoria");

    if (missing.length) {
      counters.missingRequiredFields += 1;
      ignoredRows.push({ rowNumber, reason: `Campos obrigatorios ausentes: ${missing.join(", ")}` });
      return;
    }

    const date = parseBrazilianDate(dateValue);
    if (!date) {
      counters.invalidDates += 1;
      ignoredRows.push({ rowNumber, reason: "Data invalida", sample: cellToText(dateValue) });
      return;
    }

    const value = parseMoneyValue(rawValue);
    if (value === null) {
      counters.invalidValues += 1;
      ignoredRows.push({ rowNumber, reason: "Valor invalido", sample: cellToText(rawValue) });
      return;
    }

    const account = cellToText(getValue(row, header.columns, "account")).trim();
    const status = cellToText(getValue(row, header.columns, "status")).trim();
    const subcategory = cellToText(getValue(row, header.columns, "subcategory")).trim();
    const tagsRaw = cellToText(getValue(row, header.columns, "tags")).trim();
    const type = value < 0 ? "expense" : value > 0 ? "income" : "neutral";

    transactions.push({
      id: `${rowNumber}-${transactions.length}`,
      rowNumber,
      date,
      dateIso: toIsoDate(date),
      description,
      value,
      absoluteValue: Math.abs(value),
      expenseAmount: value < 0 ? Math.abs(value) : 0,
      account,
      status,
      category,
      subcategory,
      tagsRaw,
      tags: parseTags(tagsRaw),
      type,
      isPending: normalizeText(status).includes("pendente"),
      duplicateGroupId: "",
    });
  });

  if (!transactions.length) {
    throw new Error("Nenhum lancamento valido encontrado.");
  }

  const duplicateGroups = detectDuplicates(transactions);
  const duplicateIds = new Map();
  duplicateGroups.forEach((group, index) => {
    group.items.forEach((item) => duplicateIds.set(item.id, `D${index + 1}`));
  });

  transactions.forEach((transaction) => {
    transaction.duplicateGroupId = duplicateIds.get(transaction.id) ?? "";
  });

  const dates = transactions.map((transaction) => transaction.date).sort((a, b) => a - b);

  return {
    fileName,
    sourceSheet,
    transactions,
    quality: {
      ...counters,
      validRows: transactions.length,
      expenses: transactions.filter((transaction) => transaction.type === "expense").length,
      incomes: transactions.filter((transaction) => transaction.type === "income").length,
      neutral: transactions.filter((transaction) => transaction.type === "neutral").length,
      ignoredRows: ignoredRows.length + counters.emptyRows + counters.totalizationRows,
      ignoredDetails: ignoredRows,
      duplicateGroups,
      recognizedColumns: header.recognizedColumns,
      unknownColumns: header.unknownColumns,
      periodStart: dates[0],
      periodEnd: dates[dates.length - 1],
    },
  };
}

export function detectDuplicates(transactions) {
  const groups = new Map();

  transactions.forEach((transaction) => {
    const key = [
      transaction.dateIso,
      normalizeText(transaction.description),
      transaction.value,
      normalizeText(transaction.account),
      normalizeText(transaction.category),
    ].join("|");

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(transaction);
  });

  return Array.from(groups.values())
    .filter((items) => items.length > 1)
    .map((items) => ({
      key: items.map((item) => item.id).join("-"),
      count: items.length,
      items,
    }));
}

function detectCsvDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsv(text) {
  const delimiter = detectCsvDelimiter(text);
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (!insideQuotes && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

async function readXlsx(file) {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const preferred = workbook.worksheets.find((worksheet) => normalizeText(worksheet.name) === "despesas");
  const orderedSheets = preferred
    ? [preferred, ...workbook.worksheets.filter((worksheet) => worksheet !== preferred)]
    : workbook.worksheets;

  const failures = [];

  for (const worksheet of orderedSheets) {
    const rows = [];
    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const values = [];
      for (let columnNumber = 1; columnNumber <= Math.max(worksheet.columnCount, 8); columnNumber += 1) {
        values.push(row.getCell(columnNumber).value);
      }
      rows.push(values);
    }

    try {
      return parseMobillsRows(rows, file.name, worksheet.name);
    } catch (error) {
      failures.push(error.message);
    }
  }

  throw new Error(failures[0] || "Nenhuma planilha valida encontrada.");
}

async function readCsv(file) {
  const text = await file.text();
  return parseMobillsRows(parseCsv(text), file.name, "CSV");
}

export async function readMobillsFile(file) {
  if (!file) throw new Error("Selecione um arquivo para importar.");

  const extension = getExtension(file.name);

  try {
    if (extension === "xlsx") return await readXlsx(file);
    if (extension === "csv") return await readCsv(file);
    if (extension === "xls") {
      throw new Error("Formato .xls nao suportado nesta versao. Exporte em .xlsx ou .csv para manter a leitura local e segura.");
    }

    throw new Error("Formato nao suportado. Use .xlsx ou .csv.");
  } catch (error) {
    if (error.message) throw error;
    throw new Error("Arquivo corrompido ou ilegivel.");
  }
}
