# 🚀 Karis Store NPM — Fitur & Panduan Penggunaan

Aplikasi **Karis Store** kini telah sepenuhnya dimigrasikan ke **React Native (Expo)** dengan desain Dark Mode premium dan performa yang lebih gegas.

---

## 📊 1. Dashboard Utama
- **Metrik Real-time**: Pantau total Kas, Omzet bulan ini, dan Aset stok langsung di halaman utama.
- **Visualisasi**: Grafik batang untuk membandingkan performa platform (Shopee, TikTok, Offline).
- **Notifikasi Stok**: Indikator otomatis jika ada produk yang stoknya menipis (< 10 pcs).

## 💸 2. Manajemen Arus Kas (Cash Flow)
- **Pencatatan Otomatis**: Setiap penjualan lunas otomatis tercatat sebagai uang masuk.
- **Pencatatan Manual**: Catat pengeluaran (operasional, bensin, dll) atau pemasukan manual lainnya.
- **Filter Pintar**: Lihat riwayat berdasarkan 'Semua', 'Uang Masuk', atau 'Uang Keluar'.
- **Saldo Dinamis**: Warna saldo berubah (hijau/merah) sesuai kondisi keuangan toko.

## 📦 3. Stok Gudang (Inventory)
- **Manajemen Produk**: Tambah, edit, atau hapus SKU produk dengan mudah.
- **Opname Stok**: Fitur tambah/kurangi stok secara cepat dengan indikator visual (Merah = Habis, Kuning = Tipis, Hijau = Aman).
- **Nilai Aset**: Secara otomatis menghitung total nilai uang yang tertanam di stok gudang.

## 🧾 4. Penjualan Offline & Kontra Bon
- **Surat Jalan**: Buat pesanan untuk pelanggan offline/toko mitra.
- **Sistem Kontra Bon**: Dukungan status 'Pending' untuk pesanan yang belum dibayar. Aplikasi akan memberikan peringatan total tagihan yang belum tertagih.
- **Cetak PDF**: Generate Surat Jalan/Invoice profesional dalam format PDF yang bisa langsung dibagikan (WhatsApp/Email) atau dicetak.
- **Status Retur**: Kelola pengembalian barang secara terpisah untuk menjaga akurasi stok.

## 📑 5. Upload Omset Online (Excel Parser)
- **Multi-Platform**: Pilih antara format **Shopee** atau **TikTok Shop**.
- **Parser Cerdas**: Secara otomatis mendeteksi kolom (Order ID, Status, Revenue) meskipun format Excel dari marketplace berubah-ubah.
- **Rekonsiliasi**: Menghitung omzet bersih secara otomatis (Total Selesai - Refund).
- **Sinkronisasi**: Data yang diupload akan masuk ke database laporan omzet dan Arus Kas.

---

## 🛠️ Teknis & Keamanan Data
- **Offline First**: Semua data disimpan di device Anda menggunakan `expo-sqlite`. Tidak ada data yang dikirim ke server luar (Privasi 100%).
- **Cepat & Ringan**: Menggunakan **Zustand** untuk manajemen state yang efisien, membuat aplikasi terasa sangat responsif.
- **Siap Android**: Dikonfigurasi dengan SDK terbaru dan kompatibel dengan Android 14+.

---

### Cara Menjalankan:
1. Hubungkan HP ke WiFi yang sama dengan PC.
2. Jalankan `START_EXPO.bat` di folder proyek.
3. Scan QR Code dengan aplikasi **Expo Go**.
