```tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  portions: number | null;
  diameter_cm: number | null;
  height_cm: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  package_quantity: number;
  package_price: number;
  active: boolean;
};

type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string;
  quantity: number;
  unit: string;
};

type RecipeForm = {
  name: string;
  description: string;
  category: string;
  portions: string;
  diameterCm: string;
  heightCm: string;
  active: boolean;
};

type IngredientForm = {
  productId: string;
  quantity: string;
  unit: string;
};

const emptyForm: RecipeForm = {
  name: "",
  description: "",
  category: "",
  portions: "",
  diameterCm: "",
  heightCm: "",
  active: true,
};

const emptyIngredientForm: IngredientForm = {
  productId: "",
  quantity: "",
  unit: "",
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<
    RecipeIngredient[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIngredient, setSavingIngredient] =
    useState(false);

  const [form, setForm] =
    useState<RecipeForm>(emptyForm);

  const [ingredientForm, setIngredientForm] =
    useState<IngredientForm>(emptyIngredientForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [selectedRecipeId, setSelectedRecipeId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRecipes();
    loadProducts();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    setError("");

    const { data, error: recipesError } =
      await supabase
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

  async function loadProducts() {
    const { data, error: productsError } =
      await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });

    if (productsError) {
      setError(
        `Nie udało się pobrać produktów: ${productsError.message}`
      );
      return;
    }

    setProducts((data ?? []) as Product[]);
  }

  async function loadIngredients(recipeId: string) {
    const { data, error: ingredientsError } =
      await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: true });

    if (ingredientsError) {
      setError(
        `Nie udało się pobrać składników: ${ingredientsError.message}`
      );
      return;
    }

    setIngredients(
      (data ?? []) as RecipeIngredient[]
    );
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

  function updateIngredientForm(
    field: keyof IngredientForm,
    value: string
  ) {
    setIngredientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(recipe: Recipe) {
    setEditingId(recipe.id);
    setSelectedRecipeId(recipe.id);

    setForm({
      name: recipe.name ?? "",
      description: recipe.description ?? "",
      category: recipe.category ?? "",
      portions:
        recipe.portions !== null
          ? String(recipe.portions).replace(".", ",")
          : "",
      diameterCm:
        recipe.diameter_cm !== null
          ? String(recipe.diameter_cm).replace(".", ",")
          : "",
      heightCm:
        recipe.height_cm !== null
          ? String(recipe.height_cm).replace(".", ",")
          : "",
      active: recipe.active,
    });

    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");

    loadIngredients(recipe.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selectRecipe(recipe: Recipe) {
    setSelectedRecipeId(recipe.id);
    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");
    loadIngredients(recipe.id);
  }

  function cancelEditing() {
    setEditingId(null);
    setSelectedRecipeId(null);
    setForm(emptyForm);
    setIngredientForm(emptyIngredientForm);
    setIngredients([]);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = form.name.trim();

    if (!cleanName) {
      setError("Podaj nazwę receptury.");
      return;
    }

    const portions =
      form.portions.trim() === ""
        ? null
        : Number(
            form.portions.replace(",", ".")
          );

    const diameterCm =
      form.diameterCm.trim() === ""
        ? null
        : Number(
            form.diameterCm.replace(",", ".")
          );

    const heightCm =
      form.heightCm.trim() === ""
        ? null
        : Number(
            form.heightCm.replace(",", ".")
          );

    if (
      portions !== null &&
      (!Number.isFinite(portions) ||
        portions <= 0)
    ) {
      setError(
        "Liczba porcji musi być większa od 0."
      );
      return;
    }

    if (
      diameterCm !== null &&
      (!Number.isFinite(diameterCm) ||
        diameterCm <= 0)
    ) {
      setError(
        "Średnica musi być większa od 0."
      );
      return;
    }

    if (
      heightCm !== null &&
      (!Number.isFinite(heightCm) ||
        heightCm <= 0)
    ) {
      setError(
        "Wysokość musi być większa od 0."
      );
      return;
    }

    const recipeData = {
      name: cleanName,
      description:
        form.description.trim() || null,
      category:
        form.category.trim() || null,
      portions,
      diameter_cm: diameterCm,
      height_cm: heightCm,
      active: form.active,
    };

    setSaving(true);

    if (editingId) {
      const { error: updateError } =
        await supabase
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

      setSuccess(
        "Receptura została zaktualizowana."
      );

      setSelectedRecipeId(editingId);
      await loadIngredients(editingId);
    } else {
      const { data, error: insertError } =
        await supabase
          .from("recipes")
          .insert(recipeData)
          .select("*")
          .single();

      if (insertError) {
        setError(
          `Nie udało się zapisać receptury: ${insertError.message}`
        );
        setSaving(false);
        return;
      }

      const newRecipe = data as Recipe;

      setSuccess(
        "Receptura została dodana."
      );

      setSelectedRecipeId(newRecipe.id);
      setEditingId(newRecipe.id);
      await loadIngredients(newRecipe.id);
    }

    await loadRecipes();

    setSaving(false);
  }

  async function deleteRecipe(recipe: Recipe) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć recepturę "${recipe.name}"?\n\nTa operacja usunie również jej składniki, jeśli są z nią powiązane.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: ingredientsError } =
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipe.id);

    if (ingredientsError) {
      setError(
        `Nie udało się usunąć składników receptury: ${ingredientsError.message}`
      );
      return;
    }

    const { error: deleteError } =
      await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

    if (deleteError) {
      setError(
        `Nie udało się usunąć receptury: ${deleteError.message}`
      );
      return;
    }

    if (selectedRecipeId === recipe.id) {
      setSelectedRecipeId(null);
      setIngredients([]);
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

    const { error: updateError } =
      await supabase
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

  async function addIngredient(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedRecipeId) {
      setError(
        "Najpierw wybierz lub zapisz recepturę."
      );
      return;
    }

    if (!ingredientForm.productId) {
      setError("Wybierz produkt.");
      return;
    }

    const quantity = Number(
      ingredientForm.quantity.replace(",", ".")
    );

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Ilość składnika musi być większa od 0."
      );
      return;
    }

    const selectedProduct = products.find(
      (product) =>
        product.id === ingredientForm.productId
    );

    if (!selectedProduct) {
      setError("Nie znaleziono wybranego produktu.");
      return;
    }

    setSavingIngredient(true);

    const { error: insertError } =
      await supabase
        .from("recipe_ingredients")
        .insert({
          recipe_id: selectedRecipeId,
          product_id: selectedProduct.id,
          quantity,
          unit:
            ingredientForm.unit.trim() ||
            selectedProduct.unit,
        });

    if (insertError) {
      setError(
        `Nie udało się dodać składnika: ${insertError.message}`
      );
      setSavingIngredient(false);
      return;
    }

    setIngredientForm(emptyIngredientForm);

    await loadIngredients(selectedRecipeId);

    setSuccess(
      `Dodano składnik "${selectedProduct.name}".`
    );

    setSavingIngredient(false);
  }

  async function deleteIngredient(
    ingredient: RecipeIngredient
  ) {
    const product = products.find(
      (item) => item.id === ingredient.product_id
    );

    const confirmed = window.confirm(
      `Usunąć składnik "${product?.name ?? "produktu"}" z receptury?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } =
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("id", ingredient.id);

    if (deleteError) {
      setError(
        `Nie udało się usunąć składnika: ${deleteError.message}`
      );
      return;
    }

    if (selectedRecipeId) {
      await loadIngredients(selectedRecipeId);
    }

    setSuccess("Składnik został usunięty.");
  }

  function getProductName(productId: string) {
    return (
      products.find(
        (product) => product.id === productId
      )?.name ?? "Nieznany produkt"
    );
  }

  function getProductUnit(productId: string) {
    return (
      products.find(
        (product) => product.id === productId
      )?.unit ?? ""
    );
  }

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
            Twórz receptury tortów i przypisuj do nich
            produkty oraz ilości.
          </p>
        </div>

        <div style={countBadgeStyle}>
          {recipes.length}{" "}
          {recipes.length === 1
            ? "receptura"
            : recipes.length >= 2 &&
                recipes.length <= 4
              ? "receptury"
              : "receptur"}
        </div>
      </div>

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

      <div style={contentGridStyle}>
        <div style={leftColumnStyle}>
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
                    : "Receptura zostanie zapisana w Supabase."}
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
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="np. Tort czekoladowy"
                  disabled={saving}
                  required
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
                  placeholder="np. Torty klasyczne"
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
                  Liczba porcji
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={form.portions}
                  onChange={(event) =>
                    updateForm(
                      "portions",
                      event.target.value
                    )
                  }
                  placeholder="np. 12"
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <div style={twoColumnStyle}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Średnica
                  </span>

                  <div
                    style={
                      unitInputWrapperStyle
                    }
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.diameterCm}
                      onChange={(event) =>
                        updateForm(
                          "diameterCm",
                          event.target.value
                        )
                      }
                      placeholder="np. 20"
                      disabled={saving}
                      style={unitInputStyle}
                    />

                    <span style={unitStyle}>
                      cm
                    </span>
                  </div>
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Wysokość
                  </span>

                  <div
                    style={
                      unitInputWrapperStyle
                    }
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.heightCm}
                      onChange={(event) =>
                        updateForm(
                          "heightCm",
                          event.target.value
                        )
                      }
                      placeholder="np. 10"
                      disabled={saving}
                      style={unitInputStyle}
                    />

                    <span style={unitStyle}>
                      cm
                    </span>
                  </div>
                </label>
              </div>

              <label
                style={checkboxLabelStyle}
              >
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

          {selectedRecipeId && (
            <div style={ingredientsCardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h3 style={cardTitleStyle}>
                    Składniki receptury
                  </h3>

                  <p style={cardSubtitleStyle}>
                    Dodaj produkty i określ ich ilość.
                  </p>
                </div>

                <div style={ingredientCountStyle}>
                  {ingredients.length}
                </div>
              </div>

              <form
                onSubmit={addIngredient}
                style={ingredientFormStyle}
              >
                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Produkt
                  </span>

                  <select
                    value={ingredientForm.productId}
                    onChange={(event) => {
                      const productId =
                        event.target.value;

                      const product =
                        products.find(
                          (item) =>
                            item.id === productId
                        );

                      setIngredientForm(
                        (current) => ({
                          ...current,
                          productId,
                          unit:
                            product?.unit ??
                            "",
                        })
                      );
                    }}
                    disabled={savingIngredient}
                    style={inputStyle}
                  >
                    <option value="">
                      Wybierz produkt
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={twoColumnStyle}>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>
                      Ilość
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        ingredientForm.quantity
                      }
                      onChange={(event) =>
                        updateIngredientForm(
                          "quantity",
                          event.target.value
                        )
                      }
                      placeholder="np. 250"
                      disabled={savingIngredient}
                      style={inputStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    <span style={labelTextStyle}>
                      Jednostka
                    </span>

                    <input
                      type="text"
                      value={
                        ingredientForm.unit
                      }
                      onChange={(event) =>
                        updateIngredientForm(
                          "unit",
                          event.target.value
                        )
                      }
                      placeholder="np. g"
                      disabled={savingIngredient}
                      style={inputStyle}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingIngredient}
                  style={{
                    ...buttonStyle,
                    opacity: savingIngredient
                      ? 0.7
                      : 1,
                    cursor: savingIngredient
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {savingIngredient
                    ? "Dodawanie..."
                    : "+ Dodaj składnik"}
                </button>
              </form>

              {ingredients.length === 0 ? (
                <div
                  style={
                    ingredientsEmptyStyle
                  }
                >
                  Brak składników w tej recepturze.
                </div>
              ) : (
                <div
                  style={
                    ingredientsListStyle
                  }
                >
                  {ingredients.map(
                    (ingredient, index) => (
                      <div
                        key={ingredient.id}
                        style={
                          ingredientRowStyle
                        }
                      >
                        <div
                          style={
                            ingredientNumberStyle
                          }
                        >
                          {index + 1}
                        </div>

                        <div
                          style={
                            ingredientMainStyle
                          }
                        >
                          <strong>
                            {getProductName(
                              ingredient.product_id
                            )}
                          </strong>

                          <span
                            style={
                              ingredientMetaStyle
                            }
                          >
                            {ingredient.quantity}{" "}
                            {ingredient.unit ||
                              getProductUnit(
                                ingredient.product_id
                              )}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            deleteIngredient(
                              ingredient
                            )
                          }
                          style={
                            deleteIngredientButtonStyle
                          }
                        >
                          Usuń
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
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
              onClick={() => {
                loadRecipes();
                loadProducts();
              }}
              disabled={loading}
              style={refreshButtonStyle}
            >
              Odśwież
            </button>
          </div>

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
                Dodaj pierwszą recepturę za pomocą
                formularza.
              </p>
            </div>
          ) : (
            <div style={recipesListStyle}>
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  style={{
                    ...recipeRowStyle,
                    ...(selectedRecipeId ===
                    recipe.id
                      ? selectedRecipeRowStyle
                      : {}),
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      selectRecipe(recipe)
                    }
                    style={
                      recipeSelectButtonStyle
                    }
                  >
                    <div
                      style={recipeMainStyle}
                    >
                      <div
                        style={
                          recipeIconStyle
                        }
                      >
                        {recipe.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <div
                          style={
                            recipeNameStyle
                          }
                        >
                          {recipe.name}
                        </div>

                        <div
                          style={
                            recipeMetaStyle
                          }
                        >
                          {recipe.category ||
                            "Bez kategorii"}

                          {recipe.description
                            ? ` • ${recipe.description}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div
                    style={
                      recipeDetailsStyle
                    }
                  >
                    <div>
                      <span
                        style={
                          detailLabelStyle
                        }
                      >
                        Porcje
                      </span>

                      <strong>
                        {recipe.portions ?? "—"}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          detailLabelStyle
                        }
                      >
                        Rozmiar
                      </span>

                      <strong>
                        {recipe.diameter_cm
                          ? `${recipe.diameter_cm} cm`
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          detailLabelStyle
                        }
                      >
                        Wysokość
                      </span>

                      <strong>
                        {recipe.height_cm
                          ? `${recipe.height_cm} cm`
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          detailLabelStyle
                        }
                      >
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

const leftColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "20px",
};

const formCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const ingredientsCardStyle = {
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

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const unitInputWrapperStyle = {
  position: "relative" as const,
};

const unitInputStyle = {
  ...inputStyle,
  paddingRight: "40px",
};

const unitStyle = {
  position: "absolute" as const,
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#8a837d",
  fontSize: "12px",
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

const selectedRecipeRowStyle = {
  border: "1px solid #cdb9a4",
  background: "#fdfbf9",
};

const recipeSelectButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  textAlign: "left" as const,
  color: "#292522",
  minWidth: "200px",
  flex: "1 1 240px",
};

const recipeMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: "200px",
  flex: "1 1 240px",
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
  maxWidth: "380px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const recipeDetailsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
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

const ingredientFormStyle = {
  borderTop: "1px solid #eee7e0",
  paddingTop: "18px",
};

const ingredientCountStyle = {
  minWidth: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 700,
};

const ingredientsEmptyStyle = {
  borderTop: "1px solid #eee7e0",
  paddingTop: "18px",
  color: "#8a837d",
  fontSize: "13px",
  textAlign: "center" as const,
};

const ingredientsListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  borderTop: "1px solid #eee7e0",
  paddingTop: "18px",
};

const ingredientRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid #eee7e0",
  borderRadius: "10px",
  padding: "10px",
};

const ingredientNumberStyle = {
  width: "26px",
  height: "26px",
  borderRadius: "8px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 700,
  flexShrink: 0,
};

const ingredientMainStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "3px",
  flex: 1,
  minWidth: 0,
};

const ingredientMetaStyle = {
  color: "#8a837d",
  fontSize: "12px",
};

const deleteIngredientButtonStyle = {
  border: "1px solid #e3c1bd",
  background: "#fff8f7",
  color: "#a34f46",
  borderRadius: "8px",
  padding: "6px 9px",
  cursor: "pointer",
  fontSize: "11px",
};
```
