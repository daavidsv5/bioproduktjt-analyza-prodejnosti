# Bioprodukt JT – CLAUDE.md

## Spuštění projektu

```bash
npm run dev -- --port 3001
```

Aplikace běží na http://localhost:3001

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** komponenty (Button, Card, Table, Select, Badge) v `src/components/ui/`
- **PapaParse** – parsování CSV z Google Sheets
- **lucide-react** – ikony

## Struktura projektu

```
src/
  app/
    page.tsx              # Hlavní stránka (dashboard)
    layout.tsx            # Root layout
    globals.css           # Globální styly
    api/
      sales/route.ts      # GET /api/sales – načítá data z Google Sheets CSV
      exchange-rate/      # GET /api/exchange-rate – kurz EUR/CZK z ČNB
  components/
    AnalyticsTable.tsx    # Tabulka produktů s řazením
    Filters.tsx           # Filtry (rok, měsíc, trh)
    FileUpload.tsx        # Upload CSV (nepoužito v aktuálním UI)
    ui/                   # shadcn/ui komponenty
  types/
    index.ts              # SaleRecord, ProductSummary, SortField, SortDirection, Market
  utils/
    csvParser.ts          # CSV parser utility
  lib/
    utils.ts              # cn() helper (clsx + tailwind-merge)
```

## Datový zdroj

Data se načítají z veřejně publikovaného Google Sheets dokumentu jako CSV:
- URL je v `src/app/api/sales/route.ts` (konstanta `SHEET_CSV_URL`)
- Cache: 24 hodin (`next: { revalidate: 86400 }`)
- Filtrují se pouze řádky, kde `itemCode` je číslo (reálné produkty)
- Názvy produktů se čistí – odstraňují se váhové/množstevní suffixu jako `(540g)`, `(200ml)`, `(6ks)`

## Klíčová logika

- **Trhy**: `CZ` = CZK, `SK` = EUR, `ALL` = obě (EUR se převádí na CZK kurzem ČNB)
- **Storno**: řádky se statusem obsahujícím "storno" se vylučují
- **Kurz EUR/CZK**: načítá se z ČNB API v `/api/exchange-rate`, fallback = 25.0
- **Export CSV**: tlačítko v UI exportuje aktuálně filtrovaná data s BOM (UTF-8 pro Excel)

## Typy

```ts
SaleRecord     – jeden řádek z Google Sheets
ProductSummary – agregovaný součet za produkt
Market         – 'ALL' | 'CZ' | 'SK'
SortField      – sloupec pro řazení tabulky
SortDirection  – 'asc' | 'desc'
```
