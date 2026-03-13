'use client';

import { Market } from '@/types';

interface FiltersProps {
  years: number[];
  months: number[];
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedMarket: Market;
  onYearChange: (year: number | null) => void;
  onMonthChange: (month: number | null) => void;
  onMarketChange: (market: Market) => void;
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Leden', 2: 'Únor', 3: 'Březen', 4: 'Duben',
  5: 'Květen', 6: 'Červen', 7: 'Červenec', 8: 'Srpen',
  9: 'Září', 10: 'Říjen', 11: 'Listopad', 12: 'Prosinec',
};

export function Filters({
  years, months, selectedYear, selectedMonth, selectedMarket,
  onYearChange, onMonthChange, onMarketChange,
}: FiltersProps) {
  const selectClass = "px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]";

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rok</label>
        <select value={selectedYear ?? ''} onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : null)} className={selectClass}>
          <option value="">Všechny roky</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Měsíc</label>
        <select value={selectedMonth ?? ''} onChange={(e) => onMonthChange(e.target.value ? Number(e.target.value) : null)} className={selectClass}>
          <option value="">Všechny měsíce</option>
          {months.map((m) => <option key={m} value={m}>{MONTH_NAMES[m]}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trh</label>
        <div className="flex rounded-lg border border-blue-200 overflow-hidden">
          {(['ALL', 'CZ', 'SK'] as Market[]).map((market) => (
            <button
              key={market}
              onClick={() => onMarketChange(market)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedMarket === market
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              {market === 'ALL' ? 'Vše' : market === 'CZ' ? '🇨🇿' : '🇸🇰'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
