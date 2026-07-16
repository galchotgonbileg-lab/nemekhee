import { query } from "./db";

export async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      reorder_level INT NOT NULL DEFAULT 0,
      sale_price INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'draft',
      total_amount INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INT NOT NULL,
      unit_price INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'draft',
      total_amount INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      sales_order_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INT NOT NULL,
      unit_price INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      type TEXT NOT NULL,
      quantity INT NOT NULL,
      note TEXT,
      reference_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
