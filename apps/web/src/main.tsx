import React from "react";
import ReactDOM from "react-dom/client";
import { AlertTriangle, Boxes, PackagePlus, RefreshCw } from "lucide-react";
import type { Product } from "@warehouse/shared";
import "./styles.css";

const initialProducts: Product[] = [
  {
    id: "prd_flour_25kg",
    sku: "GUR-25",
    name: "Гурил 25кг",
    category: "Хүнс",
    unit: "шуудай",
    quantity: 84,
    reorderLevel: 20,
    salePrice: 72000,
    status: "active",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prd_rice_10kg",
    sku: "BUD-10",
    name: "Будаа 10кг",
    category: "Хүнс",
    unit: "уут",
    quantity: 13,
    reorderLevel: 15,
    salePrice: 42000,
    status: "active",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prd_oil_5l",
    sku: "TOS-5",
    name: "Ургамлын тос 5л",
    category: "Хүнс",
    unit: "сав",
    quantity: 31,
    reorderLevel: 12,
    salePrice: 39500,
    status: "active",
    updatedAt: new Date().toISOString()
  }
];

function currency(value: number) {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    maximumFractionDigits: 0
  }).format(value);
}

function App() {
  const [products] = React.useState<Product[]>(initialProducts);
  const lowStock = products.filter((product) => product.quantity <= product.reorderLevel);
  const totalValue = products.reduce(
    (sum, product) => sum + product.quantity * product.salePrice,
    0
  );

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Boxes aria-hidden="true" />
          <span>Агуулах</span>
        </div>
        <nav>
          <a className="active" href="/">Бараа</a>
          <a href="/">Хөдөлгөөн</a>
          <a href="/">Захиалга</a>
          <a href="/">Тайлан</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Өнөөдрийн хяналт</p>
            <h1>Барааны үлдэгдэл</h1>
          </div>
          <div className="actions">
            <button title="Шинэчлэх" type="button">
              <RefreshCw aria-hidden="true" />
            </button>
            <button className="primary" type="button">
              <PackagePlus aria-hidden="true" />
              <span>Бараа нэмэх</span>
            </button>
          </div>
        </header>

        <section className="metrics" aria-label="Үндсэн үзүүлэлт">
          <article>
            <span>Нийт бараа</span>
            <strong>{products.length}</strong>
          </article>
          <article>
            <span>Бага үлдэгдэл</span>
            <strong>{lowStock.length}</strong>
          </article>
          <article>
            <span>Нийт үнэлгээ</span>
            <strong>{currency(totalValue)}</strong>
          </article>
        </section>

        {lowStock.length > 0 && (
          <section className="notice">
            <AlertTriangle aria-hidden="true" />
            <span>{lowStock.map((item) => item.name).join(", ")} дахин таталт хэрэгтэй.</span>
          </section>
        )}

        <section className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Код</th>
                <th>Бараа</th>
                <th>Ангилал</th>
                <th>Үлдэгдэл</th>
                <th>Доод хэмжээ</th>
                <th>Зарах үнэ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>
                    <span className={product.quantity <= product.reorderLevel ? "stock low" : "stock"}>
                      {product.quantity} {product.unit}
                    </span>
                  </td>
                  <td>{product.reorderLevel}</td>
                  <td>{currency(product.salePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
