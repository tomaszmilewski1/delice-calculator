"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type Order = {
  id: string;
  client_id?: string | null;
  client_name: string;
  client_phone: string | null;
  client_address: string | null;
  cake_name: string;
  diameter_cm: number;
  height_cm: number;
  portions: number;
  total_price: number;
  deposit: number;
  delivery_date: string;
  status: "nowe" | "w_trakcie" | "zrealizowane" | "anulowane";
  notes: string | null;
  created_at: string;
};

type ClientOption = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

type OrderForm = {
  client_id: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  cake_name: string;
  diameter_cm: string;
  height_cm: string;
  portions: string;
  total_price: string;
  deposit: string;
  delivery_date: string;
  status: "nowe" | "w_trakcie" | "zrealizowane" | "anulowane";
  notes: string;
};

const emptyOrderForm: OrderForm = {
  client_id: "",
  client_name: "",
  client_phone: "",
  client_address: "",
  cake_name: "",
  diameter_cm: "18",
  height_cm: "12",
  portions: "14",
  total_price: "",
  deposit: "0",
  delivery_date: new Date().toISOString().slice(0, 10),
  status: "nowe",
  notes: "",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OrderForm>(emptyOrderForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [ordersRes, clientsRes] = await Promise.all([
      supabase.from("orders").select("*").order("delivery_date", { ascending: true }),
      supabase.from("clients").select("id, name, phone, address, notes").order("name", { ascending: true }),
    ]);

    if (ordersRes.error) {
      setError(`Nie udało się pobrać zamówień: ${ordersRes.error.message}`);
      setLoading(false);
      return;
    }

    if (clientsRes.error) {
      setError(`Nie udało się pobrać bazy klientów: ${clientsRes.error.message}`);
      setLoading(false);
      return;
    }

    setOrders((ordersRes.data ?? []) as Order[]);
    setClients((clientsRes.data ?? []) as ClientOption[]);
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

  function handleClientSelect(clientId: string) {
    if (!clientId) {
      setForm((prev) => ({
        ...prev,
        client_id: "",
      }));
      return;
    }

    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        client_id: selected.id,
        client_name: selected.name,
        client_phone: selected.phone || "",
        client_address: selected.address || "",
        notes: prev.notes
          ? prev.notes
          : selected.notes
          ? `Uwagi klienta: ${selected.notes}`
          : "",
      }));
    }
  }

  function startEditing(order: Order) {
    setEditingId(order.id);
    setForm({
      client_id: order.client_id || "",
      client_name: order.client_name,
      client_phone: order.client_phone ?? "",
      client_address: order.client_address ?? "",
      cake_name: order.cake_name,
      diameter_cm: String(order.diameter_cm),
      height_cm: String(order.height_cm),
      portions: String(order.portions),
      total_price: String(order.total_price).replace(".", ","),
      deposit: String(order.deposit).replace(".", ","),
      delivery_date: order.delivery_date,
      status: order.status,
      notes: order.notes ?? "",
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
      setError("Wybierz datę realizacji / wydania tortu.");
      return;
    }

    setSaving(true);

    const payload = {
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim() || null,
      client_address: form.client_address.trim() || null,
      cake_name: form.cake_name.trim(),
      diameter_cm: Number(form.diameter_cm) || 18,
      height_cm: Number(form.height_cm) || 12,
      portions: Number(form.portions) || 14,
      total_price: parseDecimal(form.total_price),
      deposit: parseDecimal(form.deposit),
      delivery_date: form.delivery_date,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("orders")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess("Zamówienie zostało pomyślnie zaktualizowane.");
      } else {
        const { error: insertError } = await supabase.from("orders").insert(payload);
        if (insertError) throw insertError;
        setSuccess("Nowe zamówienie zostało zapisane.");
      }

      setForm(emptyOrderForm);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function updateOrderStatus(id: string, newStatus: Order["status"]) {
    try {
      const { error: patchError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (patchError) throw patchError;
      await loadData();
    } catch (err: any) {
      setError(`Błąd aktualizacji statusu: ${err.message}`);
    }
  }

  async function deleteOrder(id: string, name: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć zamówienie dla: ${name}?`)) return;
    try {
      const { error: delError } = await supabase.from("orders").delete().eq("id", id);
      if (delError) throw delError;
      setSuccess(`Zamówienie dla "${name}" zostało usunięte.`);
      await loadData();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        !query ||
        o.client_name.toLowerCase().includes(query) ||
        o.cake_name.toLowerCase().includes(query) ||
        (o.client_phone && o.client_phone.includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [orders, statusFilter, search]);

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
          HARMONOGRAM I ZAMÓWIENIA
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Zamówienia</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Rejestruj zlecenia, terminy wydań, zaliczki i monitoruj realizację wypieków.
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

      {/* FORMULARZ ZAMÓWIENIA */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            {editingId ? "Edycja zamówienia" : "+ Nowe zamówienie na tort"}
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
          {/* Wybór z bazy klientów */}
          <div style={{ background: "#fdfbf9", border: "1px solid #e9e2da", borderRadius: 12, padding: 16 }}>
            <label style={labelStyle}>
              <span>👤 Wybierz klienta z bazy (lub wpisz poniżej nowego):</span>
              <select
                value={form.client_id}
                onChange={(e) => handleClientSelect(e.target.value)}
                style={{ ...inputStyle, background: "#ffffff", fontWeight: 600 }}
              >
                <option value="">-- Wpisz dane klienta ręcznie --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <label style={labelStyle}>
              Imię i nazwisko klienta *
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
              Adres / Miejsce dostawy
              <input
                type="text"
                value={form.client_address}
                onChange={(e) => updateForm("client_address", e.target.value)}
                placeholder="np. Białystok (lub odbiór własny)"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Data wydania / realizacji *
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => updateForm("delivery_date", e.target.value)}
                required
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              Nazwa / styl tortu *
              <input
                type="text"
                value={form.cake_name}
                onChange={(e) => updateForm("cake_name", e.target.value)}
                placeholder="np. Tort Urodzinowy Mango-Marakuja"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Średnica (cm)
              <input
                type="number"
                value={form.diameter_cm}
                onChange={(e) => updateForm("diameter_cm", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Wysokość (cm)
              <input
                type="number"
                value={form.height_cm}
                onChange={(e) => updateForm("height_cm", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Porcje
              <input
                type="number"
                value={form.portions}
                onChange={(e) => updateForm("portions", e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              Wycena całkowita (zł) *
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
                value={form.deposit}
                onChange={(e) => updateForm("deposit", e.target.value)}
                placeholder="np. 100,00"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Status zamówienia
              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value as any)}
                style={inputStyle}
              >
                <option value="nowe">Nowe (Oczekujące)</option>
                <option value="w_trakcie">W trakcie realizacji</option>
                <option value="zrealizowane">Zrealizowane / Wydane</option>
                <option value="anulowane">Anulowane</option>
              </select>
            </label>
          </div>

          <label style={labelStyle}>
            Szczegóły dekoracji / Uwagi / Alergie
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="np. Napis: 30 Lat Ani, żywe kwiaty, bez orzechów, odbiór o godz. 14:00"
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
            {saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany w zamówieniu" : "+ Zapisz zamówienie"}
          </button>
        </form>
      </div>

      {/* LISTA ZAMÓWIEŃ */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            Lista zamówień ({filteredOrders.length})
          </h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...inputStyle, width: "auto" }}
            >
              <option value="all">Wszystkie statusy</option>
              <option value="nowe">Nowe</option>
              <option value="w_trakcie">W trakcie</option>
              <option value="zrealizowane">Zrealizowane</option>
              <option value="anulowane">Anulowane</option>
            </select>

            <input
              type="text"
              placeholder="Szukaj klienta, tortu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 220 }}
            />
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
            {filteredOrders.map((order) => {
              const remaining = Number(order.total_price || 0) - Number(order.deposit || 0);

              return (
                <div
                  key={order.id}
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
                      <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700 }}>
                        TERMIN WYDANIA: {order.delivery_date}
                      </div>
                      <h4 style={{ margin: "3px 0 0", fontSize: 18, color: "#292522" }}>
                        {order.cake_name} ({order.diameter_cm} cm × {order.height_cm} cm, {order.portions} porcji)
                      </h4>
                      <div style={{ marginTop: 4, fontSize: 13, color: "#514b46" }}>
                        Klient: <strong>{order.client_name}</strong> {order.client_phone ? `| 📞 ${order.client_phone}` : ""} {order.client_address ? `| 📍 ${order.client_address}` : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#292522" }}>
                        {formatMoney(order.total_price)}
                      </div>
                      <div style={{ fontSize: 12, color: remaining > 0 ? "#b91c1c" : "#047857", fontWeight: 600 }}>
                        {remaining > 0 ? `Do zapłaty: ${formatMoney(remaining)}` : "Opłacono w całości"}
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: 9, fontSize: 13, color: "#514b46", border: "1px solid #eee7e0" }}>
                      <strong>Uwagi:</strong> {order.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee7e0", paddingTop: 12, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#716b65" }}>Zmień status:</span>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "nowe")}
                        style={{
                          ...buttonStyle,
                          padding: "4px 8px",
                          fontSize: 11,
                          background: order.status === "nowe" ? "#dbeafe" : "#f3f4f6",
                          color: order.status === "nowe" ? "#1e40af" : "#4b5563",
                        }}
                      >
                        Nowe
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "w_trakcie")}
                        style={{
                          ...buttonStyle,
                          padding: "4px 8px",
                          fontSize: 11,
                          background: order.status === "w_trakcie" ? "#fef3c7" : "#f3f4f6",
                          color: order.status === "w_trakcie" ? "#92400e" : "#4b5563",
                        }}
                      >
                        W trakcie
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "zrealizowane")}
                        style={{
                          ...buttonStyle,
                          padding: "4px 8px",
                          fontSize: 11,
                          background: order.status === "zrealizowane" ? "#dcfce7" : "#f3f4f6",
                          color: order.status === "zrealizowane" ? "#166534" : "#4b5563",
                        }}
                      >
                        Zrealizowane
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => startEditing(order)}
                        style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151", padding: "6px 12px", fontSize: 12 }}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id, order.client_name)}
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
