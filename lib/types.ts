export type DisplayMode = 'anonymous' | 'currency';
export type InflationSource = 'builtin' | 'upload';
export type IncomeValueType = 'monthly' | 'yearly';

export interface InflationRecord {
  year: number;
  inflation_percent: number;
}

export interface YearPoint {
  year: number;
  value: number;
}

export interface BaseEntityInput {
  base: number;
  current: number;
  linearGrowth: boolean;
  points: YearPoint[];
}

export interface IncomeInput extends BaseEntityInput {
  valueType: IncomeValueType;
}

export interface SettingsInput {
  baseYear: number;
  currentYear: number;
  country: string;
  inflationSource: InflationSource;
  displayMode: DisplayMode;
  currency: string;
  ueRate: number;
}

export interface CalculationInput {
  anonymous_user_id: string;
  settings: SettingsInput;
  income: IncomeInput;
  savings: BaseEntityInput;
  assets: BaseEntityInput;
}

export interface CalculationYearRow {
  year: number;
  inflation_percent: number;
  income_actual: number;
  income_ideal: number;
  income_delta: number;
  income_delta_percent: number;
  income_value_type: IncomeValueType;
  income_actual_year_total: number;
  income_ideal_year_total: number;
  savings_actual: number;
  savings_ideal: number;
  savings_delta: number;
  savings_delta_percent: number;
  assets_actual: number;
  assets_ideal: number;
  assets_delta: number;
  assets_delta_percent: number;
}

export interface SummaryMetric {
  current_actual: number;
  current_ideal: number;
  current_delta: number;
  current_delta_percent: number;
}

export interface CalculationSummary {
  income_total_actual: number;
  income_total_ideal: number;
  income_total_delta: number;
  income_current_actual: number;
  income_current_ideal: number;
  income_current_delta: number;
  income_current_delta_percent: number;
  savings_current_actual: number;
  savings_current_ideal: number;
  savings_current_delta: number;
  savings_current_delta_percent: number;
  assets_current_actual: number;
  assets_current_ideal: number;
  assets_current_delta: number;
  assets_current_delta_percent: number;
}

export interface CalculationResults {
  years: CalculationYearRow[];
  summary: CalculationSummary;
}

export interface CountryOption {
  code: string;
  name: string;
}
