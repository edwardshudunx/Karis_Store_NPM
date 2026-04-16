import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const downloadProductFormat = async () => {
  try {
    const data = [
      ['Nama Produk', 'Satuan', 'Harga Modal', 'Harga Jual', 'Stok Awal'],
      ['Contoh Barang A', 'pcs', 15000, 20000, 100],
      ['Contoh Barang B', 'dus', 120000, 150000, 10],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok");

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'Format_Import_Stok.xlsx';

    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { 
       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       UTI: 'com.microsoft.excel.xlsx',
       dialogTitle: 'Download Format Import Stok' 
    });
  } catch (error) {
    console.error('Export Error', error);
    throw new Error('Gagal menghasilkan format Excel.');
  }
};
