import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAppStore, Product } from '../store/appStore';
import { formatRupiah } from '../utils/currency';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { parseProductExcel } from '../services/excelProductParser';

// ─── Modal Produk Baru ────────────────────────────
// DIPERBAIKI: Memisahkan komponen modal agar re-render tidak mengganggu focus keyboard
const AddProductModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ name: '', unit: '', buyPrice: '', sellPrice: '', stock: '' });
  const addProduct = useAppStore(s => s.addProduct);

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Nama produk wajib diisi.'); return; }
    addProduct({
      name:      form.name.trim(),
      unit:      form.unit.trim() || 'pcs',
      buyPrice:  parseFloat(form.buyPrice.replace(/[^0-9]/g, '')) || 0,
      sellPrice: parseFloat(form.sellPrice.replace(/[^0-9]/g, '')) || 0,
      stock:     parseInt(form.stock) || 0,
    });
    setForm({ name: '', unit: '', buyPrice: '', sellPrice: '', stock: '' });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-slate-800 rounded-t-3xl p-6">
          <View className="w-10 h-1 bg-slate-600 rounded-full self-center mb-5" />
          <Text className="text-white text-xl font-bold mb-5">📦 Tambah Produk Baru</Text>
          
          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-1">Nama Produk*</Text>
            <TextInput
              className="bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600"
              placeholderTextColor="#475569" value={form.name}
              onChangeText={t => setForm(f => ({ ...f, name: t }))}
            />
          </View>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-1">Kemasan / Unit (cth: Dus, 100ml)*</Text>
            <TextInput
              className="bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600"
              placeholderTextColor="#475569" value={form.unit} placeholder="pcs"
              onChangeText={t => setForm(f => ({ ...f, unit: t }))}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-1">Harga Modal (Rp)*</Text>
              <TextInput
                className="bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600"
                placeholderTextColor="#475569" keyboardType="numeric" value={form.buyPrice}
                onChangeText={t => setForm(f => ({ ...f, buyPrice: t }))}
              />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-1">Harga Jual (Rp)</Text>
              <TextInput
                className="bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600"
                placeholderTextColor="#475569" keyboardType="numeric" value={form.sellPrice}
                onChangeText={t => setForm(f => ({ ...f, sellPrice: t }))}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-slate-400 text-xs mb-1">Stok Awal</Text>
            <TextInput
              className="bg-slate-700 text-white rounded-xl px-4 py-3 border border-slate-600"
              placeholderTextColor="#475569" keyboardType="numeric" value={form.stock}
              onChangeText={t => setForm(f => ({ ...f, stock: t }))}
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 bg-slate-700 rounded-xl py-3.5 items-center">
              <Text className="text-slate-300 font-semibold">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} className="flex-1 bg-violet-500 rounded-xl py-3.5 items-center">
              <Text className="text-white font-bold">Simpan Produk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────
export default function StockScreen() {
  const store = useAppStore();
  const [search, setSearch]               = useState('');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [isImporting, setIsImporting]     = useState(false);

  useEffect(() => { store.loadAll(); }, []);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      if (res.canceled) return;
      const file = res.assets[0];
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      const products = parseProductExcel(base64);
      store.importProducts(products);
      Alert.alert('Sukses', `${products.length} produk berhasil diimport ke stok.`);
    } catch (e: any) {
      Alert.alert('Gagal Import', e?.message || 'Gagal memproses file Excel.');
    } finally {
      setIsImporting(false);
    }
  };

  const filtered = store.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header & Search */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5">
            <Ionicons name="search" size={16} color="#64748b" />
            <TextInput
              className="flex-1 text-white ml-2 text-sm"
              placeholder="Cari nama produk..."
              placeholderTextColor="#64748b" value={search} onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity onPress={handleImport} disabled={isImporting}
            className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-2xl items-center justify-center">
            {isImporting ? <ActivityIndicator size="small" color="#8b5cf6" /> : <Ionicons name="cloud-upload-outline" size={20} color="#8b5cf6" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View className="mx-4 mt-3 mb-2 bg-violet-900/30 border border-violet-700/30 rounded-2xl px-4 py-3 flex-row justify-between shrink-0">
         <View className="items-center flex-1"><Text className="text-slate-400 text-xs">SKU</Text><Text className="text-white font-bold">{store.products.length}</Text></View>
         <View className="w-px bg-slate-700" />
         <View className="items-center flex-1"><Text className="text-slate-400 text-xs">Aset</Text><Text className="text-white font-bold text-xs">{formatRupiah(store.totalAsetStok())}</Text></View>
         <View className="w-px bg-slate-700" />
         <View className="items-center flex-1"><Text className="text-slate-400 text-xs">⚠️ Stok Tipis</Text><Text className="text-amber-400 font-bold">{store.lowStockCount()}</Text></View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="bg-slate-800 border border-slate-700/40 rounded-2xl px-4 py-3.5 mb-3 flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-violet-500/10 items-center justify-center mr-3">
              <Ionicons name="cube" size={18} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{item.name}</Text>
              <Text className="text-slate-500 text-xs">Modal: {formatRupiah(item.buyPrice)} | Jual: {formatRupiah(item.sellPrice)}</Text>
              <View className="flex-row items-center mt-0.5">
                <View className="bg-slate-700 px-1.5 py-0.5 rounded">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">{item.unit}</Text>
                </View>
              </View>
            </View>
            <View className="items-end">
               <Text className={`font-bold text-base ${item.stock < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>{item.stock}</Text>
               <Text className="text-slate-500 text-[10px] uppercase">{item.unit}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 bg-violet-500 rounded-2xl px-5 py-3.5 flex-row items-center shadow-lg">
        <Ionicons name="add" size={18} color="white" />
        <Text className="text-white font-bold ml-1">Tambah Produk</Text>
      </TouchableOpacity>

      <AddProductModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
    </View>
  );
}
