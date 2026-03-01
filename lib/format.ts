import { SettingsInput } from '@/lib/types';

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}

export function convertToCurrency(value: number, settings: SettingsInput): number {
  return value * (settings.ueRate || 0);
}

export function formatMoney(value: number, settings: SettingsInput): string {
  const uePart = `${formatNumber(value)} у.е.`;

  if (settings.displayMode !== 'currency') {
    return uePart;
  }

  const currencyPart = `${formatNumber(convertToCurrency(value, settings))} ${settings.currency || ''}`.trim();
  return `${uePart} · ${currencyPart}`;
}
