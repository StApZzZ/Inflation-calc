'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { BUILTIN_COUNTRIES, getBuiltinInflation } from '@/lib/inflation-data';
import { calculateResults } from '@/lib/calculations';
import { ensureAnonymousUserId } from '@/lib/user-id';
import { formatMoney, formatPercent } from '@/lib/format';
import { validateCalculationInput } from '@/lib/validation';
import {
  BaseEntityInput,
  CalculationInput,
  CalculationResults,
  DisplayMode,
  IncomeInput,
  InflationRecord,
  SettingsInput,
} from '@/lib/types';
import { SectionCard } from '@/components/section-card';
import { YearPointsEditor } from '@/components/year-points-editor';
import { MetricCard } from '@/components/metric-card';
import { ChartsPanel } from '@/components/charts-panel';
import { ResultsTable } from '@/components/results-table';

const FORM_STORAGE_KEY = 'inflation-income-form';

const THEME_STORAGE_KEY = 'inflation-income-theme';

type Theme = 'light' | 'dark';

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

function createDefaultInput(): CalculationInput {
  const currentYear = new Date().getFullYear();

  return {
    anonymous_user_id: '',
    settings: {
      baseYear: currentYear - 3,
      currentYear,
      country: 'RU',
      inflationSource: 'builtin',
      displayMode: 'anonymous',
      currency: 'RUB',
      ueRate: 1000,
    },
    income: {
      base: 100,
      current: 135,
      valueType: 'monthly',
      linearGrowth: true,
      points: [],
    },
    savings: {
      base: 50,
      current: 82,
      linearGrowth: false,
      points: [{ year: currentYear - 1, value: 60 }],
    },
    assets: {
      base: 200,
      current: 290,
      linearGrowth: true,
      points: [{ year: currentYear - 2, value: 230 }],
    },
  };
}

function parseCsvInflation(text: string): InflationRecord[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error('CSV-файл пуст или не содержит данных.');
  }

  const headerParts = rows[0].split(/[;,]/).map((part) => part.trim().toLowerCase());
  const yearIndex = headerParts.indexOf('year');
  const inflationIndex = headerParts.indexOf('inflation_percent');

  if (yearIndex === -1 || inflationIndex === -1) {
    throw new Error('CSV должен содержать колонки year и inflation_percent.');
  }

  return rows.slice(1).map((row) => {
    const parts = row.split(/[;,]/).map((part) => part.trim());
    return {
      year: Number(parts[yearIndex]),
      inflation_percent: Number(parts[inflationIndex]),
    };
  });
}

function parseInflationFile(text: string, fileName: string): InflationRecord[] {
  if (fileName.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      throw new Error('JSON должен содержать массив объектов.');
    }

    return parsed.map((row) => ({
      year: Number(row.year),
      inflation_percent: Number(row.inflation_percent),
    }));
  }

  return parseCsvInflation(text);
}

function cloneEntity(entity: BaseEntityInput): BaseEntityInput {
  return {
    ...entity,
    points: entity.points.map((point) => ({ ...point })),
  };
}

function cloneIncome(entity: IncomeInput): IncomeInput {
  return {
    ...cloneEntity(entity),
    valueType: entity.valueType,
  };
}

function normalizeLoadedInput(input: CalculationInput): CalculationInput {
  return {
    anonymous_user_id: input.anonymous_user_id || '',
    settings: { ...input.settings },
    income: cloneIncome(input.income),
    savings: cloneEntity(input.savings),
    assets: cloneEntity(input.assets),
  };
}

function DeltaTone({ value }: { value: number }) {
  const className = value > 0 ? 'metric-positive' : value < 0 ? 'metric-negative' : '';
  return <span className={className}>{formatPercent(value)}</span>;
}

function EntityFields({
  title,
  entity,
  onChange,
  withValueType = false,
}: {
  title: string;
  entity: BaseEntityInput | IncomeInput;
  onChange: (next: BaseEntityInput | IncomeInput) => void;
  withValueType?: boolean;
}) {
  function updateNumber(field: 'base' | 'current', rawValue: string) {
    onChange({ ...entity, [field]: rawValue === '' ? 0 : Number(rawValue) });
  }

  function updateLinearGrowth(linearGrowth: boolean) {
    onChange({ ...entity, linearGrowth });
  }

  function updatePoints(points: BaseEntityInput['points']) {
    onChange({ ...entity, points });
  }

  function updateValueType(valueType: 'monthly' | 'yearly') {
    if (!withValueType) {
      return;
    }

    onChange({ ...(entity as IncomeInput), valueType });
  }

  return (
    <SectionCard
      title={title}
      description={
        withValueType
          ? 'Стартовое и текущее значение дохода, тип дохода и промежуточные точки.'
          : 'Стартовое и текущее значение, логика изменения и промежуточные точки.'
      }
    >
      <div className="stack">
        <div className="field-grid">
          <div className="field">
            <label htmlFor={`${title}-base`}>Стартовое значение</label>
            <input
              id={`${title}-base`}
              type="number"
              min="0"
              step="0.01"
              value={entity.base}
              onChange={(event) => updateNumber('base', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${title}-current`}>Текущее значение</label>
            <input
              id={`${title}-current`}
              type="number"
              min="0"
              step="0.01"
              value={entity.current}
              onChange={(event) => updateNumber('current', event.target.value)}
            />
          </div>

          {withValueType ? (
            <div className="field">
              <label>Тип дохода</label>
              <div className="radio-group">
                <button
                  type="button"
                  className={`radio-chip ${'valueType' in entity && entity.valueType === 'monthly' ? 'active' : ''}`}
                  onClick={() => updateValueType('monthly')}
                >
                  Доход указан как месячный
                </button>
                <button
                  type="button"
                  className={`radio-chip ${'valueType' in entity && entity.valueType === 'yearly' ? 'active' : ''}`}
                  onClick={() => updateValueType('yearly')}
                >
                  Доход указан как годовой
                </button>
              </div>
            </div>
          ) : null}

          <div className="field">
            <label>Логика между точками</label>
            <div className="radio-group">
              <button
                type="button"
                className={`radio-chip ${entity.linearGrowth ? 'active' : ''}`}
                onClick={() => updateLinearGrowth(true)}
              >
                Линейный рост
              </button>
              <button
                type="button"
                className={`radio-chip ${!entity.linearGrowth ? 'active' : ''}`}
                onClick={() => updateLinearGrowth(false)}
              >
                Ступенчатый рост
              </button>
            </div>
          </div>
        </div>

        <YearPointsEditor
          title="Промежуточные точки"
          points={entity.points}
          onChange={updatePoints}
        />
      </div>
    </SectionCard>
  );
}

export function CalculatorApp() {
  const [input, setInput] = useState<CalculationInput>(createDefaultInput);
  const [uploadedInflation, setUploadedInflation] = useState<InflationRecord[]>([]);
  const [fileStatus, setFileStatus] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const userId = ensureAnonymousUserId();
    const saved = window.localStorage.getItem(FORM_STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { input: CalculationInput; uploadedInflation: InflationRecord[] };
        const normalized = normalizeLoadedInput(parsed.input);
        normalized.anonymous_user_id = userId;
        setInput(normalized);
        setUploadedInflation(parsed.uploadedInflation ?? []);
      } catch {
        setInput((current) => ({ ...current, anonymous_user_id: userId }));
      }
    } else {
      setInput((current) => ({ ...current, anonymous_user_id: userId }));
    }

    setHasLoadedLocalState(true);
  }, []);

  useEffect(() => {
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalState) {
      return;
    }

    window.localStorage.setItem(
      FORM_STORAGE_KEY,
      JSON.stringify({ input, uploadedInflation }),
    );
  }, [hasLoadedLocalState, input, uploadedInflation]);

  const effectiveInflation = useMemo(() => {
    if (input.settings.inflationSource === 'upload') {
      return uploadedInflation;
    }

    return getBuiltinInflation(input.settings.country);
  }, [input.settings.country, input.settings.inflationSource, uploadedInflation]);

  const validationErrors = useMemo(
    () => validateCalculationInput(input, effectiveInflation),
    [effectiveInflation, input],
  );

  const results = useMemo<CalculationResults | null>(() => {
    if (validationErrors.length > 0) {
      return null;
    }

    return calculateResults(input, effectiveInflation);
  }, [effectiveInflation, input, validationErrors]);

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light';
      applyTheme(next);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }

      return next;
    });
  }

  function updateSettings<K extends keyof SettingsInput>(field: K, value: SettingsInput[K]) {
    setInput((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: value,
      },
    }));
    setSaveMessage('');
  }

  function updateIncome(next: BaseEntityInput | IncomeInput) {
    setInput((current) => ({ ...current, income: next as IncomeInput }));
    setSaveMessage('');
  }

  function updateEntity(name: 'savings' | 'assets', next: BaseEntityInput | IncomeInput) {
    setInput((current) => ({ ...current, [name]: next as BaseEntityInput }));
    setSaveMessage('');
  }

  async function handleInflationFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseInflationFile(text, file.name);
      setUploadedInflation(parsed);
      updateSettings('inflationSource', 'upload');
      setFileStatus(`Загружено ${parsed.length} строк из файла ${file.name}.`);
    } catch (error) {
      setUploadedInflation([]);
      setFileStatus(error instanceof Error ? error.message : 'Не удалось прочитать файл инфляции.');
    }
  }

  async function saveCalculation() {
    if (!results || validationErrors.length > 0) {
      setSaveMessage('Сохранение недоступно, пока не исправлены ошибки в форме.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/calculation/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          inflation_data: effectiveInflation,
          results,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Сохранение завершилось с ошибкой.');
      }

      setSaveMessage(`Расчёт сохранён. Файл: ${payload.fileId}`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Не удалось сохранить расчёт.');
    } finally {
      setIsSaving(false);
    }
  }

  const summary = results?.summary;
  const currentSetName = BUILTIN_COUNTRIES.find((country) => country.code === input.settings.country)?.name;

  return (
    <main className="page-shell">
      <div className="container stack">
        <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="small-button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
        </div>
        <section className="hero">
          <div className="hero-card">
            <h1>Индекс дохода, накоплений и активов с учётом инфляции</h1>
            <p>
              Сервис сравнивает фактические значения с идеальной инфляционно-скорректированной траекторией,
              считает суммарный доход за период, показывает дельты по годам и умеет сохранять расчёты в JSON.
            </p>
            <div className="badges">
              <span className="badge">Анонимный UUID без привязки к IP</span>
              <span className="badge">CSV / JSON инфляция</span>
              <span className="badge">Доход, накопления, активы</span>
              <span className="badge">Desktop + mobile</span>
            </div>
          </div>

          <aside className="hero-card hero-side">
            <h2>Сводка текущего расчёта</h2>
            <div className="small-text">
              Пользователь: <strong>{input.anonymous_user_id || 'создаётся...'}</strong>
            </div>
            <div className="small-text">
              Источник инфляции:{' '}
              <strong>
                {input.settings.inflationSource === 'builtin'
                  ? `встроенный набор (${currentSetName || 'не выбран'})`
                  : 'пользовательский файл'}
              </strong>
            </div>
            <div className="small-text">
              Значений в активном инфляционном наборе: <strong>{effectiveInflation.length}</strong>
            </div>
            <div className="inline-actions">
              <button type="button" className="button" onClick={saveCalculation} disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Сохранить расчёт'}
              </button>
              <a className="ghost-button" href="#results">
                Перейти к итогам
              </a>
            </div>
            {saveMessage ? <div className={`alert ${saveMessage.includes('сохранён') ? 'success' : 'error'}`}>{saveMessage}</div> : null}
          </aside>
        </section>

        <SectionCard title="Общие настройки" description="Параметры периода, источника инфляции и режима отображения.">
          <div className="stack">
            <div className="field-grid">
              <div className="field">
                <label htmlFor="baseYear">Базовый год</label>
                <input
                  id="baseYear"
                  type="number"
                  value={input.settings.baseYear}
                  onChange={(event) => updateSettings('baseYear', Number(event.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="currentYear">Текущий год</label>
                <input
                  id="currentYear"
                  type="number"
                  value={input.settings.currentYear}
                  onChange={(event) => updateSettings('currentYear', Number(event.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="country">Страна / набор инфляции</label>
                <select
                  id="country"
                  value={input.settings.country}
                  onChange={(event) => updateSettings('country', event.target.value)}
                  disabled={input.settings.inflationSource === 'upload'}
                >
                  {BUILTIN_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Источник инфляции</label>
                <div className="radio-group">
                  <button
                    type="button"
                    className={`radio-chip ${input.settings.inflationSource === 'builtin' ? 'active' : ''}`}
                    onClick={() => updateSettings('inflationSource', 'builtin')}
                  >
                    Встроенный
                  </button>
                  <button
                    type="button"
                    className={`radio-chip ${input.settings.inflationSource === 'upload' ? 'active' : ''}`}
                    onClick={() => updateSettings('inflationSource', 'upload')}
                  >
                    Пользовательский файл
                  </button>
                </div>
              </div>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="inflationFile">Загрузка файла инфляции</label>
                <input
                  id="inflationFile"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleInflationFileChange}
                />
                <div className="helper">
                  Поддерживаются CSV и JSON. Для встроенного режима файл не обязателен.
                </div>
                {fileStatus ? <div className="helper">{fileStatus}</div> : null}
              </div>

              <div className="field">
                <label>Режим отображения</label>
                <div className="radio-group">
                  <button
                    type="button"
                    className={`radio-chip ${input.settings.displayMode === 'anonymous' ? 'active' : ''}`}
                    onClick={() => updateSettings('displayMode', 'anonymous' as DisplayMode)}
                  >
                    Только у.е.
                  </button>
                  <button
                    type="button"
                    className={`radio-chip ${input.settings.displayMode === 'currency' ? 'active' : ''}`}
                    onClick={() => updateSettings('displayMode', 'currency' as DisplayMode)}
                  >
                    У.е. + валюта
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="currency">Валюта</label>
                <input
                  id="currency"
                  type="text"
                  placeholder="RUB"
                  value={input.settings.currency}
                  onChange={(event) => updateSettings('currency', event.target.value.toUpperCase())}
                  disabled={input.settings.displayMode !== 'currency'}
                />
              </div>

              <div className="field">
                <label htmlFor="ueRate">Курс у.е. к валюте</label>
                <input
                  id="ueRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={input.settings.ueRate}
                  onChange={(event) => updateSettings('ueRate', Number(event.target.value))}
                  disabled={input.settings.displayMode !== 'currency'}
                />
                <div className="helper">Пример: 1 у.е. = 1000 RUB.</div>
              </div>
            </div>
          </div>
        </SectionCard>

        <EntityFields title="Доход" entity={input.income} onChange={updateIncome} withValueType />
        <EntityFields title="Накопления" entity={input.savings} onChange={(next) => updateEntity('savings', next)} />
        <EntityFields title="Активы" entity={input.assets} onChange={(next) => updateEntity('assets', next)} />

        {validationErrors.length > 0 ? (
          <div className="alert error">
            <strong>Исправьте ошибки, чтобы получить расчёт:</strong>
            <ul>
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {summary && results ? (
          <>
            <section id="results" className="stack">
              <SectionCard title="Итоги" description="Ключевые показатели на текущий год и за весь выбранный период.">
                <div className="summary-grid">
                  <MetricCard
                    label="Текущий фактический доход"
                    value={formatMoney(summary.income_current_actual, input.settings)}
                    meta={`Идеал: ${formatMoney(summary.income_current_ideal, input.settings)}`}
                  />
                  <MetricCard
                    label="Текущая дельта дохода"
                    value={formatMoney(summary.income_current_delta, input.settings)}
                    meta={`Отклонение: ${formatPercent(summary.income_current_delta_percent)}`}
                    tone={summary.income_current_delta > 0 ? 'positive' : summary.income_current_delta < 0 ? 'negative' : 'default'}
                  />
                  <MetricCard
                    label="Суммарный доход за период"
                    value={formatMoney(summary.income_total_actual, input.settings)}
                    meta={`Идеальный суммарный: ${formatMoney(summary.income_total_ideal, input.settings)}`}
                  />
                  <MetricCard
                    label="Суммарная дельта дохода"
                    value={formatMoney(summary.income_total_delta, input.settings)}
                    tone={summary.income_total_delta > 0 ? 'positive' : summary.income_total_delta < 0 ? 'negative' : 'default'}
                    meta={`Тип дохода: ${input.income.valueType === 'monthly' ? 'месячный' : 'годовой'}`}
                  />
                  <MetricCard
                    label="Накопления: текущий факт"
                    value={formatMoney(summary.savings_current_actual, input.settings)}
                    meta={`Идеал: ${formatMoney(summary.savings_current_ideal, input.settings)}`}
                  />
                  <MetricCard
                    label="Накопления: текущая дельта"
                    value={formatMoney(summary.savings_current_delta, input.settings)}
                    meta={`Отклонение: ${formatPercent(summary.savings_current_delta_percent)}`}
                    tone={summary.savings_current_delta > 0 ? 'positive' : summary.savings_current_delta < 0 ? 'negative' : 'default'}
                  />
                  <MetricCard
                    label="Активы: текущий факт"
                    value={formatMoney(summary.assets_current_actual, input.settings)}
                    meta={`Идеал: ${formatMoney(summary.assets_current_ideal, input.settings)}`}
                  />
                  <MetricCard
                    label="Активы: текущая дельта"
                    value={formatMoney(summary.assets_current_delta, input.settings)}
                    meta={`Отклонение: ${formatPercent(summary.assets_current_delta_percent)}`}
                    tone={summary.assets_current_delta > 0 ? 'positive' : summary.assets_current_delta < 0 ? 'negative' : 'default'}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Краткое сравнение" description="Быстрое чтение текущего состояния по трём сущностям.">
                <div className="grid-3">
                  <div className="surface section-card">
                    <h3>Доход</h3>
                    <p className="muted">
                      Факт: <strong>{formatMoney(summary.income_current_actual, input.settings)}</strong>
                    </p>
                    <p className="muted">
                      Идеал: <strong>{formatMoney(summary.income_current_ideal, input.settings)}</strong>
                    </p>
                    <p className="muted">
                      Дельта: <strong>{formatMoney(summary.income_current_delta, input.settings)}</strong> · <DeltaTone value={summary.income_current_delta_percent} />
                    </p>
                  </div>

                  <div className="surface section-card">
                    <h3>Накопления</h3>
                    <p className="muted">
                      Факт: <strong>{formatMoney(summary.savings_current_actual, input.settings)}</strong>
                    </p>
                    <p className="muted">
                      Идеал: <strong>{formatMoney(summary.savings_current_ideal, input.settings)}</strong>
                    </p>
                    <p className="muted">
                      Дельта: <strong>{formatMoney(summary.savings_current_delta, input.settings)}</strong> · <DeltaTone value={summary.savings_current_delta_percent} />
                    </p>
                  </div>

                  <div className="surface section-card">
                    <h3>Активы</h3>
                    <p className="muted">
                      Факт: <strong>{formatMoney(summary.assets_current_actual, input.settings)}</strong>
                    </p>
                    <p className="muted">
                      Идеал: <strong>{formatMoney(summary.assets_current_ideal, input.settings)}</strong>
                    </p>
                    <p className="muted">
                      Дельта: <strong>{formatMoney(summary.assets_current_delta, input.settings)}</strong> · <DeltaTone value={summary.assets_current_delta_percent} />
                    </p>
                  </div>
                </div>
              </SectionCard>

              <ChartsPanel results={results} settings={input.settings} />

              <SectionCard title="Таблица по годам" description="Годовая расшифровка инфляции, фактических и идеальных значений.">
                <ResultsTable results={results} settings={input.settings} />
              </SectionCard>
            </section>
          </>
        ) : null}

        <div className="footer-note">
          Демо-MVP: расчёты выполняются на клиенте без перезагрузки страницы, сохранение расчёта выполняется серверным route handler в JSON.
        </div>
      </div>
    </main>
  );
}
