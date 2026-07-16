import { Request, Response } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { query } from "./db";
import type {
  Customer,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  StockMovement,
  Supplier
} from "@warehouse/shared";

const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  unit: z.string().min(1),
  quantity: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
  salePrice: z.number().nonnegative().default(0)
});

const supplierSchema = z.object({
  name: z.string().min(2),
  contact: z.string().optional()
});

const customerSchema = z.object({
  name: z.string().min(2),
  contact: z.string().optional()
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative()
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  items: z.array(orderItemSchema).min(1)
});

const salesOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1)
});

const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  referenceId: z.string().optional()
});

function serializeProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    unit: row.unit,
    quantity: row.quantity,
    reorderLevel: row.reorder_level,
    salePrice: row.sale_price,
    status: row.status,
    updatedAt: row.updated_at.toISOString()
  };
}

function serializeSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

function serializeCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

function serializePurchaseOrderItem(row: any): PurchaseOrderItem {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price
  };
}

function serializeSalesOrderItem(row: any): SalesOrderItem {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price
  };
}

function serializePurchaseOrder(row: any, items: PurchaseOrderItem[] = []): PurchaseOrder {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    status: row.status,
    totalAmount: row.total_amount,
    createdAt: row.created_at.toISOString(),
    items
  };
}

function serializeSalesOrder(row: any, items: SalesOrderItem[] = []): SalesOrder {
  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    totalAmount: row.total_amount,
    createdAt: row.created_at.toISOString(),
    items
  };
}

export async function listProducts(_request: Request, response: Response) {
  const result = await query("SELECT * FROM products ORDER BY updated_at DESC");
  response.json(result.rows.map(serializeProduct));
}

export async function createProduct(request: Request, response: Response) {
  const parsed = productSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const product: Product = {
    id: nanoid(),
    status: "active",
    updatedAt: new Date().toISOString(),
    ...parsed.data
  };

  await query(
    `INSERT INTO products (id, sku, name, category, unit, quantity, reorder_level, sale_price, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      product.id,
      product.sku,
      product.name,
      product.category,
      product.unit,
      product.quantity,
      product.reorderLevel,
      product.salePrice,
      product.status,
      product.updatedAt
    ]
  );

  response.status(201).json(product);
}

export async function listStockMovements(_request: Request, response: Response) {
  const result = await query("SELECT * FROM stock_movements ORDER BY created_at DESC");
  response.json(
    result.rows.map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      type: row.type,
      quantity: row.quantity,
      note: row.note ?? undefined,
      referenceId: row.reference_id ?? undefined,
      createdAt: row.created_at.toISOString()
    }))
  );
}

export async function createStockMovement(request: Request, response: Response) {
  const parsed = movementSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const productResult = await query("SELECT * FROM products WHERE id = $1", [parsed.data.productId]);

  if (productResult.rowCount === 0) {
    response.status(404).json({ error: "Product not found" });
    return;
  }

  const product = productResult.rows[0];
  const currentQuantity = product.quantity as number;
  const signedQuantity = parsed.data.type === "out" ? -parsed.data.quantity : parsed.data.quantity;
  const updatedQuantity =
    parsed.data.type === "adjustment"
      ? parsed.data.quantity
      : Math.max(0, currentQuantity + signedQuantity);
  const updatedAt = new Date().toISOString();

  await query("BEGIN");
  try {
    await query(
      "UPDATE products SET quantity = $1, updated_at = $2 WHERE id = $3",
      [updatedQuantity, updatedAt, parsed.data.productId]
    );

    const movement: StockMovement = {
      id: nanoid(),
      productId: parsed.data.productId,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      note: parsed.data.note,
      referenceId: parsed.data.referenceId,
      createdAt: updatedAt
    };

    await query(
      `INSERT INTO stock_movements (id, product_id, type, quantity, note, reference_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        movement.id,
        movement.productId,
        movement.type,
        movement.quantity,
        movement.note,
        movement.referenceId ?? null,
        movement.createdAt
      ]
    );

    await query("COMMIT");
    response.status(201).json({ movement, product: { ...product, quantity: updatedQuantity, updatedAt } });
  } catch (error) {
    await query("ROLLBACK");
    response.status(500).json({ error: "Failed to record stock movement" });
  }
}

export async function listSuppliers(_request: Request, response: Response) {
  const result = await query("SELECT * FROM suppliers ORDER BY created_at DESC");
  response.json(result.rows.map(serializeSupplier));
}

export async function createSupplier(request: Request, response: Response) {
  const parsed = supplierSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const supplier: Supplier = {
    id: nanoid(),
    name: parsed.data.name,
    contact: parsed.data.contact,
    createdAt: new Date().toISOString()
  };

  await query(
    `INSERT INTO suppliers (id, name, contact, created_at) VALUES ($1, $2, $3, $4)`,
    [supplier.id, supplier.name, supplier.contact ?? null, supplier.createdAt]
  );

  response.status(201).json(supplier);
}

export async function listCustomers(_request: Request, response: Response) {
  const result = await query("SELECT * FROM customers ORDER BY created_at DESC");
  response.json(result.rows.map(serializeCustomer));
}

export async function createCustomer(request: Request, response: Response) {
  const parsed = customerSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const customer: Customer = {
    id: nanoid(),
    name: parsed.data.name,
    contact: parsed.data.contact,
    createdAt: new Date().toISOString()
  };

  await query(
    `INSERT INTO customers (id, name, contact, created_at) VALUES ($1, $2, $3, $4)`,
    [customer.id, customer.name, customer.contact ?? null, customer.createdAt]
  );

  response.status(201).json(customer);
}

export async function listPurchaseOrders(_request: Request, response: Response) {
  const result = await query("SELECT * FROM purchase_orders ORDER BY created_at DESC");
  const orderIds = result.rows.map((row: any) => row.id);
  const items =
    orderIds.length > 0
      ? await query("SELECT * FROM purchase_order_items WHERE purchase_order_id = ANY($1)", [orderIds])
      : { rows: [] };

  const itemsByOrder = new Map<string, PurchaseOrderItem[]>();
  for (const row of items.rows) {
    const item = serializePurchaseOrderItem(row);
    const collection = itemsByOrder.get(item.purchaseOrderId) ?? [];
    collection.push(item);
    itemsByOrder.set(item.purchaseOrderId, collection);
  }

  response.json(
    result.rows.map((row: any) => serializePurchaseOrder(row, itemsByOrder.get(row.id) ?? []))
  );
}

export async function createPurchaseOrder(request: Request, response: Response) {
  const parsed = purchaseOrderSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const supplierResult = await query("SELECT id FROM suppliers WHERE id = $1", [parsed.data.supplierId]);
  if (supplierResult.rowCount === 0) {
    response.status(404).json({ error: "Supplier not found" });
    return;
  }

  const totalAmount = parsed.data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const purchaseOrder: PurchaseOrder = {
    id: nanoid(),
    supplierId: parsed.data.supplierId,
    status: "draft",
    totalAmount,
    createdAt: new Date().toISOString(),
    items: parsed.data.items.map((item) => ({
      id: nanoid(),
      purchaseOrderId: "",
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  };

  await query("BEGIN");
  try {
    await query(
      `INSERT INTO purchase_orders (id, supplier_id, status, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [purchaseOrder.id, purchaseOrder.supplierId, purchaseOrder.status, purchaseOrder.totalAmount, purchaseOrder.createdAt]
    );

    for (const item of parsed.data.items) {
      await query(
        `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [nanoid(), purchaseOrder.id, item.productId, item.quantity, item.unitPrice]
      );
    }

    await query("COMMIT");
    response.status(201).json({ ...purchaseOrder, items: parsed.data.items.map((item) => ({
      id: nanoid(),
      purchaseOrderId: purchaseOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })) });
  } catch (error) {
    await query("ROLLBACK");
    response.status(500).json({ error: "Could not create purchase order" });
  }
}

export async function receivePurchaseOrder(request: Request, response: Response) {
  const { id } = request.params;
  const orderResult = await query("SELECT * FROM purchase_orders WHERE id = $1", [id]);

  if (orderResult.rowCount === 0) {
    response.status(404).json({ error: "Purchase order not found" });
    return;
  }

  const order = orderResult.rows[0];
  if (order.status === "received") {
    response.status(400).json({ error: "Purchase order already received" });
    return;
  }

  const itemsResult = await query("SELECT * FROM purchase_order_items WHERE purchase_order_id = $1", [id]);
  const updatedAt = new Date().toISOString();

  await query("BEGIN");
  try {
    for (const item of itemsResult.rows) {
      const productResult = await query("SELECT quantity FROM products WHERE id = $1", [item.product_id]);
      if (productResult.rowCount === 0) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const currentQuantity = productResult.rows[0].quantity as number;
      const newQuantity = currentQuantity + item.quantity;

      await query(
        "UPDATE products SET quantity = $1, updated_at = $2 WHERE id = $3",
        [newQuantity, updatedAt, item.product_id]
      );

      await query(
        `INSERT INTO stock_movements (id, product_id, type, quantity, note, reference_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [nanoid(), item.product_id, "in", item.quantity, `Received PO ${id}`, id, updatedAt]
      );
    }

    await query("UPDATE purchase_orders SET status = $1 WHERE id = $2", ["received", id]);
    await query("COMMIT");
    response.json({ success: true });
  } catch (error) {
    await query("ROLLBACK");
    response.status(500).json({ error: "Could not receive purchase order" });
  }
}

export async function listSalesOrders(_request: Request, response: Response) {
  const result = await query("SELECT * FROM sales_orders ORDER BY created_at DESC");
  const orderIds = result.rows.map((row: any) => row.id);
  const items =
    orderIds.length > 0
      ? await query("SELECT * FROM sales_order_items WHERE sales_order_id = ANY($1)", [orderIds])
      : { rows: [] };

  const itemsByOrder = new Map<string, SalesOrderItem[]>();
  for (const row of items.rows) {
    const item = serializeSalesOrderItem(row);
    const collection = itemsByOrder.get(item.salesOrderId) ?? [];
    collection.push(item);
    itemsByOrder.set(item.salesOrderId, collection);
  }

  response.json(result.rows.map((row: any) => serializeSalesOrder(row, itemsByOrder.get(row.id) ?? [])));
}

export async function createSalesOrder(request: Request, response: Response) {
  const parsed = salesOrderSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const customerResult = await query("SELECT id FROM customers WHERE id = $1", [parsed.data.customerId]);
  if (customerResult.rowCount === 0) {
    response.status(404).json({ error: "Customer not found" });
    return;
  }

  const totalAmount = parsed.data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const salesOrder: SalesOrder = {
    id: nanoid(),
    customerId: parsed.data.customerId,
    status: "draft",
    totalAmount,
    createdAt: new Date().toISOString(),
    items: parsed.data.items.map((item) => ({
      id: nanoid(),
      salesOrderId: "",
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  };

  await query("BEGIN");
  try {
    await query(
      `INSERT INTO sales_orders (id, customer_id, status, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [salesOrder.id, salesOrder.customerId, salesOrder.status, salesOrder.totalAmount, salesOrder.createdAt]
    );

    for (const item of parsed.data.items) {
      await query(
        `INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [nanoid(), salesOrder.id, item.productId, item.quantity, item.unitPrice]
      );
    }

    await query("COMMIT");
    response.status(201).json({ ...salesOrder, items: parsed.data.items.map((item) => ({
      id: nanoid(),
      salesOrderId: salesOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })) });
  } catch (error) {
    await query("ROLLBACK");
    response.status(500).json({ error: "Could not create sales order" });
  }
}

export async function shipSalesOrder(request: Request, response: Response) {
  const { id } = request.params;
  const orderResult = await query("SELECT * FROM sales_orders WHERE id = $1", [id]);

  if (orderResult.rowCount === 0) {
    response.status(404).json({ error: "Sales order not found" });
    return;
  }

  const order = orderResult.rows[0];
  if (order.status === "shipped") {
    response.status(400).json({ error: "Sales order already shipped" });
    return;
  }

  const itemsResult = await query("SELECT * FROM sales_order_items WHERE sales_order_id = $1", [id]);
  const updatedAt = new Date().toISOString();

  await query("BEGIN");
  try {
    for (const item of itemsResult.rows) {
      const productResult = await query("SELECT quantity FROM products WHERE id = $1", [item.product_id]);
      if (productResult.rowCount === 0) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const currentQuantity = productResult.rows[0].quantity as number;
      if (currentQuantity < item.quantity) {
        throw new Error(`Not enough stock for product ${item.product_id}`);
      }

      const newQuantity = currentQuantity - item.quantity;
      await query(
        "UPDATE products SET quantity = $1, updated_at = $2 WHERE id = $3",
        [newQuantity, updatedAt, item.product_id]
      );

      await query(
        `INSERT INTO stock_movements (id, product_id, type, quantity, note, reference_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [nanoid(), item.product_id, "out", item.quantity, `Shipped SO ${id}`, id, updatedAt]
      );
    }

    await query("UPDATE sales_orders SET status = $1 WHERE id = $2", ["shipped", id]);
    await query("COMMIT");
    response.json({ success: true });
  } catch (error) {
    await query("ROLLBACK");
    response.status(500).json({ error: "Could not ship sales order" });
  }
}
