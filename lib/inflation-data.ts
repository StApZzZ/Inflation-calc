import { CountryOption, InflationRecord } from '@/lib/types';

const years = [
  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
  2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
  2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
] as const;

function makeSeries(values: number[]): InflationRecord[] {
  return years.map((year, index) => ({ year, inflation_percent: values[index] ?? 0 }));
}

export const BUILTIN_COUNTRIES: CountryOption[] = [
  { code: 'RU', name: 'Россия' },
  { code: 'US', name: 'США' },
  { code: 'EU', name: 'Еврозона / ЕС' },
  { code: 'KZ', name: 'Казахстан' },
  { code: 'BY', name: 'Беларусь' },
];

export const BUILTIN_INFLATION: Record<string, InflationRecord[]> = {
  RU: makeSeries([
    20.2, 18.6, 15.1, 12.0, 11.7, 10.9, 9.0, 11.9, 13.3, 8.8,
    8.8, 6.1, 6.6, 6.5, 11.4, 12.9, 5.4, 2.5, 4.3, 3.0,
    4.9, 8.4, 13.8, 7.4, 6.1, 5.8, 5.2, 4.9, 4.6, 4.4, 4.2,
  ]),
  US: makeSeries([
    3.4, 2.8, 1.6, 2.3, 2.7, 3.4, 3.2, 2.8, 3.8, -0.4,
    1.6, 3.2, 2.1, 1.5, 1.6, 0.1, 1.3, 2.1, 2.4, 1.8,
    1.2, 4.7, 8.0, 4.1, 3.0, 2.6, 2.4, 2.3, 2.2, 2.2, 2.1,
  ]),
  EU: makeSeries([
    2.1, 2.4, 2.1, 2.0, 2.2, 2.2, 2.1, 2.3, 3.3, 0.3,
    1.6, 2.7, 2.5, 1.3, 0.4, 0.0, 0.2, 1.5, 1.8, 1.2,
    0.3, 2.6, 8.4, 5.4, 2.9, 2.5, 2.2, 2.1, 2.0, 2.0, 2.0,
  ]),
  KZ: makeSeries([
    13.2, 8.4, 5.9, 6.5, 6.9, 7.6, 8.6, 10.8, 17.0, 7.3,
    7.1, 8.3, 5.1, 5.8, 6.7, 13.6, 8.5, 7.1, 6.0, 5.3,
    7.5, 8.4, 20.3, 14.5, 9.4, 7.2, 6.1, 5.8, 5.5, 5.3, 5.1,
  ]),
  BY: makeSeries([
    108.7, 61.1, 42.6, 28.4, 18.1, 10.3, 7.0, 8.4, 14.8, 13.0,
    7.7, 53.2, 21.8, 16.5, 16.2, 12.0, 10.6, 6.0, 4.9, 5.6,
    7.4, 9.9, 15.2, 5.8, 5.2, 4.8, 4.5, 4.3, 4.1, 4.0, 3.9,
  ]),
};

export function getBuiltinInflation(countryCode: string): InflationRecord[] {
  return BUILTIN_INFLATION[countryCode] ?? [];
}
