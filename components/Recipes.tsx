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
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIngredient, setSavingIngredient] = useState(false);

  const [form, setForm] = useState<RecipeForm>(emptyForm);
  const [ingredientForm, setIngredientForm] =
    useState<IngredientForm>(emptyIngredientForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [recipesResult, productsResult, ingredientsResult] =
      await Promise.all([
        supabase
          .from("recipes")
          .select("*")
          .order("name", { ascending: true }),

        supabase
          .from("products")
          .select("*")
          .order("name", { ascending: true }),

        supabase
          .from("recipe_ingredients")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

    if (recipesResult.error) {
      setError(
        `Nie udało się pobrać receptur: ${recipesResult.error.message}`
      );
    }

    if (productsResult.error) {
      setError(
        `Nie udało się pobrać produktów: ${productsResult.error.message}`
      );
    }

    if (ingredientsResult.error) {
      setError(
        `Nie udało się pobrać składników: ${ingredientsResult.error.message}`
      );
    }

    setRecipes((recipesResult.data ?? []) as Recipe[]);
    setProducts((productsResult.data ?? []) as Product[]);
    setIngredients(
      (ingredientsResult.data ?? []) as RecipeIngredient[]
    );

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

  function updateIngredientForm(
    field: keyof IngredientForm,
    value: string
  ) {
    setIngredientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function fillRecipeForm(recipe: Recipe) {
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
  }

  function startEditing(recipe: Recipe) {
    setEditingId(recipe.id);
    setSelectedRecipeId(recipe.id);

    fillRecipeForm(recipe);

    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startNewRecipe() {
    setEditingId(null);
    setSelectedRecipeId(null);
    setForm(emptyForm);
    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");
  }

  function cancelEditing() {
    startNewRecipe();
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
      (!Number.isFinite(portionsValue) ||
        portionsValue <= 0)
    ) {
      setError("Liczba porcji musi być większa od 0.");
      return;
    }

    if (
      diameterValue !== null &&
      (!Number.isFinite(diameterValue) ||
        diameterValue <= 0)
    ) {
      setError("Średnica musi być większa od 0.");
      return;
    }

    if (
      heightValue !== null &&
      (!Number.isFinite(heightValue) ||
        heightValue <= 0)
    ) {
      setError("Wysokość musi być większa od 0.");
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

      setSelectedRecipeId(editingId);
      setSuccess("Receptura została zaktualizowana.");
    } else {
      const { data, error: insertError } = await supabase
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

      setEditingId(data.id);
      setSelectedRecipeId(data.id);

      setSuccess(
        "Receptura została dodana. Możesz teraz dodać składniki."
      );
    }

    await loadData();

    setSaving(false);
  }

  async function addIngredient(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedRecipeId) {
      setError(
        "Najpierw wybierz lub zapisz recepturę."
      );
      return;
    }

    setError("");
    setSuccess("");

    if (!ingredientForm.productId) {
      setError("Wybierz produkt.");
      return;
    }

    const quantity = Number(
      ingredientForm.quantity.replace(",", ".")
    );

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Podaj prawidłową ilość składnika.");
      return;
    }

    const product = products.find(
      (item) => item.id === ingredientForm.productId
    );

    if (!product) {
      setError("Nie znaleziono wybranego produktu.");
      return;
    }

    const unit =
      ingredientForm.unit.trim() || product.unit;

    setSavingIngredient(true);

    const { error: insertError } = await supabase
      .from("recipe_ingredients")
      .insert({
        recipe_id: selectedRecipeId,
        product_id: product.id,
        quantity,
        unit,
      });

    if (insertError) {
      setError(
        `Nie udało się dodać składnika: ${insertError.message}`
      );
      setSavingIngredient(false);
      return;
    }

    setIngredientForm(emptyIngredientForm);

    setSuccess(
      `Dodano składnik: ${product.name}.`
    );

    await loadData();

    setSavingIngredient(false);
  }

  async function deleteIngredient(
    ingredient: RecipeIngredient
  ) {
    const product = products.find(
      (item) => item.id === ingredient.product_id
    );

    const confirmed = window.confirm(
      `Czy usunąć składnik "${
        product?.name ?? "produkt"
      }" z receptury?`
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

    await loadData();
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

    const { error: deleteIngredientsError } =
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipe.id);

    if (deleteIngredientsError) {
      setError(
        `Nie udało się usunąć składników receptury: ${deleteIngredientsError.message}`
      );
      return;
    }

    const { error: deleteRecipeError } =
      await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

    if (deleteRecipeError) {
      setError(
        `Nie udało się usunąć receptury: ${deleteRecipeError.message}`
      );
      return;
    }

    if (selectedRecipeId === recipe.id) {
      startNewRecipe();
    }

    setSuccess(
      `Receptura "${recipe.name}" została usunięta.`
    );

    await loadData();
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

  function selectRecipe(recipe: Recipe) {
    setSelectedRecipeId(recipe.id);
    setEditingId(recipe.id);

    fillRecipeForm(recipe);

    setIngredientForm(emptyIngredientForm);
    setError("");
    setSuccess("");
  }

  function getProduct(productId: string) {
    return products.find(
      (product) => product.id === productId
    );
  }

  /*
   * Przelicza koszt składnika z uwzględnieniem jednostek.
   *
   * Przykłady:
   * 1 kg mąki = 1000 g
   * 500 g z opakowania 1 kg za 5,00 zł = 2,50 zł
   *
   * Jednostki szt. pozostają liczone bez przeliczania.
   */
  function calculateIngredientCost(
    ingredient: RecipeIngredient
  ) {
    const product = getProduct(
      ingredient.product_id
    );

    if (!product) {
      return 0;
    }

    if (
      !product.package_quantity ||
      product.package_quantity <= 0 ||
      product.package_price === null ||
      product.package_price === undefined
    ) {
      return 0;
    }

    const recipeUnit = ingredient.unit
      .trim()
      .toLowerCase();

    const productUnit = product.unit
      .trim()
      .toLowerCase();

    let ingredientQuantity =
      ingredient.quantity;

    let packageQuantity =
      product.package_quantity;

    /*
     * Produkt w bazie:
     * 1 kg
     *
     * Receptura:
     * 500 g
     *
     * Zamieniamy opakowanie na:
     * 1000 g
     */
    if (
      productUnit === "kg" &&
      recipeUnit === "g"
    ) {
      packageQuantity =
        product.package_quantity * 1000;
    }

    /*
     * Produkt w bazie:
     * 1000 g
     *
     * Receptura:
     * 0,5 kg
     *
     * Zamieniamy ilość receptury na:
     * 500 g
     */
    else if (
      productUnit === "g" &&
      recipeUnit === "kg"
    ) {
      ingredientQuantity =
        ingredient.quantity * 1000;
    }

    /*
     * Produkt w bazie:
     * g
     *
     * Receptura:
     * mg
     *
     * 1 g = 1000 mg
     */
    else if (
      productUnit === "g" &&
      recipeUnit === "mg"
    ) {
      packageQuantity =
        product.package_quantity * 1000;
    }

    /*
     * Produkt w bazie:
     * mg
     *
     * Receptura:
     * g
     *
     * 1 g = 1000 mg
     */
    else if (
      productUnit === "mg" &&
      recipeUnit === "g"
    ) {
      ingredientQuantity =
        ingredient.quantity * 1000;
    }

    return (
      (ingredientQuantity /
        packageQuantity) *
      product.package_price
    );
  }

  function calculateRecipeCost(recipeId: string) {
    return ingredients
      .filter(
        (ingredient) =>
          ingredient.recipe_id === recipeId
      )
      .reduce(
        (sum, ingredient) =>
          sum +
          calculateIngredientCost(ingredient),
        0
      );
  }

  const selectedRecipe = useMemo(
    () =>
      recipes.find(
        (recipe) =>
          recipe.id === selectedRecipeId
      ) ?? null,
    [recipes, selectedRecipeId]
  );

  const selectedIngredients = useMemo(
    () =>
      ingredients.filter(
        (ingredient) =>
          ingredient.recipe_id ===
          selectedRecipeId
      ),
    [ingredients, selectedRecipeId]
  );

  const selectedRecipeCost = selectedRecipe
    ? calculateRecipeCost(selectedRecipe.id)
    : 0;

  function formatNumber(
    value: number | null | undefined
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return Number(value)
      .toString()
      .replace(".", ",");
  }

  function formatMoney(value: number) {
    return `${value
      .toFixed(2)
      .replace(".", ",")} zł`;
  }

  function getRecipePortionsLabel(
    portions: number | null
  ) {
    if (portions === null) {
      return "Brak danych o porcjach";
    }

    return `${formatNumber(portions)} ${
      portions === 1
        ? "porcja"
        : portions >= 2 &&
          portions <= 4
        ? "porcje"
        : "porcji"
    }`;
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
            Twórz receptury, wybieraj produkty
            z bazy i automatycznie wyliczaj koszt.
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
                    ? "Zmień dane receptury i zapisz zmiany."
                    : "Najpierw utwórz recepturę, a następnie dodaj jej składniki."}
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
                  placeholder="np. Krem śmietankowy"
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
                  placeholder="np. Kremy"
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

                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Średnica cm
                  </span>

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
                      updateForm(
                        "heightCm",
                        event.target.value
                      )
                    }
                    placeholder="np. 10"
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

          {selectedRecipe && (
            <div style={ingredientsCardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h3 style={cardTitleStyle}>
                    Składniki receptury
                  </h3>

                  <p style={cardSubtitleStyle}>
                    {selectedRecipe.name}
                  </p>
                </div>

                <div style={costBadgeStyle}>
                  Koszt:{" "}
                  <strong>
                    {formatMoney(
                      selectedRecipeCost
                    )}
                  </strong>
                </div>
              </div>

              <form
                onSubmit={addIngredient}
                style={ingredientFormStyle}
              >
                <div style={ingredientProductFieldStyle}>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>
                      Produkt
                    </span>

                    <select
                      value={
                        ingredientForm.productId
                      }
                      onChange={(event) =>
                        updateIngredientForm(
                          "productId",
                          event.target.value
                        )
                      }
                      disabled={
                        savingIngredient ||
                        products.length === 0
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Wybierz produkt z bazy...
                      </option>

                      {products
                        .filter(
                          (product) =>
                            product.active
                        )
                        .map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name} —{" "}
                            {formatMoney(
                              Number(
                                product.package_price
                              )
                            )} /{" "}
                            {formatNumber(
                              product.package_quantity
                            )}{" "}
                            {product.unit}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <div style={ingredientQuantityFieldStyle}>
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
                </div>

                <div style={ingredientUnitFieldStyle}>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>
                      Jednostka
                    </span>

                    <input
                      type="text"
                      value={ingredientForm.unit}
                      onChange={(event) =>
                        updateIngredientForm(
                          "unit",
                          event.target.value
                        )
                      }
                      placeholder="automatycznie"
                      disabled={savingIngredient}
                      style={inputStyle}
                    />
                  </label>
                </div>

                <div style={ingredientButtonFieldStyle}>
                  <button
                    type="submit"
                    disabled={savingIngredient}
                    style={{
                      ...smallButtonStyle,
                      opacity:
                        savingIngredient
                          ? 0.7
                          : 1,
                    }}
                  >
                    {savingIngredient
                      ? "Dodawanie..."
                      : "+ Dodaj"}
                  </button>
                </div>
              </form>

              {selectedIngredients.length === 0 ? (
                <div style={emptyIngredientsStyle}>
                  Brak składników. Wybierz produkt z
                  bazy powyżej i dodaj jego ilość.
                </div>
              ) : (
                <div style={ingredientsListStyle}>
                  {selectedIngredients.map(
                    (ingredient) => {
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
                          style={
                            ingredientRowStyle
                          }
                        >
                          <div
                            style={
                              ingredientMainStyle
                            }
                          >
                            <div
                              style={
                                ingredientIconStyle
                              }
                            >
                              {product?.name
                                .charAt(0)
                                .toUpperCase() ??
                                "P"}
                            </div>

                            <div>
                              <div
                                style={
                                  ingredientNameStyle
                                }
                              >
                                {product?.name ??
                                  "Nieznany produkt"}
                              </div>

                              <div
                                style={
                                  ingredientMetaStyle
                                }
                              >
                                {formatNumber(
                                  ingredient.quantity
                                )}{" "}
                                {ingredient.unit}
                              </div>
                            </div>
                          </div>

                          <div
                            style={
                              ingredientRightStyle
                            }
                          >
                            <strong>
                              {formatMoney(
                                ingredientCost
                              )}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                deleteIngredient(
                                  ingredient
                                )
                              }
                              style={
                                smallDeleteButtonStyle
                              }
                            >
                              Usuń
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div style={totalCostStyle}>
                <div>
                  <span
                    style={totalLabelStyle}
                  >
                    Łączny koszt receptury
                  </span>

                  <span
                    style={totalHintStyle}
                  >
                    Na podstawie cen produktów
                    zapisanych w bazie.
                  </span>
                </div>

                <strong
                  style={totalValueStyle}
                >
                  {formatMoney(
                    selectedRecipeCost
                  )}
                </strong>
              </div>
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
                Kliknij recepturę, aby zarządzać
                jej składnikami.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
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
              {recipes.map((recipe) => {
                const recipeCost =
                  calculateRecipeCost(
                    recipe.id
                  );

                const recipeIngredients =
                  ingredients.filter(
                    (ingredient) =>
                      ingredient.recipe_id ===
                      recipe.id
                  );

                const isSelected =
                  selectedRecipeId ===
                  recipe.id;

                return (
                  <div
                    key={recipe.id}
                    style={{
                      ...recipeRowStyle,
                      ...(isSelected
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
                        style={
                          recipeMainStyle
                        }
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

                            {" • "}

                            {
                              recipeIngredients.length
                            }{" "}
                            {recipeIngredients.length ===
                            1
                              ? "składnik"
                              : recipeIngredients.length >=
                                  2 &&
                                recipeIngredients.length <=
                                  4
                              ? "składniki"
                              : "składników"}
                          </div>
                        </div>
                      </div>

                      <div
                        style={
                          recipeInfoStyle
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
                            {getRecipePortionsLabel(
                              recipe.portions
                            )}
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
                              ? `${formatNumber(
                                  recipe.diameter_cm
                                )} cm`
                              : "—"}

                            {recipe.height_cm
                              ? ` × ${formatNumber(
                                  recipe.height_cm
                                )} cm`
                              : ""}
                          </strong>
                        </div>

                        <div>
                          <span
                            style={
                              detailLabelStyle
                            }
                          >
                            Koszt
                          </span>

                          <strong
                            style={
                              recipeCostValueStyle
                            }
                          >
                            {formatMoney(
                              recipeCost
                            )}
                          </strong>
                        </div>
                      </div>
                    </button>

                    <div
                      style={
                        recipeActionsStyle
                      }
                    >
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
                );
              })}
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
    "minmax(320px, 420px) minmax(0, 1fr)",
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

const ingredientsCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  marginTop: "20px",
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

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr 1fr",
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

const smallButtonStyle = {
  width: "100%",
  border: "none",
  borderRadius: "9px",
  padding: "11px 13px",
  background: "#8a6d4b",
  color: "#ffffff",
  fontSize: "13px",
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

const ingredientFormStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 1fr) 120px 120px 100px",
  gap: "10px",
  alignItems: "end",
  marginBottom: "20px",
};

const ingredientProductFieldStyle = {
  minWidth: 0,
};

const ingredientQuantityFieldStyle = {
  minWidth: 0,
};

const ingredientUnitFieldStyle = {
  minWidth: 0,
};

const ingredientButtonFieldStyle = {
  paddingBottom: "16px",
};

const emptyIngredientsStyle = {
  border: "1px dashed #ddd3c9",
  borderRadius: "11px",
  padding: "20px",
  textAlign: "center" as const,
  color: "#8a837d",
  fontSize: "13px",
};

const ingredientsListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const ingredientRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  border: "1px solid #eee7e0",
  borderRadius: "11px",
  padding: "10px 12px",
};

const ingredientMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const ingredientIconStyle = {
  width: "34px",
  height: "34px",
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
  fontSize: "14px",
  fontWeight: 600,
  color: "#292522",
};

const ingredientMetaStyle = {
  marginTop: "3px",
  color: "#8a837d",
  fontSize: "12px",
};

const ingredientRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexShrink: 0,
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

const costBadgeStyle = {
  background: "#f0f8f2",
  color: "#477451",
  border: "1px solid #bdd9c3",
  borderRadius: "10px",
  padding: "8px 11px",
  fontSize: "12px",
  whiteSpace: "nowrap" as const,
};

const totalCostStyle = {
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #eee7e0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
};

const totalLabelStyle = {
  display: "block",
  color: "#514b46",
  fontSize: "13px",
  fontWeight: 700,
};

const totalHintStyle = {
  display: "block",
  marginTop: "3px",
  color: "#9a928b",
  fontSize: "11px",
};

const totalValueStyle = {
  color: "#477451",
  fontSize: "24px",
};

const recipesListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const recipeRowStyle = {
  border: "1px solid #eee7e0",
  borderRadius: "13px",
  padding: "12px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const selectedRecipeRowStyle = {
  border: "1px solid #d8c8b8",
  background: "#fcfaf7",
};

const recipeSelectButtonStyle = {
  flex: 1,
  minWidth: 0,
  border: "none",
  background: "transparent",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
  cursor: "pointer",
  textAlign: "left" as const,
};

const recipeMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: "190px",
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

const recipeInfoStyle = {
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

const recipeCostValueStyle = {
  color: "#477451",
};

const recipeActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexShrink: 0,
};

const statusStyle = {
  border: "none",
  borderRadius: "20px",
  padding: "5px 9px",
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
