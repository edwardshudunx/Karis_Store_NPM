import { create } from 'zustand';
import { db } from '../database/db';

// ─── Types ───────────────────────────────────────────
export type Product = {
  id: number;
  name: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
};

export type TransactionItem = {
  id: number;
  transactionId: number;
  productId: number;
  productName: string;
  unit: string;
  quantity: number;
  price: number;
};

export type Transaction = {
  id: number;
  type: 'offline' | 'online';
  platform?: string;
  totalAmount: number;
  date: string;
  dueDate?: string;
  status: 'lunas' | 'pending' | 'retur';
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  parentId?: number; 
  items?: TransactionItem[];
};

export type CashFlowEntry = {
  id: number;
  rekeningId: number;
  type: 'in' | 'out';
  amount: number;
  description: string;
  date: string;
};

export type Rekening = {
  id: number;
  name: string;
  balance: number;
};

// ─── Store ───────────────────────────────────────────
type AppState = {
  products: Product[];
  cashFlows: CashFlowEntry[];
  transactions: Transaction[];
  rekenings: Rekening[];

  loadAll: () => void;

  // Products
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateStock: (id: number, delta: number) => void;
  deleteProduct: (id: number) => void;
  importProducts: (list: Omit<Product, 'id'>[]) => void;

  // Cash Flow
  addCashFlow: (entry: Omit<CashFlowEntry, 'id'>) => void;

  // Rekening
  addRekening: (name: string) => void;
  transferFunds: (fromId: number, toId: number, amount: number) => void;

  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'items'>, items: Omit<TransactionItem, 'id' | 'transactionId' | 'unit'>[], rekeningId?: number) => void;
  processReturn: (originalTxId: number, returnItems: { productId: number; productName: string; qty: number; price: number }[], rekeningId?: number) => void;
  settleBill: (orderId: number, rekeningId: number) => void; 

  // Computed
  totalKas: () => number;
  totalUangMasuk: () => number;
  totalUangKeluar: () => number;
  totalOmzetBulanIni: () => number;
  totalAsetStok: () => number;
  lowStockCount: () => number;
};

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  cashFlows: [],
  transactions: [],
  rekenings: [],

  loadAll: () => {
    try {
      const products = db.getAllSync('SELECT * FROM products ORDER BY name') as Product[];
      const cashFlows = db.getAllSync('SELECT * FROM cash_flow ORDER BY date DESC') as CashFlowEntry[];
      const rekenings = db.getAllSync('SELECT * FROM rekening') as Rekening[];
      const txs = db.getAllSync('SELECT * FROM transactions ORDER BY date DESC') as Transaction[];
      const allItems = db.getAllSync('SELECT * FROM transaction_items') as TransactionItem[];
      
      const transactions = txs.map(t => ({
        ...t,
        items: allItems.filter(i => i.transactionId === t.id)
      }));

      set({ products, cashFlows, transactions, rekenings });
    } catch (e) {
      console.error('loadAll error', e);
    }
  },

  addProduct: (p) => {
    db.runSync('INSERT INTO products (name, unit, buyPrice, sellPrice, stock) VALUES (?, ?, ?, ?, ?)', [p.name, p.unit, p.buyPrice, p.sellPrice, p.stock]);
    get().loadAll();
  },

  updateStock: (id, delta) => {
    db.runSync('UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?', [delta, id]);
    get().loadAll();
  },

  deleteProduct: (id) => {
    db.runSync('DELETE FROM products WHERE id = ?', [id]);
    get().loadAll();
  },

  importProducts: (list) => {
    try {
      for (const p of list) {
        const existing = db.getFirstSync('SELECT id, stock FROM products WHERE LOWER(name) = LOWER(?)', [p.name.trim()]) as any;
        if (existing) {
          db.runSync('UPDATE products SET stock = stock + ?, buyPrice = ?, sellPrice = ?, unit = ? WHERE id = ?', [p.stock, p.buyPrice, p.sellPrice, p.unit, existing.id]);
        } else {
          db.runSync('INSERT INTO products (name, unit, buyPrice, sellPrice, stock) VALUES (?, ?, ?, ?, ?)', [p.name.trim(), p.unit, p.buyPrice, p.sellPrice, p.stock]);
        }
      }
      get().loadAll();
    } catch (e) { console.error('Import error', e); }
  },

  addRekening: (name) => {
    db.runSync('INSERT INTO rekening (name, balance) VALUES (?, ?)', [name, 0]);
    get().loadAll();
  },

  addCashFlow: (entry) => {
    db.runSync('INSERT INTO cash_flow (rekeningId, type, amount, description, date) VALUES (?, ?, ?, ?, ?)', 
      [entry.rekeningId, entry.type, entry.amount, entry.description, entry.date]);
    
    // Update balance in rekening table
    if (entry.type === 'in') {
      db.runSync('UPDATE rekening SET balance = balance + ? WHERE id = ?', [entry.amount, entry.rekeningId]);
    } else {
      db.runSync('UPDATE rekening SET balance = balance - ? WHERE id = ?', [entry.amount, entry.rekeningId]);
    }
    get().loadAll();
  },

  transferFunds: (fromId, toId, amount) => {
    const now = new Date().toISOString();
    const fromName = get().rekenings.find(r => r.id === fromId)?.name;
    const toName = get().rekenings.find(r => r.id === toId)?.name;

    get().addCashFlow({
      rekeningId: fromId,
      type: 'out',
      amount,
      description: `Tarik Dana/Transfer ke ${toName}`,
      date: now
    });
    get().addCashFlow({
      rekeningId: toId,
      type: 'in',
      amount,
      description: `Penerimaan Tarik Dana dari ${fromName}`,
      date: now
    });
  },

  addTransaction: (t, items, rekeningId = 1) => {
    try {
      const res = db.runSync(
        'INSERT INTO transactions (type, platform, totalAmount, date, dueDate, status, customerName, customerAddress, customerPhone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.type, t.platform ?? null, t.totalAmount, t.date, t.dueDate ?? null, t.status, t.customerName ?? '', t.customerAddress ?? '', t.customerPhone ?? '']
      );
      const txId = res.lastInsertRowId;
      const stmt = db.prepareSync('INSERT INTO transaction_items (transactionId, productId, productName, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)');
      try {
        for (const item of items) {
          const prod = get().products.find(p => p.id === item.productId);
          stmt.executeSync([txId, item.productId, item.productName, prod?.unit || 'pcs', item.quantity, item.price]);
          get().updateStock(item.productId, -item.quantity);
        }
      } finally { stmt.finalizeSync(); }

      if (t.status === 'lunas') {
        get().addCashFlow({ 
          rekeningId,
          type: 'in', 
          amount: t.totalAmount, 
          description: `Penjualan Tunai - ${t.customerName}`, 
          date: t.date 
        });
      }
      get().loadAll();
    } catch (e) {
      console.error('addTransaction error', e);
      throw e;
    }
  },

  processReturn: (originalTxId, returnItems, rekeningId = 1) => {
    try {
      const now = new Date().toISOString();
      const original = get().transactions.find(t => t.id === originalTxId);
      if (!original) return;
      const totalReturn = returnItems.reduce((s, i) => s + (i.price * i.qty), 0);
      const res = db.runSync('INSERT INTO transactions (type, platform, totalAmount, date, status, customerName, customerAddress, customerPhone, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['offline', original.platform ?? null, totalReturn, now, 'retur', original.customerName, original.customerAddress ?? '', original.customerPhone ?? '', originalTxId]);
      const retId = res.lastInsertRowId;
      const stmt = db.prepareSync('INSERT INTO transaction_items (transactionId, productId, productName, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)');
      try {
        for (const item of returnItems) {
          const prod = get().products.find(p => p.id === item.productId);
          stmt.executeSync([retId, item.productId, item.productName, prod?.unit || 'pcs', item.qty, item.price]);
          get().updateStock(item.productId, item.qty);
        }
      } finally { stmt.finalizeSync(); }

      if (original.status === 'lunas') {
        get().addCashFlow({ 
          rekeningId,
          type: 'out', 
          amount: totalReturn, 
          description: `Pengembalian Dana Retur - ${original.customerName} (SP-${String(originalTxId).padStart(4, '0')})`, 
          date: now 
        });
      }
      get().loadAll();
    } catch (e) { console.error('processReturn error', e); throw e; }
  },

  settleBill: (orderId, rekeningId) => {
    const order = get().transactions.find(t => t.id === orderId);
    if (!order || order.status !== 'pending') return;

    const returns = get().transactions.filter(t => t.parentId === orderId && t.status === 'retur');
    const totalReturn = returns.reduce((s, r) => s + r.totalAmount, 0);
    const netAmount = order.totalAmount - totalReturn;

    db.runSync('UPDATE transactions SET status = "lunas" WHERE id = ?', [orderId]);
    get().addCashFlow({
      rekeningId,
      type: 'in',
      amount: netAmount,
      description: `Pelunasan Penagihan SP-${String(orderId).padStart(4, '0')} (Net Retur)`,
      date: new Date().toISOString()
    });
    get().loadAll();
  },

  totalKas: () => get().rekenings.reduce((s, r) => s + r.balance, 0),
  totalUangMasuk: () => get().cashFlows.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0),
  totalUangKeluar: () => get().cashFlows.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0),
  totalOmzetBulanIni: () => {
    const now = new Date();
    return get().transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, t) => s + t.totalAmount, 0);
  },
  totalAsetStok: () => get().products.reduce((s, p) => s + p.buyPrice * p.stock, 0),
  lowStockCount: () => get().products.filter(p => p.stock < 10).length,
}));
