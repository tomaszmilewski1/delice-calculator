"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export interface ProductStock {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  package_quantity: number | null;
  package_price: number | null;
  stock_quantity: number | null;
  active?: boolean | null;
}

export interface OrderReq {
  id: string;
  cake_name: string;
  delivery_date: string;
  status: string;
}

export interface RecipeLink {
  id: string;
  name: string;
}

export interface RecipeIngredientItem {
  id: string;
  recipe_id: string;
  product_id: string;
  quantity: number;
  unit: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [orders, setOrders] = useState<OrderReq[]>([]);
  const [recipes, setRecipes] = useState<RecipeLink[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<"all" | "weekend" | "today">("weekend");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError("");

    try {
      const [prodRes, ordRes, recRes, ingRes] = await Promise.all([
        supabase.from("products").select("*").order("name", { ascending: true }),
        supabase.from("orders").select("id, cake_name, delivery_date, status").in("status", ["nowe", "w_trakcie"]).order("delivery_date", { ascending: true }),
        supabase.from("recipes").select("id, name"),
        supabase.from("recipe_ingredients").select("id, recipe_id, product_id, quantity, unit"),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (ordRes.error) throw ordRes.error;
      if (recRes.error) throw recRes.error;
      if (ingRes.error) throw ingRes.error;

      setProducts((prodRes.data || []) as ProductStock[]);
      setOrders((ordRes.data || []) as OrderReq[]);
      setRecipes((recRes.data || []) as RecipeLink[]);
      setRecipeIngredients((ingRes.data || []) as RecipeIngredientItem[]);
    } catch (err: any) {
      setError(`Błąd wczytywania danych magazynu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function updateStock(productId: string, newStock: number) {
    setSavingId(productId);
    try {
      const { error: updateErr } = await supabase
        .from("products")
        .update({ stock_quantity: Math.max(0, newStock) })
        .eq("id", productId);

      if (updateErr) throw updateErr;

      setProducts((curr) =>
        curr.map((p) => (p.id === productId ? { ...p, stock_quantity: Math.max(0, newStock) } : p))
      );
    } catch (err: any) {
      setError(`Błąd aktualizacji stanu: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  }

  // Filtrowanie aktywnych zamówień wg wybranego okresu
  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    if (dateFilter === "all") return orders;
    if (dateFilter === "today") return orders.filter((o) => o.delivery_date === todayStr);

    if (dateFilter === "weekend") {
      const day = today.getDay();
      let fri = new Date(today);
      if (day === 5) fri = new Date(today);
      else if (day === 6) fri.setDate(today.getDate() - 1);
      else if (day === 0) fri.setDate(today.getDate() - 2);
      else fri.setDate(today.getDate() + (5 - day));

      const sun = new Date(fri);
      sun.setDate(sun.getDate() + 2);

      const friStr = fri.toISOString().slice(0, 10);
      const sunStr = sun.toISOString().slice(0, 10);

      return orders.filter((o) => o.delivery_date >= friStr && o.delivery_date <= sunStr);
    }

    return orders;
  }, [orders, dateFilter]);

  // Obliczenie zapotrzebowania na każdy produkt
  const requiredQuantities = useMemo(() => {
    const map: Record<string, number> = {};

    filteredOrders.forEach((ord) => {
      const cleanOrdName = ord.cake_name.toLowerCase().trim();
      const matchedRecipe = recipes.find((r) => {
        const cleanRecName = r.name.toLowerCase().trim();
        return cleanOrdName.includes(cleanRecName) || cleanRecName.includes(cleanOrdName);
      });

      if (matchedRecipe) {
        const matchedIngs = recipeIngredients.filter((ing) => ing.recipe_id === matchedRecipe.id);
        matchedIngs.forEach((ing) => {
          map[ing.product_id] = (map[ing.product_id] || 0) + Number(ing.quantity || 0);
        });
      }
    });

    return map;
  }, [filteredOrders, recipes, recipeIngredients]);

  // Raport magazynowy
  const inventoryReport = useMemo(() => {
    return products.map((prod) => {
      const stock = Number(prod.stock_quantity ?? 0);
      const required = Number(requiredQuantities[prod.id] ?? 0);
      const diff = stock - required;
      const isMissing = diff < 0;
      const missingAmount = isMissing ? Math.abs(diff) : 0;
      const pkgSize = Number(prod.package_quantity) || 1;
      const packagesToBuy = isMissing ? Math.ceil(missingAmount / pkgSize) : 0;
      const estimatedCost = packagesToBuy * Number(prod.package_price || 0);

      return {
        product: prod,
        stock,
        required,
        diff,
        isMissing,
        missingAmount,
        packagesToBuy,
        estimatedCost,
      };
    }).filter((item) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        item.product.name.toLowerCase().includes(q) ||
        (item.product.category && item.product.category.toLowerCase().includes(q))
      );
    });
  }, [products, requiredQuantities, search]);

  const missingItems = useMemo(() => {
    return inventoryReport.filter((i) => i.isMissing);
  }, [inventoryReport]);

  const totalShoppingCost = useMemo(() => {
    return missingItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  }, [missingItems]);

  function copyShoppingList() {
    if (missingItems.length === 0) return;

    let text = `🛒 LISTA ZAKUPÓW — PRACOWNIA DÉLICE\n`;
    text += `Okres: ${dateFilter === "weekend" ? "Najbliższy weekend" : dateFilter === "today" ? "Dzisiaj" : "Wszystkie zamówienia"}\n`;
    text += `Szacowany koszt: ${totalShoppingCost.toFixed(2).replace(".", ",")} zł\n\n`;

    missingItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product.name}: ${item.missingAmount} ${item.product.unit || "g"} (${item.packagesToBuy}x opak. po ${item.product.package_quantity} ${item.product.unit || "g"})\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

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
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd3c9",
    fontSize: 13,
    background: "#fff",
    color: "#292522",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          STANY MAGAZYNOWE I ZAPOTRZEBOWANIE
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>
          Magazyn spożywczy i lista zakupów
        </h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Kontroluj zapasy w pracowni, sprawdzaj zapotrzebowanie ze zleceń i generuj gotowe listy zakupów.
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* KAFLE PODSUMOWANIA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
        <div style={{ ...cardStyle, borderLeft: "4px solid #8a6d4b" }}>
          <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700 }}>ZLECENIA W WYBRANYM OKRESIE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#292522", marginTop: 4 }}>
            {filteredOrders.length} tortów
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Aktywne zlecenia generujące zapotrzebowanie
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: "4px solid #b91c1c" }}>
          <div style={{ fontSize: 11, color: "#b91c1c", fontWeight: 700 }}>BRAKUJĄCE SUROWCE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#b91c1c", marginTop: 4 }}>
            {missingItems.length} pozycji
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Wymaga dokupienia przed pieczeniem
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: "4px solid #047857" }}>
          <div style={{ fontSize: 11, color: "#047857", fontWeight: 700 }}>SZACOWANY KOSZT ZAKUPÓW</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#047857", marginTop: 4 }}>
            {totalShoppingCost.toFixed(2).replace(".", ",")} zł
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
            Wartość brakujących opakowań
          </div>
        </div>
      </div>

      {/* PASEK FILTRÓW I GENEROWANIA LISTY */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#716b65" }}>Zapotrzebowanie na:</span>
            <button
              type="button"
              onClick={() => setDateFilter("weekend")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: dateFilter === "weekend" ? "#8a6d4b" : "#f4f0ec",
                color: dateFilter === "weekend" ? "#ffffff" : "#716b65",
              }}
            >
              Weekend (Pt-Nd)
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: dateFilter === "today" ? "#8a6d4b" : "#f4f0ec",
                color: dateFilter === "today" ? "#ffffff" : "#716b65",
              }}
            >
              Na dzisiaj
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: dateFilter === "all" ? "#8a6d4b" : "#f4f0ec",
                color: dateFilter === "all" ? "#ffffff" : "#716b65",
              }}
            >
              Wszystkie zamówienia
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Szukaj surowca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 200 }}
            />

            <button
              type="button"
              onClick={copyShoppingList}
              disabled={missingItems.length === 0}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                background: missingItems.length > 0 ? "#047857" : "#e5e7eb",
                color: missingItems.length > 0 ? "#ffffff" : "#9ca3af",
                fontWeight: 700,
                fontSize: 12,
                cursor: missingItems.length > 0 ? "pointer" : "not-allowed",
              }}
            >
              {copied ? "✓ Skopiowano listę!" : "📋 Kopiuj listę zakupów"}
            </button>
          </div>
        </div>
      </div>

      {/* TABELA BILANSU MAGAZYNOWEGO */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#292522" }}>
          Bilans surowców na stanie ({inventoryReport.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#716b65" }}>Ładowanie magazynu...</div>
        ) : inventoryReport.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #ddd3c9", borderRadius: 12, color: "#8a837d" }}>
            Brak produktów w bazie. Dodaj produkty w zakładce „Produkty”.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee7e0", textAlign: "left", color: "#8a6d4b" }}>
                  <th style={{ padding: "12px 10px" }}>SUROWIEC</th>
                  <th style={{ padding: "12px 10px" }}>KATEGORIA</th>
                  <th style={{ padding: "12px 10px" }}>STAN NA PÓŁCE</th>
                  <th style={{ padding: "12px 10px" }}>ZAPOTRZEBOWANIE</th>
                  <th style={{ padding: "12px 10px" }}>BILANS / BRAK</th>
                  <th style={{ padding: "12px 10px", textAlign: "right" }}>DO ZAKUPIENIA</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport.map((item) => {
                  const p = item.product;
                  const isLow = item.isMissing;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #f2ebe4",
                        background: isLow ? "#fff8f8" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#292522" }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#716b65" }}>
                        <span style={{ background: "#f4f0ec", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {p.category || "Inne"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={p.stock_quantity ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setProducts((curr) =>
                                curr.map((pr) => (pr.id === p.id ? { ...pr, stock_quantity: val } : pr))
                              );
                            }}
                            onBlur={(e) => updateStock(p.id, Number(e.target.value))}
                            style={{ ...inputStyle, width: 90, textAlign: "right", fontWeight: 700 }}
                          />
                          <span style={{ color: "#716b65", fontSize: 12 }}>{p.unit || "g"}</span>
                          {savingId === p.id && <span style={{ fontSize: 10, color: "#047857" }}>✓</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#514b46" }}>
                        {item.required > 0 ? `${item.required} ${p.unit || "g"}` : "0"}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {isLow ? (
                          <span style={{ color: "#b91c1c", fontWeight: 800 }}>
                            Brakuje: {item.missingAmount} {p.unit || "g"}
                          </span>
                        ) : (
                          <span style={{ color: "#047857", fontWeight: 700 }}>
                            Zapas: +{item.diff} {p.unit || "g"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        {item.packagesToBuy > 0 ? (
                          <div>
                            <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 8px", borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                              Kup: {item.packagesToBuy} op. (~{item.estimatedCost.toFixed(2).replace(".", ",")} zł)
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#716b65", fontSize: 12 }}>Wystarczy</span>
                        )}
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
