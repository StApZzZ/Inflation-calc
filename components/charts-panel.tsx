'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalculationResults, SettingsInput } from '@/lib/types';
import { formatMoney, formatPercent } from '@/lib/format';

interface ChartsPanelProps {
  results: CalculationResults;
  settings: SettingsInput;
}

function valueFormatter(value: number, settings: SettingsInput) {
  return formatMoney(value, settings);
}

export function ChartsPanel({ results, settings }: ChartsPanelProps) {
  const incomeBarData = results.years.map((row) => ({ year: row.year.toString(), delta: row.income_delta }));

  return (
    <div className="stack">
      <div className="surface section-card">
        <header>
          <div>
            <h3>Дельта дохода по годам</h3>
            <p className="muted">Обязательная столбчатая диаграмма: фактический доход минус идеальный.</p>
          </div>
        </header>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value) => {
                  if (value == null) {
                    return valueFormatter(0, settings);
                  }
                  return valueFormatter(Number(value), settings);
                }}
              />
              <Bar dataKey="delta" radius={[10, 10, 0, 0]}>
                {incomeBarData.map((entry) => (
                  <Cell key={entry.year} fill={entry.delta >= 0 ? '#16a34a' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="legend-row">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#16a34a' }} />
            Положительная дельта
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#dc2626' }} />
            Отрицательная дельта
          </span>
        </div>
      </div>

      <LineComparisonChart
        title="Доход: фактическое vs идеальное"
        description="Дополнительная линейная визуализация по доходу."
        settings={settings}
        data={results.years.map((row) => ({
          year: row.year.toString(),
          actual: row.income_actual,
          ideal: row.income_ideal,
          inflation: row.inflation_percent,
        }))}
      />

      <LineComparisonChart
        title="Накопления: фактическое vs идеальное"
        description="Срез по накоплениям на конец каждого года."
        settings={settings}
        data={results.years.map((row) => ({
          year: row.year.toString(),
          actual: row.savings_actual,
          ideal: row.savings_ideal,
          inflation: row.inflation_percent,
        }))}
      />

      <LineComparisonChart
        title="Активы: фактическое vs идеальное"
        description="Сравнение стоимости активов и инфляционно-скорректированной траектории."
        settings={settings}
        data={results.years.map((row) => ({
          year: row.year.toString(),
          actual: row.assets_actual,
          ideal: row.assets_ideal,
          inflation: row.inflation_percent,
        }))}
      />
    </div>
  );
}

interface LineComparisonChartProps {
  title: string;
  description: string;
  settings: SettingsInput;
  data: Array<{ year: string; actual: number; ideal: number; inflation: number }>;
}

function LineComparisonChart({ title, description, settings, data }: LineComparisonChartProps) {
  return (
    <div className="surface section-card">
      <header>
        <div>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
        </div>
      </header>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                const numericValue = value == null ? 0 : Number(value as number | string);
                const label = name === 'actual' ? 'Фактическое' : 'Идеальное';
                return [valueFormatter(numericValue, settings), label];
              }}
              labelFormatter={(label, payload) => {
                const firstPoint = Array.isArray(payload) ? payload[0] : undefined;
                const inflation = (firstPoint?.payload as { inflation?: number } | undefined)?.inflation;
                return inflation === undefined ? `Год: ${label}` : `Год: ${label} · инфляция: ${formatPercent(inflation)}`;
              }}
            />
            <Legend formatter={(value) => (value === 'actual' ? 'Фактическое' : 'Идеальное')} />
            <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="ideal" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
