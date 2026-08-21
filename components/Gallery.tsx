"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type CakePhoto = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  flavor_notes: string | null;
  created_at: string;
};

const CATEGORIES = [
  "Wszystkie",
  "Urodzinowe",
  "Weselne",
  "Dziecięce",
  "Chrzciny / Komunia",
  "Okolicznościowe",
  "Nowoczesne / Bento",
  "Inne",
];

export default function Gallery() {
  const [photos, setPhotos] = useState<CakePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [search, setSearch] = useState("");
  const [activeModalPhoto, setActiveModalPhoto] = useState<CakePhoto | null>(null);

  // Formularz
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Urodzinowe");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [flavorNotes, setFlavorNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadPhotos();
  }, []);

  async function loadPhotos() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchErr } = await supabase
        .from("cake_gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) throw fetchErr;
      setPhotos((data || []) as CakePhoto[]);
    } catch (err: any) {
      setError(`Błąd wczytywania galerii: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Obsługa wczytania pliku zdjęcia z telefonu / dysku (Base64)
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Zdjęcie jest za duże. Maksymalny rozmiar to 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Podaj nazwę lub tytuł realizacji.");
      return;
    }
    if (!imageUrl.trim()) {
      setError("Wybierz zdjęcie z dysku lub podaj link URL.");
      return;
    }

    setSaving(true);
    try {
      const { error: insertErr } = await supabase.from("cake_gallery").insert({
        title: title.trim(),
        category,
        image_url: imageUrl.trim(),
        description: description.trim() || null,
        flavor_notes: flavorNotes.trim() || null,
      });

      if (insertErr) throw insertErr;

      setSuccess("Zdjęcie zostało pomyślnie dodane do galerii!");
      setTitle("");
      setImageUrl("");
      setDescription("");
      setFlavorNotes("");
      await loadPhotos();
    } catch (err: any) {
      setError(`Błąd zapisu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, photoTitle: string) {
    if (!window.confirm(`Czy na pewno chcesz usunąć zdjęcie "${photoTitle}"?`)) return;
    try {
      const { error: delErr } = await supabase.from("cake_gallery").delete().eq("id", id);
      if (delErr) throw delErr;
      setSuccess(`Usunięto zdjęcie: ${photoTitle}`);
      if (activeModalPhoto?.id === id) setActiveModalPhoto(null);
      await loadPhotos();
    } catch (err: any) {
      setError(`Błąd usuwania: ${err.message}`);
    }
  }

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchesCat = selectedCategory === "Wszystkie" || p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.flavor_notes && p.flavor_notes.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [photos, selectedCategory, search]);

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
          PORTFOLIO I REALIZACJE
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Baza zdjęć tortów</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Katalog zrealizowanych wypieków, inspiracje dekoracji i smaków dla klientów.
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

      {/* FORMULARZ DODAWANIA ZDJĘCIA */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#292522" }}>
          + Dodaj nowe zdjęcie do portfolio
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Nazwa / Tytuł tortu *
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Tort Piętrowy z żywymi eustomami"
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
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              📸 Wgraj plik z telefonu / komputera
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ ...inputStyle, padding: "8px" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              🔗 lub wklej bezpośredni link URL do zdjęcia
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://domena.pl/zdjecie.jpg"
                style={inputStyle}
              />
            </label>
          </div>

          {imageUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fdfbf9", padding: 10, borderRadius: 10, border: "1px solid #eee7e0" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Podgląd" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
              <span style={{ fontSize: 12, color: "#047857", fontWeight: 600 }}>✓ Zdjęcie załadowane do podglądu</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Smaki / Kremy (notatka)
              <input
                type="text"
                value={flavorNotes}
                onChange={(e) => setFlavorNotes(e.target.value)}
                placeholder="np. Czekolada, chrupka orzechowa, malina"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#514b46" }}>
              Opis dekoracji / Wymiary
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="np. Średnica 20 cm, tynk ganache, złocenia"
                style={inputStyle}
              />
            </label>
          </div>

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
              cursor: "pointer",
              marginTop: 6,
            }}
          >
            {saving ? "Zapisywanie..." : "+ Dodaj zdjęcie do bazy"}
          </button>
        </form>
      </div>

      {/* FILTROWANIE I GALERIA */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
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
            placeholder="Szukaj realizacji, smaku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 220 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#716b65" }}>Ładowanie bazy zdjęć...</div>
        ) : filteredPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #ddd3c9", borderRadius: 12, color: "#8a837d" }}>
            Brak zdjęć w wybranej kategorii. Dodaj pierwsze zdjęcie powyżej!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  border: "1px solid #eee7e0",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                {/* Obrazek z kliknięciem w podgląd */}
                <div
                  onClick={() => setActiveModalPhoto(photo)}
                  style={{ width: "100%", height: 220, position: "relative", cursor: "pointer", background: "#f4f0ec" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {photo.category}
                  </div>
                </div>

                {/* Opis */}
                <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px", fontSize: 16, color: "#292522" }}>{photo.title}</h4>
                    {photo.flavor_notes && (
                      <div style={{ fontSize: 12, color: "#8a6d4b", fontWeight: 600, marginBottom: 4 }}>
                        🍰 {photo.flavor_notes}
                      </div>
                    )}
                    {photo.description && (
                      <p style={{ margin: 0, fontSize: 12, color: "#716b65", lineHeight: 1.4 }}>
                        {photo.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, borderTop: "1px solid #eee7e0", paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setActiveModalPhoto(photo)}
                      style={{ border: "none", background: "transparent", color: "#8a6d4b", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      Powiększ 🔍
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(photo.id, photo.title)}
                      style={{ border: "none", background: "transparent", color: "#b91c1c", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL POWIĘKSZENIA ZDJĘCIA (LIGHTBOX) */}
      {activeModalPhoto && (
        <div
          onClick={() => setActiveModalPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 18,
              maxWidth: 600,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeModalPhoto.image_url}
              alt={activeModalPhoto.title}
              style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", background: "#111" }}
            />
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 700 }}>
                    {activeModalPhoto.category}
                  </div>
                  <h3 style={{ margin: "4px 0 6px", fontSize: 20, color: "#292522" }}>
                    {activeModalPhoto.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalPhoto(null)}
                  style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}
                >
                  ✕ Zamknij
                </button>
              </div>

              {activeModalPhoto.flavor_notes && (
                <div style={{ fontSize: 13, color: "#8a6d4b", fontWeight: 600, marginTop: 6 }}>
                  Smaki: {activeModalPhoto.flavor_notes}
                </div>
              )}
              {activeModalPhoto.description && (
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#716b65", lineHeight: 1.5 }}>
                  {activeModalPhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
