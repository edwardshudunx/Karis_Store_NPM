import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { parseShopee, parseTikTok, ParseResult } from '../services/excelParser';
import { useAppStore } from '../store/appStore';
import { formatRupiah } from '../utils/currency';

type Platform = 'Shopee' | 'TikTok Shop';

const PlatformPicker = ({ selected, onSelect }: { selected: Platform; onSelect: (p: Platform) => void }) => (
  <View className="flex-row gap-3 mb-5">
    {(['Shopee', 'TikTok Shop'] as Platform[]).map(p => {
      const isActive = selected === p;
      const color    = p === 'Shopee' ? '#f97316' : '#ec4899';
      return (
        <TouchableOpacity key={p} onPress={() => onSelect(p)} className="flex-1 rounded-2xl py-4 items-center border-2" style={{ backgroundColor: isActive ? color + '22' : '#1e293b', borderColor: isActive ? color : '#334155' }}>
          <Text className="text-2xl mb-1">{p === 'Shopee' ? '🛒' : '🎵'}</Text>
          <Text className="font-bold text-sm" style={{ color: isActive ? color : '#94a3b8' }}>{p}</Text>
          {isActive && <View className="mt-1 rounded-full px-2 py-0.5" style={{ backgroundColor: color }}><Text className="text-white text-xs font-semibold">Dipilih ✓</Text></View>}
        </TouchableOpacity>
      );
    })}
  </View>
);

const OmzetRow = ({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) => (
  <View className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2" style={{ backgroundColor: color + '18' }}>
    <Text style={{ color, fontWeight: bold ? '700' : '500', fontSize: bold ? 14 : 12 }}>{label}</Text>
    <Text style={{ color, fontWeight: '700', fontSize: bold ? 16 : 13 }}>{formatRupiah(value)}</Text>
  </View>
);

export default function UploadOmsetScreen() {
  const [platform, setPlatform] = useState<Platform>('Shopee');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const store = useAppStore();
  const rekenings = store.rekenings;
  const addCashFlow = store.addCashFlow;

  const handleUpload = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      setIsSynced(false);

      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets?.length) return;
      const file = picked.assets[0];
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });

      let parsed: ParseResult = platform === 'Shopee' ? parseShopee(base64, file.name) : parseTikTok(base64, file.name);
      setResult(parsed);
    } catch (e: any) {
      Alert.alert('❌ Gagal Membaca File', e?.message ?? 'Terjadi error tak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncBalance = () => {
    if (!result) return;
    
    // Cari rekening yang sesuai (Shopee Walet atau TikTok Walet)
    const walletName = platform === 'Shopee' ? 'Shopee Walet' : 'TikTok Walet';
    const targetRek = rekenings.find(r => r.name === walletName);

    if (!targetRek) {
      Alert.alert('Error', `Rekening ${walletName} tidak ditemukan. Silakan tambahkan di pengaturan.`);
      return;
    }

    if (result.totalBersih <= 0) {
      Alert.alert('Info', 'Tidak ada omset bersih yang bisa disinkronkan.');
      return;
    }

    addCashFlow({
      rekeningId: targetRek.id,
      type: 'in',
      amount: result.totalBersih,
      description: `Omzet ${platform} - ${result.fileName}`,
      date: new Date().toISOString()
    });

    setIsSynced(true);
    Alert.alert('✅ Berhasil Sinkron', `Saldo ${walletName} berhasil ditambahkan sebesar ${formatRupiah(result.totalBersih)}.`);
  };

  const platformColor = platform === 'Shopee' ? '#f97316' : '#ec4899';

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 16 }}>
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold">Kalkulator Omset</Text>
        <Text className="text-slate-500 text-xs mt-1">Hanya kalkulasi sementara dari laporan Excel platform</Text>
      </View>

      <PlatformPicker selected={platform} onSelect={(p) => { setPlatform(p); setResult(null); setIsSynced(false); }} />

      <TouchableOpacity onPress={handleUpload} disabled={isLoading} className="rounded-2xl py-5 flex-row items-center justify-center mb-6" style={{ backgroundColor: isLoading ? '#334155' : platformColor }}>
        {isLoading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="document-attach" size={20} color="white" />}
        <Text className="text-white font-bold text-base ml-2">{isLoading ? 'Membaca Laporan...' : `Pilih Laporan Excel ${platform}`}</Text>
      </TouchableOpacity>

      {result && (
        <View className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <View className="flex-row items-center mb-5 pb-4 border-b border-slate-700">
             <View className="p-2 rounded-xl" style={{ backgroundColor: platformColor + '22' }}>
                <Ionicons name={platform === 'Shopee' ? 'cart' : 'musical-notes'} size={24} color={platformColor} />
             </View>
             <View className="ml-3">
                <Text className="text-white font-bold text-lg">{platform}</Text>
                <Text className="text-slate-500 text-[10px]" numberOfLines={1}>{result.fileName}</Text>
             </View>
          </View>

          <OmzetRow label="Total Selesai" value={result.totalSelesai} color="#10b981" />
          <OmzetRow label="Total Pengembalian" value={result.totalPengembalian} color="#ef4444" />
          <OmzetRow label="Masih Proses" value={result.totalProses} color="#f59e0b" />
          
          <View className="my-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-700/50">
             <Text className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-tighter">ESTIMASI OMSET BERSIH</Text>
             <Text className="text-white text-2xl font-black" style={{ color: platformColor }}>{formatRupiah(result.totalBersih)}</Text>
          </View>

          {!isSynced ? (
            <TouchableOpacity onPress={handleSyncBalance} className="bg-emerald-500 rounded-2xl py-4 flex-row items-center justify-center shadow-lg">
               <Ionicons name="sync-circle" size={24} color="white" />
               <Text className="text-white font-bold text-base ml-2">Update Saldo {platform} Walet</Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl py-4 flex-row items-center justify-center">
               <Ionicons name="checkmark-done-circle" size={24} color="#10b981" />
               <Text className="text-emerald-400 font-bold text-base ml-2">Saldo Telah Diupdate ✓</Text>
            </View>
          )}

          <Text className="text-slate-600 text-[10px] text-center mt-4 italic">
            *Data tidak disimpan sebagai riwayat pesanan (menghemat storage)
          </Text>
        </View>
      )}

      {!result && (
        <View className="mt-10 items-center opacity-30">
          <Ionicons name="cloud-download-outline" size={80} color="#64748b" />
          <Text className="text-slate-500 mt-4 font-medium text-center">Belum ada file yang diupload untuk dikalkulasi</Text>
        </View>
      )}
      <View className="h-10" />
    </ScrollView>
  );
}
