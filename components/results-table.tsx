import { CalculationResults, SettingsInput } from '@/lib/types';
import { formatMoney, formatPercent } from '@/lib/format';

interface ResultsTableProps {
  results: CalculationResults;
  settings: SettingsInput;
}

function ValueBlock({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div className="value-block">
      <span>{primary}</span>
      {secondary ? <small>{secondary}</small> : null}
    </div>
  );
}

function renderValue(value: number, settings: SettingsInput) {
  if (settings.displayMode !== 'currency') {
    return <ValueBlock primary={formatMoney(value, settings)} />;
  }

  const [primary, secondary] = formatMoney(value, settings).split(' · ');
  return <ValueBlock primary={primary} secondary={secondary} />;
}

export function ResultsTable({ results, settings }: ResultsTableProps) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Год</th>
            <th>Инфляция</th>
            <th>Доход факт</th>
            <th>Доход идеал</th>
            <th>Дельта дохода</th>
            <th>Дельта дохода %</th>
            <th>Доход за год факт</th>
            <th>Доход за год идеал</th>
            <th>Накопления факт</th>
            <th>Накопления идеал</th>
            <th>Дельта накоплений</th>
            <th>Дельта накоплений %</th>
            <th>Активы факт</th>
            <th>Активы идеал</th>
            <th>Дельта активов</th>
            <th>Дельта активов %</th>
          </tr>
        </thead>
        <tbody>
          {results.years.map((row) => (
            <tr key={row.year}>
              <td>{row.year}</td>
              <td>{formatPercent(row.inflation_percent)}</td>
              <td>{renderValue(row.income_actual, settings)}</td>
              <td>{renderValue(row.income_ideal, settings)}</td>
              <td>{renderValue(row.income_delta, settings)}</td>
              <td>{formatPercent(row.income_delta_percent)}</td>
              <td>{renderValue(row.income_actual_year_total, settings)}</td>
              <td>{renderValue(row.income_ideal_year_total, settings)}</td>
              <td>{renderValue(row.savings_actual, settings)}</td>
              <td>{renderValue(row.savings_ideal, settings)}</td>
              <td>{renderValue(row.savings_delta, settings)}</td>
              <td>{formatPercent(row.savings_delta_percent)}</td>
              <td>{renderValue(row.assets_actual, settings)}</td>
              <td>{renderValue(row.assets_ideal, settings)}</td>
              <td>{renderValue(row.assets_delta, settings)}</td>
              <td>{formatPercent(row.assets_delta_percent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
