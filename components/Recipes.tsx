"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  servings: number | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type RecipeForm = {
  name: string;
  category: string;
  description: string;
  servings: string;
  notes: string;
  active: boolean;
};

const emptyForm: RecipeForm = {
  name: "",
  category: "",
  description: "",
  servings: "",
  notes: "",
  active: true,
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<RecipeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    setError("");

    const { data, error: recipesError } = await supabase
      .from("recipes")
      .select("*")
      .order("name", { ascending: true });

    if (recipesError) {
      setError(
        `Nie udało się pobrać receptur: ${recipesError.message}`
      );
      setLoading(false);
      return;
    }

    setRecipes((data ?? []) as Recipe[]);
    setLoading(false);
  }

  function updateForm(
    field: keyof RecipeForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(recipe: Recipe) {
    setEditingId(recipe.id);

    setForm({
      name: recipe.name ?? "",
      category: recipe.category ?? "",
      description: recipe.description ?? "",
      servings:
        recipe.servings !== null
          ? String(recipe.servings).replace(".", ",")
          : "",
      notes: recipe.notes ?? "",
      active: recipe.active,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = form.name.trim();

    if (!cleanName) {
      setError("Podaj nazwę receptury.");
      return;
    }

    const servingsValue =
      form.servings.trim() === ""
        ? null
        : Number(form.servings.replace(",", "."));

    if (
      servingsValue !== null &&
      (!Number.isFinite(servingsValue) || servingsValue <= 0)
    ) {
      setError(
        "Liczba porcji musi być liczbą większą od zera."
      );
      return;
    }

    const recipeData = {
      name: cleanName,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      servings: servingsValue,
      notes: form.notes.trim() || null,
      active: form.active,
    };

    setSaving(true);

    if (editingId) {
      const { error: updateError } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq("id", editingId);

      if (updateError) {
        setError(
          `Nie udało się zaktualizować receptury: ${updateError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Receptura została zaktualizowana.");
    } else {
      const { error: insertError } = await supabase
        .from("recipes")
        .insert(recipeData);

      if (insertError) {
        setError(
          `Nie udało się zapisać receptury: ${insertError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Receptura została dodana.");
    }

    setForm(emptyForm);
    setEditingId(null);

    await loadRecipes();

    setSaving(false);
  }

  async function deleteRecipe(recipe: Recipe) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć recepturę "${recipe.name}"?\n\nTej operacji nie można cofnąć.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipe.id);

    if (deleteError) {
      setError(
        `Nie udało się usunąć receptury: ${deleteError.message}`
      );
      return;
    }

    if (editingId === recipe.id) {
      cancelEditing();
    }

    setSuccess(
      `Receptura "${recipe.name}" została usunięta.`
    );

    await loadRecipes();
  }

  async function toggleActive(recipe: Recipe) {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("recipes")
      .update({
        active: !recipe.active,
      })
      .eq("id", recipe.id);

    if (updateError) {
      setError(
        `Nie udało się zmienić statusu receptury: ${updateError.message}`
      );
      return;
    }

    setRecipes((current) =>
      current.map((item) =>
        item.id === recipe.id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );

    setSuccess(
      recipe.active
        ? `Receptura "${recipe.name}" została wyłączona.`
        : `Receptura "${recipe.name}" została aktywowana.`
    );
  }

  function formatServings(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
    }

    return Number(value)
      .toString()
      .replace(".", ",");
  }

  const categories = useMemo(() => {
    const uniqueCategories = recipes
      .map((recipe) => recipe.category?.trim())
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(new Set(uniqueCategories)).sort(
      (a, b) => a.localeCompare(b, "pl")
    );
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const cleanSearch = search
      .trim()
      .toLocaleLowerCase("pl");

    return recipes.filter((recipe) => {
      const matchesSearch =
        cleanSearch === "" ||
        recipe.name
          .toLocaleLowerCase("pl")
          .includes(cleanSearch) ||
        (recipe.category ?? "")
          .toLocaleLowerCase("pl")
          .includes(cleanSearch) ||
        (recipe.description ?? "")
          .toLocaleLowerCase("pl")
          .includes(cleanSearch);

      const matchesCategory =
        categoryFilter === "all" ||
        recipe.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [recipes, search, categoryFilter]);

  return (
    <section style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            BAZA RECEPTUR
          </div>

          <h2 style={titleStyle}>
            Receptury
          </h2>

          <p style={subtitleStyle}>
            Twórz receptury, zarządzaj nimi i przygotuj
            bazę do automatycznego wyliczania kosztów tortów.
          </p>
        </div>

        <div style={countBadgeStyle}>
          {recipes.length}{" "}
          {recipes.length === 1
            ? "receptura"
            : recipes.length >= 2 && recipes.length <= 4
            ? "receptury"
            : "receptur"}
        </div>
      </div>

      <div style={contentGridStyle}>
        <div style={formCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                {editingId
                  ? "Edytuj recepturę"
                  : "Dodaj recepturę"}
              </h3>

              <p style={cardSubtitleStyle}>
                {editingId
                  ? "Zmień dane receptury i zapisz zmiany."
                  : "Receptura zostanie zapisana w bazie Supabase."}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={cancelEditing}
                style={cancelButtonStyle}
              >
                Anuluj
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Nazwa receptury *
              </span>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="np. Biszkopt waniliowy"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Kategoria
              </span>

              <input
                type="text"
                value={form.category}
                onChange={(event) =>
                  updateForm(
                    "category",
                    event.target.value
                  )
                }
                placeholder="np. Biszkopty"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Liczba porcji
              </span>

              <input
                type="text"
                inputMode="decimal"
                value={form.servings}
                onChange={(event) =>
                  updateForm(
                    "servings",
                    event.target.value
                  )
                }
                placeholder="np. 10"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Opis
              </span>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Krótki opis receptury"
                disabled={saving}
                rows={3}
                style={textareaStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Uwagi
              </span>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateForm("notes", event.target.value)
                }
                placeholder="Opcjonalne informacje"
                disabled={saving}
                rows={3}
                style={textareaStyle}
              />
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  updateForm(
                    "active",
                    event.target.checked
                  )
                }
                disabled={saving}
              />

              <span>
                Receptura aktywna
              </span>
            </label>

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            {success && (
              <div style={successStyle}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...buttonStyle,
                opacity: saving ? 0.7 : 1,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Zapisywanie..."
                : editingId
                ? "Zapisz zmiany"
                : "+ Dodaj recepturę"}
            </button>
          </form>
        </div>

        <div style={listCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                Lista receptur
              </h3>

              <p style={cardSubtitleStyle}>
                Receptury zapisane w bazie Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRecipes}
              disabled={loading}
              style={refreshButtonStyle}
            >
              Odśwież
            </button>
          </div>

          <div style={filtersStyle}>
            <div style={searchWrapperStyle}>
              <span style={searchIconStyle}>
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Szukaj receptury lub kategorii..."
                style={searchInputStyle}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              style={filterSelectStyle}
            >
              <option value="all">
                Wszystkie kategorie
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            {(search !== "" ||
              categoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                }}
                style={clearFilterButtonStyle}
              >
                Wyczyść
              </button>
            )}
          </div>

          {!loading && recipes.length > 0 && (
            <div style={resultsInfoStyle}>
              Wyświetlono{" "}
              <strong>
                {filteredRecipes.length}
              </strong>{" "}
              z{" "}
              <strong>
                {recipes.length}
              </strong>{" "}
              receptur
            </div>
          )}

          {loading ? (
            <div style={emptyStyle}>
              Ładowanie receptur...
            </div>
          ) : recipes.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                R
              </div>

              <strong>
                Brak receptur
              </strong>

              <p style={emptyTextStyle}>
                Dodaj pierwszą recepturę za pomocą formularza.
              </p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                ?
              </div>

              <strong>
                Nie znaleziono receptur
              </strong>

              <p style={emptyTextStyle}>
                Zmień wyszukiwanie lub wybierz inną kategorię.
              </p>
            </div>
          ) : (
            <div style={recipesListStyle}>
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  style={recipeRowStyle}
                >
                  <div style={recipeMainStyle}>
                    <div style={recipeIconStyle}>
                      {recipe.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div style={recipeNameStyle}>
                        {recipe.name}
                      </div>

                      <div style={recipeMetaStyle}>
                        {recipe.category ||
                          "Bez kategorii"}

                        {recipe.servings !== null
                          ? ` • ${formatServings(
                              recipe.servings
                            )} porcji`
                          : ""}
                      </div>

                      {recipe.description && (
                        <div style={descriptionStyle}>
                          {recipe.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={recipeDetailsStyle}>
                    <div>
                      <span style={detailLabelStyle}>
                        Porcje
                      </span>

                      <strong>
                        {formatServings(
                          recipe.servings
                        )}
                      </strong>
                    </div>

                    <div>
                      <span style={detailLabelStyle}>
                        Status
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(recipe)
                        }
                        style={{
                          ...statusStyle,
                          ...(recipe.active
                            ? activeStatusStyle
                            : inactiveStatusStyle),
                        }}
                      >
                        {recipe.active
                          ? "Aktywna"
                          : "Nieaktywna"}
                      </button>
                    </div>
                  </div>

                  <div style={actionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(recipe)
                      }
                      style={editButtonStyle}
                    >
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteRecipe(recipe)
                      }
                      style={deleteButtonStyle}
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
    </section>
  );
}

const pageStyle = {
  width: "100%",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#8a6d4b",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "2px",
  marginBottom: "7px",
};

const titleStyle = {
  margin: 0,
  fontSize: "30px",
  color: "#292522",
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#716b65",
  lineHeight: 1.5,
};

const countBadgeStyle = {
  background: "#f2ebe4",
  color: "#8a6d4b",
  borderRadius: "20px",
  padding: "9px 14px",
  fontSize: "13px",
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(300px, 380px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
};

const formCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const listCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
  minWidth: 0,
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
  marginBottom: "22px",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "20px",
  color: "#292522",
};

const cardSubtitleStyle = {
  margin: "6px 0 0",
  color: "#8a837d",
  fontSize: "13px",
  lineHeight: 1.5,
};

const labelStyle = {
  display: "block",
  marginBottom: "16px",
};

const labelTextStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#514b46",
  fontSize: "13px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  padding: "11px 12px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: "80px",
  fontFamily: "inherit",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  fontSize: "14px",
  color: "#514b46",
  marginBottom: "18px",
};

const buttonStyle = {
  width: "100%",
  border: "none",
  borderRadius: "10px",
  padding: "12px 15px",
  background: "#8a6d4b",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
};

const cancelButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#716b65",
  borderRadius: "9px",
  padding: "8px 11px",
  cursor: "pointer",
  fontSize: "12px",
};

const refreshButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "9px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
};

const filtersStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(200px, 1fr) 220px auto",
  gap: "10px",
  marginBottom: "12px",
};

const searchWrapperStyle = {
  position: "relative" as const,
};

const searchIconStyle = {
  position: "absolute" as const,
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "13px",
  opacity: 0.6,
};

const searchInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  padding: "11px 12px 11px 34px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "13px",
  outline: "none",
};

const filterSelectStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  padding: "11px 12px",
  background: "#ffffff",
  color: "#514b46",
  fontSize: "13px",
  outline: "none",
};

const clearFilterButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "9px",
  padding: "0 13px",
  cursor: "pointer",
  fontSize: "12px",
  whiteSpace: "nowrap" as const,
};

const resultsInfoStyle = {
  color: "#8a837d",
  fontSize: "12px",
  marginBottom: "12px",
};

const errorStyle = {
  background: "#fff1f0",
  border: "1px solid #e7b8b3",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "11px",
  marginBottom: "14px",
  fontSize: "13px",
  lineHeight: 1.5,
};

const successStyle = {
  background: "#f0f8f2",
  border: "1px solid #bdd9c3",
  color: "#477451",
  borderRadius: "9px",
  padding: "11px",
  marginBottom: "14px",
  fontSize: "13px",
};

const emptyStyle = {
  minHeight: "250px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  color: "#716b65",
};

const emptyIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "14px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "20px",
  marginBottom: "14px",
};

const emptyTextStyle = {
  margin: "7px 0 0",
  fontSize: "13px",
};

const recipesListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const recipeRowStyle = {
  border: "1px solid #eee7e0",
  borderRadius: "13px",
  padding: "15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const recipeMainStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  minWidth: "220px",
  flex: 1,
};

const recipeIconStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "11px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  flexShrink: 0,
};

const recipeNameStyle = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#292522",
};

const recipeMetaStyle = {
  marginTop: "4px",
  color: "#8a837d",
  fontSize: "12px",
};

const descriptionStyle = {
  marginTop: "7px",
  color: "#716b65",
  fontSize: "12px",
  lineHeight: 1.4,
};

const recipeDetailsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "25px",
  flexWrap: "wrap" as const,
};

const detailLabelStyle = {
  display: "block",
  color: "#9a928b",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  marginBottom: "4px",
};

const statusStyle = {
  border: "none",
  borderRadius: "20px",
  padding: "4px 8px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const activeStatusStyle = {
  background: "#edf7ef",
  color: "#477451",
};

const inactiveStatusStyle = {
  background: "#f3f1ef",
  color: "#817a74",
};

const actionsStyle = {
  display: "flex",
  gap: "8px",
  marginLeft: "auto",
};

const editButtonStyle = {
  border: "1px solid #d8c8b8",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};

const deleteButtonStyle = {
  border: "1px solid #e3c1bd",
  background: "#fff8f7",
  color: "#a34f46",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};
