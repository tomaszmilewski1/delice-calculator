"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Product {
  id: string;
  name: string;
  category: string;
  package_size: number;
  package_unit: string;
  package_price: number;
  supplier?: string | null;
  notes?: string | null;
  created_at?: string;
}

const CATEGORIES = [
  "Wszystkie",
  "Nabiał",
  "Czekolady i kakao",
  "Owoce i puree",
  "Mąki i sypkie",
  "Cukry i słodziki",
  "Tłuszcze i oleje",
  "Orzechy i pasty",
  "Dodatki i barwniki",
  "Opakowania i podkłady",
  "Inne",
];

const UNITS = ["g", "kg", "ml", "l", "szt."];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Prosty formularz
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Nabiał");
  const [packageSize, setPackageSize] = useState<number | string>("");
  const [packageUnit, setPackageUnit] = useState("g");
  const [packagePrice, setPackagePrice] = useState<number | string>("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (fetchErr) throw fetchErr;
      setProducts((data || []) as Product[]);
    } catch (err: any) {
      setError(`Błąd wczytywania: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleEditClick(p: Product) {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category || "Nabiał");
    setPackageSize(p.package_size);
    setPackageUnit(p.package_unit || "g");
    setPackagePrice(p.package_price);
    setSupplier(p.supplier || "");
    setNotes(p.notes || "");
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingProduct(null);
    resetForm();
  }

  function resetForm() {
    setName("");
    setCategory("Nabiał");
    setPackageSize("");
    setPackageUnit("g");
    setPackagePrice("");
    setSupplier("");
    setNotes("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const sizeNum = Number(String(packageSize).replace(",", "."));
    const priceNum = Number(String(packagePrice).replace(",", "."));

    if (!name.trim()) {
      setError("Podaj nazwę surowca.");
      return;
    }
    if (!sizeNum || sizeNum <= 0) {
      setError("Podaj prawidłową wielkość opakowania.");
      return;
    }
    if (!priceNum || priceNum < 0) {
      setError("Podaj prawidłową cenę.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        package_size: sizeNum,
        package_unit: packageUnit,
        package_price: priceNum,
        supplier: supplier.trim() || null,
        notes: notes.trim() || null,
      };

      if (editingProduct) {
        const { error: updateErr } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);

        if (updateErr) throw updateErr;
        setSuccess(`Zaktualizowano: "${payload.name}"`);
      } else {
        const { error: insertErr } = await supabase
          .from("products")
          .insert(payload);

        if (insertErr) throw insertErr;
        setSuccess(`Dodano: "${payload.name}"`);
      }

      setEditingProduct(null);
      resetForm();
      await loadProducts();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, prodName: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć "${prodName}"?`)) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await supabase.from("recipe_ingredients").delete().eq("product_id", id);
      await supabase.from("recipe_items").delete().eq("product_id", id);

      const { error: delErr } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (delErr) throw delErr;

      setSuccess(`Usunięto "${prodName}"`);
      if (editingProduct?.id === id) handleCancelEdit();
      await loadProducts();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === "Wszystkie" || p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, search]);

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e9e2da",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 9,
    border: "1px solid #ddd3c9",
    fontSize: 14,
    background: "#fff",
    color: "#292522",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            color: "#8a6d4b",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          MAGAZYN I SUROWCE
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>
          Katalog produktów
        </h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Baza surowców z aktualnymi cenami zakupu i przelicznikiem jednostkowym.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: 12,
            marginBottom: 20,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 14,
            background: "#ecfdf5",
            color: "#047857",
            borderRadius: 12,
            marginBottom: 20,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {success}
        </div>
      )}

      {/* FORMULARZ */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            {editingProduct ? `Edycja produktu: ${editingProduct.name}` : "+ Dodaj nowy produkt / surowiec"}
          </h3>
          {editingProduct && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                border: "1px solid #ddd3c9",
                background: "#f4f0ec",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                color: "#716b65",
              }}
            >
              Anuluj edycję
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Nazwa surowca *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Śmietanka 36% Łaciata"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Kategoria
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                {CATEGORIES.filter((c) => c !== "Wszystkie").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Cena opakowania (zł) *
              <input
                type="number"
                step="0.01"
                min="0"
                value={packagePrice}
                onChange={(e) => setPackagePrice(e.target.value)}
                placeholder="np. 14.50"
                required
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Wielkość opakowania *
              <input
                type="number"
                step="any"
                min="0.001"
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
                placeholder="np. 1000"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Jednostka
              <select
                value={packageUnit}
                onChange={(e) => setPackageUnit(e.target.value)}
                style={inputStyle}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Dostawca / Sklep (opcjonalnie)
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="np. Selgros, Makro, Biedronka"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
            Notatka / uwagi (opcjonalnie)
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. Tylko w butelce"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              background: "#8a6d4b",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {saving
              ? "Zapisywanie..."
              : editingProduct
              ? "Zapisz zmiany w produkcie"
              : "+ Dodaj produkt do bazy"}
          </button>
        </form>
      </div>

      {/* TABELA PRODUKTÓW */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background:
                    selectedCategory === cat ? "#8a6d4b" : "#f4f0ec",
                  color: selectedCategory === cat ? "#ffffff" : "#716b65",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Szukaj produktu, sklepu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 240 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#716b65" }}>
            Ładowanie listy produktów...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              border: "1px dashed #ddd3c9",
              borderRadius: 12,
              color: "#8a837d",
            }}
          >
            Brak produktów w wybranej kategorii.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee7e0", textAlign: "left", color: "#8a6d4b" }}>
                  <th style={{ padding: "12px 10px" }}>PRODUKT</th>
                  <th style={{ padding: "12px 10px" }}>KATEGORIA</th>
                  <th style={{ padding: "12px 10px" }}>OPAKOWANIE</th>
                  <th style={{ padding: "12px 10px" }}>CENA OPAK.</th>
                  <th style={{ padding: "12px 10px" }}>CENA / JEDN.</th>
                  <th style={{ padding: "12px 10px" }}>DOSTAWCA</th>
                  <th style={{ padding: "12px 10px", textAlign: "right" }}>AKCJE</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const size = Number(p.package_size) || 1;
                  const price = Number(p.package_price) || 0;
                  const unitPrice = price / size;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #f2ebe4",
                        background: editingProduct?.id === p.id ? "#fdfbf9" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#292522" }}>
                        {p.name}
                        {p.notes && (
                          <div style={{ fontSize: 11, color: "#8a837d", fontWeight: 400 }}>
                            {p.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#716b65" }}>
                        <span
                          style={{
                            background: "#f4f0ec",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", color: "#514b46" }}>
                        {p.package_size} {p.package_unit}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#292522" }}>
                        {Number(p.package_price).toFixed(2).replace(".", ",")} zł
                      </td>
                      <td style={{ padding: "12px 10px", color: "#047857", fontWeight: 600 }}>
                        {unitPrice < 1
                          ? `${(unitPrice * (p.package_unit === "g" ? 1000 : 1)).toFixed(2).replace(".", ",")} zł/${p.package_unit === "g" ? "kg" : p.package_unit}`
                          : `${unitPrice.toFixed(2).replace(".", ",")} zł/${p.package_unit}`}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#716b65" }}>
                        {p.supplier || "—"}
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(p)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#8a6d4b",
                            fontWeight: 700,
                            cursor: "pointer",
                            marginRight: 12,
                          }}
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id, p.name)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#b91c1c",
                            fontWeight: 700,
                            cursor: deletingId === p.id ? "not-allowed" : "pointer",
                            opacity: deletingId === p.id ? 0.5 : 1,
                          }}
                        >
                          {deletingId === p.id ? "Usuwanie..." : "Usuń"}
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
    </div>
  );
}
