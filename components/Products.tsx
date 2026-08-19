"use client";

import { useEffect, useState } from "react";
import { supabase } from "../folder/lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  package_quantity: number | null;
  package_price: number | null;
  notes: string | null;
  active: boolean;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("g");
  const [packageQuantity, setPackageQuantity] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [notes, setNotes] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Użytkownik nie jest zalogowany.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct() {
    if (!name.trim()) {
      setError("Podaj nazwę produktu.");
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Użytkownik nie jest zalogowany.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      name: name.trim(),
      category: category.trim() || null,
      unit,
      package_quantity: Number(packageQuantity) || 0,
      package_price: Number(packagePrice) || 0,
      notes: notes.trim() || null,
      active: true,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setCategory("");
    setUnit("g");
    setPackageQuantity("");
    setPackagePrice("");
    setNotes("");

    await loadProducts();

    setSaving(false);
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

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
      }}
    >
      <div style={{ marginBottom: "25px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "32px",
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
          Zarządzaj produktami, cenami zakupu, opakowaniami i jednostkami.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#fff1ef",
            border: "1px solid #e7b8b1",
            color: "#9b4d43",
            padding: "12px 15px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <Field
          label="Nazwa produktu"
          value={name}
          onChange={setName}
          placeholder="np. Mąka tortowa"
        />

        <Field
          label="Kategoria"
          value={category}
          onChange={setCategory}
          placeholder="np. Suche"
        />

        <Field
          label="Ilość w opakowaniu"
          value={packageQuantity}
          onChange={setPackageQuantity}
          placeholder="np. 1000"
          type="number"
        />

        <Field
          label="Cena zakupu (zł)"
          value={packagePrice}
          onChange={setPackagePrice}
          placeholder="np. 4,99"
          type="number"
        />

        <label>
          <div style={labelStyle}>Jednostka</div>

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

        <Field
          label="Uwagi"
          value={notes}
          onChange={setNotes}
          placeholder="Opcjonalnie"
        />
      </div>

      <button
        onClick={addProduct}
        disabled={saving}
        style={{
          border: "none",
          borderRadius: "10px",
          padding: "12px 20px",
          background: saving ? "#b9a99a" : "#8a6d4b",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          cursor: saving ? "default" : "pointer",
          marginBottom: "30px",
        }}
      >
        {saving ? "Zapisywanie..." : "+ Dodaj produkt"}
      </button>

      <h3
        style={{
          fontSize: "22px",
          marginBottom: "15px",
        }}
      >
        Lista produktów
      </h3>

      {loading ? (
        <p style={{ color: "#716b65" }}>
          Ładowanie produktów...
        </p>
      ) : products.length === 0 ? (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            color: "#716b65",
            border: "1px dashed #ddd3c9",
            borderRadius: "12px",
          }}
        >
          Nie dodano jeszcze żadnych produktów.
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
                <th style={thStyle}>Produkt</th>
                <th style={thStyle}>Kategoria</th>
                <th style={thStyle}>Opakowanie</th>
                <th style={thStyle}>Cena zakupu</th>
                <th style={thStyle}>Jednostka</th>
                <th style={thStyle}>Aktywny</th>
                <th style={thStyle}></th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={tdStyle}>
                    <strong>{product.name}</strong>
                  </td>

                  <td style={tdStyle}>
                    {product.category || "—"}
                  </td>

                  <td style={tdStyle}>
                    {product.package_quantity ?? 0}{" "}
                    {product.unit}
                  </td>

                  <td style={tdStyle}>
                    {(product.package_price ?? 0)
                      .toFixed(2)
                      .replace(".", ",")}{" "}
                    zł
                  </td>

                  <td style={tdStyle}>
                    {product.unit}
                  </td>

                  <td style={tdStyle}>
                    {product.active ? "Tak" : "Nie"}
                  </td>

                  <td style={tdStyle}>
                    <button
                      onClick={() =>
                        deleteProduct(product.id)
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
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      <div style={labelStyle}>{label}</div>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

const labelStyle = {
  fontSize: "13px",
  color: "#716b65",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
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
