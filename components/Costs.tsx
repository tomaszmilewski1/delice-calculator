"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type FixedCost = {
  id: string;
  name: string;
  category: string;
  monthly_cost: number;
  description: string | null;
  active: boolean;
  created_at: string;
};

type OrderSummary = {
  id: string;
  total_price: number;
  status: string;
  delivery_date: string;
};

type FixedCostForm = {
  name: string;
  category: string;
  monthly_cost: string;
  description: string;
  active: boolean;
};

const emptyFixedCostForm: FixedCostForm = {
  name: "",
  category: "media",
  monthly_cost: "",
  description: "",
  active: true,
};

export default function Costs() {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FixedCostForm>(emptyFixedCostForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [costsRes, ordersRes] = await Promise.all([
      supabase.from("fixed_costs").select("*").order("name", { ascending: true }),
      supabase.from("orders").select("id, total_price, status, delivery_date"),
    ]);

    if (costsRes.error) {
      setError(`Nie udało się pobrać kosztów: ${costsRes.error.message}`);
      setLoading(false);
      return;
    }

    if (ordersRes.error) {
      setError(`Nie udało się pobrać zamówień: ${ordersRes.error.message}`);
      setLoading(false);
      return;
    }

    setFixedCosts((costsRes.data ?? []) as FixedCost[]);
    setOrders((ordersRes.data ?? []) as OrderSummary[]);
    setLoading(false);
  }

  function parseDecimal(value: string): number {
    if (!value || !value.trim()) return 0;
    const num = Number(value.replace(",", ".").trim());
    return Number.isFinite(num) ? num : 0;
  }

  function formatMoney(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "0,00 zł";
    return `${Number(value).toFixed(2).replace(".", ",")} zł`;
  }

  function updateForm(field: keyof FixedCostForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEditing(cost: FixedCost) {
    setEditingId(cost.id);
    setForm({
      name: cost.name,
      category: cost.category,
      monthly_cost: String(cost.monthly_cost).replace(".", ","),
      description: cost.description ?? "",
      active: cost.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyFixedCostForm);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Podaj nazwę kosztu.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      monthly_cost: parseDecimal(form.monthly_cost),
      description: form.description.trim() || null,
      active: form.active,
    };

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("fixed_costs")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess("Koszt stały został zaktualizowany.");
      } else {
        const { error: insertError } = await supabase.from("fixed_costs").insert(payload);
        if (insertError) throw insertError;
        setSuccess("Nowy koszt stały został dodany.");
      }

      setForm(emptyFixedCostForm);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCost(id: string, name: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć koszt "${name}"?`)) return;
    try {
      const { error: delError } = await supabase.from("fixed_costs").delete().eq("id", id);
      if (delError) throw delError;
      setSuccess(`Koszt "${name}" został usunięty.`);
      await loadData();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    }
  }

  async function toggleActive(cost: FixedCost) {
    try {
      const { error: toggleErr } = await supabase
        .from("fixed_costs")
        .update({ active: !cost.active })
        .eq("id", cost.id);
      if (toggleErr) throw toggleErr;
      await loadData();
    } catch (err: any) {
      setError(`Błąd zmiany statusu: ${err.message}`);
    }
  }

  // Finanse
  const totalMonthlyFixedCosts = useMemo(() => {
    return fixedCosts.filter((c) => c.active).reduce((sum, c) => sum + Number(c.monthly_cost || 0), 0);
  }, [fixedCosts]);

  const realizedOrdersRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "zrealizowane")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  }, [orders]);

  const activeOrdersRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "nowe" || o.status === "w_trakcie")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  }, [orders]);

  const netBalance = useMemo(() => {
    return realizedOrdersRevenue - totalMonthlyFixedCosts;
  }, [realizedOrdersRevenue, totalMonthlyFixedCosts]);

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

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#514b46",
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          KOSZTY STAŁE I RENTOWNOŚĆ
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Koszty i Zyskowność</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Rejestruj koszty stałe pracowni i monitoruj realny bilans finansowy ze zrealizowanych zamówień.
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 14, background: "#ecfdf5", color: "#047857", borderRadius: 12, marginBottom: 20 }}>
          {success}
        </div>
      )}

      {/* PODSUMOWANIE FINANSOWE */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, background: "#fdfbf9" }}>
          <div style={{ fontSize: 12, color: "#8a6d4b", fontWeight: 700 }}>KOSZTY STAŁE (MIESIĘCZNIE)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#b91c1c", marginTop: 6 }}>
            {formatMoney(totalMonthlyFixedCosts)}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 4 }}>
            Suma aktywnych kosztów stałych
          </div>
        </div>

        <div style={{ ...cardStyle, background: "#fdfbf9" }}>
          <div style={{ fontSize: 12, color: "#8a6d4b", fontWeight: 700 }}>PRZYCHÓD ZE ZREALIZOWANYCH</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#047857", marginTop: 6 }}>
            {formatMoney(realizedOrdersRevenue)}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 4 }}>
            Zakończone zamówienia
          </div>
        </div>

        <div style={{ ...cardStyle, background: "#fdfbf9" }}>
          <div style={{ fontSize: 12, color: "#8a6d4b", fontWeight: 700 }}>W REALIZACJI / ZAPLANOWANE</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#2563eb", marginTop: 6 }}>
            {formatMoney(activeOrdersRevenue)}
          </div>
          <div style={{ fontSize: 12, color: "#716b65", marginTop: 4 }}>
            Oczekujące na realizację
          </div>
        </div>

        <div style={{ ...cardStyle, background: netBalance >= 0 ? "#ecfdf5" : "#fee2e2", border: netBalance >= 0 ? "1px solid #a7f3d0" : "1px solid #fca5a5" }}>
          <div style={{ fontSize: 12, color: netBalance >= 0 ? "#065f46" : "#991b1b", fontWeight: 700 }}>BILANS NETTO (PRZYCHÓD - KOSZTY)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: netBalance >= 0 ? "#047857" : "#b91c1c", marginTop: 6 }}>
            {formatMoney(netBalance)}
          </div>
          <div style={{ fontSize: 12, color: netBalance >= 0 ? "#059669" : "#dc2626", marginTop: 4 }}>
            {netBalance >= 0 ? "Pracownia na plusie" : "Koszty przewyższają przychód"}
          </div>
        </div>
      </div>

      {/* FORMULARZ KOSZTU STAŁEGO */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            {editingId ? "Edytuj koszt stały" : "+ Dodaj nowy koszt stały"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEditing}
              style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151" }}
            >
              Anuluj
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              Nazwa kosztu *
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="np. Prąd i gaz (piec), Czynsz lokalu, ZUS, Domena"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Kategoria
              <select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                style={inputStyle}
              >
                <option value="media">Media (prąd, gaz, woda)</option>
                <option value="lokal">Czynsz / Lokal</option>
                <option value="podatki">Podatki / ZUS / Księgowość</option>
                <option value="sprzet">Sprzęt / Amortyzacja</option>
                <option value="marketing">Marketing / Domena / Reklama</option>
                <option value="inne">Inne</option>
              </select>
            </label>

            <label style={labelStyle}>
              Koszt miesięczny (zł) *
              <input
                type="text"
                inputMode="decimal"
                value={form.monthly_cost}
                onChange={(e) => updateForm("monthly_cost", e.target.value)}
                placeholder="np. 350,00"
                required
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Opis / Dodatkowe uwagi
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="np. Średni miesięczny rachunek za energię przy intensywnym pieczeniu..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...buttonStyle,
              background: "#8a6d4b",
              color: "#ffffff",
              marginTop: 6,
              fontSize: 15,
            }}
          >
            {saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany w koszcie" : "+ Dodaj koszt stały"}
          </button>
        </form>
      </div>

      {/* LISTA KOSZTÓW STAŁYCH */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            Zestawienie kosztów stałych ({fixedCosts.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 30, color: "#716b65" }}>Ładowanie kosztów...</div>
        ) : fixedCosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #ddd3c9", borderRadius: 12, color: "#8a837d" }}>
            Brak zdefiniowanych kosztów stałych. Dodaj pierwszy koszt powyżej.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fixedCosts.map((cost) => (
              <div
                key={cost.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 140px 180px",
                  gap: 14,
                  alignItems: "center",
                  padding: "14px 18px",
                  background: cost.active ? "#fdfbf9" : "#f9fafb",
                  border: "1px solid #eee7e0",
                  borderRadius: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#292522" }}>
                    {cost.name}
                  </div>
                  {cost.description && (
                    <div style={{ fontSize: 12, color: "#8a837d", marginTop: 2 }}>
                      {cost.description}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#716b65", background: "#f2ebe4", padding: "4px 8px", borderRadius: 6, textAlign: "center" }}>
                  {cost.category}
                </div>

                <strong style={{ fontSize: 16, color: cost.active ? "#b91c1c" : "#9ca3af", textAlign: "right" }}>
                  {formatMoney(cost.monthly_cost)} / msc
                </strong>

                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => startEditing(cost)}
                    style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151", padding: "6px 10px", fontSize: 12 }}
                  >
                    Edytuj
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleActive(cost)}
                    style={{
                      ...buttonStyle,
                      background: cost.active ? "#fef3c7" : "#dcfce7",
                      color: cost.active ? "#92400e" : "#166534",
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
                  >
                    {cost.active ? "Wyłącz" : "Włącz"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteCost(cost.id, cost.name)}
                    style={{ ...buttonStyle, background: "#fee2e2", color: "#b91c1c", padding: "6px 10px", fontSize: 12 }}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
