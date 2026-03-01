'use client';

import { YearPoint } from '@/lib/types';

interface YearPointsEditorProps {
  title: string;
  points: YearPoint[];
  onChange: (points: YearPoint[]) => void;
}

export function YearPointsEditor({ title, points, onChange }: YearPointsEditorProps) {
  function updatePoint(index: number, field: keyof YearPoint, rawValue: string) {
    const next = [...points];
    const numericValue = rawValue === '' ? 0 : Number(rawValue);
    next[index] = {
      ...next[index],
      [field]: numericValue,
    };
    onChange(next);
  }

  function addPoint() {
    onChange([...points, { year: new Date().getFullYear(), value: 0 }]);
  }

  function removePoint(index: number) {
    onChange(points.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="stack">
      <div className="inline-actions">
        <strong>{title}</strong>
        <button type="button" className="small-button" onClick={addPoint}>
          Добавить точку
        </button>
      </div>

      {points.length === 0 ? (
        <div className="helper">Промежуточные точки не заданы. Используются только стартовое и текущее значения.</div>
      ) : (
        <div className="table-scroll">
          <table className="points-table">
            <thead>
              <tr>
                <th>Год</th>
                <th>Значение</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={`${point.year}-${index}`}>
                  <td>
                    <input
                      type="number"
                      value={point.year}
                      onChange={(event) => updatePoint(index, 'year', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={point.value}
                      onChange={(event) => updatePoint(index, 'value', event.target.value)}
                    />
                  </td>
                  <td>
                    <button type="button" className="small-button" onClick={() => removePoint(index)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
