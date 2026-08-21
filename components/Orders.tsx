"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type Order = {
  id: string;
  client_name: string;
  client_phone: string | null;
  delivery_date: string;
  delivery_time: string | null;
  cake_name: string;
  diameter_cm: number | null;
  height_cm: number | null;
  portions: number | null;
  description: string | null;
  total_price: number;
  advance_payment: number;
  status: "nowe" | "w_trakcie" | "zrealizowane" | "anulowane";
  created_at: string;
};

type OrderForm = {
  client_name: string;
  client_phone: string;
  delivery_date: string;
  delivery_time: string;
  cake_name: string;
  diameter_cm: string;
  height_cm: string;
  portions: string;
  description: string;
  total_price: string;
  advance_payment: string;
  status: "nowe" | "w_trakcie" | "zrealizowane" | "anulowane";
};

const emptyOrderForm: OrderForm = {
  client_name: "",
  client_phone: "",
  delivery_date: new Date().toISOString().split("T")[0],
  delivery_time: "14:00",
  cake_name: "",
  diameter_cm: "20",
  height_cm: "10",
  portions: "12",
  description: "",
  total_price: "",
  advance_payment: "0",
  status: "nowe",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OrderForm>(emptyOrderForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");

    const { data, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("delivery_date", { ascending: true });

    if (ordersError) {
      setError(`Nie udało się pobrać zamówień: ${ordersError.message}`);
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as Order[]);
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

  function updateForm(field: keyof OrderForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEditing(order: Order) {
    setEditingId(order.id);
    setForm({
      client_name: order.client_name,
      client_phone: order.client_phone ?? "",
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time ?? "14:00",
      cake_name: order.cake_name,
      diameter_cm: order.diameter_cm ? String(order.diameter_cm).replace(".", ",") : "",
      height_cm: order.height_cm ? String(order.height_cm).replace(".", ",") : "",
      portions: order.portions ? String(order.portions).replace(".", ",") : "",
      description: order.description ?? "",
      total_price: String(order.total_price).replace(".", ","),
      advance_payment: String(order.advance_payment).replace(".", ","),
      status: order.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyOrderForm);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.client_name.trim()) {
      setError("Podaj imię i nazwisko klienta.");
      return;
    }
    if (!form.cake_name.trim()) {
      setError("Podaj nazwę tortu.");
      return;
    }
    if (!form.delivery_date) {
      setError("Wybierz datę odbioru / realizacji.");
      return;
    }

    setSaving(true);

    const payload = {
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim() || null,
      delivery_date: form.delivery_date,
      delivery_time: form.delivery_time.trim() || null,
      cake_name: form.cake_name.trim(),
      diameter_cm: parseDecimal(form.diameter_cm) || null,
      height_cm: parseDecimal(form.height_cm) || null,
      portions: parseDecimal(form.portions) || null,
      description: form.description.trim() || null,
      total_price: parseDecimal(form.total_price),
      advance_payment: parseDecimal(form.advance_payment),
      status: form.status,
    };

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("orders")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess("Zamówienie zostało zaktualizowane.");
      } else {
        const { error: insertError } = await supabase.from("orders").insert(payload);
        if (insertError) throw insertError;
        setSuccess("Nowe zamówienie zostało zapisane.");
      }

      setForm(emptyOrderForm);
      setEditingId(null);
      await loadOrders();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrder(id: string) {
    if (!window.confirm("Czy na pewno chcesz usunąć to zamówienie?")) return;
    try {
      const { error: delError } = await supabase.from("orders").delete().eq("id", id);
      if (delError) throw delError;
      setSuccess("Zamówienie zostało usunięte.");
      await loadOrders();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    }
  }

  async function updateStatus(id: string, newStatus: Order["status"]) {
    try {
      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);
      if (statusError) throw statusError;
      await loadOrders();
    } catch (err: any) {
      setError(`Błąd zmiany statusu: ${err.message}`);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !query ||
        o.client_name.toLowerCase().includes(query) ||
        o.cake_name.toLowerCase().includes(query) ||
        (o.client_phone && o.client_phone.includes(query));
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

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

  function getStatusBadge(status: Order["status"]) {
    switch (status) {
      case "nowe":
        return { label: "NOWE", bg: "#eff6ff", color: "#1d4ed8" };
      case "w_trakcie":
        return { label: "W REALIZACJI", bg: "#fefce8", color: "#a16207" };
      case "zrealizowane":
        return { label: "ZREALIZOWANE", bg: "#ecfdf5", color: "#047857" };
      case "anulowane":
        return { label: "ANULOWANE", bg: "#fee2e2", color: "#b91c1c" };
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          ZARZĄDZANIE ZAMÓWIENIAMI
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Baza zamówień</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Rejestruj zamówienia klientów, terminy odbioru, zaliczki i kontroluj etapy realizacji.
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

      {/* FORMULARZ NOWEGO ZAMÓWIENIA */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            {editingId ? "Edytuj zamówienie" : "+ Nowe zamówienie"}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <label style={labelStyle}>
              Klient (Imię i nazwisko) *
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => updateForm("client_name", e.target.value)}
                placeholder="np. Anna Kowalska"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Telefon kontaktowy
              <input
                type="tel"
                value={form.client_phone}
                onChange={(e) => updateForm("client_phone", e.target.value)}
                placeholder="np. 500 600 700"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Data odbioru *
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => updateForm("delivery_date", e.target.value)}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Godzina odbioru
              <input
                type="time"
                value={form.delivery_time}
                onChange={(e) => updateForm("delivery_time", e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              Nazwa / Rodzaj tortu *
              <input
                type="text"
                value={form.cake_name}
                onChange={(e) => updateForm("cake_name", e.target.value)}
                placeholder="np. Tort Malinowy z białą czekoladą"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Średnica (cm)
              <input
                type="text"
                inputMode="decimal"
                value={form.diameter_cm}
                onChange={(e) => updateForm("diameter_cm", e.target.value)}
                placeholder="20"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Wysokość (cm)
              <input
                type="text"
                inputMode="decimal"
                value={form.height_cm}
                onChange={(e) => updateForm("height_cm", e.target.value)}
                placeholder="10"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Liczba porcji
              <input
                type="text"
                inputMode="decimal"
                value={form.portions}
                onChange={(e) => updateForm("portions", e.target.value)}
                placeholder="12"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Szczegóły dekoracji / Uwagi klienta
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="np. Topper z cyfrą 30, żywe kwiaty w odcieniach pudrowego różu, bezglutenowy biszkopt..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              Cena końcowa (zł) *
              <input
                type="text"
                inputMode="decimal"
                value={form.total_price}
                onChange={(e) => updateForm("total_price", e.target.value)}
                placeholder="np. 250,00"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Wpłacona zaliczka (zł)
              <input
                type="text"
                inputMode="decimal"
                value={form.advance_payment}
                onChange={(e) => updateForm("advance_payment", e.target.value)}
                placeholder="np. 50,00"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Status zamówienia
              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                style={inputStyle}
              >
                <option value="nowe">Nowe</option>
                <option value="w_trakcie">W realizacji</option>
                <option value="zrealizowane">Zrealizowane</option>
                <option value="anulowane">Anulowane</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...buttonStyle,
              background: "#8a6d4b",
              color: "#ffffff",
              marginTop: 10,
              fontSize: 15,
            }}
          >
            {saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany w zamówieniu" : "+ Zapisz nowe zamówienie"}
          </button>
        </form>
      </div>

      {/* LISTA I FILTROWANIE ZAMÓWIEŃ */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            Lista zamówień ({filteredOrders.length})
          </h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Szukaj po kliencie, torcie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 220 }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...inputStyle, width: 160 }}
            >
              <option value="all">Wszystkie statusy</option>
              <option value="nowe">Nowe</option>
              <option value="w_trakcie">W realizacji</option>
              <option value="zrealizowane">Zrealizowane</option>
              <option value="anulowane">Anulowane</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 30, color: "#716b65" }}>Ładowanie zamówień...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #ddd3c9", borderRadius: 12, color: "#8a837d" }}>
            Brak zamówień spełniających kryteria.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              const remaining = Number(ord.total_price) - Number(ord.advance_payment);

              return (
                <div
                  key={ord.id}
                  style={{
                    border: "1px solid #eee7e0",
                    borderRadius: 14,
                    padding: 18,
                    background: "#fdfbf9",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          letterSpacing: 1,
                        }}
                      >
                        {badge.label}
                      </span>
                      <h4 style={{ margin: "6px 0 2px", fontSize: 18, color: "#292522" }}>
                        {ord.cake_name}
                      </h4>
                      <div style={{ color: "#716b65", fontSize: 13 }}>
                        Klient: <strong>{ord.client_name}</strong> {ord.client_phone && `(${ord.client_phone})`}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#8a837d" }}>Termin odbioru:</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#8a6d4b" }}>
                        {ord.delivery_date} {ord.delivery_time && `• ${ord.delivery_time}`}
                      </div>
                    </div>
                  </div>

                  {ord.description && (
                    <div style={{ background: "#ffffff", padding: 10, borderRadius: 8, fontSize: 13, color: "#514b46", border: "1px solid #eee7e0" }}>
                      {ord.description}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee7e0", paddingTop: 12, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", gap: 18, fontSize: 13 }}>
                      <div>
                        Wymiary: <strong>{ord.diameter_cm ?? "—"} cm × {ord.height_cm ?? "—"} cm</strong>
                      </div>
                      <div>
                        Porcje: <strong>{ord.portions ?? "—"}</strong>
                      </div>
                      <div>
                        Cena: <strong style={{ color: "#047857" }}>{formatMoney(ord.total_price)}</strong>
                      </div>
                      <div>
                        Zaliczka: <strong>{formatMoney(ord.advance_payment)}</strong>
                      </div>
                      <div>
                        Do zapłaty: <strong style={{ color: remaining > 0 ? "#b91c1c" : "#047857" }}>{formatMoney(remaining)}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={ord.status}
                        onChange={(e) => updateStatus(ord.id, e.target.value as any)}
                        style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12 }}
                      >
                        <option value="nowe">Nowe</option>
                        <option value="w_trakcie">W realizacji</option>
                        <option value="zrealizowane">Zrealizowane</option>
                        <option value="anulowane">Anulowane</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => startEditing(ord)}
                        style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151", padding: "6px 12px", fontSize: 12 }}
                      >
                        Edytuj
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteOrder(ord.id)}
                        style={{ ...buttonStyle, background: "#fee2e2", color: "#b91c1c", padding: "6px 12px", fontSize: 12 }}
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
