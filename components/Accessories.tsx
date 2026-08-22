"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Accessory {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  supplier: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

const ACCESSORY_CATEGORIES = [
  "Wszystkie",
  "Toppery",
  "Podkłady MDF / Cienkie",
  "Pudełka i opakowania",
  "Wstążki i papilotki",
  "Świeczki i race",
  "Wsporniki i stelaże",
  "Figurki i dekoracje niespożywcze",
  "Inne",
];

export default function Accessories() {
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pola formularza
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Toppery");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  const [minStockAlert, setMinStockAlert] = useState<string>("2");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchErr } = await supabase
        .from("accessories")
        .select("*")
        .order("name", { ascending: true });

      if (fetchErr) throw fetchErr;
      setItems((data || []) as Accessory[]);
    } catch (err: any) {
      setError(`Błąd wczytywania akcesoriów: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(item: Accessory) {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category || "Toppery");
    setUnitPrice(item.unit_price ? String(item.unit_price).replace(".", ",") : "");
    setStockQuantity(String(item.stock_quantity ?? 0));
    setMinStockAlert(String(item.min_stock_alert ?? 2));
    setSupplier(item.supplier || "");
    setNotes(item.notes || "");
    setActive(item.active);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    resetForm();
  }

  function resetForm() {
    setName("");
    setCategory("Toppery");
    setUnitPrice("");
    setStockQuantity("0");
    setMinStockAlert("2");
    setSupplier("");
    setNotes("");
    setActive(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const priceNum = Number(String(unitPrice).replace(",", "."));
    const stockNum = parseInt(String(stockQuantity), 10) || 0;
    const minAlertNum = parseInt(String(minStockAlert), 10) || 0;

    if (!name.trim()) {
      setError("Podaj nazwę akcesorium / dodatku.");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Podaj prawidłową cenę za sztukę.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        unit_price: priceNum,
        stock_quantity: stockNum,
        min_stock_alert: minAlertNum,
        supplier: supplier.trim() || null,
        notes: notes.trim() || null,
        active,
      };

      if (editingId) {
        const { error: updateErr } = await supabase
          .from("accessories")
          .update(payload)
          .eq("id", editingId);

        if (updateErr) throw updateErr;
        setSuccess(`Zaktualizowano: "${payload.name}"`);
      } else {
        const { error: insertErr } = await supabase
          .from("accessories")
          .insert(payload);

        if (insertErr) throw insertErr;
        setSuccess(`Dodano nowe akcesorium: "${payload.name}"`);
      }

      cancelEditing();
      await loadItems();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, itemName: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć "${itemName}"?`)) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const { error: delErr } = await supabase.from("accessories").delete().eq("id", id);
      if (delErr) throw delErr;

      setSuccess(`Usunięto "${itemName}"`);
      if (editingId === id) cancelEditing();
      await loadItems();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function adjustStock(item: Accessory, delta: number) {
    const newQty = Math.max(0, (item.stock_quantity || 0) + delta);
    try {
      const { error: updateErr } = await supabase
        .from("accessories")
        .update({ stock_quantity: newQty })
        .eq("id", item.id);

      if (updateErr) throw updateErr;

      setItems((current) =>
        current.map((i) => (i.id === item.id ? { ...i, stock_quantity: newQty } : i))
      );
    } catch (err: any) {
      setError(`Błąd aktualizacji stanu: ${err.message}`);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat =
        selectedCategory === "Wszystkie" || item.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.supplier && item.supplier.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [items, selectedCategory, search]);

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
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          AKCESORIA I OPAKOWANIA
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>
          Dodatki niespożywcze
        </h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Katalog topperów, podkładów MDF, pudełek, wstążek i elementów dekoracyjnych z kontrolą stanu magazynowego.
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 14, background: "#ecfdf5", color: "#047857", borderRadius: 12, marginBottom: 20, fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* FORMULARZ DODAWANIA / EDYCJI */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            {editingId ? "Edycja akcesorium" : "+ Dodaj nowy dodatek / opakowanie"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEditing}
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
              Nazwa przedmiotu *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Topper 'Pierwsza Komunia Święta' złoty"
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
                {ACCESSORY_CATEGORIES.filter((c) => c !== "Wszystkie").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Koszt zakupu / szt. (zł) *
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="np. 12.00"
                required
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Stan na stanie (szt.)
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Alert braku (gdy poniżej szt.)
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                placeholder="2"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Dostawca / Sklep (opcjonalnie)
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="np. Allegro, Torcik.net"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
            Uwagi / Wymiary (opcjonalnie)
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. Pudełko 30x30x35 cm, z rączką"
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
            {saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany" : "+ Dodaj do bazy akcesoriów"}
          </button>
        </form>
      </div>

      {/* TABELA AKCESORIÓW */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCESSORY_CATEGORIES.map((cat) => (
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
                  background: selectedCategory === cat ? "#8a6d4b" : "#f4f0ec",
                  color: selectedCategory === cat ? "#ffffff" : "#716b65",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Szukaj akcesorium, sklepu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 240 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#716b65" }}>Ładowanie bazy akcesoriów...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #ddd3c9", borderRadius: 12, color: "#8a837d" }}>
            Brak akcesoriów w wybranej kategorii.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee7e0", textAlign: "left", color: "#8a6d4b" }}>
                  <th style={{ padding: "12px 10px" }}>AKCESORIUM</th>
                  <th style={{ padding: "12px 10px" }}>KATEGORIA</th>
                  <th style={{ padding: "12px 10px" }}>KOSZT / SZT.</th>
                  <th style={{ padding: "12px 10px" }}>STAN MAGAZYNU</th>
                  <th style={{ padding: "12px 10px" }}>DOSTAWCA</th>
                  <th style={{ padding: "12px 10px", textAlign: "right" }}>AKCJE</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLowStock =
                    item.stock_quantity !== null &&
                    item.stock_quantity <= (item.min_stock_alert ?? 2);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f2ebe4",
                        background: editingId === item.id ? "#fdfbf9" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#292522" }}>
                        {item.name}
                        {item.notes && (
                          <div style={{ fontSize: 11, color: "#8a837d", fontWeight: 400 }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#716b65" }}>
                        <span style={{ background: "#f4f0ec", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#292522" }}>
                        {Number(item.unit_price || 0).toFixed(2).replace(".", ",")} zł
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => adjustStock(item, -1)}
                            style={{
                              border: "1px solid #ddd3c9",
                              background: "#ffffff",
                              borderRadius: 6,
                              width: 24,
                              height: 24,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            -
                          </button>
                          <span
                            style={{
                              fontWeight: 800,
                              color: isLowStock ? "#b91c1c" : "#292522",
                              minWidth: 24,
                              textAlign: "center",
                            }}
                          >
                            {item.stock_quantity ?? 0} szt.
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustStock(item, 1)}
                            style={{
                              border: "1px solid #ddd3c9",
                              background: "#ffffff",
                              borderRadius: 6,
                              width: 24,
                              height: 24,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            +
                          </button>
                          {isLowStock && (
                            <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 700, background: "#fee2e2", padding: "2px 6px", borderRadius: 4 }}>
                              Niski stan!
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px", color: "#716b65" }}>
                        {item.supplier || "—"}
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
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
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id, item.name)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#b91c1c",
                            fontWeight: 700,
                            cursor: deletingId === item.id ? "not-allowed" : "pointer",
                            opacity: deletingId === item.id ? 0.5 : 1,
                          }}
                        >
                          {deletingId === item.id ? "..." : "Usuń"}
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
