import { BaseEntityInput, CalculationInput, InflationRecord } from '@/lib/types';

function validateEntity(
  entityName: string,
  entity: BaseEntityInput,
  baseYear: number,
  currentYear: number,
  errors: string[],
) {
  if (entity.base < 0) {
    errors.push(`${entityName}: стартовое значение не может быть отрицательным.`);
  }

  if (entity.current < 0) {
    errors.push(`${entityName}: текущее значение не может быть отрицательным.`);
  }

  const years = new Set<number>();

  for (const point of entity.points) {
    if (!Number.isInteger(point.year)) {
      errors.push(`${entityName}: год в промежуточной точке должен быть целым числом.`);
      continue;
    }

    if (point.year < baseYear || point.year > currentYear) {
      errors.push(`${entityName}: год ${point.year} выходит за пределы расчётного периода.`);
    }

    if (point.value < 0) {
      errors.push(`${entityName}: значение в промежуточной точке не может быть отрицательным.`);
    }

    if (years.has(point.year)) {
      errors.push(`${entityName}: обнаружен дубликат года ${point.year} в промежуточных точках.`);
    }

    years.add(point.year);
  }
}

export function validateInflationData(
  inflationData: InflationRecord[],
  baseYear: number,
  currentYear: number,
): string[] {
  const errors: string[] = [];
  const years = new Set<number>();

  for (const row of inflationData) {
    if (!Number.isInteger(row.year)) {
      errors.push('Инфляционный файл содержит нецелый год.');
      continue;
    }

    if (years.has(row.year)) {
      errors.push(`В инфляционных данных найден дубликат года ${row.year}.`);
    }

    years.add(row.year);

    if (!Number.isFinite(row.inflation_percent)) {
      errors.push(`Для ${row.year} указано некорректное значение инфляции.`);
    }
  }

  for (let year = baseYear + 1; year <= currentYear; year += 1) {
    if (!years.has(year)) {
      errors.push(`Инфляционные данные не покрывают ${year} год.`);
    }
  }

  return errors;
}

export function validateCalculationInput(
  input: CalculationInput,
  inflationData: InflationRecord[],
): string[] {
  const errors: string[] = [];
  const { settings, income, savings, assets } = input;

  if (settings.baseYear > settings.currentYear) {
    errors.push('Базовый год не может быть больше текущего года.');
  }

  if (!settings.country && settings.inflationSource === 'builtin') {
    errors.push('Выберите страну для встроенного набора инфляции.');
  }

  if (settings.displayMode === 'currency' && !settings.currency.trim()) {
    errors.push('Укажите код валюты, если включён валютный режим.');
  }

  if (settings.displayMode === 'currency' && settings.ueRate <= 0) {
    errors.push('Курс у.е. к валюте должен быть больше нуля.');
  }

  if (!['monthly', 'yearly'].includes(income.valueType)) {
    errors.push('Тип дохода должен быть monthly или yearly.');
  }

  if (settings.inflationSource === 'upload' && inflationData.length === 0) {
    errors.push('Выбран пользовательский источник инфляции, но файл ещё не загружен.');
  }

  validateEntity('Доход', income, settings.baseYear, settings.currentYear, errors);
  validateEntity('Накопления', savings, settings.baseYear, settings.currentYear, errors);
  validateEntity('Активы', assets, settings.baseYear, settings.currentYear, errors);

  errors.push(...validateInflationData(inflationData, settings.baseYear, settings.currentYear));

  return Array.from(new Set(errors));
}
