"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  purchasePrice: number;
  packageSize: number;
  packageUnit: string;
  usageUnit: string;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [packageUnit, setPackageUnit] = useState("g");
  const [usageUnit, setUsageUnit] = useState("g");

  function addProduct() {
    if (
      !name.trim() ||
      !purchasePrice ||
      !packageSize
    ) {
      return;
    }

    const product: Product = {
      id: Date.now(),
      name: name.trim(),
      purchasePrice: Number(purchasePrice),
      packageSize: Number(packageSize),
      packageUnit,
      usageUnit,
    };

    setProducts((current) => [...current, product]);

    setName("");
    setPurchasePrice("");
    setPackageSize("");
    setPackageUnit("g");
    setUsageUnit("g");
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
        padding: "30px",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#8a6d4b",
            marginBottom: "8px",
          }}
        >
          Délice
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "32px",
          }}
        >
          Produkty
        </h1>

        <p
          style={{
            color: "#716b65",
            marginTop: "10px",
            marginBottom: 0,
          }}
        >
          Zarządzaj produktami i ich aktualnymi cenami.
        </p>
      </div>

      <div
        style={{
          background: "#faf8f5",
          border: "1px solid #e9e2da",
          borderRadius: "14px",
          padding: "22px",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "21px",
          }}
        >
          Dodaj produkt
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          <label>
            <div style={labelStyle}>
              Nazwa produktu
            </div>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="np. Mąka"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={labelStyle}>
              Cena zakupu
            </div>

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
            <div style={labelStyle}>
              Wielkość opakowania
            </div>

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
            <div style={labelStyle}>
              Jednostka opakowania
            </div>

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
            <div style={labelStyle}>
              Jednostka używana w recepturze
            </div>

            <select
              value={usageUnit}
              onChange={(e) =>
                setUsageUnit(e.target.value)
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
        </div>

        <button
          onClick={addProduct}
          style={{
            marginTop: "20px",
            background: "#8a6d4b",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          + Dodaj produkt
        </button>
      </div>

      <div>
        <h2
          style={{
            fontSize: "21px",
            marginBottom: "15px",
          }}
        >
          Lista produktów
        </h2>

        {products.length === 0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#716b65",
              border: "1px dashed #ddd3c9",
              borderRadius: "12px",
            }}
          >
            Brak produktów.
            <br />
            Dodaj pierwszy produkt powyżej.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    Produkt
                  </th>

                  <th style={thStyle}>
                    Cena zakupu
                  </th>

                  <th style={thStyle}>
                    Opakowanie
                  </th>

                  <th style={thStyle}>
                    Jednostka
                  </th>

                  <th style={thStyle}>
                    Jednostka receptury
                  </th>

                  <th style={thStyle}>
                    Cena / jednostkę
                  </th>

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
                        <strong>
                          {product.name}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {formatMoney(
                          product.purchasePrice
                        )}{" "}
                        zł
                      </td>

                      <td style={tdStyle}>
                        {product.packageSize}{" "}
                        {product.packageUnit}
                      </td>

                      <td style={tdStyle}>
                        {product.packageUnit}
                      </td>

                      <td style={tdStyle}>
                        {product.usageUnit}
                      </td>

                      <td style={tdStyle}>
                        {formatMoney(unitPrice)} zł /{" "}
                        {product.usageUnit}
                      </td>

                      <td style={tdStyle}>
                        <button
                          onClick={() =>
                            removeProduct(
                              product.id
                            )
                          }
                          style={{
                            border: "none",
                            background:
                              "transparent",
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

function formatMoney(value: number) {
  return value.toFixed(2).replace(".", ",");
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
