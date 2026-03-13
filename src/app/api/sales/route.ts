import { NextResponse } from 'next/server';
import Papa from 'papaparse';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vToMQ4iS5Vh1I8XwTqj9EMn-gz8BYscQgsD7wBylZkPTQbjQjLs37RW6yzHv8-4gx96SDPRfUMD7WJi/pub?output=csv&gid=0';

// Only include rows where itemCode is a pure number (real products)
function isProductCode(itemCode: string): boolean {
  return /^\d+$/.test((itemCode || '').trim());
}

// Remove weight/quantity suffixes and clean up product names
// e.g. "Jablečné trubičky 43ks (540g)" → "Jablečné trubičky 43ks"
function cleanProductName(name: string): string {
  return name
    .replace(/\s*\(\d+\s*g\)/gi, '')   // remove (Xg)
    .replace(/\s*\(\d+\s*ml\)/gi, '')  // remove (Xml)
    .replace(/\s*\(\d+\s*ks\)/gi, '')  // remove (Xks)
    .trim();
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  return parseFloat(value.toString().replace(',', '.')) || 0;
}

export async function GET() {
  try {
    const res = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 86400 }, // cache 24 hodin
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Nepodařilo se načíst data z Google Sheets' }, { status: 502 });
    }

    const csvText = await res.text();

    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
    });

    const records = (result.data as Record<string, string>[])
      .filter((row) => {
        // Only real products – itemCode must be a number
        if (!isProductCode(row.itemCode)) return false;
        if (!row.itemName?.trim()) return false;
        return true;
      })
      .map((row) => ({
        product_name: cleanProductName(row.itemName.trim()),

        quantity: parseNumber(row.itemAmount),
        price_no_vat: parseNumber(row.itemTotalPriceWithoutVat),
        price_vat: parseNumber(row.itemTotalPriceWithVat),
        currency: (row.currency || 'CZK').trim().toUpperCase(),
        date: row.date || '',
        status: row.statusName || '',
      }));

    return NextResponse.json(records);
  } catch (err) {
    console.error('Sales API error:', err);
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 });
  }
}
