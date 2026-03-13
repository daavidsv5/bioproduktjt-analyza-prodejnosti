import { NextResponse } from 'next/server';

const CNB_URL =
  'https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt';

export async function GET() {
  try {
    const res = await fetch(CNB_URL, {
      next: { revalidate: 3600 }, // cache 1 hodina
    });

    if (!res.ok) throw new Error('CNB API unavailable');

    const text = await res.text();

    // Format: "EMU|euro|1|EUR|24.375"
    const line = text.split('\n').find((l) => l.startsWith('EMU|'));
    if (!line) throw new Error('EUR rate not found');

    const parts = line.split('|');
    const amount = parseFloat(parts[2]);
    const rate = parseFloat(parts[4].replace(',', '.'));
    const eurCzk = rate / amount;

    return NextResponse.json({ EUR_CZK: eurCzk, date: text.split('\n')[0].trim() });
  } catch (err) {
    console.error('Exchange rate error:', err);
    // Fallback rate
    return NextResponse.json({ EUR_CZK: 25.0, date: null, fallback: true });
  }
}
