'use client';

import { useState, useMemo, useEffect } from 'react';
import { Leaf, TrendingUp, Package, ShoppingCart, RefreshCw, Download } from 'lucide-react';
import { SaleRecord, Market, ProductSummary } from '@/types';
import { Filters } from '@/components/Filters';
import { AnalyticsTable } from '@/components/AnalyticsTable';

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-blue-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [rawData, setRawData] = useState<SaleRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market>('ALL');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eurCzk, setEurCzk] = useState<number>(25.0);
  const [rateDate, setRateDate] = useState<string | null>(null);

  const fetchFromSheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, rateRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/exchange-rate'),
      ]);

      if (!salesRes.ok) throw new Error('Chyba při načítání dat');
      const data: SaleRecord[] = await salesRes.json();
      setRawData(data);
      setLastUpdated(new Date());

      if (rateRes.ok) {
        const rateData = await rateRes.json();
        setEurCzk(rateData.EUR_CZK);
        setRateDate(rateData.date ?? null);
      }
    } catch (err) {
      console.error(err);
      setError('Nepodařilo se načíst data z Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFromSheets();
  }, []);

  const { years, months } = useMemo(() => {
    const ys = new Set<number>();
    const ms = new Set<number>();
    rawData.forEach((r) => {
      const d = new Date(r.date);
      if (!isNaN(d.getTime())) {
        ys.add(d.getFullYear());
        ms.add(d.getMonth() + 1);
      }
    });
    return {
      years: Array.from(ys).sort((a, b) => b - a),
      months: Array.from(ms).sort((a, b) => a - b),
    };
  }, [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter((r) => {
      if (r.status.toLowerCase().includes('storno')) return false;
      const d = new Date(r.date);
      if (selectedYear && d.getFullYear() !== selectedYear) return false;
      if (selectedMonth && d.getMonth() + 1 !== selectedMonth) return false;
      if (selectedMarket === 'CZ' && r.currency !== 'CZK') return false;
      if (selectedMarket === 'SK' && r.currency !== 'EUR') return false;
      return true;
    });
  }, [rawData, selectedYear, selectedMonth, selectedMarket]);

  const aggregated = useMemo<ProductSummary[]>(() => {
    const map = new Map<string, ProductSummary>();
    filteredData.forEach((r) => {
      const key = r.product_name;
      const factor = (selectedMarket === 'ALL' && r.currency === 'EUR') ? eurCzk : 1;

      const existing = map.get(key);
      if (existing) {
        existing.total_quantity += r.quantity;
        existing.total_price_no_vat += r.price_no_vat * factor;
        existing.total_price_vat += r.price_vat * factor;
      } else {
        map.set(key, {
          product_name: r.product_name,
          total_quantity: r.quantity,
          total_price_no_vat: r.price_no_vat * factor,
          total_price_vat: r.price_vat * factor,
        });
      }
    });
    return Array.from(map.values());
  }, [filteredData, selectedMarket, eurCzk]);

  const totalQty = useMemo(() => aggregated.reduce((s, r) => s + r.total_quantity, 0), [aggregated]);
  const totalSalesVat = useMemo(() => aggregated.reduce((s, r) => s + r.total_price_vat, 0), [aggregated]);
  const totalSalesNoVat = useMemo(() => aggregated.reduce((s, r) => s + r.total_price_no_vat, 0), [aggregated]);

  const currency = selectedMarket === 'SK' ? 'EUR' : 'CZK';

  const exportCSV = () => {
    const MONTH_NAMES: Record<number, string> = {
      1: 'Leden', 2: 'Únor', 3: 'Březen', 4: 'Duben',
      5: 'Květen', 6: 'Červen', 7: 'Červenec', 8: 'Srpen',
      9: 'Září', 10: 'Říjen', 11: 'Listopad', 12: 'Prosinec',
    };

    const periodLabel = [
      selectedYear ?? 'Vše',
      selectedMonth ? MONTH_NAMES[selectedMonth] : null,
      selectedMarket !== 'ALL' ? selectedMarket : null,
    ].filter(Boolean).join('_') || 'Vše';

    const sorted = [...aggregated].sort((a, b) => b.total_quantity - a.total_quantity);

    const exportDecimals = currency === 'EUR' ? 2 : 0;
    const fmt = (n: number) =>
      new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: exportDecimals, maximumFractionDigits: exportDecimals }).format(n);

    const header = ['Název produktu', 'Počet kusů', `Hodnota bez DPH (${currency})`, `Hodnota s DPH (${currency})`];
    const rows = sorted.map((r) => [
      r.product_name,
      r.total_quantity,
      fmt(r.total_price_no_vat),
      fmt(r.total_price_vat),
    ]);

    const totalRow = [
      'CELKEM',
      sorted.reduce((s, r) => s + r.total_quantity, 0),
      fmt(sorted.reduce((s, r) => s + r.total_price_no_vat, 0)),
      fmt(sorted.reduce((s, r) => s + r.total_price_vat, 0)),
    ];

    const csvContent = [header, ...rows, totalRow]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    // BOM for Excel UTF-8 recognition
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bioprodukt_${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const decimals = currency === 'EUR' ? 2 : 0;
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 rounded-xl">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Bioprodukt JT</h1>
              <p className="text-sm text-blue-500 font-medium">Analýza prodejnosti produktů</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedMarket === 'ALL' && rateDate && (
              <span className="text-xs text-gray-400">
                Kurz ČNB ({rateDate}): 1 EUR = {fmtCurrency(eurCzk)} CZK
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Aktualizováno: {lastUpdated.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchFromSheets}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Obnovit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading */}
        {loading && rawData.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <p className="text-gray-400">Načítám data z Google Sheets...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && rawData.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-red-100">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Dashboard */}
        {rawData.length > 0 && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
              <Filters
                years={years}
                months={months}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                selectedMarket={selectedMarket}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
                onMarketChange={setSelectedMarket}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Celkový prodej s DPH"
                value={fmtCurrency(totalSalesVat)}
                sub={currency}
                icon={TrendingUp}
                color="bg-blue-600"
              />
              <StatCard
                title="Celkový prodej bez DPH"
                value={fmtCurrency(totalSalesNoVat)}
                sub={currency}
                icon={ShoppingCart}
                color="bg-blue-500"
              />
              <StatCard
                title="Celkový počet kusů"
                value={totalQty.toLocaleString('cs-CZ')}
                sub="ks prodáno"
                icon={Package}
                color="bg-indigo-500"
              />
              <StatCard
                title="Počet produktů"
                value={aggregated.length.toString()}
                sub="unikátních produktů"
                icon={Leaf}
                color="bg-indigo-600"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Přehled produktů</h2>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
              <AnalyticsTable data={aggregated} currency={currency} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
