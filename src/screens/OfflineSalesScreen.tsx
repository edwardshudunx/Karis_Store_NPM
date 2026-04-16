import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, FlatList, ActivityIndicator,
} from 'react-native';
import { useAppStore, Transaction, Product, Rekening } from '../store/appStore';
import { formatRupiah } from '../utils/currency';
import { Ionicons } from '@expo/vector-icons';
import { generateInvoicePDF, generateSettlementPDF } from '../services/printService';
import * as Contacts from 'expo-contacts';

type Status = 'lunas' | 'pending' | 'retur';

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: string }> = {
  lunas:   { label: 'Lunas',      color: '#10b981', icon: 'checkmark-circle' },
  pending: { label: 'Kontra Bon', color: '#f59e0b', icon: 'time' },
  retur:   { label: 'Retur',      color: '#ef4444', icon: 'return-up-back' },
};

// ─── Modal Rekening Selector ───
const RekeningPicker = ({ label, selected, onSelect, rekenings }: { label: string, selected: number, onSelect: (id: number) => void, rekenings: Rekening[] }) => (
  <View className="mb-4">
    <Text className="text-slate-500 text-[10px] font-bold uppercase mb-2">{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {rekenings.map(r => (
        <TouchableOpacity key={r.id} onPress={() => onSelect(r.id)} className={`mr-2 px-4 py-2 rounded-xl border ${selected === r.id ? 'bg-blue-500 border-blue-400' : 'bg-slate-700 border-slate-600'}`}>
          <Text className={`text-xs font-bold ${selected === r.id ? 'text-white' : 'text-slate-400'}`}>{r.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// ─── Modal Buat Pesanan ───
const NewOrderModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const store = useAppStore();
  const [form, setForm] = useState({ customer: '', address: '', phone: '', status: 'lunas' as 'lunas' | 'pending', dueWeeks: '1', rekeningId: 1 });
  const [cart, setCart] = useState<{ productId: number; productName: string; qty: number; price: number }[]>([]);
  const [search, setSearch] = useState('');

  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

  const pickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        setForm(f => ({ ...f, customer: contact.name || f.customer, phone: contact.phoneNumbers?.[0]?.number || f.phone, address: contact.addresses?.[0]?.street || f.address }));
      }
    }
  };

  const handleSave = () => {
    if (!form.customer.trim()) { Alert.alert('Error', 'Nama pelanggan wajib diisi.'); return; }
    if (cart.length === 0) { Alert.alert('Error', 'Pilih minimal 1 barang.'); return; }

    let dueDateStr = null;
    if (form.status === 'pending') {
      const dd = new Date();
      dd.setDate(dd.getDate() + (parseInt(form.dueWeeks) * 7));
      dueDateStr = dd.toISOString();
    }

    store.addTransaction({
      type: 'offline',
      totalAmount: total,
      date: new Date().toISOString(),
      dueDate: dueDateStr,
      status: form.status,
      customerName: form.customer.trim(),
      customerAddress: form.address.trim(),
      customerPhone: form.phone.trim(),
    }, cart.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.qty, price: i.price })), form.rekeningId);

    setForm({ customer: '', address: '', phone: '', status: 'lunas', dueWeeks: '1', rekeningId: 1 });
    setCart([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end"><View className="bg-slate-800 rounded-t-3xl p-6 h-[92%]">
          <View className="w-10 h-1 bg-slate-600 rounded-full self-center mb-5" />
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">📑 Buat Pesanan Baru</Text>
            <TouchableOpacity onPress={pickContact} className="bg-blue-500/20 border border-blue-500/40 rounded-xl px-3 py-1.5 flex-row items-center"><Ionicons name="person-add" size={14} color="#3b82f6" /><Text className="text-blue-400 text-xs font-bold ml-1.5">Kontak</Text></TouchableOpacity>
          </View>
          <ScrollView className="flex-1">
            <TextInput className="bg-slate-700 text-white rounded-xl px-4 py-3 mb-2" placeholder="Nama Pelanggan *" placeholderTextColor="#64748b" value={form.customer} onChangeText={t => setForm(f => ({ ...f, customer: t }))} />
            <View className="flex-row gap-2 mb-4">
               <TextInput className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3" placeholder="Telepon" placeholderTextColor="#64748b" value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} />
               <TextInput className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3" placeholder="Alamat" placeholderTextColor="#64748b" value={form.address} onChangeText={t => setForm(f => ({ ...f, address: t }))} />
            </View>
            <View className="flex-row gap-3 mb-4">
               {(['lunas', 'pending'] as const).map(s => (
                 <TouchableOpacity key={s} onPress={() => setForm(f => ({ ...f, status: s }))} className="flex-1 py-3 rounded-xl border-2 items-center" style={{ borderColor: form.status === s ? '#3b82f6' : '#334155', backgroundColor: form.status === s ? '#3b82f622' : 'transparent' }}>
                    <Text className="font-bold uppercase text-xs" style={{ color: form.status === s ? '#3b82f6' : '#64748b' }}>{s === 'lunas' ? '💵 Tunai' : '⏳ Kontra Bon'}</Text>
                 </TouchableOpacity>
               ))}
            </View>
            {form.status === 'lunas' && <RekeningPicker label="Penerimaan ke Akun:" selected={form.rekeningId} onSelect={id => setForm(f => ({...f, rekeningId: id}))} rekenings={store.rekenings} />}
            {form.status === 'pending' && (
              <View className="mb-4 bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
                <Text className="text-amber-500 text-[10px] font-bold uppercase mb-2">Jangka Waktu:</Text>
                <View className="flex-row gap-2">{['1', '2', '4'].map(w => (<TouchableOpacity key={w} onPress={() => setForm(f => ({ ...f, dueWeeks: w }))} className="flex-1 py-1.5 rounded-lg border" style={{ borderColor: form.dueWeeks === w ? '#f59e0b' : '#334155', backgroundColor: form.dueWeeks === w ? '#f59e0b' : 'transparent' }}><Text className="text-center text-[10px] text-white font-bold">{w} Minggu</Text></TouchableOpacity>))}</View>
              </View>
            )}
            <View className="bg-slate-700 rounded-xl px-3 flex-row items-center border border-slate-600 mb-3"><Ionicons name="search" size={14} color="#64748b" /><TextInput className="flex-1 text-white ml-2 py-2 text-sm" placeholder="Cari produk..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} /></View>
            <ScrollView className="max-h-32 mb-4 bg-slate-900/50 rounded-xl p-2">
              {store.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => {
                const inCart = cart.some(i => i.productId === p.id);
                return (
                  <TouchableOpacity key={p.id} onPress={() => inCart ? setCart(cart.filter(i => i.productId !== p.id)) : setCart([...cart, { productId: p.id, productName: p.name, qty: 1, price: p.sellPrice }])} className="flex-row items-center justify-between py-2 border-b border-slate-800/50">
                    <Text className={inCart ? "text-blue-400 font-bold" : "text-slate-300"}>{p.name}</Text>
                    <Ionicons name={inCart ? "checkbox" : "square-outline"} size={18} color={inCart ? "#3b82f6" : "#475569"} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {cart.map((item, idx) => (
                <View key={`cart-${item.productId}-${idx}`} className="bg-slate-700/50 rounded-xl p-3 mb-2 flex-row items-center">
                  <Text className="flex-1 text-white text-xs">{item.productName}</Text>
                  <View className="flex-row items-center bg-slate-800 rounded-lg p-1">
                    <TouchableOpacity onPress={() => setCart(cart.map(i => i.productId === item.productId ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}><Ionicons name="remove" size={14} color="white" /></TouchableOpacity>
                    <TextInput className="text-white font-bold mx-2 text-xs w-8 text-center" keyboardType="numeric" value={String(item.qty)} onChangeText={(v) => { const n = parseInt(v.replace(/[^0-9]/g, '')) || 0; setCart(cart.map(i => i.productId === item.productId ? { ...i, qty: n } : i)); }} />
                    <TouchableOpacity onPress={() => setCart(cart.map(i => i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i))}><Ionicons name="add" size={14} color="white" /></TouchableOpacity>
                  </View>
                </View>
            ))}
          </ScrollView>
          <View className="pt-4 border-t border-slate-700">
            <View className="flex-row justify-between mb-4"><Text className="text-slate-400">Total</Text><Text className="text-blue-400 font-bold text-xl">{formatRupiah(total)}</Text></View>
            <View className="flex-row gap-3"><TouchableOpacity onPress={onClose} className="flex-1 py-4 items-center"><Text className="text-slate-500 font-bold">Batal</Text></TouchableOpacity><TouchableOpacity onPress={handleSave} className="flex-1 bg-blue-500 rounded-2xl py-4 items-center"><Text className="text-white font-bold">Simpan</Text></TouchableOpacity></View>
          </View>
      </View></View>
    </Modal>
  );
};

// ─── Modal Detail & Penagihan ───
const DetailModal = ({ visible, tx, onClose, setIsSettling, setShowRetur }: { visible: boolean; tx: Transaction | null; onClose: () => void; setIsSettling: (v: boolean) => void; setShowRetur: (v: boolean) => void }) => {
  const store = useAppStore();
  const relatedReturns = tx ? store.transactions.filter(t => t.parentId === tx.id && t.status === 'retur') : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end"><View className="bg-slate-800 rounded-t-3xl p-6">
          <Text className="text-white text-xl font-bold mb-1">Pesanan SP-{String(tx?.id).padStart(4, '0')}</Text>
          <Text className="text-slate-500 text-xs mb-4">{tx?.customerName}</Text>
          {tx?.status === 'pending' && (
            <TouchableOpacity onPress={() => { setIsSettling(true); setShowRetur(true); }} className="bg-emerald-500 rounded-2xl py-4 flex-row items-center justify-center mb-3"><Ionicons name="cash" size={18} color="white" /><Text className="text-white font-bold ml-2">Lunasi Tagihan Net</Text></TouchableOpacity>
          )}
          {tx?.status === 'lunas' && (
            <TouchableOpacity onPress={() => generateSettlementPDF(tx, relatedReturns)} className="bg-emerald-600 rounded-xl py-4 flex-row items-center justify-center mb-3"><Ionicons name="document-text-outline" size={18} color="white" /><Text className="text-white font-bold ml-2">Cetak Kwitansi</Text></TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => tx && generateInvoicePDF(tx)} className="bg-slate-700 rounded-xl py-3.5 flex-row items-center justify-center mb-3"><Ionicons name="print-outline" size={18} color="white" /><Text className="text-white font-bold ml-2">Cetak Surat Pesanan</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="mt-2 py-2 items-center"><Text className="text-slate-500">Tutup</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
};

// ─── Modal Retur (Unified with Settlement) ───
const ReturnModal = ({ visible, tx, isSettling, setIsSettling, onClose }: { visible: boolean; tx: Transaction | null; isSettling: boolean; setIsSettling: (v: boolean) => void; onClose: () => void }) => {
  const store = useAppStore();
  const [retItems, setRetItems] = useState<{ productId: number; productName: string; qty: number; price: number; max: number }[]>([]);
  const [rekeningId, setRekeningId] = useState(1);

  useEffect(() => {
    if (tx && tx.items) {
      const grouped = tx.items.reduce((acc, item) => {
        const existing = acc.find(i => i.productId === item.productId);
        if (existing) existing.max += item.quantity;
        else acc.push({ productId: item.productId, productName: item.productName, qty: 0, price: item.price, max: item.quantity });
        return acc;
      }, [] as { productId: number; productName: string; qty: number; price: number; max: number }[]);
      setRetItems(grouped);
    }
  }, [tx]);

  const handleReturnAction = () => {
    if (!tx) return;
    const toReturn = retItems.filter(i => i.qty > 0);
    if (toReturn.length > 0) store.processReturn(tx.id, toReturn, rekeningId);

    if (isSettling) {
      store.settleBill(tx.id, rekeningId);
      const oldReturns = store.transactions.filter(t => t.parentId === tx.id && t.status === 'retur');
      let finalReturns = [...oldReturns];
      if (toReturn.length > 0) finalReturns.push({ totalAmount: toReturn.reduce((s, i) => s + (i.price * i.qty), 0), items: toReturn.map(i => ({ productName: i.productName, quantity: i.qty, price: i.price })) } as any);
      generateSettlementPDF(tx, finalReturns);
      setIsSettling(false);
      Alert.alert('Sukses', 'Tagihan lunas & Kwitansi dibuat.');
    } else { Alert.alert('Sukses', 'Retur dicatat.'); }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end"><View className="bg-slate-800 rounded-t-3xl p-6 h-[80%]">
        <Text className="text-red-400 text-xl font-bold mb-1">{isSettling ? '💰 Pelunasan & Retur' : '↩️ Pilih Retur'}</Text>
        <ScrollView className="flex-1 mb-5">
           {retItems.map((item, idx) => (
                <View key={`ret-${item.productId}-${idx}`} className="flex-row items-center bg-slate-900/50 p-3 mb-2 rounded-xl">
                  <Text className="flex-1 text-slate-300 text-xs">{item.productName}</Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => setRetItems(retItems.map(i => i.productId === item.productId ? { ...i, qty: Math.max(0, i.qty - 1) } : i))}><Ionicons name="remove-circle" size={24} color="#ef4444" /></TouchableOpacity>
                    <TextInput className="text-white font-bold mx-3 w-8 text-center" keyboardType="numeric" value={String(item.qty)} onChangeText={(v) => { const n = parseInt(v.replace(/[^0-9]/g, '')) || 0; setRetItems(retItems.map(i => i.productId === item.productId ? { ...i, qty: Math.min(i.max, Math.max(0, n)) } : i)); }} />
                    <TouchableOpacity onPress={() => setRetItems(retItems.map(i => i.productId === item.productId ? { ...i, qty: Math.min(item.max, item.qty + 1) } : i))}><Ionicons name="add-circle" size={24} color="#10b981" /></TouchableOpacity>
                  </View>
                </View>
           ))}
           {isSettling && <RekeningPicker label="Penerimaan Lunas ke Akun:" selected={rekeningId} onSelect={setRekeningId} rekenings={store.rekenings} />}
        </ScrollView>
        <TouchableOpacity onPress={handleReturnAction} className={`${isSettling ? 'bg-emerald-500' : 'bg-red-500'} py-4 rounded-2xl items-center`}><Text className="text-white font-bold">{isSettling ? 'Konfirmasi Pelunasan' : 'Proses Retur'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { setIsSettling(false); onClose(); }} className="py-2 items-center"><Text className="text-slate-500">Batal</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
};

// ─── Main Screen ───
export default function OfflineSalesScreen() {
  const store = useAppStore();
  const [tab, setTab] = useState<'pesanan' | 'retur'>('pesanan');
  const [showNew, setShowNew] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction|null>(null);
  const [showRetur, setShowRetur] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { store.loadAll(); }, []);

  const data = store.transactions.filter(t => t.type === 'offline' && (tab === 'pesanan' ? t.status !== 'retur' : t.status === 'retur'))
               .filter(t => (t.customerName || '').toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search));

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-row mx-4 mt-4 bg-slate-800 rounded-2xl p-1 border border-slate-700">
        {(['pesanan', 'retur'] as const).map(t => (<TouchableOpacity key={t} onPress={() => setTab(t)} className="flex-1 py-2 rounded-xl items-center" style={{ backgroundColor: tab === t ? '#3b82f6' : 'transparent' }}><Text className="font-bold capitalize" style={{ color: tab === t ? 'white' : '#94a3b8' }}>{t}</Text></TouchableOpacity>))}
      </View>
      <View className="mx-4 mt-4 bg-slate-800 rounded-2xl px-4 flex-row items-center border border-slate-700">
        <Ionicons name="search" size={18} color="#64748b" /><TextInput className="flex-1 text-white ml-3 py-3" placeholder="Nama atau SP..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />
      </View>

      <FlatList data={data} keyExtractor={item => String(item.id)} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => {
          const isOverdue = item.status === 'pending' && item.dueDate && new Date(item.dueDate) < new Date();
          return (
            <TouchableOpacity onPress={() => setSelectedTx(item)} className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white font-bold">SP-{String(item.id).padStart(4, '0')}</Text>
                <View className="rounded px-2 py-0.5" style={{ backgroundColor: STATUS_CONFIG[item.status as Status]?.color + '22' }}><Text className="text-[10px] font-bold uppercase" style={{ color: STATUS_CONFIG[item.status as Status]?.color }}>{STATUS_CONFIG[item.status as Status]?.label}</Text></View>
              </View>
              <Text className="text-slate-400 font-semibold text-sm mb-1">{item.customerName}</Text>
              <View className="flex-row justify-between items-end"><View><Text className="text-slate-600 text-[10px]">{new Date(item.date).toLocaleDateString('id-ID')}</Text>{item.status === 'pending' && item.dueDate && (<Text className={`text-[10px] font-bold mt-0.5 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>📅 Tempo: {new Date(item.dueDate).toLocaleDateString('id-ID')}</Text>)}</View><Text className="text-white font-bold">{formatRupiah(item.totalAmount)}</Text></View>
            </TouchableOpacity>
          );
        }}
      />
      {tab === 'pesanan' && <TouchableOpacity onPress={() => setShowNew(true)} className="absolute bottom-6 right-6 bg-blue-500 rounded-2xl px-5 py-3.5 flex-row items-center shadow-lg"><Ionicons name="add" size={18} color="white" /><Text className="text-white font-bold ml-2">Surat Pesanan</Text></TouchableOpacity>}
      <NewOrderModal visible={showNew} onClose={() => setShowNew(false)} />
      <DetailModal visible={!!selectedTx && !showRetur} tx={selectedTx} onClose={() => setSelectedTx(null)} setIsSettling={setIsSettling} setShowRetur={setShowRetur} />
      <ReturnModal visible={showRetur} tx={selectedTx} isSettling={isSettling} setIsSettling={setIsSettling} onClose={() => { setShowRetur(false); setSelectedTx(null); }} />
    </View>
  );
}
