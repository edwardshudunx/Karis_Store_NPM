import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('karis_store.db');

export const initDB = () => {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unit TEXT DEFAULT 'pcs',
        buyPrice REAL NOT NULL DEFAULT 0,
        sellPrice REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        platform TEXT,
        totalAmount REAL NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        customerName TEXT DEFAULT '',
        customerAddress TEXT DEFAULT '',
        customerPhone TEXT DEFAULT '',
        dueDate TEXT,
        parentId INTEGER DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS cash_flow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rekeningId INTEGER DEFAULT 1,
        type TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rekening (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS omset_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        fileName TEXT NOT NULL,
        noOrder TEXT NOT NULL,
        status TEXT NOT NULL,
        totalHarga REAL NOT NULL DEFAULT 0,
        date TEXT NOT NULL,
        uploadDate TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transactionId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        productName TEXT NOT NULL,
        unit TEXT DEFAULT 'pcs',
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (transactionId) REFERENCES transactions (id) ON DELETE CASCADE
      );
    `);

    try {
      db.execSync('ALTER TABLE products ADD COLUMN unit TEXT DEFAULT "pcs";');
    } catch (e) { /* ignore if column exists */ }

    try {
      db.execSync('ALTER TABLE transactions ADD COLUMN customerAddress TEXT DEFAULT "";');
    } catch (e) { /* ignore if column exists */ }

    try {
      db.execSync('ALTER TABLE transactions ADD COLUMN customerPhone TEXT DEFAULT "";');
    } catch (e) { /* ignore if column exists */ }

    try {
      db.execSync('ALTER TABLE transactions ADD COLUMN dueDate TEXT;');
    } catch (e) { /* ignore if column exists */ }

    try {
      db.execSync('ALTER TABLE transactions ADD COLUMN parentId INTEGER;');
    } catch (e) { /* ignore if column exists */ }

    try {
      db.execSync('ALTER TABLE transaction_items ADD COLUMN unit TEXT DEFAULT "pcs";');
    } catch (e) { /* ignore if column exists */ }

    // Migrasi Kolom jika DB sudah ada (Development hack)
    try {
      db.execSync('ALTER TABLE transactions ADD COLUMN platform TEXT;');
    } catch (e) { /* ignore if column exists */ }

    try {
      db.execSync('ALTER TABLE cash_flow ADD COLUMN rekeningId INTEGER DEFAULT 1;');
    } catch (e) { /* ignore */ }

    // Seed initial account if none
    const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM rekening');
    if (count && count.c === 0) {
      db.execSync("INSERT INTO rekening (name, balance) VALUES ('Kas Tunai', 0);");
      db.execSync("INSERT INTO rekening (name, balance) VALUES ('Shopee Walet', 0);");
      db.execSync("INSERT INTO rekening (name, balance) VALUES ('TikTok Walet', 0);");
    }

    console.log('✅ Database diinisialisasi');
  } catch (err) {
    console.error('❌ Gagal inisialisasi database', err);
  }
};

export const resetDB = () => {
  try {
    db.execSync(`
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS cash_flow;
      DROP TABLE IF EXISTS omset_records;
      DROP TABLE IF EXISTS transaction_items;
      DROP TABLE IF EXISTS rekening;
    `);
    initDB();
    console.log('✅ Database di-reset');
  } catch (err) {
    console.error('❌ Gagal reset database', err);
  }
};
