import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, TextInput, Alert,
} from 'react-native';
import { useAppStore, CashFlowEntry } from '../store/appStore';
import { formatRupiah } from '../utils/currency';
import { Ionicons } from '@expo/vector-icons';

// ─── Item Riwayat ─────────────────────────────────
const CashFlowItem = ({ item, index }: { item: CashFlowEntry; index: number }) => {
  const isOut = item.type === 'out';
  return (
    <View
      className="flex-row items-center px-4 py-3.5 mb-3 rounded-2xl border border-slate-700/40"
      style={{ backgroundColor: index % 2 === 0 ? '#1e293b' : '#0f172a' }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: isOut ? '#ef444422' : '#10b98122' }}
      >
        <Ionicons
          name={isOut ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={22}
          color={isOut ? '#ef4444' : '#10b981'}
        />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
          {item.description}
        </Text>
        <Text className="text-slate-500 text-xs mt-0.5">
          {new Date(item.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
      </View>
      <Text
        className="font-bold text-sm"
        style={{ color: isOut ? '#ef4444' : '#10b981' }}
      >
        {isOut ? '−' : '+'} {formatRupiah(item.amount)}
      </Text>
    </View>
  );
};

// ─── Modal Tambah Pengeluaran ─────────────────────
const AddExpenseModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal]       = useState('');
  const addCashFlow = useAppStore(s => s.addCashFlow);

  const handleSave = () => {
    const amount = parseFloat(nominal.replace(/[^0-9]/g, ''));
    if (!keterangan.trim()) { Alert.alert('Error', 'Keterangan wajib diisi.'); return; }
    if (!amount || amount <= 0) { Alert.alert('Error', 'Nominal harus lebih dari 0.'); return; }
    addCashFlow({
      type: 'out',
      amount,
      description: keterangan.trim(),
      date: new Date().toISOString(),
    });
    setKeterangan(''); setNominal('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-slate-800 rounded-t-3xl p-6">
          <View className="w-10 h-1 bg-slate-600 rounded-full self-center mb-5" />
          <Text className="text-white text-xl font-bold mb-5">💸 Catat Pengeluaran</Text>

          <Text className="text-slate-400 text-xs mb-1">Keterangan *</Text>
          <TextInput
            className="bg-slate-700 text-white rounded-xl px-4 py-3 mb-4 border border-slate-600"
            placeholder="cth: Beli bensin, Lakban, Bubble wrap"
            placeholderTextColor="#475569"
            value={keterangan}
            onChangeText={setKeterangan}
          />

          <Text className="text-slate-400 text-xs mb-1">Nominal (Rp) *</Text>
          <TextInput
            className="bg-slate-700 text-white rounded-xl px-4 py-3 mb-6 border border-slate-600"
            placeholder="0"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            value={nominal}
            onChangeText={setNominal}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose}
              className="flex-1 bg-slate-700 rounded-xl py-3.5 items-center border border-slate-600">
              <Text className="text-slate-300 font-semibold">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}
              className="flex-1 bg-red-500 rounded-xl py-3.5 items-center">
              <Text className="text-white font-bold">Catat Pengeluaran</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Modal Tambah Pemasukan Manual ────────────────
const AddIncomeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal]       = useState('');
  const addCashFlow = useAppStore(s => s.addCashFlow);

  const handleSave = () => {
    const amount = parseFloat(nominal.replace(/[^0-9]/g, ''));
    if (!keterangan.trim()) { Alert.alert('Error', 'Keterangan wajib diisi.'); return; }
    if (!amount || amount <= 0) { Alert.alert('Error', 'Nominal harus lebih dari 0.'); return; }
    addCashFlow({
      type: 'in',
      amount,
      description: keterangan.trim(),
      date: new Date().toISOString(),
    });
    setKeterangan(''); setNominal('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-slate-800 rounded-t-3xl p-6">
          <View className="w-10 h-1 bg-slate-600 rounded-full self-center mb-5" />
          <Text className="text-white text-xl font-bold mb-5">💵 Catat Pemasukan Manual</Text>

          <Text className="text-slate-400 text-xs mb-1">Keterangan *</Text>
          <TextInput
            className="bg-slate-700 text-white rounded-xl px-4 py-3 mb-4 border border-slate-600"
            placeholder="cth: Transfer kontra bon Toko ABC"
            placeholderTextColor="#475569"
            value={keterangan}
            onChangeText={setKeterangan}
          />

          <Text className="text-slate-400 text-xs mb-1">Nominal (Rp) *</Text>
          <TextInput
            className="bg-slate-700 text-white rounded-xl px-4 py-3 mb-6 border border-slate-600"
            placeholder="0"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            value={nominal}
            onChangeText={setNominal}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose}
              className="flex-1 bg-slate-700 rounded-xl py-3.5 items-center border border-slate-600">
              <Text className="text-slate-300 font-semibold">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}
              className="flex-1 bg-emerald-500 rounded-xl py-3.5 items-center">
              <Text className="text-white font-bold">Catat Pemasukan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────
export default function CashFlowScreen() {
  const store    = useAppStore();
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome]   = useState(false);
  const [filter, setFilter]           = useState<'all' | 'in' | 'out'>('all');

  useEffect(() => { store.loadAll(); }, []);

  const totalKas = store.totalKas();
  const masuk    = store.totalUangMasuk();
  const keluar   = store.totalUangKeluar();

  const filtered = store.cashFlows.filter(c =>
    filter === 'all' ? true : c.type === filter
  );

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header Saldo */}
      <View
        className="px-5 pt-5 pb-6 border-b border-slate-700/50"
        style={{ backgroundColor: totalKas >= 0 ? '#134e4a40' : '#450a0a40' }}
      >
        <Text className="text-slate-400 text-sm">Total Saldo Kas</Text>
        <Text
          className="text-4xl font-bold mt-1"
          style={{ color: totalKas >= 0 ? '#2dd4bf' : '#f87171' }}
        >
          {formatRupiah(totalKas)}
        </Text>
        <View className="flex-row mt-4 gap-8">
          <View className="flex-row items-center gap-2">
            <View className="bg-emerald-500/20 rounded-lg p-1.5">
              <Ionicons name="arrow-down" size={14} color="#10b981" />
            </View>
            <View>
              <Text className="text-slate-400 text-xs">Pemasukan</Text>
              <Text className="text-emerald-400 font-semibold text-sm">{formatRupiah(masuk)}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-red-500/20 rounded-lg p-1.5">
              <Ionicons name="arrow-up" size={14} color="#ef4444" />
            </View>
            <View>
              <Text className="text-slate-400 text-xs">Pengeluaran</Text>
              <Text className="text-red-400 font-semibold text-sm">{formatRupiah(keluar)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row mx-4 mt-4 bg-slate-800 rounded-xl p-1 border border-slate-700 mb-2">
        {([['all', 'Semua'], ['in', 'Masuk ↓'], ['out', 'Keluar ↑']] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: filter === key ? (key === 'in' ? '#10b981' : key === 'out' ? '#ef4444' : '#3b82f6') : 'transparent' }}
          >
            <Text className="text-xs font-semibold" style={{ color: filter === key ? 'white' : '#94a3b8' }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        ListHeaderComponent={
          <Text className="text-slate-500 text-xs uppercase font-semibold mb-3 tracking-wider">
            Riwayat Transaksi ({filtered.length})
          </Text>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="wallet-outline" size={52} color="#1e293b" />
            <Text className="text-slate-600 mt-3">Belum ada transaksi</Text>
          </View>
        }
        renderItem={({ item, index }) => <CashFlowItem item={item} index={index} />}
      />

      {/* FAB Double */}
      <View className="absolute bottom-6 right-6 gap-3">
        <TouchableOpacity
          onPress={() => setShowIncome(true)}
          className="bg-emerald-500 rounded-2xl px-4 py-3 flex-row items-center shadow-lg"
        >
          <Ionicons name="add-circle-outline" size={18} color="white" />
          <Text className="text-white font-bold ml-1.5">Pemasukan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowExpense(true)}
          className="bg-red-500 rounded-2xl px-4 py-3 flex-row items-center shadow-lg"
        >
          <Ionicons name="remove-circle-outline" size={18} color="white" />
          <Text className="text-white font-bold ml-1.5">Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      <AddExpenseModal visible={showExpense} onClose={() => setShowExpense(false)} />
      <AddIncomeModal  visible={showIncome}  onClose={() => setShowIncome(false)} />
    </View>
  );
}
