"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  notes: string | null;
  active: boolean;
};

type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  created_at: string;
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

const emptyRecipeForm: RecipeForm = {
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
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIngredient, setSavingIngredient] = useState(false);

  const [form, setForm] = useState<RecipeForm>(emptyRecipeForm);
  const [ingredientForm, setIngredientForm] =
    useState<IngredientForm>(emptyIngredientForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRecipes();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedRecipeId) {
      loadIngredients(selectedRecipeId);
    } else {
      setIngredients([]);
    }
  }, [selectedRecipeId]);

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

  async function loadProducts() {
    const { data, error: productsError } = await supabase
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
    const { data, error: ingredientsError } = await supabase
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

    setIngredients((data ?? []) as RecipeIngredient[]);
  }

  function updateRecipeForm(
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

  function startNewRecipe() {
    setEditingId(null);
    setSelectedRecipeId(null);
    setForm(emptyRecipeForm);
    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setSelectedRecipeId(null);
    setForm(emptyRecipeForm);
    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");
  }

  async function handleRecipeSubmit(
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

    const portionsValue =
      form.portions.trim() === ""
        ? null
        : Number(form.portions.replace(",", "."));

    const diameterValue =
      form.diameterCm.trim() === ""
        ? null
        : Number(form.diameterCm.replace(",", "."));

    const heightValue =
      form.heightCm.trim() === ""
        ? null
        : Number(form.heightCm.replace(",", "."));

    if (
      portionsValue !== null &&
      (!Number.isFinite(portionsValue) || portionsValue <= 0)
    ) {
      setError("Liczba porcji musi być prawidłową liczbą.");
      return;
    }

    if (
      diameterValue !== null &&
      (!Number.isFinite(diameterValue) || diameterValue <= 0)
    ) {
      setError("Średnica musi być prawidłową liczbą.");
      return;
    }

    if (
      heightValue !== null &&
      (!Number.isFinite(heightValue) || heightValue <= 0)
    ) {
      setError("Wysokość musi być prawidłową liczbą.");
      return;
    }

    const recipeData = {
      name: cleanName,
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      portions: portionsValue,
      diameter_cm: diameterValue,
      height_cm: heightValue,
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
      setSelectedRecipeId(editingId);
    } else {
      const { data, error: insertError } = await supabase
        .from("recipes")
        .insert(recipeData)
        .select()
        .single();

      if (insertError) {
        setError(
          `Nie udało się zapisać receptury: ${insertError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Receptura została dodana.");

      if (data) {
        setEditingId(data.id);
        setSelectedRecipeId(data.id);
      }
    }

    await loadRecipes();

    setSaving(false);
  }

  async function deleteRecipe(recipe: Recipe) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć recepturę "${recipe.name}"?\n\nZostaną również usunięte jej składniki.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipe.id);

    if (ingredientsError) {
      setError(
        `Nie udało się usunąć składników receptury: ${ingredientsError.message}`
      );
      return;
    }

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

    if (selectedRecipeId === recipe.id) {
      setSelectedRecipeId(null);
    }

    if (editingId === recipe.id) {
      setEditingId(null);
      setForm(emptyRecipeForm);
    }

    setSuccess(`Receptura "${recipe.name}" została usunięta.`);

    await loadRecipes();
  }

  async function handleIngredientSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedRecipeId) {
      setError("Najpierw wybierz lub zapisz recepturę.");
      return;
    }

    if (!ingredientForm.productId) {
      setError("Wybierz produkt z bazy produktów.");
      return;
    }

    const quantity = Number(
      ingredientForm.quantity.replace(",", ".")
    );

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Podaj prawidłową ilość składnika.");
      return;
    }

    if (!ingredientForm.unit.trim()) {
      setError("Podaj jednostkę składnika.");
      return;
    }

    const selectedProduct = products.find(
      (product) => product.id === ingredientForm.productId
    );

    if (!selectedProduct) {
      setError("Nie znaleziono wybranego produktu.");
      return;
    }

    setSavingIngredient(true);

    const { error: insertError } = await supabase
      .from("recipe_ingredients")
      .insert({
        recipe_id: selectedRecipeId,
        product_id: selectedProduct.id,
        quantity,
        unit: ingredientForm.unit.trim(),
      });

    if (insertError) {
      setError(
        `Nie udało się dodać składnika: ${insertError.message}`
      );
      setSavingIngredient(false);
      return;
    }

    setIngredientForm(emptyIngredientForm);
    setSuccess(`Dodano "${selectedProduct.name}" do receptury.`);

    await loadIngredients(selectedRecipeId);

    setSavingIngredient(false);
  }

  async function deleteIngredient(ingredient: RecipeIngredient) {
    const product = products.find(
      (item) => item.id === ingredient.product_id
    );

    const confirmed = window.confirm(
      `Usunąć składnik "${product?.name ?? "produkt"}" z receptury?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("id", ingredient.id);

    if (deleteError) {
      setError(
        `Nie udało się usunąć składnika: ${deleteError.message}`
      );
      return;
    }

    setSuccess("Składnik został usunięty.");

    if (selectedRecipeId) {
      await loadIngredients(selectedRecipeId);
    }
  }

  function getProduct(productId: string) {
    return products.find((product) => product.id === productId);
  }

  function convertToBaseUnit(
    quantity: number,
    unit: string
  ): { quantity: number; unit: string } | null {
    const normalized = unit.trim().toLowerCase();

    if (normalized === "kg") {
      return {
        quantity: quantity * 1000,
        unit: "g",
      };
    }

    if (normalized === "g") {
      return {
        quantity,
        unit: "g",
      };
    }

    if (normalized === "l") {
      return {
        quantity: quantity * 1000,
        unit: "ml",
      };
    }

    if (normalized === "ml") {
      return {
        quantity,
        unit: "ml",
      };
    }

    if (
      normalized === "szt" ||
      normalized === "szt." ||
      normalized === "sztuk"
    ) {
      return {
        quantity,
        unit: "szt",
      };
    }

    if (normalized === "opak." || normalized === "opak") {
      return {
        quantity,
        unit: "opak.",
      };
    }

    return null;
  }

  function calculateIngredientCost(
    ingredient: RecipeIngredient
  ): number | null {
    const product = getProduct(ingredient.product_id);

    if (!product) {
      return null;
    }

    if (
      product.package_quantity === null ||
      product.package_price === null ||
      product.package_quantity <= 0
    ) {
      return null;
    }

    const ingredientBase = convertToBaseUnit(
      ingredient.quantity,
      ingredient.unit
    );

    const packageBase = convertToBaseUnit(
      Number(product.package_quantity),
      product.unit
    );

    if (!ingredientBase || !packageBase) {
      return null;
    }

    if (ingredientBase.unit !== packageBase.unit) {
      return null;
    }

    return (
      (ingredientBase.quantity / packageBase.quantity) *
      Number(product.package_price)
    );
  }

  const totalCost = useMemo(() => {
    return ingredients.reduce((total, ingredient) => {
      const cost = calculateIngredientCost(ingredient);

      if (cost === null) {
        return total;
      }

      return total + cost;
    }, 0);
  }, [ingredients, products]);

  const selectedRecipe = recipes.find(
    (recipe) => recipe.id === selectedRecipeId
  );

  const selectedProduct = getProduct(ingredientForm.productId);

  function formatMoney(value: number) {
    return `${value.toFixed(2).replace(".", ",")} zł`;
  }

  function formatNumber(value: number) {
    return Number(value)
      .toString()
      .replace(".", ",");
  }

  function getIngredientCostLabel(
    ingredient: RecipeIngredient
  ) {
    const cost = calculateIngredientCost(ingredient);

    if (cost === null) {
      return "—";
    }

    return formatMoney(cost);
  }

  return (
    <section style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>BAZA RECEPTUR</div>

          <h2 style={titleStyle}>
            Receptury
          </h2>

          <p style={subtitleStyle}>
            Twórz receptury, wybieraj składniki z bazy produktów
            i automatycznie wyliczaj koszt wykonania.
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
        <div>
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
                    ? "Zmień dane receptury."
                    : "Podstawowe informacje o recepturze."}
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

            <form onSubmit={handleRecipeSubmit}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>
                  Nazwa receptury *
                </span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateRecipeForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="np. Tort czekoladowy"
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
                    updateRecipeForm(
                      "category",
                      event.target.value
                    )
                  }
                  placeholder="np. Torty"
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
                    updateRecipeForm(
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

              <div style={threeColumnStyle}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Porcje
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.portions}
                    onChange={(event) =>
                      updateRecipeForm(
                        "portions",
                        event.target.value
                      )
                    }
                    placeholder="np. 12"
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Średnica cm
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.diameterCm}
                    onChange={(event) =>
                      updateRecipeForm(
                        "diameterCm",
                        event.target.value
                      )
                    }
                    placeholder="np. 20"
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Wysokość cm
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.heightCm}
                    onChange={(event) =>
                      updateRecipeForm(
                        "heightCm",
                        event.target.value
                      )
                    }
                    placeholder="np. 12"
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateRecipeForm(
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

          {selectedRecipeId && (
            <div style={formCardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h3 style={cardTitleStyle}>
                    Dodaj składnik
                  </h3>

                  <p style={cardSubtitleStyle}>
                    Wybierz produkt bezpośrednio z bazy produktów.
                  </p>
                </div>
              </div>

              <form onSubmit={handleIngredientSubmit}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Produkt *
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

                      setIngredientForm({
                        productId,
                        quantity: "",
                        unit:
                          product?.unit ?? "",
                      });
                    }}
                    disabled={savingIngredient}
                    style={inputStyle}
                  >
                    <option value="">
                      — wybierz produkt —
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                        {product.unit
                          ? ` (${product.unit})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedProduct && (
                  <div style={productInfoStyle}>
                    <div>
                      <span style={infoLabelStyle}>
                        Opakowanie
                      </span>

                      <strong>
                        {formatNumber(
                          selectedProduct.package_quantity
                        )}{" "}
                        {selectedProduct.unit}
                      </strong>
                    </div>

                    <div>
                      <span style={infoLabelStyle}>
                        Cena
                      </span>

                      <strong>
                        {formatMoney(
                          selectedProduct.package_price
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                <div style={twoColumnStyle}>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>
                      Ilość *
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={ingredientForm.quantity}
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
                      Jednostka *
                    </span>

                    <select
                      value={ingredientForm.unit}
                      onChange={(event) =>
                        updateIngredientForm(
                          "unit",
                          event.target.value
                        )
                      }
                      disabled={savingIngredient}
                      style={inputStyle}
                    >
                      <option value="">
                        — wybierz —
                      </option>

                      <option value="g">
                        g
                      </option>

                      <option value="kg">
                        kg
                      </option>

                      <option value="ml">
                        ml
                      </option>

                      <option value="l">
                        l
                      </option>

                      <option value="szt">
                        szt
                      </option>

                      <option value="opak.">
                        opak.
                      </option>

                      <option value="łyżka">
                        łyżka
                      </option>

                      <option value="łyżeczka">
                        łyżeczka
                      </option>
                    </select>
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
                  }}
                >
                  {savingIngredient
                    ? "Dodawanie..."
                    : "+ Dodaj składnik"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div>
          <div style={listCardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h3 style={cardTitleStyle}>
                  Lista receptur
                </h3>

                <p style={cardSubtitleStyle}>
                  Wybierz recepturę, aby zobaczyć jej składniki
                  i koszt.
                </p>
              </div>

              <button
                type="button"
                onClick={startNewRecipe}
                style={refreshButtonStyle}
              >
                + Nowa
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
                  Dodaj pierwszą recepturę.
                </p>
              </div>
            ) : (
              <div style={recipesListStyle}>
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() =>
                      setSelectedRecipeId(recipe.id)
                    }
                    style={{
                      ...recipeRowStyle,
                      ...(selectedRecipeId === recipe.id
                        ? selectedRecipeRowActiveStyle
                        : {}),
                    }}
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

                          {recipe.portions
                            ? ` • ${recipe.portions} porcji`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div style={recipeActionsStyle}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          startEditing(recipe);
                        }}
                        style={editButtonStyle}
                      >
                        Edytuj
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteRecipe(recipe);
                        }}
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

          {selectedRecipe && (
            <div style={ingredientsCardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={eyebrowStyle}>
                    SKŁADNIKI RECEPTURY
                  </div>

                  <h3 style={cardTitleStyle}>
                    {selectedRecipe.name}
                  </h3>
                </div>

                <div style={costBadgeStyle}>
                  <span style={costLabelStyle}>
                    KOSZT RECEPTURY
                  </span>

                  <strong style={costValueStyle}>
                    {formatMoney(totalCost)}
                  </strong>
                </div>
              </div>

              {ingredients.length === 0 ? (
                <div style={emptyIngredientsStyle}>
                  <strong>
                    Brak składników
                  </strong>

                  <p>
                    Wybierz produkt powyżej i dodaj pierwszy
                    składnik do receptury.
                  </p>
                </div>
              ) : (
                <div style={ingredientsListStyle}>
                  {ingredients.map((ingredient) => {
                    const product = getProduct(
                      ingredient.product_id
                    );

                    const ingredientCost =
                      calculateIngredientCost(
                        ingredient
                      );

                    return (
                      <div
                        key={ingredient.id}
                        style={ingredientRowStyle}
                      >
                        <div style={ingredientProductStyle}>
                          <div style={ingredientIconStyle}>
                            {product?.name
                              .charAt(0)
                              .toUpperCase() ?? "?"}
                          </div>

                          <div>
                            <div
                              style={ingredientNameStyle}
                            >
                              {product?.name ??
                                "Nieznany produkt"}
                            </div>

                            <div
                              style={ingredientMetaStyle}
                            >
                              {product?.category ||
                                "Bez kategorii"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={ingredientQuantityStyle}
                        >
                          <span
                            style={detailLabelStyle}
                          >
                            Ilość
                          </span>

                          <strong>
                            {formatNumber(
                              ingredient.quantity
                            )}{" "}
                            {ingredient.unit}
                          </strong>
                        </div>

                        <div
                          style={ingredientCostStyle}
                        >
                          <span
                            style={detailLabelStyle}
                          >
                            Koszt
                          </span>

                          <strong>
                            {ingredientCost !== null
                              ? formatMoney(
                                  ingredientCost
                                )
                              : "—"}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            deleteIngredient(
                              ingredient
                            )
                          }
                          style={smallDeleteButtonStyle}
                        >
                          Usuń
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={summaryStyle}>
                <div>
                  <span style={summaryLabelStyle}>
                    Liczba składników
                  </span>

                  <strong>
                    {ingredients.length}
                  </strong>
                </div>

                <div>
                  <span style={summaryLabelStyle}>
                    Koszt receptury
                  </span>

                  <strong style={summaryCostStyle}>
                    {formatMoney(totalCost)}
                  </strong>
                </div>

                {selectedRecipe.portions &&
                  selectedRecipe.portions > 0 && (
                    <div>
                      <span style={summaryLabelStyle}>
                        Koszt 1 porcji
                      </span>

                      <strong>
                        {formatMoney(
                          totalCost /
                            Number(
                              selectedRecipe.portions
                            )
                        )}
                      </strong>
                    </div>
                  )}
              </div>
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
  marginBottom: "20px",
};

const listCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
  minWidth: 0,
  marginBottom: "20px",
};

const ingredientsCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
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

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "10px",
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
  cursor: "pointer",
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

const smallDeleteButtonStyle = {
  border: "1px solid #e3c1bd",
  background: "#fff8f7",
  color: "#a34f46",
  borderRadius: "7px",
  padding: "6px 9px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 600,
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
  gap: "15px",
  flexWrap: "wrap" as const,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const selectedRecipeRowActiveStyle = {
  border: "1px solid #cdb69d",
  background: "#fcf9f6",
};

const recipeMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: "190px",
  flex: 1,
};

const recipeIconStyle = {
  width: "42px",
  height: "42px",
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

const recipeActionsStyle = {
  display: "flex",
  gap: "8px",
};

const productInfoStyle = {
  display: "flex",
  gap: "30px",
  background: "#f8f5f1",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const infoLabelStyle = {
  display: "block",
  color: "#9a928b",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "3px",
};

const ingredientRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(200px, 1fr) 100px 110px auto",
  alignItems: "center",
  gap: "15px",
  border: "1px solid #eee7e0",
  borderRadius: "12px",
  padding: "12px",
};

const ingredientProductStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const ingredientIconStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "9px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  flexShrink: 0,
};

const ingredientNameStyle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#292522",
};

const ingredientMetaStyle = {
  marginTop: "3px",
  fontSize: "11px",
  color: "#8a837d",
};

const ingredientQuantityStyle = {
  fontSize: "13px",
  color: "#514b46",
};

const ingredientCostStyle = {
  fontSize: "13px",
  color: "#514b46",
};

const detailLabelStyle = {
  display: "block",
  color: "#9a928b",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  marginBottom: "4px",
};

const ingredientsListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "9px",
};

const emptyIngredientsStyle = {
  background: "#faf8f5",
  borderRadius: "12px",
  padding: "25px",
  textAlign: "center" as const,
  color: "#716b65",
};

const costBadgeStyle = {
  background: "#f2ebe4",
  borderRadius: "12px",
  padding: "10px 14px",
  textAlign: "right" as const,
  minWidth: "120px",
};

const costLabelStyle = {
  display: "block",
  color: "#8a6d4b",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.7px",
  marginBottom: "3px",
};

const costValueStyle = {
  color: "#6f563b",
  fontSize: "19px",
};

const summaryStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "35px",
  borderTop: "1px solid #eee7e0",
  marginTop: "16px",
  paddingTop: "17px",
  flexWrap: "wrap" as const,
};

const summaryLabelStyle = {
  display: "block",
  color: "#9a928b",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  marginBottom: "4px",
};

const summaryCostStyle = {
  color: "#8a6d4b",
  fontSize: "18px",
};

const selectedRecipeRowStyle = {
  background: "#fcf9f6",
};
