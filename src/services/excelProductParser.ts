import * as XLSX from 'xlsx';
import { Product } from '../store/appStore';

export const parseProductExcel = (base64: string): Omit<Product, 'id'>[] => {
  const wb = XLSX.read(base64, { type: 'base64' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (raw.length < 2) throw new Error('File Excel kosong atau tidak sesuai format.');

  // Find header row
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    if ((raw[i] || []).some(v => String(v).toLowerCase().includes('nama'))) {
      headerIdx = i;
      break;
    }
  }

  const header = raw[headerIdx].map(h => String(h || '').toLowerCase().trim());
  const findIdx = (keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)));

  const idxName  = findIdx(['nama', 'produk', 'item']);
  const idxUnit  = findIdx(['kemasan', 'satuan', 'unit']);
  const idxBuy   = findIdx(['modal', 'beli', 'buy', 'hpp']);
  const idxSell  = findIdx(['jual', 'sell', 'price']);
  const idxStock = findIdx(['stok', 'stock', 'jumlah', 'qty']);

  if (idxName === -1) throw new Error('Kolom "Nama" tidak ditemukan di Excel.');

  const products: Omit<Product, 'id'>[] = [];
  
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !row[idxName]) continue;

    const parseNum = (v: any) => {
      if (typeof v === 'number') return v;
      return parseFloat(String(v || '0').replace(/[^0-9.]/g, '')) || 0;
    };

    products.push({
      name:      String(row[idxName]),
      unit:      idxUnit !== -1 ? String(row[idxUnit] || 'pcs') : 'pcs',
      buyPrice:  idxBuy !== -1 ? parseNum(row[idxBuy]) : 0,
      sellPrice: idxSell !== -1 ? parseNum(row[idxSell]) : 0,
      stock:     idxStock !== -1 ? Math.floor(parseNum(row[idxStock])) : 0,
    });
  }

  return products;
};
