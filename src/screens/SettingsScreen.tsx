import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resetDB } from '../database/db';
import { useAppStore, Rekening } from '../store/appStore';
import { formatRupiah } from '../utils/currency';

type SettingRow = { icon: string; label: string; value?: string; onPress?: () => void };

const SettingItem = ({ icon, label, value, onPress }: SettingRow) => (
  <TouchableOpacity onPress={onPress} className="flex-row items-center bg-slate-800 border border-slate-700/40 rounded-2xl px-4 py-3.5 mb-3">
    <View className="w-9 h-9 rounded-xl bg-slate-700 items-center justify-center mr-3">
      <Ionicons name={icon as any} size={18} color="#94a3b8" />
    </View>
    <Text className="flex-1 text-white font-medium">{label}</Text>
    {value ? <Text className="text-slate-500 text-sm">{value}</Text> : <Ionicons name="chevron-forward" size={16} color="#64748b" />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const store = useAppStore();
  const rekenings = store.rekenings;
  const [showRekModal, setShowRekModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newRekName, setNewRekName] = useState('');
  
  const [transfer, setTransfer] = useState({ from: 0, to: 0, amount: '' });

  const handleReset = () => {
    Alert.alert('Konfirmasi Reset', 'Semua data akan dihapus permanen. Lanjutkan?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { resetDB(); store.loadAll(); Alert.alert('Sukses', 'Database telah direset.'); } },
    ]);
  };

  const handleAddRek = () => {
    if (!newRekName.trim()) return;
    store.addRekening(newRekName);
    setNewRekName('');
    setShowRekModal(false);
  };

  const handleTransfer = () => {
    const amt = parseFloat(transfer.amount);
    if (!transfer.from || !transfer.to || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Lengkapi data transfer dengan benar.');
      return;
    }
    const fromRek = rekenings.find(r => r.id === transfer.from);
    if (fromRek && fromRek.balance < amt) {
      Alert.alert('Saldo Kurang', `Saldo ${fromRek.name} tidak mencukupi.`);
      return;
    }

    store.transferFunds(transfer.from, transfer.to, amt);
    setTransfer({ from: 0, to: 0, amount: '' });
    setShowTransferModal(false);
    Alert.alert('Sukses', 'Dana berhasil dipindahkan.');
  };

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 16 }}>
      
      {/* Profil Toko */}
      <View className="bg-teal-800/30 border border-teal-700/30 rounded-2xl p-5 mb-6 items-center">
        <View className="w-16 h-16 rounded-2xl bg-teal-500/20 border-2 border-teal-500 items-center justify-center mb-3">
          <Ionicons name="storefront" size={30} color="#2dd4bf" />
        </View>
        <Text className="text-white text-xl font-bold">Karis Store</Text>
        <Text className="text-teal-400 text-xs">Sistem Informasi Penjualan (Offline-First)</Text>
      </View>

      {/* Saldo Rekening Section */}
      <Text className="text-slate-500 text-xs font-semibold uppercase mb-2 ml-1 tracking-wider">💳 SALDO AKUN & WALET</Text>
      <View className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-4 mb-4">
        {rekenings.map(r => (
          <View key={r.id} className="flex-row items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
             <Text className="text-slate-300 font-medium">{r.name}</Text>
             <Text className="text-white font-bold">{formatRupiah(r.balance)}</Text>
          </View>
        ))}
        <View className="flex-row gap-2 mt-4">
           <TouchableOpacity onPress={() => setShowRekModal(true)} className="flex-1 bg-slate-700 p-3 rounded-xl items-center"><Text className="text-slate-300 text-xs font-bold">Tambah Akun</Text></TouchableOpacity>
           <TouchableOpacity onPress={() => setShowTransferModal(true)} className="flex-1 bg-blue-600 p-3 rounded-xl items-center shadow-lg"><Text className="text-white text-xs font-bold">Tarik Dana / Transfer</Text></TouchableOpacity>
        </View>
      </View>

      {/* Grup Umum */}
      <Text className="text-slate-500 text-xs font-semibold uppercase mb-2 ml-1 mt-4 tracking-wider">Pengaturan Umum</Text>
      <SettingItem icon="business-outline" label="Nama Toko" value="Karis Store" />
      <SettingItem icon="person-outline" label="Admin" value="Root" />
      <SettingItem icon="trash-outline" label="Reset Semua Data" onPress={handleReset} />

      {/* Modal Tambah Rekening */}
      <Modal visible={showRekModal} transparent animationType="fade" onRequestClose={() => setShowRekModal(false)}>
         <View className="flex-1 bg-black/70 justify-center p-6">
            <View className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
               <Text className="text-white text-lg font-bold mb-4">Tambah Rekening Baru</Text>
               <TextInput className="bg-slate-700 text-white rounded-xl px-4 py-3 mb-5" placeholder="Contoh: Bank BCA, Kas Toko" placeholderTextColor="#64748b" value={newRekName} onChangeText={setNewRekName} />
               <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => setShowRekModal(false)} className="flex-1 py-3 items-center"><Text className="text-slate-400">Batal</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleAddRek} className="flex-1 bg-blue-500 rounded-xl py-3 items-center"><Text className="text-white font-bold">Simpan</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      {/* Modal Tarik Dana / Transfer */}
      <Modal visible={showTransferModal} transparent animationType="slide" onRequestClose={() => setShowTransferModal(false)}>
         <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-slate-800 rounded-t-3xl p-6">
               <Text className="text-white text-xl font-bold mb-1">Tarik Dana / Transfer</Text>
               <Text className="text-slate-500 text-xs mb-6">Pindahkan saldo antar akun atau tarik dari walet</Text>

               <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2">DARI AKUN:</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {rekenings.map(r => (
                    <TouchableOpacity key={r.id} onPress={() => setTransfer(t => ({...t, from: r.id}))} className={`mr-2 px-4 py-2 rounded-xl border ${transfer.from === r.id ? 'bg-blue-500 border-blue-400' : 'bg-slate-700 border-slate-600'}`}>
                      <Text className={`text-xs font-bold ${transfer.from === r.id ? 'text-white' : 'text-slate-400'}`}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
               </ScrollView>

               <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2">KE AKUN TUJUAN:</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                  {rekenings.map(r => (
                    <TouchableOpacity key={r.id} onPress={() => setTransfer(t => ({...t, to: r.id}))} className={`mr-2 px-4 py-2 rounded-xl border ${transfer.to === r.id ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-700 border-slate-600'}`}>
                      <Text className={`text-xs font-bold ${transfer.to === r.id ? 'text-white' : 'text-slate-400'}`}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
               </ScrollView>

               <TextInput keyboardType="numeric" placeholder="Jumlah (Nominal)" placeholderTextColor="#64748b" className="bg-slate-900 text-white text-lg font-black rounded-2xl px-6 py-4 mb-8 border border-slate-700" value={transfer.amount} onChangeText={t => setTransfer(prev => ({...prev, amount: t}))} />

               <TouchableOpacity onPress={handleTransfer} className="bg-blue-500 rounded-2xl py-4 items-center mb-2"><Text className="text-white font-bold text-lg">Konfirmasi Pindahkan Dana</Text></TouchableOpacity>
               <TouchableOpacity onPress={() => setShowTransferModal(false)} className="py-2 items-center"><Text className="text-slate-500">Batalkan</Text></TouchableOpacity>
            </View>
         </View>
      </Modal>

      <View className="h-8" />
    </ScrollView>
  );
}
