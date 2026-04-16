export function terbilang(n: number): string {
  const units = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
  const numberWords = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  if (n === 0) return 'Nol';

  function convert(n: number): string {
    if (n < 12) return numberWords[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    if (n < 2000) return 'Seribu ' + convert(n - 1000);
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    return '';
  }

  let result = convert(n).trim().replace(/\s+/g, ' ');
  // Special case for "Satu Puluh" -> "Sepuluh", though convert handles up to 11
  // Standard Indonesian: 1000 often "Seribu" not "Satu Ribu"
  
  return result;
}
