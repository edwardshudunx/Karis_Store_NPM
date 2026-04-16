import * as XLSX from 'xlsx';

export type ParsedRow = {
  noOrder: string;
  status: string;
  statusKategori: 'Selesai' | 'Pengembalian' | 'Proses Penyelesaian';
  totalHarga: number;
  tanggal: string;
  platform: 'Shopee' | 'TikTok Shop';
};

export type ParseResult = {
  rows: ParsedRow[];
  fileName: string;
  platform: 'Shopee' | 'TikTok Shop';
  totalSelesai: number;
  totalPengembalian: number;
  totalProses: number;
  totalBersih: number;
};

// ─── Numeric Parser (Indonesian / US aware) ───────
const parseNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  
  let s = String(val).trim();
  s = s.replace(/(Rp|IDR|\s)/g, '');

  if (s.includes('.') && s.includes(',')) {
    // 1.250.000,00 -> 1250000.00
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',') && s.split(',')[1]?.length <= 2) {
    // 1000,50 -> 1000.50
    s = s.replace(',', '.');
  } else if (s.includes('.') && s.split('.')[1]?.length === 3) {
    // 25.000 -> 25000
    s = s.replace(/\./g, '');
  }
  
  s = s.replace(/[^0-9.\-]/g, '');
  return parseFloat(s) || 0;
};

// ─── Helper: Get value for row by keyword list ─────
const getRowValue = (header: any[], row: any[], keywords: string[]): any => {
  for (let i = 0; i < header.length; i++) {
    const h = String(header[i] ?? '').toLowerCase().trim();
    if (keywords.some(k => h.includes(k.toLowerCase()))) {
      return row[i];
    }
  }
  return null;
};

// ─── Status Categorizer ───────────────────────────
const categorizeStatus = (raw: string): { label: string; kategori: ParsedRow['statusKategori'] } => {
  const s = raw.toLowerCase();
  
  if (s.includes('batal') || s.includes('cancel') || s.includes('refund') || s.includes('kembali') || s.includes('retur') || s.includes('returned')) {
    return { label: 'Pengembalian / Refund', kategori: 'Pengembalian' };
  }
  
  if (s.includes('selesai') || s === 'settlement' || s === 'order' || s.includes('completed') || s.includes('garansi') || s.includes('diterima') || s.includes('delivered')) {
    return { label: 'Selesai', kategori: 'Selesai' };
  }
  
  return { label: raw || 'Dalam Proses', kategori: 'Proses Penyelesaian' };
};

// ─── UNIVERSAL PARSER LOGIC ───────────────────────
const parseExcelInternal = (base64: string, fileName: string, platform: 'Shopee' | 'TikTok Shop'): ParseResult => {
  const wb = XLSX.read(base64, { type: 'base64', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rawData.length < 2) throw new Error('File Excel kosong atau format tidak sesuai.');

  // Find header row (the one with the most columns, within first 10 rows)
  let headerIdx = 0;
  let maxCols = 0;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const cols = (rawData[i] || []).filter(v => v !== null && v !== '').length;
    if (cols > maxCols) {
      maxCols = cols;
      headerIdx = i;
    }
  }

  const header = rawData[headerIdx];
  const rows: ParsedRow[] = [];

  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every(v => v === null || v === '')) continue;

    const noOrder = String(getRowValue(header, row, ['no. pesanan', 'order id', 'order/adjustment id', 'no pesanan']) ?? '').trim();
    if (!noOrder || noOrder === 'null') continue;

    const rawStatus = String(getRowValue(header, row, ['status pesanan', 'order status', 'status', 'type', 'tipe']) ?? 'Selesai');
    const { label, kategori } = categorizeStatus(rawStatus);

    const rawDate = getRowValue(header, row, ['waktu pesanan dibuat', 'created time', 'create time', 'tanggal', 'date']);
    const tanggal = rawDate instanceof Date ? rawDate.toISOString() : (rawDate ? String(rawDate) : new Date().toISOString());

    let total = 0;

    if (platform === 'Shopee') {
      // Shopee Logic
      const penghasilan = parseNumber(getRowValue(header, row, ['total penghasilan', 'penghasilan penjual']));
      if (penghasilan !== 0) {
        total = penghasilan;
      } else {
        const d_terima = parseNumber(getRowValue(header, row, ['total pembayaran', 'dibayar pembeli', 'total payment']));
        if (d_terima !== 0) {
          total = d_terima;
        } else {
          // Fallback: Harga x Qty
          const harga = parseNumber(getRowValue(header, row, ['harga setelah diskon', 'harga awal', 'harga produk']));
          const qty = parseNumber(getRowValue(header, row, ['jumlah', 'kuantitas', 'qty'])) || 1;
          total = harga * qty;
        }
      }
    } else {
      // TikTok Logic
      const rev = parseNumber(getRowValue(header, row, ['total revenue', 'pendapatan', 'revenue', 'penyelesaian', 'settlement amount']));
      total = rev;
    }

    rows.push({
      noOrder,
      status: label,
      statusKategori: kategori,
      totalHarga: total,
      tanggal,
      platform,
    });
  }

  if (rows.length === 0) throw new Error('Format kolom tidak cocok. Pastikan file benar.');

  const totalSelesai = rows.filter(r => r.statusKategori === 'Selesai').reduce((sum, r) => sum + r.totalHarga, 0);
  const totalRefund = rows.filter(r => r.statusKategori === 'Pengembalian').reduce((sum, r) => sum + r.totalHarga, 0);
  const totalProses = rows.filter(r => r.statusKategori === 'Proses Penyelesaian').reduce((sum, r) => sum + r.totalHarga, 0);

  return {
    rows,
    fileName,
    platform,
    totalSelesai,
    totalPengembalian: totalRefund,
    totalProses,
    totalBersih: totalSelesai - totalRefund,
  };
};

export const parseShopee = (base64: string, fileName: string) => parseExcelInternal(base64, fileName, 'Shopee');
export const parseTikTok = (base64: string, fileName: string) => parseExcelInternal(base64, fileName, 'TikTok Shop');
