'use client';

import { useState, useMemo, useEffect } from 'react';
import { Leaf, TrendingUp, Package, ShoppingCart, RefreshCw, Download, Sparkles } from 'lucide-react';
import { SaleRecord, Market, ProductSummary } from '@/types';
import { Filters } from '@/components/Filters';
import { AnalyticsTable } from '@/components/AnalyticsTable';

function StatCard({ title, value, sub, icon: Icon, gradient }: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl p-5 flex items-start gap-4 ${gradient} shadow-sm`}>
      <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-white mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
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
  const decimals = currency === 'EUR' ? 2 : 0;
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

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

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bioprodukt_${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-md shadow-violet-200">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Bioprodukt JT</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 text-xs font-semibold">
                  <Sparkles className="w-3 h-3" /> Analytics
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Analýza prodejnosti produktů</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedMarket === 'ALL' && rateDate && (
              <span className="hidden md:block text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                1 EUR = <span className="font-semibold text-gray-600">{fmtCurrency(eurCzk)} CZK</span>
                <span className="text-gray-300 ml-1">({rateDate})</span>
              </span>
            )}
            {lastUpdated && (
              <span className="hidden sm:block text-xs text-gray-400">
                {lastUpdated.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchFromSheets}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Obnovit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Loading */}
        {loading && rawData.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <RefreshCw className="w-7 h-7 text-violet-500 animate-spin" />
            </div>
            <p className="text-gray-400 font-medium">Načítám data z Google Sheets...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && rawData.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Dashboard */}
        {rawData.length > 0 && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
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
                gradient="bg-gradient-to-br from-violet-600 to-indigo-600"
              />
              <StatCard
                title="Celkový prodej bez DPH"
                value={fmtCurrency(totalSalesNoVat)}
                sub={currency}
                icon={ShoppingCart}
                gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
              />
              <StatCard
                title="Celkový počet kusů"
                value={totalQty.toLocaleString('cs-CZ')}
                sub="prodáno"
                icon={Package}
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
              <StatCard
                title="Počet produktů"
                value={aggregated.length.toString()}
                sub="unikátních produktů"
                icon={Leaf}
                gradient="bg-gradient-to-br from-cyan-500 to-teal-500"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Přehled produktů</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{aggregated.length} produktů · seřazeno dle počtu kusů</p>
                </div>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-all shadow-sm"
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
