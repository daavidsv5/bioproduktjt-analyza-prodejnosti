import Papa from 'papaparse';
import { SaleRecord } from '@/types';

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  return parseFloat(value.toString().replace(',', '.')) || 0;
}

function decodeCSV(buffer: ArrayBuffer): string {
  // Try UTF-8 first (modern exports), fall back to Windows-1250
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  // If UTF-8 decoding produces replacement characters (�), try Windows-1250
  if (utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1250').decode(buffer);
  }
  return utf8;
}

// Only include rows where itemCode is a pure number (real products)
function isProductCode(itemCode: string): boolean {
  return /^\d+$/.test((itemCode || '').trim());
}

// Remove weight/quantity suffixes from product names
// e.g. "Jablečné trubičky 43ks (540g)" → "Jablečné trubičky 43ks"
function cleanProductName(name: string): string {
  return name
    .replace(/\s*\(\d+\s*g\)/gi, '')
    .replace(/\s*\(\d+\s*ml\)/gi, '')
    .replace(/\s*\(\d+\s*ks\)/gi, '')
    .trim();
}

export async function parseCSVFile(file: File): Promise<SaleRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const text = decodeCSV(buffer);

        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: ',',
        });

        const records = (result.data as Record<string, string>[])
          .filter((row) => {
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

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
