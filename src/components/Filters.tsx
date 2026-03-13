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
  const selectClass = "px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent min-w-[130px] cursor-pointer hover:border-violet-300 transition-colors";

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Rok</label>
        <select value={selectedYear ?? ''} onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : null)} className={selectClass}>
          <option value="">Všechny roky</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Měsíc</label>
        <select value={selectedMonth ?? ''} onChange={(e) => onMonthChange(e.target.value ? Number(e.target.value) : null)} className={selectClass}>
          <option value="">Všechny měsíce</option>
          {months.map((m) => <option key={m} value={m}>{MONTH_NAMES[m]}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Trh</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {(['ALL', 'CZ', 'SK'] as Market[]).map((market) => (
            <button
              key={market}
              onClick={() => onMarketChange(market)}
              className={`px-4 py-2 text-sm font-semibold transition-all ${
                selectedMarket === market
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-inner'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {market === 'ALL' ? 'Vše' : market === 'CZ' ? '🇨🇿 CZ' : '🇸🇰 SK'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
