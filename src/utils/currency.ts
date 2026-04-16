/**
 * Format angka ke format mata uang Rupiah (Rp)
 * @param value - Nilai numerik
 * @returns String terformat, misal: "Rp 1.250.000"
 */
export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Singkat nilai besar: 1.500.000 → "1,5 Jt"
 */
export const formatShort = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} Rb`;
  return formatRupiah(value);
};
