"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type Order = {
  id: string;
  client_name: string;
  client_phone: string | null;
  delivery_date: string;
  delivery_time?: string | null;
  cake_name: string;
  diameter_cm: number;
  height_cm: number;
  portions: number;
  description: string | null;
  total_price: number;
  advance_payment: number;
  status: "nowe" | "w_trakcie" | "zrealizowane" | "anulowane";
  created_at: string;
};

type ClientOption = {
  id: string;
  name: string;
  phone: string | null;
  notes?: string | null;
};

type OrderForm = {
  client_id: string;
  client_name: string;
  client_phone: string;
  delivery_time: string;
  cake_name: string;
  diameter_cm: string;
  height_cm: string;
  portions: string;
  total_price: string;
  advance_payment: string;
  delivery_date: string;
  status: "nowe" | "w_trakcie" | "zrealizowane" | "anulowane";
  description: string;
};

const emptyOrderForm: OrderForm = {
  client_id: "",
  client_name: "",
  client_phone: "",
  delivery_time: "14:00",
  cake_name: "",
  diameter_cm: "18",
  height_cm: "12",
  portions: "14",
  total_price: "",
  advance_payment: "0",
  delivery_date: new Date().toISOString().slice(0, 10),
  status: "nowe",
  description: "",
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

  // Modale podglądu / drukowania
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<Order | null>(null);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [ordersRes, clientsRes] = await Promise.all([
        supabase.from("orders").select("*").order("delivery_date", { ascending: true }),
        supabase.from("clients").select("id, name, phone, notes").order("name", { ascending: true }),
      ]);

      if (ordersRes.error) throw ordersRes.error;

      setOrders((ordersRes.data ?? []) as Order[]);
      setClients((clientsRes.data ?? []) as ClientOption[]);
    } catch (err: any) {
      setError(`Błąd pobierania danych: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
      setForm((prev) => ({ ...prev, client_id: "" }));
      return;
    }

    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        client_id: selected.id,
        client_name: selected.name,
        client_phone: selected.phone || "",
        description: prev.description
          ? prev.description
          : selected.notes
          ? `Uwagi klienta: ${selected.notes}`
          : "",
      }));
    }
  }

  function startEditing(order: Order) {
    setEditingId(order.id);
    setForm({
      client_id: "",
      client_name: order.client_name,
      client_phone: order.client_phone ?? "",
      delivery_time: order.delivery_time ?? "14:00",
      cake_name: order.cake_name,
      diameter_cm: String(order.diameter_cm),
      height_cm: String(order.height_cm),
      portions: String(order.portions),
      total_price: String(order.total_price).replace(".", ","),
      advance_payment: String(order.advance_payment ?? 0).replace(".", ","),
      delivery_date: order.delivery_date,
      status: order.status,
      description: order.description ?? "",
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
      delivery_time: form.delivery_time.trim() || null,
      cake_name: form.cake_name.trim(),
      diameter_cm: Number(form.diameter_cm) || 18,
      height_cm: Number(form.height_cm) || 12,
      portions: Number(form.portions) || 14,
      total_price: parseDecimal(form.total_price),
      advance_payment: parseDecimal(form.advance_payment),
      delivery_date: form.delivery_date,
      status: form.status,
      description: form.description.trim() || null,
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

  // Szablon wiadomości ze stopką Délice by Milewska - słodka doskonałość [facebook.com/DeliceByMilewska]
  function generateClientMessageText(order: Order): string {
    const remaining = Number(order.total_price || 0) - Number(order.advance_payment || 0);
    return `Dzień dobry ${order.client_name}! 🍰✨

Dziękujemy za złożenie zamówienia w pracowni Délice by Milewska - słodka doskonałość!

Oto podsumowanie Twojego tortu:
🎂 Tort: ${order.cake_name}
📐 Wymiary: ⌀${order.diameter_cm} cm (ok. ${order.portions} porcji)
🗓 Termin odbioru: ${order.delivery_date}${order.delivery_time ? ` (godz. ${order.delivery_time})` : ""}
${order.description ? `📌 Szczegóły / dekoracja: ${order.description}\n` : ""}
💰 Całkowita wartość: ${formatMoney(order.total_price)}
💵 Wpłacona zaliczka: ${formatMoney(order.advance_payment)}
👉 Pozostało do dopłaty przy odbiorze: ${formatMoney(remaining)}

Będzie nam ogromnie miło, jeśli po uroczystości oznaczysz nas na zdjęciach! 📸✨

Pozdrawiamy serdecznie,
Délice by Milewska - słodka doskonałość
[facebook.com/DeliceByMilewska]`;
  }

  function handleCopyMessage(order: Order) {
    const text = generateClientMessageText(order);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    });
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
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-label, #printable-label * { visibility: visible !important; }
          #printable-invoice, #printable-invoice * { visibility: visible !important; }
          #printable-label, #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .delice-no-print { display: none !important; }
        }
      `}</style>

      <div className="delice-no-print" style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          HARMONOGRAM I ZAMÓWIENIA
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Zamówienia — Délice by Milewska</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Rejestruj zlecenia, generuj potwierdzenia dla klientów oraz drukuj etykiety z alergenami na pudełka.
        </p>
      </div>

      {error && (
        <div className="delice-no-print" style={{ padding: 14, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {success && (
        <div className="delice-no-print" style={{ padding: 14, background: "#ecfdf5", color: "#047857", borderRadius: 12, marginBottom: 20 }}>
          {success}
        </div>
      )}

      {/* FORMULARZ ZAMÓWIENIA */}
      <div className="delice-no-print" style={{ ...cardStyle, marginBottom: 24 }}>
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
              Godzina odbioru
              <input
                type="text"
                value={form.delivery_time}
                onChange={(e) => updateForm("delivery_time", e.target.value)}
                placeholder="np. 14:00"
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
                placeholder="np. Tort Urodzinowy Pistacja-Malina"
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
                value={form.advance_payment}
                onChange={(e) => updateForm("advance_payment", e.target.value)}
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
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="np. Napis: 30 Lat Ani, żywe kwiaty, bez orzechów"
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
      <div className="delice-no-print" style={cardStyle}>
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
              const remaining = Number(order.total_price || 0) - Number(order.advance_payment || 0);

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
                        TERMIN WYDANIA: {order.delivery_date} {order.delivery_time ? `(godz. ${order.delivery_time})` : ""}
                      </div>
                      <h4 style={{ margin: "3px 0 0", fontSize: 18, color: "#292522" }}>
                        {order.cake_name} ({order.diameter_cm} cm × {order.height_cm} cm, {order.portions} porcji)
                      </h4>
                      <div style={{ marginTop: 4, fontSize: 13, color: "#514b46" }}>
                        Klient: <strong>{order.client_name}</strong> {order.client_phone ? `| 📞 ${order.client_phone}` : ""}
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

                  {order.description && (
                    <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: 9, fontSize: 13, color: "#514b46", border: "1px solid #eee7e0" }}>
                      <strong>Uwagi:</strong> {order.description}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", background: "#ffffff", padding: "10px 12px", borderRadius: 10, border: "1px solid #eee7e0" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForMessage(order)}
                      style={{ ...buttonStyle, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "6px 12px", fontSize: 12 }}
                    >
                      📱 Wiadomość dla klienta (WhatsApp / SMS)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderForLabel(order)}
                      style={{ ...buttonStyle, background: "#fefce8", color: "#854d0e", border: "1px solid #fef08a", padding: "6px 12px", fontSize: 12 }}
                    >
                      🏷 Etykieta na pudełko (Alergeny)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderForInvoice(order)}
                      style={{ ...buttonStyle, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "6px 12px", fontSize: 12 }}
                    >
                      📄 Potwierdzenie / Karta wydania (PDF)
                    </button>
                  </div>

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

      {/* MODAL 1: WIADOMOŚĆ DLA KLIENTA (WHATSAPP / SMS) */}
      {selectedOrderForMessage && (
        <div
          className="delice-no-print"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrderForMessage(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 620,
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>📱 Wiadomość dla klienta</h3>
                <div style={{ fontSize: 12, color: "#8a6d4b", fontWeight: 700 }}>Délice by Milewska - słodka doskonałość</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForMessage(null)}
                style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <textarea
              readOnly
              rows={15}
              value={generateClientMessageText(selectedOrderForMessage)}
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12, resize: "none", background: "#fdfbf9", lineHeight: 1.5 }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => handleCopyMessage(selectedOrderForMessage)}
                style={{ ...buttonStyle, flex: 1, background: "#047857", color: "#fff" }}
              >
                {copiedText ? "✓ Skopiowano do schowka!" : "📋 Kopiuj treść wiadomości"}
              </button>

              {selectedOrderForMessage.client_phone && (
                <a
                  href={`https://wa.me/48${selectedOrderForMessage.client_phone.replace(/\s+/g, "")}?text=${encodeURIComponent(
                    generateClientMessageText(selectedOrderForMessage)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...buttonStyle,
                    background: "#25D366",
                    color: "#fff",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Otwórz WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ETYKIETA NA PUDEŁKO (ALERGENY I ZALECENIA) */}
      {selectedOrderForLabel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrderForLabel(null)}
        >
          <div
            id="printable-label"
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#ffffff",
              borderRadius: 16,
              padding: 26,
              border: "2px dashed #8a6d4b",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", borderBottom: "1.5px solid #8a6d4b", paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#8a6d4b", letterSpacing: 1.5 }}>
                DÉLICE BY MILEWSKA
              </div>
              <div style={{ fontSize: 11, color: "#514b46", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
                SŁODKA DOSKONAŁOŚĆ
              </div>
              <div style={{ fontSize: 10, color: "#8a837d", marginTop: 2 }}>Autorska Pracownia Tortów Artystycznych</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700 }}>TORT ARTYSTYCZNY DLA:</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#292522" }}>{selectedOrderForLabel.client_name}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#514b46", marginTop: 2 }}>
                Kompozycja smaków: {selectedOrderForLabel.cake_name}
              </div>
              <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
                Data wydania: <strong>{selectedOrderForLabel.delivery_date}</strong> (⌀{selectedOrderForLabel.diameter_cm} cm, ok. {selectedOrderForLabel.portions} porcji)
              </div>
            </div>

            <div style={{ background: "#fffdfa", border: "1px solid #e9e2da", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 11, color: "#514b46" }}>
              <strong style={{ color: "#b91c1c", display: "block", marginBottom: 3 }}>⚠️ INFORMACJA O ALERGENACH:</strong>
              Produkt może zawierać: gluten, jaja kurzęce, mleko i produkty pochodne (laktoza), orzechy, soję, żelatynę wieprzową.
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 10, fontSize: 11, color: "#166534", lineHeight: 1.4 }}>
              <strong>❄️ ZALECENIA DOTYCZĄCE PRZECHOWYWANIA I KROJENIA:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                <li>Przechowywać w lodówce w temp. 4–7°C w zamkniętym pudełku.</li>
                <li>Wyjąć z lodówki na 20–30 minut przed podaniem (kremy uzyskają idealną aksamitność).</li>
                <li>Kroić gorącym, suchym nożem zanurzanym we wrzątku.</li>
                <li>Elementy dekoracyjne (topper, żywe kwiaty, wsporniki) są niejadalne.</li>
              </ul>
            </div>

            <div style={{ textAlign: "center", marginTop: 14, paddingTop: 10, borderTop: "1px dashed #ddd3c9", fontSize: 11, color: "#8a6d4b", fontWeight: 600 }}>
              fb.com/DeliceByMilewska • Oznacz nas na zdjęciach! ✨
            </div>

            <div className="delice-no-print" style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ ...buttonStyle, flex: 1, background: "#8a6d4b", color: "#fff" }}
              >
                🖨 Drukuj etykietę na pudełko
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForLabel(null)}
                style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151" }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: POTWIERDZENIE ZAMÓWIENIA / KARTA WYDANIA (PDF) */}
      {selectedOrderForInvoice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setSelectedOrderForInvoice(null)}
        >
          <div
            id="printable-invoice"
            style={{
              width: "100%",
              maxWidth: 650,
              background: "#ffffff",
              borderRadius: 16,
              padding: 30,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #8a6d4b", paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#8a6d4b", letterSpacing: 1.5 }}>
                  DÉLICE BY MILEWSKA
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#514b46" }}>SŁODKA DOSKONAŁOŚĆ</div>
                <div style={{ fontSize: 11, color: "#716b65" }}>Autorska Pracownia Tortów Artystycznych • fb.com/DeliceByMilewska</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#292522" }}>KARTA ZAMÓWIENIA</div>
                <div style={{ fontSize: 12, color: "#716b65" }}>Data wydania: {selectedOrderForInvoice.delivery_date}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#fdfbf9", padding: 14, borderRadius: 10, border: "1px solid #eee7e0" }}>
                <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700, marginBottom: 4 }}>DANE ZAMAWIAJĄCEGO:</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#292522" }}>{selectedOrderForInvoice.client_name}</div>
                {selectedOrderForInvoice.client_phone && (
                  <div style={{ fontSize: 13, color: "#514b46", marginTop: 2 }}>📞 {selectedOrderForInvoice.client_phone}</div>
                )}
              </div>

              <div style={{ background: "#fdfbf9", padding: 14, borderRadius: 10, border: "1px solid #eee7e0" }}>
                <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700, marginBottom: 4 }}>TERMIN ODBIORU:</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#292522" }}>{selectedOrderForInvoice.delivery_date}</div>
                <div style={{ fontSize: 13, color: "#514b46", marginTop: 2 }}>Godzina: {selectedOrderForInvoice.delivery_time || "do ustalenia"}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f4f0ec", color: "#8a6d4b", textAlign: "left" }}>
                    <th style={{ padding: 10 }}>POZYCJA</th>
                    <th style={{ padding: 10 }}>PARAMETRY</th>
                    <th style={{ padding: 10, textAlign: "right" }}>WARTOŚĆ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #eee7e0" }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>{selectedOrderForInvoice.cake_name}</td>
                    <td style={{ padding: 12 }}>⌀{selectedOrderForInvoice.diameter_cm} cm × {selectedOrderForInvoice.height_cm} cm (ok. {selectedOrderForInvoice.portions} porcji)</td>
                    <td style={{ padding: 12, textAlign: "right", fontWeight: 800 }}>{formatMoney(selectedOrderForInvoice.total_price)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedOrderForInvoice.description && (
              <div style={{ background: "#fdfbf9", padding: 12, borderRadius: 8, border: "1px solid #eee7e0", fontSize: 12, marginBottom: 20 }}>
                <strong>Szczegóły / uwagi do zamówienia:</strong> {selectedOrderForInvoice.description}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <div style={{ width: 270, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Wartość całkowita:</span>
                  <strong>{formatMoney(selectedOrderForInvoice.total_price)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#047857" }}>
                  <span>Wpłacona zaliczka:</span>
                  <strong>{formatMoney(selectedOrderForInvoice.advance_payment)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, borderTop: "2px solid #8a6d4b", paddingTop: 6, color: "#8a6d4b" }}>
                  <span>Pozostało do zapłaty:</span>
                  <span>{formatMoney(Number(selectedOrderForInvoice.total_price || 0) - Number(selectedOrderForInvoice.advance_payment || 0))}</span>
                </div>
              </div>
            </div>

            <div className="delice-no-print" style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ ...buttonStyle, flex: 1, background: "#8a6d4b", color: "#fff" }}
              >
                🖨 Drukuj kartę zamówienia / Zapisz PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForInvoice(null)}
                style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151" }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
