export type UserRole = "admin" | "warehouse_manager" | "sales";

export type ProductStatus = "active" | "archived";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  salePrice: number;
  status: ProductStatus;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  note?: string;
  referenceId?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contact?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: "draft" | "confirmed" | "received" | "cancelled";
  totalAmount: number;
  createdAt: string;
  items?: PurchaseOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  status: "draft" | "confirmed" | "shipped" | "cancelled";
  totalAmount: number;
  createdAt: string;
  items?: SalesOrderItem[];
}
