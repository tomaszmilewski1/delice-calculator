"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
};

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  active: boolean;
};

const emptyClientForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  active: true,
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyClientForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    setError("");

    const { data, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });

    if (clientsError) {
      setError(`Nie udało się pobrać bazy klientów: ${clientsError.message}`);
      setLoading(false);
      return;
    }

    setClients((data ?? []) as Client[]);
    setLoading(false);
  }

  function updateForm(field: keyof ClientForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEditing(client: Client) {
    setEditingId(client.id);
    setForm({
      name: client.name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      address: client.address ?? "",
      notes: client.notes ?? "",
      active: client.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyClientForm);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Podaj imię i nazwisko klienta.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      active: form.active,
    };

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess("Dane klienta zostały zaktualizowane.");
      } else {
        const { error: insertError } = await supabase.from("clients").insert(payload);
        if (insertError) throw insertError;
        setSuccess("Nowy klient został dodany do bazy.");
      }

      setForm(emptyClientForm);
      setEditingId(null);
      await loadClients();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(id: string, name: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć klienta "${name}"?`)) return;
    try {
      const { error: delError } = await supabase.from("clients").delete().eq("id", id);
      if (delError) throw delError;
      setSuccess(`Klient "${name}" został usunięty.`);
      await loadClients();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    }
  }

  async function toggleActive(client: Client) {
    try {
      const { error: toggleErr } = await supabase
        .from("clients")
        .update({ active: !client.active })
        .eq("id", client.id);
      if (toggleErr) throw toggleErr;
      await loadClients();
    } catch (err: any) {
      setError(`Błąd zmiany statusu: ${err.message}`);
    }
  }

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((c) => {
      return (
        !query ||
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.address && c.address.toLowerCase().includes(query))
      );
    });
  }, [clients, search]);

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
          BAZA KLIENTÓW
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Klienci</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Przechowuj kontakty, preferencje smakowe, alergie i historię kontaktów z klientami.
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

      {/* FORMULARZ KLIENTA */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            {editingId ? "Edytuj dane klienta" : "+ Dodaj nowego klienta"}
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
              Imię i nazwisko *
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="np. Anna Kowalska"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Telefon kontaktowy
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="np. 500 600 700"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Adres e-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="np. anna@gmail.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Adres / Miasto
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                placeholder="np. Białystok, ul. Lipowa 5"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Notatki / Alergie / Preferencje klienta
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="np. Stała klientka, bezglutenowe biszkopty, preferuje mniej słodkie kremy..."
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
            {saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany" : "+ Dodaj klienta"}
          </button>
        </form>
      </div>

      {/* LISTA KLIENTÓW */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
            Lista klientów ({filteredClients.length})
          </h3>

          <input
            type="text"
            placeholder="Szukaj po nazwisku, telefonie, adresie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 280 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 30, color: "#716b65" }}>Ładowanie klientów...</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #ddd3c9", borderRadius: 12, color: "#8a837d" }}>
            Brak klientów w bazie.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {filteredClients.map((client) => (
              <div
                key={client.id}
                style={{
                  border: "1px solid #eee7e0",
                  borderRadius: 14,
                  padding: 18,
                  background: client.active ? "#fdfbf9" : "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 18, color: "#292522" }}>
                      {client.name}
                    </h4>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: client.active ? "#dcfce7" : "#e5e7eb",
                        color: client.active ? "#166534" : "#4b5563",
                      }}
                    >
                      {client.active ? "AKTYWNY" : "NIEAKTYWNY"}
                    </span>
                  </div>

                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#716b65" }}>
                    {client.phone && <div>📞 {client.phone}</div>}
                    {client.email && <div>✉️ {client.email}</div>}
                    {client.address && <div>📍 {client.address}</div>}
                  </div>

                  {client.notes && (
                    <div style={{ marginTop: 10, background: "#ffffff", padding: 8, borderRadius: 8, fontSize: 12, color: "#514b46", border: "1px solid #eee7e0" }}>
                      {client.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, borderTop: "1px solid #eee7e0", paddingTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => startEditing(client)}
                    style={{ ...buttonStyle, background: "#f3f4f6", color: "#374151", padding: "6px 12px", fontSize: 12 }}
                  >
                    Edytuj
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleActive(client)}
                    style={{
                      ...buttonStyle,
                      background: client.active ? "#fef3c7" : "#dcfce7",
                      color: client.active ? "#92400e" : "#166534",
                      padding: "6px 12px",
                      fontSize: 12,
                    }}
                  >
                    {client.active ? "Dezaktywuj" : "Aktywuj"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteClient(client.id, client.name)}
                    style={{ ...buttonStyle, background: "#fee2e2", color: "#b91c1c", padding: "6px 12px", fontSize: 12 }}
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
