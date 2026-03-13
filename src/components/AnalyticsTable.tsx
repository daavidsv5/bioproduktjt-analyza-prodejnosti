'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ProductSummary, SortField, SortDirection } from '@/types';

interface AnalyticsTableProps {
  data: ProductSummary[];
  currency: string;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDirection }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
    : <ChevronDown className="w-3.5 h-3.5 text-violet-500" />;
}

export function AnalyticsTable({ data, currency }: AnalyticsTableProps) {
  const [sortField, setSortField] = useState<SortField>('total_quantity');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * dir;
    return ((aVal as number) - (bVal as number)) * dir;
  });

  const decimals = currency === 'EUR' ? 2 : 0;
  const fmt = (n: number) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

  const headers: { label: string; field: SortField }[] = [
    { label: 'Název produktu', field: 'product_name' },
    { label: 'Počet kusů', field: 'total_quantity' },
    { label: `Bez DPH (${currency})`, field: 'total_price_no_vat' },
    { label: `S DPH (${currency})`, field: 'total_price_vat' },
  ];

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-base font-medium">Žádná data k zobrazení</p>
        <p className="text-sm mt-1">Upravte filtry</p>
      </div>
    );
  }

  const totalQty = sorted.reduce((s, r) => s + r.total_quantity, 0);
  const totalNoVat = sorted.reduce((s, r) => s + r.total_price_no_vat, 0);
  const totalVat = sorted.reduce((s, r) => s + r.total_price_vat, 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
            {headers.map(({ label, field }) => (
              <th
                key={field}
                onClick={() => handleSort(field)}
                className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-violet-600 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  {label}
                  <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-violet-50/40 transition-colors group">
              <td className="px-5 py-3.5 font-medium text-gray-800 group-hover:text-violet-700 transition-colors">
                {row.product_name}
              </td>
              <td className="px-5 py-3.5 tabular-nums">
                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                  {row.total_quantity.toLocaleString('cs-CZ')}
                </span>
              </td>
              <td className="px-5 py-3.5 tabular-nums text-gray-500 font-medium">
                {fmt(row.total_price_no_vat)}
              </td>
              <td className="px-5 py-3.5 tabular-nums">
                <span className="font-bold text-gray-900">
                  {fmt(row.total_price_vat)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gradient-to-r from-violet-50 to-indigo-50 border-t-2 border-violet-100">
            <td className="px-5 py-4 font-bold text-violet-700 text-sm">
              Celkem <span className="font-normal text-violet-400">({sorted.length} produktů)</span>
            </td>
            <td className="px-5 py-4 tabular-nums">
              <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold text-xs">
                {totalQty.toLocaleString('cs-CZ')}
              </span>
            </td>
            <td className="px-5 py-4 text-gray-600 tabular-nums font-semibold">
              {fmt(totalNoVat)}
            </td>
            <td className="px-5 py-4 tabular-nums">
              <span className="font-extrabold text-violet-700 text-base">
                {fmt(totalVat)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
