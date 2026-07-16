import express from "express";
import {
  createCustomer,
  createProduct,
  createPurchaseOrder,
  createSalesOrder,
  createStockMovement,
  createSupplier,
  listCustomers,
  listProducts,
  listPurchaseOrders,
  listSalesOrders,
  listStockMovements,
  listSuppliers,
  receivePurchaseOrder,
  shipSalesOrder
} from "./controllers";

const router = express.Router();

router.get("/products", listProducts);
router.post("/products", createProduct);

router.get("/suppliers", listSuppliers);
router.post("/suppliers", createSupplier);

router.get("/customers", listCustomers);
router.post("/customers", createCustomer);

router.get("/purchase-orders", listPurchaseOrders);
router.post("/purchase-orders", createPurchaseOrder);
router.post("/purchase-orders/:id/receive", receivePurchaseOrder);

router.get("/sales-orders", listSalesOrders);
router.post("/sales-orders", createSalesOrder);
router.post("/sales-orders/:id/ship", shipSalesOrder);

router.get("/stock-movements", listStockMovements);
router.post("/stock-movements", createStockMovement);

export default router;
