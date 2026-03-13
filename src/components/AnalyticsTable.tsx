'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ProductSummary, SortField, SortDirection } from '@/types';

interface AnalyticsTableProps {
  data: ProductSummary[];
  currency: string;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDirection }) {
  if (sortField !== field) return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-4 h-4 text-blue-600" />
    : <ChevronDown className="w-4 h-4 text-blue-600" />;
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

  const fmt = (n: number) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const headers: { label: string; field: SortField }[] = [
    { label: 'Název produktu', field: 'product_name' },
    { label: 'Počet kusů', field: 'total_quantity' },
    { label: `Bez DPH (${currency})`, field: 'total_price_no_vat' },
    { label: `S DPH (${currency})`, field: 'total_price_vat' },
  ];

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Žádná data k zobrazení</p>
        <p className="text-sm mt-1">Upravte filtry</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-blue-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-blue-50 border-b border-blue-100">
            {headers.map(({ label, field }) => (
              <th
                key={field}
                onClick={() => handleSort(field)}
                className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors select-none"
              >
                <div className="flex items-center gap-1">
                  {label}
                  <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-blue-50/50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{row.product_name}</td>
              <td className="px-4 py-3 tabular-nums">
                <span className="font-semibold text-gray-800">{row.total_quantity.toLocaleString('cs-CZ')}</span>
                <span className="text-gray-400 ml-1">ks</span>
              </td>
              <td className="px-4 py-3 text-gray-500 tabular-nums">{fmt(row.total_price_no_vat)}</td>
              <td className="px-4 py-3 text-gray-800 tabular-nums font-medium">{fmt(row.total_price_vat)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 border-t-2 border-blue-100 font-semibold">
            <td className="px-4 py-3 text-blue-700">Celkem ({sorted.length} produktů)</td>
            <td className="px-4 py-3 text-gray-800 tabular-nums">
              {sorted.reduce((s, r) => s + r.total_quantity, 0).toLocaleString('cs-CZ')} ks
            </td>
            <td className="px-4 py-3 text-gray-700 tabular-nums">
              {fmt(sorted.reduce((s, r) => s + r.total_price_no_vat, 0))}
            </td>
            <td className="px-4 py-3 text-gray-900 tabular-nums">
              {fmt(sorted.reduce((s, r) => s + r.total_price_vat, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
