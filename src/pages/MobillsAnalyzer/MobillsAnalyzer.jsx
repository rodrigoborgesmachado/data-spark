import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PageHeader from "../../components/PageHeader";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  aggregateByAccount,
  aggregateByCategory,
  aggregateByDescription,
  aggregateByMonthDay,
  aggregateByWeekday,
  aggregateCategoryDistribution,
  aggregateMonthly,
  aggregateStackedCategories,
  applyDatePreset,
  calculateMetrics,
  createFinancialSummary,
  createInitialFilters,
  DEFAULT_FILTERS,
  detectOutliers,
  detectRecurrences,
  exportTransactionsToCsv,
  filterTransactions,
  generateInsights,
  getFilterOptions,
  getPreviousPeriod,
  getTopExpenses,
} from "../../utils/mobills/analytics.js";
import {
  describePeriod,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
} from "../../utils/mobills/formatters.js";
import { EXPECTED_COLUMNS, readMobillsFile } from "../../utils/mobills/reader.js";

function makeIcon(name) {
  return function ToolIcon({ size = 18, ...props }) {
    return <i {...props} className={`bi bi-${name} tool-symbol tool-symbol--${size}`} />;
  };
}
const AlertTriangle = makeIcon("exclamation-triangle");
const BarChart3 = makeIcon("bar-chart");
const ChevronDown = makeIcon("chevron-down");
const Copy = makeIcon("copy");
const Download = makeIcon("download");
const FileSpreadsheet = makeIcon("file-earmark-spreadsheet");
const RefreshCcw = makeIcon("arrow-repeat");
const Search = makeIcon("search");
const Trash2 = makeIcon("trash");
const Upload = makeIcon("upload");

const STORAGE_KEY = "dataSpark.mobills.preferences.v1";
const CHART_COLORS = Array.from({ length: 8 }, (_, index) => `var(--chart-${index + 1})`);
const TYPE_LABELS = {
  expense: "Despesa",
  income: "Entrada/estorno",
  neutral: "Neutro",
};

const EMPTY_IMPORT = {
  result: null,
  error: "",
  status: "idle",
};

function readStoredPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      topCategoryLimit: parsed.topCategoryLimit || "10",
      pageSize: parsed.pageSize || 25,
      filters: { ...DEFAULT_FILTERS, ...(parsed.filters || {}) },
    };
  } catch {
    return { topCategoryLimit: "10", pageSize: 25, filters: DEFAULT_FILTERS };
  }
}

function saveStoredPreferences(filters, topCategoryLimit, pageSize) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      filters: {
        ...filters,
        account: "",
        status: "",
        category: "",
        subcategory: "",
        tag: "",
        search: "",
      },
      topCategoryLimit,
      pageSize,
    }),
  );
}



function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="mobills-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={`${item.name}-${item.value}`}>
          {item.name}: {typeof item.value === "number" ? formatMoney(item.value) : item.value}
        </span>
      ))}
    </div>
  );
}

function UploadPanel({ status, error, hasData, onFile, onClear }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <section
      className={`panel mobills-upload ${isDragging ? "is-dragging" : ""} ${status === "success" ? "is-success" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      aria-busy={status === "loading"}
    >
      <div className="mobills-upload__icon" aria-hidden="true">
        <FileSpreadsheet size={28} />
      </div>

      <div className="mobills-upload__content">
        <p className="eyebrow">Importação local</p>
        <h2 className="panel__title">Arraste a planilha do Mobills</h2>
        <p className="muted">
          Seus dados são processados localmente e não são enviados para nenhum servidor.
        </p>
        <p className="hint">Formatos aceitos: .xlsx e .csv. Arquivos .xls antigos são recusados por seguranca.</p>
      </div>

      <div className="mobills-upload__actions">
        <Form.Control
          ref={inputRef}
          className="sr-only"
          aria-label="Arquivo do Mobills"
          type="file"
          accept=".xlsx,.csv"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button className="btn" type="button" onClick={() => inputRef.current?.click()} disabled={status === "loading"}>
          <Upload size={18} aria-hidden="true" />
          {status === "loading" ? "Carregando..." : "Selecionar arquivo"}
        </Button>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => inputRef.current?.click()} disabled={status === "loading"}>
          <RefreshCcw size={18} aria-hidden="true" />
          Carregar novo arquivo
        </Button>
        {hasData ? (
          <Button variant="outline-secondary" className="btn btn--ghost btn--danger" type="button" onClick={onClear}>
            <Trash2 size={18} aria-hidden="true" />
            Remover arquivo e limpar dados
          </Button>
        ) : null}
      </div>

      <div className="mobills-columns" aria-label="Colunas esperadas">
        {EXPECTED_COLUMNS.map((column) => (
          <span className="pill" key={column.key}>
            {column.label}
          </span>
        ))}
      </div>

      {error ? <ErrorState>{error}</ErrorState> : null}
      {status === "success" ? <div className="mobills-success">Arquivo importado com sucesso.</div> : null}
    </section>
  );
}

function ImportQuality({ result }) {
  const [open, setOpen] = useState(false);
  const quality = result.quality;
  const cards = [
    ["Arquivo", result.fileName],
    ["Aba", result.sourceSheet || "Nao informado"],
    ["Período", describePeriod(quality.periodStart, quality.periodEnd)],
    ["Linhas totais", formatNumber(quality.totalRows)],
    ["lançamentos válidos", formatNumber(quality.validRows)],
    ["Despesas", formatNumber(quality.expenses)],
    ["Entradas/estornos", formatNumber(quality.incomes)],
    ["Linhas ignoradas", formatNumber(quality.ignoredRows)],
    ["Datas inválidas", formatNumber(quality.invalidDates)],
    ["Valores inválidos", formatNumber(quality.invalidValues)],
    ["Obrigatorios ausentes", formatNumber(quality.missingRequiredFields)],
    ["Possíveis duplicidades", formatNumber(quality.duplicateGroups.reduce((sum, group) => sum + group.count, 0))],
  ];

  return (
    <section className="panel">
      <div className="panel__head mobills-section-head">
        <div>
          <p className="eyebrow">Qualidade da Importação</p>
          <h2 className="panel__title">Resumo do arquivo</h2>
        </div>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setOpen((current) => !current)}>
          <ChevronDown size={18} aria-hidden="true" />
          Detalhes
        </Button>
      </div>

      <div className="stats-grid mobills-quality-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <div className="stat-card__value mobills-stat-small">{value}</div>
            <div className="stat-card__label">{label}</div>
          </div>
        ))}
      </div>

      <div className="mobills-column-summary">
        <p>
          <strong>Colunas reconhecidas:</strong> {quality.recognizedColumns.join(", ") || "Nenhuma"}
        </p>
        <p>
          <strong>Colunas desconhecidas:</strong> {quality.unknownColumns.join(", ") || "Nenhuma"}
        </p>
      </div>

      {open ? (
        <div className="mobills-details">
          <div>
            <h3>Linhas ignoradas</h3>
            {quality.ignoredDetails.length ? (
              <ul>
                {quality.ignoredDetails.slice(0, 80).map((item) => (
                  <li key={`${item.rowNumber}-${item.reason}`}>
                    Linha {item.rowNumber}: {item.reason}
                    {item.sample ? ` (${item.sample})` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Nenhuma linha inválida além de linhas vazias ou totalizadoras.</p>
            )}
          </div>

          <div>
            <h3>Possíveis duplicidades</h3>
            {quality.duplicateGroups.length ? (
              <ul>
                {quality.duplicateGroups.slice(0, 50).map((group) => (
                  <li key={group.key}>
                    {group.count} registros parecidos: {group.items[0].dateIso}, {group.items[0].description},{" "}
                    {formatMoney(group.items[0].absoluteValue)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Nenhuma possível duplicidade encontrada.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FiltersPanel({ filters, options, filteredCount, onChange, onPreset, onClear }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <section className="panel mobills-filters">
      <div className="panel__head mobills-section-head">
        <div>
          <p className="eyebrow">Filtros globais</p>
          <h2 className="panel__title">Período e recortes</h2>
        </div>
        <span className="pill">{formatNumber(filteredCount)} lançamentos filtrados</span>
      </div>

      <div className="mobills-presets" aria-label="Atalhos de Período">
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => onPreset("data-month")}>
          Mês atual dos dados
        </Button>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => onPreset("3m")}>
          Últimos 3 meses
        </Button>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => onPreset("6m")}>
          Últimos 6 meses
        </Button>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => onPreset("12m")}>
          Último ano
        </Button>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => onPreset("all")}>
          Período completo
        </Button>
      </div>

      <div className="form form--plain">
        <div className="form__grid">
          <Field label="Período inicial" id="filter-start">
            <Form.Control id="filter-start" className="input" type="date" value={filters.startDate} onChange={(event) => update("startDate", event.target.value)} />
          </Field>
          <Field label="Período final" id="filter-end">
            <Form.Control id="filter-end" className="input" type="date" value={filters.endDate} onChange={(event) => update("endDate", event.target.value)} />
          </Field>
          <SelectField label="Conta" value={filters.account} options={options.accounts} onChange={(value) => update("account", value)} />
          <SelectField label="Situacao" value={filters.status} options={options.statuses} onChange={(value) => update("status", value)} />
          <SelectField label="Categoria" value={filters.category} options={options.categories} onChange={(value) => update("category", value)} />
          <SelectField label="Subcategoria" value={filters.subcategory} options={options.subcategories} onChange={(value) => update("subcategory", value)} />
          <SelectField label="Tag" value={filters.tag} options={options.tags} onChange={(value) => update("tag", value)} />
          <Field label="Tipo" id="filter-type">
            <Form.Select id="filter-type" className="tool-select" value={filters.type} onChange={(event) => update("type", event.target.value)}>
              <option value="expense">Despesas</option>
              <option value="income">Entradas/estornos</option>
              <option value="all">Todos</option>
            </Form.Select>
          </Field>
          <Field label="Valor minimo" id="filter-min">
            <Form.Control id="filter-min" className="input" type="text" inputMode="decimal" value={filters.minValue} onChange={(event) => update("minValue", event.target.value)} />
          </Field>
          <Field label="Valor maximo" id="filter-max">
            <Form.Control id="filter-max" className="input" type="text" inputMode="decimal" value={filters.maxValue} onChange={(event) => update("maxValue", event.target.value)} />
          </Field>
        </div>

        <label className="mobills-search" htmlFor="filter-search">
          <Search size={18} aria-hidden="true" />
          <Form.Control
            id="filter-search"
            type="search"
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Buscar por descricao"
          />
        </label>

        <div className="mobills-toggle-row">
          <label className="mobills-check">
            <Form.Check.Input type="checkbox" checked={filters.includePending} onChange={(event) => update("includePending", event.target.checked)} />
            Incluir lançamentos pendentes
          </label>
          <label className="mobills-check">
            <Form.Check.Input type="checkbox" checked={filters.comparePrevious} onChange={(event) => update("comparePrevious", event.target.checked)} />
            Comparar com período anterior
          </label>
        </div>

        <div className="form__row">
          <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={onClear}>
            Limpar filtros
          </Button>
        </div>
      </div>
    </section>
  );
}

function Field({ id, label, children }) {
  return (
    <div className="form__group">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Field label={label} id={id}>
      <Form.Select id={id} className="tool-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Form.Select>
    </Field>
  );
}

function MetricsCards({ metrics }) {
  const cards = [
    ["Total gasto", formatMoney(metrics.totalSpent), "Soma dos valores negativos, usando valor absoluto."],
    ["Média mensal", formatMoney(metrics.monthlyAverage), "Total gasto dividido pelos meses do Período filtrado."],
    ["Média diaria", formatMoney(metrics.dailyAverage), "Total gasto dividido pelos dias do Período filtrado."],
    ["Quantidade de despesas", formatNumber(metrics.expenseCount), "Conta apenas lançamentos negativos."],
    ["Ticket médio", formatMoney(metrics.ticketAverage), "Média por despesa."],
    ["Maior despesa", metrics.largestExpense ? formatMoney(metrics.largestExpense.expenseAmount) : formatMoney(0), metrics.largestExpense?.description || "Sem despesa"],
    ["Entradas/estornos", formatMoney(metrics.totalIncome), "Valores positivos separados dos gastos."],
    ["Categoria maior gasto", metrics.topCategory?.name || "Sem dados", metrics.topCategory ? formatMoney(metrics.topCategory.total) : ""],
    ["Conta maior gasto", metrics.topAccount?.name || "Sem dados", metrics.topAccount ? formatMoney(metrics.topAccount.total) : ""],
    ["Mês maior gasto", metrics.topMonth?.name || "Sem dados", metrics.topMonth ? formatMoney(metrics.topMonth.total) : ""],
    ["Gastos pendentes", formatPercent(metrics.pendingPercent), `${formatMoney(metrics.pendingTotal)} em despesas pendentes.`],
    [
      "Variação Período anterior",
      metrics.variation === null ? "Sem comparação" : formatPercent(metrics.variation),
      metrics.previousSpent ? `Período anterior: ${formatMoney(metrics.previousSpent)}` : "Ative a comparação e use um Período com dados anteriores.",
    ],
  ];

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <p className="eyebrow">Indicadores</p>
          <h2 className="panel__title">Resumo do Período</h2>
        </div>
      </div>
      <div className="stats-grid mobills-metrics">
        {cards.map(([label, value, help]) => (
          <div className="stat-card" key={label}>
            <div className="stat-card__value mobills-stat-small">{value}</div>
            <div className="stat-card__label">
              {label}
              <span className="mobills-help" tabIndex="0" aria-label={help}>
                ?
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChartsPanel({
  filteredTransactions,
  previousTransactions,
  comparePrevious,
  topCategoryLimit,
  onTopCategoryLimitChange,
  selectedStackCategories,
  onSelectedStackCategoriesChange,
}) {
  const monthly = useMemo(() => aggregateMonthly(filteredTransactions, comparePrevious ? previousTransactions : []), [
    comparePrevious,
    filteredTransactions,
    previousTransactions,
  ]);
  const categories = useMemo(() => aggregateByCategory(filteredTransactions, topCategoryLimit), [filteredTransactions, topCategoryLimit]);
  const distribution = useMemo(() => aggregateCategoryDistribution(filteredTransactions), [filteredTransactions]);
  const accounts = useMemo(() => aggregateByAccount(filteredTransactions), [filteredTransactions]);
  const weekdays = useMemo(() => aggregateByWeekday(filteredTransactions), [filteredTransactions]);
  const monthDays = useMemo(() => aggregateByMonthDay(filteredTransactions), [filteredTransactions]);
  const descriptions = useMemo(() => aggregateByDescription(filteredTransactions), [filteredTransactions]);
  const stacked = useMemo(() => aggregateStackedCategories(filteredTransactions, selectedStackCategories), [
    filteredTransactions,
    selectedStackCategories,
  ]);
  const topCategoryOptions = useMemo(() => aggregateByCategory(filteredTransactions, "all").slice(0, 8), [filteredTransactions]);

  function toggleStackCategory(category) {
    onSelectedStackCategoriesChange(
      selectedStackCategories.includes(category)
        ? selectedStackCategories.filter((item) => item !== category)
        : [...selectedStackCategories, category],
    );
  }

  return (
    <section className="mobills-chart-grid">
      <ChartCard title="Evolução mensal" description="Total gasto por mes e media mensal.">
        {monthly.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} dataKey="label" />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} width={72} />
              <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
              <Legend />
              <Area isAnimationActive={false} type="monotone" dataKey="total" name="Gasto" stroke="var(--chart-1)" fill="var(--chart-area)" />
              <Line isAnimationActive={false} type="monotone" dataKey="average" name="Média mensal" stroke="var(--chart-3)" dot={false} />
              {comparePrevious ? <Line isAnimationActive={false} type="monotone" dataKey="previousTotal" name="Período anterior" stroke="var(--chart-2)" dot={false} /> : null}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
        )}
      </ChartCard>

      <ChartCard
        title="Gastos por categoria"
        description="Ordenado do maior para o menor."
        action={
          <Form.Select aria-label="Quantidade de categorias" className="tool-select mobills-compact-select" value={topCategoryLimit} onChange={(event) => onTopCategoryLimitChange(event.target.value)}>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="all">Todas</option>
          </Form.Select>
        }
      >
        {categories.length ? (
          <ResponsiveContainer width="100%" height={Math.max(260, categories.length * 36)}>
            <BarChart data={categories} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} type="number" tickFormatter={(value) => formatNumber(value)} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} type="category" dataKey="category" width={130} />
              <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
              <Bar isAnimationActive={false} dataKey="total" name="Valor" fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
        )}
        <div className="mobills-mini-table" aria-label="Resumo por categoria">
          {categories.slice(0, 8).map((item) => (
            <span key={item.category}>
              {item.category}: {formatMoney(item.total)} ({formatPercent(item.percent)}, {formatNumber(item.count)})
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Distribuicao por categoria" description="Categorias menores são agrupadas em Outras.">
        {distribution.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie isAnimationActive={false} data={distribution} dataKey="total" nameKey="category" innerRadius={62} outerRadius={100} paddingAngle={2}>
                {distribution.map((item, index) => (
                  <Cell key={item.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
        )}
      </ChartCard>

      <ChartCard title="Gastos por conta" description="Distribuicao das despesas entre contas.">
        {accounts.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={accounts.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} dataKey="account" />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} width={72} />
              <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
              <Bar isAnimationActive={false} dataKey="total" name="Valor" fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
        )}
      </ChartCard>

      <ChartCard title="Gastos por dia da semana" description="Total e media por lancamento em cada dia.">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekdays}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} dataKey="weekday" />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} width={72} />
            <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
            <Legend />
            <Bar isAnimationActive={false} dataKey="total" name="Total" fill="var(--chart-3)" />
            <Bar isAnimationActive={false} dataKey="average" name="Média" fill="var(--chart-5)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Gastos ao longo do mes" description="Concentracao por dia do mes.">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthDays}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} dataKey="day" />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} width={72} />
            <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
            <Bar isAnimationActive={false} dataKey="total" name="Total" fill="var(--chart-6)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Descrições com maior gasto" description="Agrupamento conservador: espaços e maiúsculas/minúsculas.">
        {descriptions.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={descriptions} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} type="number" tickFormatter={(value) => formatNumber(value)} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} type="category" dataKey="description" width={140} />
              <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
              <Bar isAnimationActive={false} dataKey="total" name="Valor" fill="var(--chart-7)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
        )}
      </ChartCard>

      <ChartCard
        title="Categorias ao longo do tempo"
        description="Evolução mensal empilhada das principais categorias."
        action={
          <div className="mobills-category-picker">
            {topCategoryOptions.map((item) => (
              <label key={item.category}>
                <Form.Check.Input
                  type="checkbox"
                  checked={selectedStackCategories.length ? selectedStackCategories.includes(item.category) : stacked.categories.includes(item.category)}
                  onChange={() => toggleStackCategory(item.category)}
                />
                {item.category}
              </label>
            ))}
          </div>
        }
      >
        {stacked.rows.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stacked.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} dataKey="label" />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} width={72} />
              <Tooltip cursor={{ fill: "var(--surface-hover)", stroke: "var(--border)" }} content={<ChartTooltip />} />
              <Legend />
              {stacked.categories.map((category, index) => (
                <Bar isAnimationActive={false} key={category} dataKey={category} stackId="category" fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
        )}
      </ChartCard>
    </section>
  );
}

function ChartCard({ title, description, action = null, children }) {
  return (
    <section className="panel mobills-chart-card">
      <div className="panel__head mobills-section-head">
        <div>
          <p className="eyebrow">Gráficos</p>
          <h2 className="panel__title">{title}</h2>
          <p className="muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InsightsPanel({ insights, recurrences }) {
  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <p className="eyebrow">Insights do Período</p>
          <h2 className="panel__title">Leituras automáticas locais</h2>
          <p className="muted">Despesas fora do padrao usam a regra: valor acima da media + 2 desvios-padrao.</p>
        </div>
      </div>
      {insights.length ? (
        <ul className="mobills-insights">
          {insights.map((insight) => (
            <li key={insight}>
              <BarChart3 size={18} aria-hidden="true" />
              {insight}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Dados insuficientes para gerar insights.</EmptyState>
      )}
      {recurrences.length ? (
        <div className="mobills-recurrences">
          <h3>Possíveis recorrências</h3>
          <div className="mobills-mini-table">
            {recurrences.map((item) => (
              <span key={item.description}>
                {item.description}: {formatMoney(item.average)} médio em {item.months} meses
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TopExpensesPanel({ transactions }) {
  const topExpenses = useMemo(() => getTopExpenses(transactions), [transactions]);

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <p className="eyebrow">Ranking</p>
          <h2 className="panel__title">Maiores despesas</h2>
        </div>
      </div>
      {topExpenses.length ? (
        <div className="mobills-rank-list">
          {topExpenses.map((transaction) => (
            <div className="mobills-rank-item" key={transaction.id}>
              <span>{formatDate(transaction.date)}</span>
              <strong>{transaction.description}</strong>
              <span>{transaction.category}</span>
              <span>{transaction.account || "Sem conta"}</span>
              <strong>{formatMoney(transaction.expenseAmount)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
      )}
    </section>
  );
}

function FinancialSummary({ text }) {
  const [copied, setCopied] = useState(false);

  async function copySummary() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="panel">
      <div className="panel__head mobills-section-head">
        <div>
          <p className="eyebrow">Resumo financeiro</p>
          <h2 className="panel__title">Texto dinâmico</h2>
        </div>
        <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={copySummary}>
          <Copy size={18} aria-hidden="true" />
          {copied ? "Copiado" : "Copiar resumo"}
        </Button>
      </div>
      <p className="mobills-summary-text">{text}</p>
    </section>
  );
}

function TransactionsTable({ transactions, outlierIds, pageSize, onPageSizeChange }) {
  const [sort, setSort] = useState({ field: "date", direction: "desc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [transactions]);

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      const left = sort.field === "date" ? a.date.getTime() : a[sort.field] ?? "";
      const right = sort.field === "date" ? b.date.getTime() : b[sort.field] ?? "";

      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left).localeCompare(String(right), "pt-BR") * direction;
    });
  }, [sort, transactions]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  function changeSort(field) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function exportCsv() {
    const blob = new Blob([exportTransactionsToCsv(sorted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mobills-filtrado.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="panel__head mobills-section-head">
        <div>
          <p className="eyebrow">Lançamentos</p>
          <h2 className="panel__title">Tabela filtrada</h2>
        </div>
        <div className="mobills-table-actions">
          <Form.Select
            className="tool-select mobills-compact-select"
            value={pageSize}
            onChange={(event) => {
              const nextPageSize = Number(event.target.value);
              onPageSizeChange(nextPageSize);
              setPage(1);
            }}
            aria-label="Itens por pagina"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={exportCsv} disabled={!sorted.length}>
            <Download size={18} aria-hidden="true" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {visible.length ? (
        <>
          <div className="mobills-table" role="table">
            <div className="mobills-table__header" role="row">
              <Button type="button" onClick={() => changeSort("date")}>Data</Button>
              <Button type="button" onClick={() => changeSort("description")}>Descricao</Button>
              <Button type="button" onClick={() => changeSort("value")}>Valor</Button>
              <Button type="button" onClick={() => changeSort("account")}>Conta</Button>
              <Button type="button" onClick={() => changeSort("status")}>Situacao</Button>
              <Button type="button" onClick={() => changeSort("category")}>Categoria</Button>
              <span>Subcategoria</span>
              <span>Tags</span>
              <span>Alertas</span>
            </div>
            {visible.map((transaction) => (
              <div className={`mobills-table__row is-${transaction.type}`} role="row" key={transaction.id}>
                <span data-label="Data">{formatDate(transaction.date)}</span>
                <strong data-label="Descricao">{transaction.description}</strong>
                <span data-label="Valor">{formatMoney(transaction.value)}</span>
                <span data-label="Conta">{transaction.account || "-"}</span>
                <span data-label="Situacao">{transaction.status || "-"}</span>
                <span data-label="Categoria">{transaction.category || "-"}</span>
                <span data-label="Subcategoria">{transaction.subcategory || "-"}</span>
                <span data-label="Tags">{transaction.tagsRaw || "-"}</span>
                <span data-label="Alertas" className="mobills-alerts">
                  {transaction.duplicateGroupId ? <span className="pill">Duplicidade</span> : null}
                  {outlierIds.has(transaction.id) ? <span className="pill pill--warning">Fora do padrao</span> : null}
                  {transaction.isPending ? <span className="pill">Pendente</span> : null}
                </span>
              </div>
            ))}
          </div>

          <div className="mobills-pagination">
            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <span>
              Pagina {page} de {totalPages}
            </span>
            <Button variant="outline-secondary" className="btn btn--ghost" type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
              Proxima
            </Button>
          </div>
        </>
      ) : (
        <EmptyState title="Nenhum lançamento encontrado">Ajuste o período ou os filtros para visualizar dados.</EmptyState>
      )}
    </section>
  );
}

export default function MobillsAnalyzer({ title = "Analisador Mobills" }) {
  const [pendingFile, setPendingFile] = useState(null);
  const [{ result, error, status }, setImportState] = useState(EMPTY_IMPORT);
  const stored = useMemo(() => readStoredPreferences(), []);
  const [filters, setFilters] = useState(stored.filters);
  const [topCategoryLimit, setTopCategoryLimit] = useState(stored.topCategoryLimit);
  const [pageSize, setPageSize] = useState(stored.pageSize);
  const [selectedStackCategories, setSelectedStackCategories] = useState([]);

  useEffect(() => {
    saveStoredPreferences(filters, topCategoryLimit, pageSize);
  }, [filters, pageSize, topCategoryLimit]);

  function handleFile(file) {
    if (result) setPendingFile(file);
    else importFile(file);
  }

  async function importFile(file) {
    setImportState({ result: null, error: "", status: "loading" });

    try {
      const nextResult = await readMobillsFile(file);
      setImportState({ result: nextResult, error: "", status: "success" });
      setFilters({ ...createInitialFilters(nextResult.transactions), comparePrevious: filters.comparePrevious });
      setSelectedStackCategories([]);
    } catch (nextError) {
      setImportState({ result: null, error: nextError.message || "Nao foi possível ler o arquivo.", status: "error" });
    }
  }

  function clearData() {
    setImportState(EMPTY_IMPORT);
    setFilters(DEFAULT_FILTERS);
    setSelectedStackCategories([]);
  }

  const transactions = useMemo(() => result?.transactions ?? [], [result]);
  const options = useMemo(() => getFilterOptions(transactions), [transactions]);
  const filteredTransactions = useMemo(() => filterTransactions(transactions, filters), [filters, transactions]);
  const previousFilters = useMemo(() => (filters.comparePrevious ? getPreviousPeriod(filters) : null), [filters]);
  const previousTransactions = useMemo(() => {
    if (!previousFilters) return [];
    return filterTransactions(transactions, { ...filters, ...previousFilters });
  }, [filters, previousFilters, transactions]);
  const metrics = useMemo(() => calculateMetrics(filteredTransactions, filters, previousTransactions), [
    filteredTransactions,
    filters,
    previousTransactions,
  ]);
  const outlierIds = useMemo(() => detectOutliers(filteredTransactions), [filteredTransactions]);
  const insights = useMemo(() => generateInsights(filteredTransactions, metrics, previousTransactions, outlierIds), [
    filteredTransactions,
    metrics,
    outlierIds,
    previousTransactions,
  ]);
  const recurrences = useMemo(() => detectRecurrences(filteredTransactions), [filteredTransactions]);
  const financialSummary = useMemo(() => createFinancialSummary(filteredTransactions, metrics), [filteredTransactions, metrics]);

  return (
    <section className="verify mobills-page">
      <PageHeader eyebrow="Ferramentas" title={<>{title}</>} description={<>
            Importe a exportação do Mobills e análise gastos, categorias, contas, recorrências e qualidade dos lançamentos
            diretamente no navegador.
          </>} />

      <Modal show={Boolean(pendingFile)} onHide={() => setPendingFile(null)} centered aria-labelledby="replace-file-title">
        <Modal.Header closeButton><Modal.Title id="replace-file-title">Substituir análise atual?</Modal.Title></Modal.Header>
        <Modal.Body>Importar outro arquivo substitui os dados da análise atual.</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setPendingFile(null)}>Cancelar</Button>
          <Button onClick={() => { const file = pendingFile; setPendingFile(null); if (file) importFile(file); }}>Importar novo arquivo</Button>
        </Modal.Footer>
      </Modal>

      <UploadPanel status={status} error={error} hasData={Boolean(result)} onFile={handleFile} onClear={clearData} />

      {status === "loading" ? (
        <LoadingState>Lendo e normalizando a planilha...</LoadingState>
      ) : null}

      {result ? (
        <>
          <ImportQuality result={result} />
          <FiltersPanel
            filters={filters}
            options={options}
            filteredCount={filteredTransactions.length}
            onChange={setFilters}
            onPreset={(preset) => setFilters((current) => applyDatePreset(current, transactions, preset))}
            onClear={() => setFilters(createInitialFilters(transactions))}
          />
          <MetricsCards metrics={metrics} />
          <ChartsPanel
            filteredTransactions={filteredTransactions}
            previousTransactions={previousTransactions}
            comparePrevious={filters.comparePrevious}
            topCategoryLimit={topCategoryLimit}
            onTopCategoryLimitChange={setTopCategoryLimit}
            selectedStackCategories={selectedStackCategories}
            onSelectedStackCategoriesChange={setSelectedStackCategories}
          />
          <TopExpensesPanel transactions={filteredTransactions} />
          <InsightsPanel insights={insights} recurrences={recurrences} />
          <FinancialSummary text={financialSummary} />
          <TransactionsTable
            transactions={filteredTransactions}
            outlierIds={outlierIds}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : (
        <section className="panel mobills-before">
          <div>
            <p className="eyebrow">Como preparar</p>
            <h2 className="panel__title">Estrutura esperada do relatório</h2>
          </div>
          <p className="muted">
            A aba preferencial deve se chamar Despesas. Se ela não existir, o analisador procura qualquer aba com as
            colunas obrigatórias Data, Descricao, Valor e Categoria. Linhas vazias e a linha Total (despesas) são ignoradas.
          </p>
          <div className="mobills-info-list">
            <span>
              <AlertTriangle size={18} aria-hidden="true" />
              Duplicidades são apenas sinalizadas e nunca removidas automaticamente.
            </span>
            <span>
              <AlertTriangle size={18} aria-hidden="true" />
              Entradas e estornos não aumentam os indicadores de gasto principal.
            </span>
          </div>
        </section>
      )}
    </section>
  );
}
