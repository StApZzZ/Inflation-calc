import {
  BaseEntityInput,
  CalculationInput,
  CalculationResults,
  CalculationSummary,
  CalculationYearRow,
  InflationRecord,
  IncomeValueType,
  YearPoint,
} from '@/lib/types';

function round(value: number): number {
  return Number(value.toFixed(6));
}

function buildInflationMap(data: InflationRecord[]): Map<number, number> {
  return new Map<number, number>(data.map((row) => [row.year, row.inflation_percent]));
}

function getSortedAnchors(
  entity: BaseEntityInput,
  baseYear: number,
  currentYear: number,
): YearPoint[] {
  if (baseYear === currentYear) {
    return [{ year: baseYear, value: entity.current }];
  }

  const anchors = [
    { year: baseYear, value: entity.base },
    ...entity.points.filter((point) => point.year !== baseYear && point.year !== currentYear),
    { year: currentYear, value: entity.current },
  ];

  return anchors.sort((left, right) => left.year - right.year);
}

export function buildActualSeries(
  entity: BaseEntityInput,
  baseYear: number,
  currentYear: number,
): Record<number, number> {
  const anchors = getSortedAnchors(entity, baseYear, currentYear);
  const series: Record<number, number> = {};

  if (anchors.length === 1) {
    series[baseYear] = round(anchors[0].value);
    return series;
  }

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index];
    const end = anchors[index + 1];
    const span = end.year - start.year;

    for (let year = start.year; year <= end.year; year += 1) {
      if (year < baseYear || year > currentYear) {
        continue;
      }

      if (year === start.year) {
        series[year] = round(start.value);
        continue;
      }

      if (entity.linearGrowth) {
        const progress = (year - start.year) / span;
        series[year] = round(start.value + (end.value - start.value) * progress);
      } else {
        series[year] = year === end.year ? round(end.value) : round(start.value);
      }
    }
  }

  if (series[currentYear] === undefined) {
    series[currentYear] = round(entity.current);
  }

  return series;
}

export function buildIdealSeries(
  baseValue: number,
  inflationMap: Map<number, number>,
  baseYear: number,
  currentYear: number,
): Record<number, number> {
  const series: Record<number, number> = { [baseYear]: round(baseValue) };

  for (let year = baseYear + 1; year <= currentYear; year += 1) {
    const inflation = inflationMap.get(year) ?? 0;
    series[year] = round(series[year - 1] * (1 + inflation / 100));
  }

  return series;
}

function toYearTotal(value: number, valueType: IncomeValueType): number {
  return valueType === 'monthly' ? value * 12 : value;
}

function safePercentDelta(actual: number, ideal: number): number {
  if (ideal === 0) {
    return actual === 0 ? 0 : 100;
  }

  return ((actual / ideal) - 1) * 100;
}

function buildSummary(rows: CalculationYearRow[]): CalculationSummary {
  const lastRow = rows[rows.length - 1];

  const income_total_actual = round(rows.reduce((sum, row) => sum + row.income_actual_year_total, 0));
  const income_total_ideal = round(rows.reduce((sum, row) => sum + row.income_ideal_year_total, 0));

  return {
    income_total_actual,
    income_total_ideal,
    income_total_delta: round(income_total_actual - income_total_ideal),
    income_current_actual: lastRow.income_actual,
    income_current_ideal: lastRow.income_ideal,
    income_current_delta: lastRow.income_delta,
    income_current_delta_percent: lastRow.income_delta_percent,
    savings_current_actual: lastRow.savings_actual,
    savings_current_ideal: lastRow.savings_ideal,
    savings_current_delta: lastRow.savings_delta,
    savings_current_delta_percent: lastRow.savings_delta_percent,
    assets_current_actual: lastRow.assets_actual,
    assets_current_ideal: lastRow.assets_ideal,
    assets_current_delta: lastRow.assets_delta,
    assets_current_delta_percent: lastRow.assets_delta_percent,
  };
}

export function calculateResults(
  input: CalculationInput,
  inflationData: InflationRecord[],
): CalculationResults {
  const { settings, income, savings, assets } = input;
  const inflationMap = buildInflationMap(inflationData);

  const incomeActual = buildActualSeries(income, settings.baseYear, settings.currentYear);
  const incomeIdeal = buildIdealSeries(income.base, inflationMap, settings.baseYear, settings.currentYear);

  const savingsActual = buildActualSeries(savings, settings.baseYear, settings.currentYear);
  const savingsIdeal = buildIdealSeries(savings.base, inflationMap, settings.baseYear, settings.currentYear);

  const assetsActual = buildActualSeries(assets, settings.baseYear, settings.currentYear);
  const assetsIdeal = buildIdealSeries(assets.base, inflationMap, settings.baseYear, settings.currentYear);

  const years: CalculationYearRow[] = [];

  for (let year = settings.baseYear; year <= settings.currentYear; year += 1) {
    const incomeActualValue = incomeActual[year] ?? income.current;
    const incomeIdealValue = incomeIdeal[year] ?? income.base;
    const savingsActualValue = savingsActual[year] ?? savings.current;
    const savingsIdealValue = savingsIdeal[year] ?? savings.base;
    const assetsActualValue = assetsActual[year] ?? assets.current;
    const assetsIdealValue = assetsIdeal[year] ?? assets.base;

    years.push({
      year,
      inflation_percent: year === settings.baseYear ? 0 : round(inflationMap.get(year) ?? 0),
      income_actual: round(incomeActualValue),
      income_ideal: round(incomeIdealValue),
      income_delta: round(incomeActualValue - incomeIdealValue),
      income_delta_percent: round(safePercentDelta(incomeActualValue, incomeIdealValue)),
      income_value_type: income.valueType,
      income_actual_year_total: round(toYearTotal(incomeActualValue, income.valueType)),
      income_ideal_year_total: round(toYearTotal(incomeIdealValue, income.valueType)),
      savings_actual: round(savingsActualValue),
      savings_ideal: round(savingsIdealValue),
      savings_delta: round(savingsActualValue - savingsIdealValue),
      savings_delta_percent: round(safePercentDelta(savingsActualValue, savingsIdealValue)),
      assets_actual: round(assetsActualValue),
      assets_ideal: round(assetsIdealValue),
      assets_delta: round(assetsActualValue - assetsIdealValue),
      assets_delta_percent: round(safePercentDelta(assetsActualValue, assetsIdealValue)),
    });
  }

  return {
    years,
    summary: buildSummary(years),
  };
}
