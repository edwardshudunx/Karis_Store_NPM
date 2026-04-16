import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  Dimensions, Animated,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { formatRupiah, formatShort } from '../utils/currency';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── Kartu Metrik ───────────────────────────────────
const MetricCard = ({
  label, value, icon, color,
}: {
  label: string; value: string; icon: string; color: string;
}) => (
  <View
    style={{ width: (width - 48) / 2 }}
    className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700/50"
  >
    <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3`} style={{ backgroundColor: color + '22' }}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text className="text-slate-400 text-xs mb-1" numberOfLines={2}>{label}</Text>
    <Text className="text-white font-bold text-sm" numberOfLines={1}>{value}</Text>
  </View>
);

// ─── Grafik Batang Sederhana ─────────────────────────
const BarChart = ({ bars }: { bars: { label: string; value: number; color: string }[] }) => {
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  return (
    <View className="flex-row justify-around items-end h-32 mt-2">
      {bars.map((b, i) => (
        <View key={i} className="items-center flex-1">
          <Text className="text-xs font-bold mb-1" style={{ color: b.color }}>
            {formatShort(b.value)}
          </Text>
          <View
            style={{
              height: Math.max((b.value / maxVal) * 80, 4),
              backgroundColor: b.color,
              borderRadius: 6,
              width: 28,
              opacity: 0.85,
            }}
          />
          <Text className="text-slate-500 text-xs mt-1">{b.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────
export default function DashboardScreen() {
  const store = useAppStore();

  useEffect(() => {
    store.loadAll();
  }, []);

  const totalOmzet = store.totalOmzetBulanIni();
  const totalKas = store.totalKas();
  const asetStok = store.totalAsetStok();
  const lowStock = store.lowStockCount();
  const uangMasuk = store.totalUangMasuk();
  const uangKeluar = store.totalUangKeluar();

  const metrics = [
    { label: 'Total Omzet\nBulan Ini', value: formatRupiah(totalOmzet), icon: 'trending-up', color: '#10b981' },
    { label: 'Saldo Kas', value: formatRupiah(totalKas), icon: 'wallet', color: '#3b82f6' },
    { label: 'Peringatan\nStok Tipis', value: `${lowStock} Barang`, icon: 'warning', color: '#f59e0b' },
    { label: 'Nilai Aset\nStok', value: formatRupiah(asetStok), icon: 'cube', color: '#8b5cf6' },
  ];

  const shopeeOmzet = store.omsetRecords
    .filter(r => r.platform === 'Shopee')
    .reduce((s, r) => s + r.totalHarga, 0);

  const tiktokOmzet = store.omsetRecords
    .filter(r => r.platform === 'TikTok Shop')
    .reduce((s, r) => s + r.totalHarga, 0);

  const offlineOmzet = store.transactions
    .filter(t => t.type === 'offline')
    .reduce((s, r) => s + r.totalAmount, 0);

  const bars = [
    { label: 'Shopee',  value: shopeeOmzet,  color: '#f97316' },
    { label: 'TikTok',  value: tiktokOmzet,  color: '#ec4899' },
    { label: 'Offline', value: offlineOmzet, color: '#3b82f6' },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 16 }}>

      {/* Header Info Periode */}
      <View className="flex-row justify-between items-center mb-5">
        <View>
          <Text className="text-slate-400 text-xs">Periode Laporan</Text>
          <Text className="text-white font-bold text-base">
            {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity className="flex-row items-center bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
          <Ionicons name="calendar" size={14} color="#94a3b8" />
          <Text className="text-slate-400 text-xs ml-1.5">Pilih Tanggal</Text>
        </TouchableOpacity>
      </View>

      {/* Metric Cards */}
      <View className="flex-row flex-wrap justify-between">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </View>

      {/* Ringkasan Arus Kas */}
      <View className="bg-gradient-to-br bg-teal-900/40 border border-teal-700/30 rounded-2xl p-5 mb-4">
        <Text className="text-teal-300 font-bold mb-3">💰 Ringkasan Arus Kas</Text>
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <View className="bg-emerald-500/20 rounded-xl px-3 py-1.5 mb-1">
              <Ionicons name="arrow-down" size={16} color="#10b981" />
            </View>
            <Text className="text-slate-400 text-xs">Uang Masuk</Text>
            <Text className="text-emerald-400 font-bold text-sm">{formatRupiah(uangMasuk)}</Text>
          </View>
          <View className="w-px bg-slate-700 mx-2" />
          <View className="items-center flex-1">
            <View className="bg-red-500/20 rounded-xl px-3 py-1.5 mb-1">
              <Ionicons name="arrow-up" size={16} color="#ef4444" />
            </View>
            <Text className="text-slate-400 text-xs">Uang Keluar</Text>
            <Text className="text-red-400 font-bold text-sm">{formatRupiah(uangKeluar)}</Text>
          </View>
          <View className="w-px bg-slate-700 mx-2" />
          <View className="items-center flex-1">
            <View className="bg-blue-500/20 rounded-xl px-3 py-1.5 mb-1">
              <Ionicons name="stats-chart" size={16} color="#60a5fa" />
            </View>
            <Text className="text-slate-400 text-xs">Net Balance</Text>
            <Text className="text-blue-400 font-bold text-sm">{formatRupiah(totalKas)}</Text>
          </View>
        </View>
      </View>

      {/* Bar Chart Omzet Platform */}
      <View className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5">
        <Text className="text-white font-bold text-base mb-1">📊 Omzet Per Platform</Text>
        <Text className="text-slate-500 text-xs mb-2">Data bulan berjalan</Text>
        <BarChart bars={bars} />
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
