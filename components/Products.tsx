"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  purchasePrice: number;
  packageSize: number;
  packageUnit: string;
  unit: string;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [packageUnit, setPackageUnit] = useState("g");
  const [unit, setUnit] = useState("g");

  function addProduct() {
    if (!name.trim() || !purchasePrice || !packageSize) {
      return;
    }

    const newProduct: Product = {
      id: Date.now(),
      name: name.trim(),
      purchasePrice: Number(purchasePrice),
      packageSize: Number(packageSize),
      packageUnit,
      unit,
    };

    setProducts((current) => [...current, newProduct]);

    setName("");
    setPurchasePrice("");
    setPackageSize("");
    setPackageUnit("g");
    setUnit("g");
  }

  function removeProduct(id: number) {
    setProducts((current) =>
      current.filter((product) => product.id !== id)
    );
  }

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "25px",
        marginTop: "20px",
      }}
    >
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#8a6d4b",
            marginBottom: "6px",
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
            marginTop: "8px",
          }}
        >
          Dodawaj produkty, ceny zakupu, opakowania i jednostki.
        </p>
      </div>

      <div
        style={{
          background: "#faf8f5",
          border: "1px solid #e9e2da",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Dodaj produkt</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "14px",
          }}
        >
          <label>
            <div style={labelStyle}>Nazwa produktu</div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Mąka"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={labelStyle}>Cena zakupu</div>

            <input
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) =>
                setPurchasePrice(e.target.value)
              }
              placeholder="np. 5,99"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={labelStyle}>Opakowanie</div>

            <input
              type="number"
              min="0"
              step="0.01"
              value={packageSize}
              onChange={(e) =>
                setPackageSize(e.target.value)
              }
              placeholder="np. 1000"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={labelStyle}>Jednostka opakowania</div>

            <select
              value={packageUnit}
              onChange={(e) =>
                setPackageUnit(e.target.value)
              }
              style={inputStyle}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="szt.">szt.</option>
            </select>
          </label>

          <label>
            <div style={labelStyle}>Jednostka użycia</div>

            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={inputStyle}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="szt.">szt.</option>
            </select>
          </label>
        </div>

        <button
          onClick={addProduct}
          style={{
            marginTop: "18px",
            background: "#8a6d4b",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Dodaj produkt
        </button>
      </div>

      <div>
        <h3>Lista produktów</h3>

        {products.length === 0 ? (
          <div
            style={{
              padding: "25px",
              textAlign: "center",
              color: "#716b65",
              border: "1px dashed #ddd3c9",
              borderRadius: "12px",
            }}
          >
            Brak produktów. Dodaj pierwszy produkt powyżej.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "750px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Produkt</th>
                  <th style={thStyle}>Cena zakupu</th>
                  <th style={thStyle}>Opakowanie</th>
                  <th style={thStyle}>Jednostka</th>
                  <th style={thStyle}>Cena / jednostkę</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const unitPrice =
                    product.packageSize > 0
                      ? product.purchasePrice /
                        product.packageSize
                      : 0;

                  return (
                    <tr key={product.id}>
                      <td style={tdStyle}>
                        <strong>{product.name}</strong>
                      </td>

                      <td style={tdStyle}>
                        {product.purchasePrice
                          .toFixed(2)
                          .replace(".", ",")}{" "}
                        zł
                      </td>

                      <td style={tdStyle}>
                        {product.packageSize
                          .toFixed(2)
                          .replace(".", ",")}
                      </td>

                      <td style={tdStyle}>
                        {product.packageUnit}
                      </td>

                      <td style={tdStyle}>
                        {unitPrice
                          .toFixed(4)
                          .replace(".", ",")}{" "}
                        zł / {product.unit}
                      </td>

                      <td style={tdStyle}>
                        <button
                          onClick={() =>
                            removeProduct(product.id)
                          }
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#9b4d43",
                            cursor: "pointer",
                          }}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "11px 12px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#716b65",
  marginBottom: "7px",
};

const thStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #e9e2da",
  color: "#716b65",
  fontSize: "13px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #f0ebe6",
};
