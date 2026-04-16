import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useAppStore } from '../store/appStore';
import { formatRupiah, formatShort } from '../utils/currency';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── Simple Bar Chart Component ─────────────────────
const SimpleBarChart = ({ data, title }: { data: { label: string; value: number; color: string }[], title: string }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <View className="bg-slate-800 rounded-3xl p-5 mb-5 border border-slate-700/50">
      <Text className="text-white font-bold text-base mb-1">{title}</Text>
      <View className="flex-row justify-around items-end h-32 mt-4">
        {data.map((d, i) => (
          <View key={i} className="items-center flex-1">
            <View
              style={{
                height: Math.max((d.value / maxVal) * 80, 4),
                backgroundColor: d.color,
                borderRadius: 6,
                width: 20,
              }}
            />
            <Text className="text-slate-500 text-[10px] mt-2 font-bold">{d.label}</Text>
            <Text className="text-slate-300 text-[9px]">{formatShort(d.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function ReportScreen() {
  const store = useAppStore();
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');

  useEffect(() => {
    store.loadAll();
  }, []);

  // Aggregation Logic
  const now = new Date();
  
  const getWeeklyData = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentWeekData = days.map((day, index) => {
      const d = new Date();
      d.setDate(now.getDate() - now.getDay() + index);
      const dateStr = d.toISOString().split('T')[0];
      const txs = store.transactions.filter(t => (t.date || '').startsWith(dateStr));
      const platformRecords = store.omsetRecords.filter(t => (t.uploadDate || '').startsWith(dateStr));

      const omzet = [...txs, ...platformRecords]
        .reduce((s, t) => s + (t.totalAmount || t.totalHarga || 0), 0);
        
      const margin = txs.reduce((s, t) => {
        const itemMargin = (t.items || []).reduce((is, item) => {
          const prod = store.products.find(p => p.id === item.productId);
          const cost = prod?.buyPrice || 0;
          return is + ((item.price - cost) * item.quantity);
        }, 0);
        return s + itemMargin;
      }, 0);

      const expense = store.cashFlows
        .filter(c => c.type === 'out' && (c.date || '').startsWith(dateStr))
        .reduce((s, c) => s + (c.amount || 0), 0);

      return { label: day.substring(0, 3), omzet, margin, expense };
    });
    return currentWeekData;
  };

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = now.getFullYear();
    
    return months.map((m, i) => {
      const txs = store.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      const platformRecords = store.omsetRecords.filter(t => {
        const d = new Date(t.uploadDate);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });

      const omzet = [...txs, ...platformRecords]
        .reduce((s, t) => s + (t.totalAmount || t.totalHarga || 0), 0);

      const margin = txs.reduce((s, t) => {
        const itemMargin = (t.items || []).reduce((is, item) => {
          const prod = store.products.find(p => p.id === item.productId);
          const cost = prod?.buyPrice || 0;
          return is + ((item.price - cost) * item.quantity);
        }, 0);
        return s + itemMargin;
      }, 0);

      const expense = store.cashFlows
        .filter(c => {
          const d = new Date(c.date);
          return c.type === 'out' && d.getMonth() === i && d.getFullYear() === currentYear;
        })
        .reduce((s, c) => s + (c.amount || 0), 0);

      return { label: m, omzet, margin, expense };
    });
  };

  const chartData = period === 'weekly' ? getWeeklyData() : getMonthlyData();
  
  const totalOmzet = chartData.reduce((s, d) => s + d.omzet, 0);
  const totalMargin = chartData.reduce((s, d) => s + d.margin, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);

  const avgMarginPct = totalOmzet > 0 ? (totalMargin / totalOmzet) * 100 : 0;

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 16 }}>
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold">Laporan Keuangan</Text>
        <Text className="text-slate-500 text-xs mt-1">Ringkasan performa toko Anda</Text>
      </View>

      {/* Period Switcher */}
      <View className="flex-row bg-slate-800 rounded-2xl p-1 mb-6 border border-slate-700">
        <TouchableOpacity 
          onPress={() => setPeriod('weekly')}
          className={`flex-1 py-2.5 rounded-xl items-center ${period === 'weekly' ? 'bg-blue-600' : ''}`}
        >
          <Text className={`font-bold ${period === 'weekly' ? 'text-white' : 'text-slate-400'}`}>Mingguan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setPeriod('monthly')}
          className={`flex-1 py-2.5 rounded-xl items-center ${period === 'monthly' ? 'bg-blue-600' : ''}`}
        >
          <Text className={`font-bold ${period === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Bulanan</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View className="mb-6">
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
             <Ionicons name="trending-up" size={20} color="#10b981" />
             <Text className="text-slate-400 text-[10px] mt-2 uppercase font-bold">Total Omzet</Text>
             <Text className="text-white font-bold text-sm mt-0.5">{formatRupiah(totalOmzet)}</Text>
          </View>
          <View className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
             <Ionicons name="pie-chart" size={20} color="#3b82f6" />
             <Text className="text-slate-400 text-[10px] mt-2 uppercase font-bold">Laba Kotor (Margin)</Text>
             <Text className="text-white font-bold text-sm mt-0.5">{formatRupiah(totalMargin)}</Text>
             <Text className="text-blue-400 text-[10px] font-bold mt-1">%{avgMarginPct.toFixed(1)} Margin</Text>
          </View>
        </View>
        <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center justify-between">
           <View className="flex-row items-center">
              <View className="bg-red-500/20 p-2 rounded-lg">
                <Ionicons name="trending-down" size={16} color="#ef4444" />
              </View>
              <View className="ml-3">
                <Text className="text-slate-400 text-[10px] uppercase font-bold">Total Pengeluaran</Text>
                <Text className="text-white font-bold text-base">{formatRupiah(totalExpense)}</Text>
              </View>
           </View>
           <Text className="text-red-500 text-[10px] font-bold">Biaya Operasional</Text>
        </View>
      </View>

      {/* Charts */}
      <SimpleBarChart 
        title="Grafik Omzet" 
        data={chartData.map(d => ({ label: d.label, value: d.omzet, color: '#3b82f6' }))} 
      />
      
      <SimpleBarChart 
        title="Grafik Pengeluaran" 
        data={chartData.map(d => ({ label: d.label, value: d.expense, color: '#ef4444' }))} 
      />

      {/* Net Profit Card */}
      <View className="bg-gradient-to-br bg-teal-600 rounded-3xl p-6 shadow-xl mb-10">
         <View className="flex-row justify-between items-center mb-1">
            <Text className="text-teal-100 font-bold opacity-80 uppercase text-[10px]">Estimasi Laba Bersih</Text>
            <Ionicons name="sparkles" size={16} color="white" />
         </View>
         <Text className="text-white text-3xl font-black">{formatRupiah(totalMargin - totalExpense)}</Text>
         <Text className="text-teal-200 text-[10px] mt-2 italic font-medium">*Laba Kotor (Margin Offline) dikurangi pengeluaran tercatat</Text>
      </View>

    </ScrollView>
  );
}
