"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  packageSize: number;
  unit: "g" | "kg" | "ml" | "l" | "szt.";
};

const initialProducts: Product[] = [
  { id: 1, name: "Mąka", price: 4.99, packageSize: 1000, unit: "g" },
  { id: 2, name: "Cukier", price: 3.99, packageSize: 1000, unit: "g" },
  { id: 3, name: "Jajka", price: 12.99, packageSize: 10, unit: "szt." },
];

const units: Product["unit"][] = ["g", "kg", "ml", "l", "szt."];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [unit, setUnit] = useState<Product["unit"]>("g");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, search]);

  function resetForm() {
    setName("");
    setPrice("");
    setPackageSize("");
    setUnit("g");
    setEditingId(null);
    setShowForm(false);
  }

  function saveProduct() {
    const numericPrice = Number(price.replace(",", "."));
    const numericPackageSize = Number(packageSize.replace(",", "."));

    if (
      !name.trim() ||
      numericPrice <= 0 ||
      numericPackageSize <= 0
    ) {
      alert("Uzupełnij nazwę, cenę zakupu i wielkość opakowania.");
      return;
    }

    const product: Product = {
      id: editingId ?? Date.now(),
      name: name.trim(),
      price: numericPrice,
      packageSize: numericPackageSize,
      unit,
    };

    setProducts((current) =>
      editingId === null
        ? [...current, product]
        : current.map((item) =>
            item.id === editingId ? product : item
          )
    );

    resetForm();
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.price));
    setPackageSize(String(product.packageSize));
    setUnit(product.unit);
    setShowForm(true);
  }

  function removeProduct(id: number) {
    if (!confirm("Czy na pewno chcesz usunąć ten produkt?")) return;

    setProducts((current) =>
      current.filter((product) => product.id !== id)
    );
  }

  function unitPrice(product: Product) {
    return product.price / product.packageSize;
  }

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "25px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              color: "#8a6d4b",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "7px",
            }}
          >
            Délice
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            Produkty
          </h2>

          <p
            style={{
              color: "#716b65",
              marginBottom: 0,
            }}
          >
            Zarządzaj produktami, cenami zakupu i wielkością opakowań.
          </p>
        </div>

        <button
          onClick={() => setShowForm((current) => !current)}
          style={primaryButtonStyle}
        >
          {showForm ? "Zamknij formularz" : "+ Dodaj produkt"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: "#faf8f5",
            border: "1px solid #e9e2da",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "22px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {editingId === null
              ? "Dodaj produkt"
              : "Edytuj produkt"}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >
            <Field label="Nazwa produktu">
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="np. Masło"
                style={inputStyle}
              />
            </Field>

            <Field label="Cena zakupu (zł)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="np. 8,99"
                style={inputStyle}
              />
            </Field>

            <Field label="Wielkość opakowania">
              <input
                type="number"
                min="0"
                step="0.01"
                value={packageSize}
                onChange={(event) =>
                  setPackageSize(event.target.value)
                }
                placeholder="np. 200"
                style={inputStyle}
              />
            </Field>

            <Field label="Jednostka">
              <select
                value={unit}
                onChange={(event) =>
                  setUnit(
                    event.target.value as Product["unit"]
                  )
                }
                style={inputStyle}
              >
                {units.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <button
              onClick={saveProduct}
              style={primaryButtonStyle}
            >
              {editingId === null
                ? "Dodaj produkt"
                : "Zapisz zmiany"}
            </button>

            <button
              onClick={resetForm}
              style={secondaryButtonStyle}
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      <input
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder="Szukaj produktu..."
        style={{
          ...inputStyle,
          marginBottom: "18px",
        }}
      />

      {filteredProducts.length === 0 ? (
        <div
          style={{
            padding: "35px 20px",
            textAlign: "center",
            color: "#716b65",
            border: "1px dashed #d8cec4",
            borderRadius: "14px",
          }}
        >
          Brak produktów.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "760px",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={thStyle}>Produkt</th>
                <th style={thStyle}>Cena zakupu</th>
                <th style={thStyle}>Opakowanie</th>
                <th style={thStyle}>Jednostka</th>
                <th style={thStyle}>
                  Cena / jednostkę
                </th>
                <th style={thStyle}>Akcje</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td style={tdStyle}>
                    <strong>{product.name}</strong>
                  </td>

                  <td style={tdStyle}>
                    {formatMoney(product.price)} zł
                  </td>

                  <td style={tdStyle}>
                    {formatNumber(product.packageSize)}
                  </td>

                  <td style={tdStyle}>
                    {product.unit}
                  </td>

                  <td style={tdStyle}>
                    {formatMoney(unitPrice(product))} zł /{" "}
                    {product.unit}
                  </td>

                  <td style={tdStyle}>
                    <button
                      onClick={() =>
                        editProduct(product)
                      }
                      style={linkButtonStyle}
                    >
                      Edytuj
                    </button>

                    <button
                      onClick={() =>
                        removeProduct(product.id)
                      }
                      style={{
                        ...linkButtonStyle,
                        color: "#9b4d43",
                      }}
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: "13px",
          color: "#716b65",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      {children}
    </label>
  );
}

function formatMoney(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function formatNumber(value: number) {
  return value.toLocaleString("pl-PL", {
    maximumFractionDigits: 2,
  });
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "11px 12px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#fff",
  color: "#292522",
  fontSize: "14px",
};

const primaryButtonStyle = {
  background: "#8a6d4b",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  background: "#ffffff",
  color: "#292522",
  border: "1px solid #d8cec4",
  borderRadius: "10px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const linkButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#8a6d4b",
  cursor: "pointer",
  marginRight: "12px",
  padding: 0,
};

const thStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #e9e2da",
  color: "#716b65",
  fontSize: "13px",
};

const tdStyle = {
  padding: "13px 8px",
  borderBottom: "1px solid #f0ebe6",
};
