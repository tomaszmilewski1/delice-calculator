"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  package_quantity: number;
  package_price: number;
  active: boolean;
};

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  portions: number | null;
  diameter_cm: number | null;
  height_cm: number | null;
  active: boolean;
  cost: number | null;
  labor_cost: number | null;
  energy_cost: number | null;
  packaging_cost: number | null;
  margin_percent: number | null;
  created_at: string;
};

type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  created_at?: string;
};

type IngredientRow = {
  id: string;
  productId: string;
  quantity: string;
  unit: string;
};

type RecipeForm = {
  name: string;
  description: string;
  category: string;
  portions: string;
  diameterCm: string;
  heightCm: string;
  laborCost: string;
  energyCost: string;
  packagingCost: string;
  marginPercent: string;
  active: boolean;
};

const emptyRecipeForm: RecipeForm = {
  name: "",
  description: "",
  category: "",
  portions: "",
  diameterCm: "",
  heightCm: "",
  laborCost: "",
  energyCost: "",
  packagingCost: "",
  marginPercent: "",
  active: true,
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);

  const [previewRecipe, setPreviewRecipe] =
    useState<Recipe | null>(null);

  const [previewIngredients, setPreviewIngredients] =
    useState<IngredientRow[]>([]);

  const [form, setForm] =
    useState<RecipeForm>(emptyRecipeForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [recipesResult, productsResult] =
      await Promise.all([
        supabase
          .from("recipes")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("name", {
            ascending: true,
          }),
      ]);

    if (recipesResult.error) {
      setError(
        `Nie udało się pobrać receptur: ${recipesResult.error.message}`
      );
      setLoading(false);
      return;
    }

    if (productsResult.error) {
      setError(
        `Nie udało się pobrać produktów: ${productsResult.error.message}`
      );
      setLoading(false);
      return;
    }

    setRecipes(
      (recipesResult.data ?? []) as Recipe[]
    );

    setProducts(
      (productsResult.data ?? []) as Product[]
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

  function parseNumber(value: string): number {
    if (!value || !value.trim()) {
      return 0;
    }

    const normalized = value
      .replace(",", ".")
      .trim();

    const number = Number(normalized);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  function parseNullableNumber(
    value: string
  ): number | null {
    if (!value || !value.trim()) {
      return null;
    }

    const number = Number(
      value.replace(",", ".").trim()
    );

    return Number.isFinite(number)
      ? number
      : null;
  }

  function formatMoney(
    value: number | null | undefined
  ) {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    ) {
      return "0,00 zł";
    }

    return `${Number(value)
      .toFixed(2)
      .replace(".", ",")} zł`;
  }

  function getProduct(productId: string) {
    return products.find(
      (product) => product.id === productId
    );
  }

  function addIngredient() {
    if (products.length === 0) {
      setError(
        "Brak aktywnych produktów w bazie składników."
      );
      return;
    }

    const product = products[0];

    setIngredients((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        productId: product.id,
        quantity: "",
        unit: product.unit ?? "",
      },
    ]);
  }

  function updateIngredient(
    id: string,
    field: keyof IngredientRow,
    value: string
  ) {
    setIngredients((current) =>
      current.map((ingredient) => {
        if (ingredient.id !== id) {
          return ingredient;
        }

        if (field === "productId") {
          const product = products.find(
            (item) => item.id === value
          );

          return {
            ...ingredient,
            productId: value,
            unit: product?.unit ?? "",
          };
        }

        return {
          ...ingredient,
          [field]: value,
        };
      })
    );
  }

  function removeIngredient(id: string) {
    setIngredients((current) =>
      current.filter(
        (ingredient) => ingredient.id !== id
      )
    );
  }

  function calculateIngredientCost(
    ingredient: IngredientRow
  ) {
    const product = getProduct(
      ingredient.productId
    );

    if (!product) {
      return 0;
    }

    const quantity = parseNumber(
      ingredient.quantity
    );

    const packageQuantity = Number(
      product.package_quantity
    );

    const packagePrice = Number(
      product.package_price
    );

    if (
      quantity <= 0 ||
      packageQuantity <= 0 ||
      packagePrice < 0
    ) {
      return 0;
    }

    return Number(
      (
        quantity *
        (packagePrice / packageQuantity)
      ).toFixed(2)
    );
  }

  const ingredientsCost = useMemo(() => {
    return Number(
      ingredients
        .reduce(
          (sum, ingredient) =>
            sum +
            calculateIngredientCost(
              ingredient
            ),
          0
        )
        .toFixed(2)
    );
  }, [ingredients, products]);

  const laborCost = useMemo(
    () => parseNumber(form.laborCost),
    [form.laborCost]
  );

  const energyCost = useMemo(
    () => parseNumber(form.energyCost),
    [form.energyCost]
  );

  const packagingCost = useMemo(
    () => parseNumber(form.packagingCost),
    [form.packagingCost]
  );

  const marginPercent = useMemo(
    () => parseNumber(form.marginPercent),
    [form.marginPercent]
  );

  const additionalCosts = useMemo(
    () =>
      Number(
        (
          laborCost +
          energyCost +
          packagingCost
        ).toFixed(2)
      ),
    [
      laborCost,
      energyCost,
      packagingCost,
    ]
  );

  const totalCost = useMemo(
    () =>
      Number(
        (
          ingredientsCost +
          additionalCosts
        ).toFixed(2)
      ),
    [
      ingredientsCost,
      additionalCosts,
    ]
  );

  const salePrice = useMemo(
    () =>
      Number(
        (
          totalCost *
          (1 + marginPercent / 100)
        ).toFixed(2)
      ),
    [
      totalCost,
      marginPercent,
    ]
  );

  const categories = useMemo(() => {
    const values = recipes
      .map((recipe) => recipe.category)
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(new Set(values)).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return recipes.filter((recipe) => {
      const matchesSearch =
        !query ||
        recipe.name
          .toLowerCase()
          .includes(query) ||
        (recipe.description ?? "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        recipe.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    recipes,
    search,
    categoryFilter,
  ]);

  async function loadRecipeIngredients(
    recipeId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      setError(
        `Nie udało się pobrać składników: ${error.message}`
      );
      return;
    }

    const rows =
      (data ?? []) as RecipeIngredient[];

    setIngredients(
      rows.map((ingredient) => ({
        id: ingredient.id,
        productId: ingredient.product_id,
        quantity: String(
          ingredient.quantity
        ).replace(".", ","),
        unit: ingredient.unit ?? "",
      }))
    );
  }

  async function loadPreviewIngredients(
    recipeId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      setError(
        `Nie udało się pobrać składników: ${error.message}`
      );
      return;
    }

    const rows =
      (data ?? []) as RecipeIngredient[];

    setPreviewIngredients(
      rows.map((ingredient) => ({
        id: ingredient.id,
        productId: ingredient.product_id,
        quantity: String(
          ingredient.quantity
        ).replace(".", ","),
        unit: ingredient.unit ?? "",
      }))
    );
  }

  async function openPreview(
    recipe: Recipe
  ) {
    setPreviewRecipe(recipe);
    setPreviewIngredients([]);
    setError("");

    await loadPreviewIngredients(
      recipe.id
    );
  }

  function calculatePreviewCost() {
    return previewIngredients.reduce(
      (sum, ingredient) => {
        return (
          sum +
          calculateIngredientCost(
            ingredient
          )
        );
      },
      0
    );
  }

  async function startEditing(
    recipe: Recipe
  ) {
    setEditingId(recipe.id);

    setForm({
      name: recipe.name ?? "",
      description:
        recipe.description ?? "",
      category:
        recipe.category ?? "",

      portions:
        recipe.portions !== null
          ? String(recipe.portions).replace(
              ".",
              ","
            )
          : "",

      diameterCm:
        recipe.diameter_cm !== null
          ? String(
              recipe.diameter_cm
            ).replace(".", ",")
          : "",

      heightCm:
        recipe.height_cm !== null
          ? String(
              recipe.height_cm
            ).replace(".", ",")
          : "",

      laborCost:
        recipe.labor_cost !== null
          ? String(
              recipe.labor_cost
            ).replace(".", ",")
          : "",

      energyCost:
        recipe.energy_cost !== null
          ? String(
              recipe.energy_cost
            ).replace(".", ",")
          : "",

      packagingCost:
        recipe.packaging_cost !== null
          ? String(
              recipe.packaging_cost
            ).replace(".", ",")
          : "",

      marginPercent:
        recipe.margin_percent !== null
          ? String(
              recipe.margin_percent
            ).replace(".", ",")
          : "",

      active: recipe.active,
    });

    setIngredients([]);
    setError("");
    setSuccess("");

    await loadRecipeIngredients(
      recipe.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyRecipeForm);
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

    const cleanName =
      form.name.trim();

    if (!cleanName) {
      setError(
        "Podaj nazwę receptury."
      );
      return;
    }

    if (ingredients.length === 0) {
      setError(
        "Dodaj przynajmniej jeden składnik do receptury."
      );
      return;
    }

    for (const ingredient of ingredients) {
      if (!ingredient.productId) {
        setError(
          "Każdy składnik musi mieć wybrany produkt."
        );
        return;
      }

      if (
        parseNumber(
          ingredient.quantity
        ) <= 0
      ) {
        setError(
          "Ilość każdego składnika musi być większa od zera."
        );
        return;
      }
    }

    const portions =
      parseNullableNumber(
        form.portions
      );

    const diameterCm =
      parseNullableNumber(
        form.diameterCm
      );

    const heightCm =
      parseNullableNumber(
        form.heightCm
      );

    const currentLaborCost =
      parseNumber(form.laborCost);

    const currentEnergyCost =
      parseNumber(form.energyCost);

    const currentPackagingCost =
      parseNumber(form.packagingCost);

    const currentMarginPercent =
      parseNumber(form.marginPercent);

    if (
      portions !== null &&
      portions <= 0
    ) {
      setError(
        "Liczba porcji musi być większa od zera."
      );
      return;
    }

    if (
      diameterCm !== null &&
      diameterCm <= 0
    ) {
      setError(
        "Średnica musi być większa od zera."
      );
      return;
    }

    if (
      heightCm !== null &&
      heightCm <= 0
    ) {
      setError(
        "Wysokość musi być większa od zera."
      );
      return;
    }

    if (currentLaborCost < 0) {
      setError(
        "Koszt pracy nie może być ujemny."
      );
      return;
    }

    if (currentEnergyCost < 0) {
      setError(
        "Koszt energii nie może być ujemny."
      );
      return;
    }

    if (currentPackagingCost < 0) {
      setError(
        "Koszt opakowania nie może być ujemny."
      );
      return;
    }

    if (currentMarginPercent < 0) {
      setError(
        "Marża nie może być ujemna."
      );
      return;
    }

    setSaving(true);

    try {
      const recipePayload = {
        name: cleanName,
        description:
          form.description.trim() ||
          null,
        category:
          form.category.trim() ||
          null,
        portions,
        diameter_cm: diameterCm,
        height_cm: heightCm,
        active: form.active,
        cost: totalCost,
        labor_cost: currentLaborCost,
        energy_cost: currentEnergyCost,
        packaging_cost:
          currentPackagingCost,
        margin_percent:
          currentMarginPercent,
      };

      let recipeId = editingId;

      if (editingId) {
        const {
          error: recipeError,
        } = await supabase
          .from("recipes")
          .update(recipePayload)
          .eq("id", editingId);

        if (recipeError) {
          throw new Error(
            recipeError.message
          );
        }

        const {
          error: deleteError,
        } = await supabase
          .from("recipe_ingredients")
          .delete()
          .eq(
            "recipe_id",
            editingId
          );

        if (deleteError) {
          throw new Error(
            deleteError.message
          );
        }
      } else {
        const {
          data,
          error: recipeError,
        } = await supabase
          .from("recipes")
          .insert(recipePayload)
          .select("*")
          .single();

        if (recipeError) {
          throw new Error(
            recipeError.message
          );
        }

        recipeId = data.id;
      }

      if (!recipeId) {
        throw new Error(
          "Nie udało się ustalić ID receptury."
        );
      }

      const ingredientPayload =
        ingredients.map(
          (ingredient) => ({
            recipe_id: recipeId,
            product_id:
              ingredient.productId,
            quantity: parseNumber(
              ingredient.quantity
            ),
            unit:
              ingredient.unit ||
              getProduct(
                ingredient.productId
              )?.unit ||
              "szt",
          })
        );

      const {
        error: ingredientsError,
      } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientPayload);

      if (ingredientsError) {
        throw new Error(
          ingredientsError.message
        );
      }

      setSuccess(
        editingId
          ? "Receptura została zaktualizowana."
          : "Receptura została zapisana."
      );

      setEditingId(null);
      setForm(emptyRecipeForm);
      setIngredients([]);

      await loadData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Nieznany błąd.";

      setError(
        `Nie udało się zapisać receptury: ${message}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecipe(
    recipe: Recipe
  ) {
    const confirmed =
      window.confirm(
        `Czy na pewno usunąć recepturę „${recipe.name}”?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        error: ingredientsError,
      } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq(
          "recipe_id",
          recipe.id
        );

      if (ingredientsError) {
        throw new Error(
          ingredientsError.message
        );
      }

      const {
        error: recipeError,
      } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      if (recipeError) {
        throw new Error(
          recipeError.message
        );
      }

      if (
        previewRecipe?.id ===
        recipe.id
      ) {
        setPreviewRecipe(null);
        setPreviewIngredients([]);
      }

      if (
        editingId === recipe.id
      ) {
        cancelEditing();
      }

      setSuccess(
        "Receptura została usunięta."
      );

      await loadData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Nieznany błąd.";

      setError(
        `Nie udało się usunąć receptury: ${message}`
      );
    }
  }

  async function toggleRecipe(
    recipe: Recipe
  ) {
    setError("");
    setSuccess("");

    const {
      error: updateError,
    } = await supabase
      .from("recipes")
      .update({
        active: !recipe.active,
      })
      .eq("id", recipe.id);

    if (updateError) {
      setError(
        `Nie udało się zmienić statusu: ${updateError.message}`
      );
      return;
    }

    await loadData();
  }

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 20,
    boxShadow:
      "0 4px 16px rgba(0,0,0,0.05)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 20,
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 800,
            color: "#111827",
          }}
        >
          Baza receptur
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "#6b7280",
          }}
        >
          Twórz receptury na podstawie
          produktów z bazy i automatycznie
          wyliczaj ich koszt.
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 12,
            background: "#fef2f2",
            color: "#b91c1c",
            border:
              "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 12,
            background: "#ecfdf5",
            color: "#047857",
            border:
              "1px solid #a7f3d0",
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
              }}
            >
              {editingId
                ? "Edytuj recepturę"
                : "Nowa receptura"}
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              {editingId
                ? "Zmień dane i składniki receptury."
                : "Dodaj recepturę i wybierz składniki z bazy produktów."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEditing}
              style={{
                ...buttonStyle,
                background: "#f3f4f6",
                color: "#374151",
              }}
            >
              Anuluj
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <label style={labelStyle}>
              Nazwa receptury
              <input
                value={form.name}
                onChange={(event) =>
                  updateForm(
                    "name",
                    event.target.value
                  )
                }
                placeholder="np. Tort malinowy"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Kategoria
              <input
                value={form.category}
                onChange={(event) =>
                  updateForm(
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
              Liczba porcji
              <input
                value={form.portions}
                onChange={(event) =>
                  updateForm(
                    "portions",
                    event.target.value
                  )
                }
                placeholder="np. 12"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Średnica cm
              <input
                value={form.diameterCm}
                onChange={(event) =>
                  updateForm(
                    "diameterCm",
                    event.target.value
                  )
                }
                placeholder="np. 20"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Wysokość cm
              <input
                value={form.heightCm}
                onChange={(event) =>
                  updateForm(
                    "heightCm",
                    event.target.value
                  )
                }
                placeholder="np. 10"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Koszt pracy
              <input
                value={form.laborCost}
                onChange={(event) =>
                  updateForm(
                    "laborCost",
                    event.target.value
                  )
                }
                placeholder="0,00"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Koszt energii
              <input
                value={form.energyCost}
                onChange={(event) =>
                  updateForm(
                    "energyCost",
                    event.target.value
                  )
                }
                placeholder="0,00"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Koszt opakowania
              <input
                value={form.packagingCost}
                onChange={(event) =>
                  updateForm(
                    "packagingCost",
                    event.target.value
                  )
                }
                placeholder="0,00"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Marża %
              <input
                value={form.marginPercent}
                onChange={(event) =>
                  updateForm(
                    "marginPercent",
                    event.target.value
                  )
                }
                placeholder="np. 30"
                inputMode="decimal"
                disabled={saving}
                style={inputStyle}
              />
            </label>
          </div>

          <label
            style={{
              ...labelStyle,
              marginTop: 16,
            }}
          >
            Opis
            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm(
                  "description",
                  event.target.value
                )
              }
              placeholder="Opis receptury..."
              rows={3}
              disabled={saving}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 14,
              fontWeight: 600,
            }}
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
            Receptura aktywna
          </label>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#f9fafb",
              borderRadius: 14,
              border:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                  }}
                >
                  Składniki
                </h3>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Produkty są pobierane
                  bezpośrednio z bazy
                  produktów.
                </p>
              </div>

              <button
                type="button"
                onClick={addIngredient}
                disabled={
                  saving ||
                  products.length === 0
                }
                style={{
                  ...buttonStyle,
                  background: "#111827",
                  color: "#fff",
                }}
              >
                + Dodaj składnik
              </button>
            </div>

            {ingredients.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  borderRadius: 12,
                  border:
                    "1px dashed #d1d5db",
                  color: "#6b7280",
                  background: "#fff",
                }}
              >
                Brak składników.
                Kliknij „Dodaj składnik”.
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {ingredients.map(
                (ingredient, index) => {
                  const product =
                    getProduct(
                      ingredient.productId
                    );

                  const ingredientCost =
                    calculateIngredientCost(
                      ingredient
                    );

                  return (
                    <div
                      key={ingredient.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(220px, 1fr) 130px 100px 120px 45px",
                        gap: 10,
                        alignItems:
                          "end",
                        padding: 12,
                        background:
                          "#fff",
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: 12,
                      }}
                    >
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Produkt
                        <select
                          value={
                            ingredient.productId
                          }
                          onChange={(
                            event
                          ) =>
                            updateIngredient(
                              ingredient.id,
                              "productId",
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            saving
                          }
                          style={
                            inputStyle
                          }
                        >
                          {products.map(
                            (
                              item
                            ) => (
                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {
                                  item.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label
                        style={
                          labelStyle
                        }
                      >
                        Ilość
                        <input
                          value={
                            ingredient.quantity
                          }
                          onChange={(
                            event
                          ) =>
                            updateIngredient(
                              ingredient.id,
                              "quantity",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="0"
                          inputMode="decimal"
                          disabled={
                            saving
                          }
                          style={
                            inputStyle
                          }
                        />
                      </label>

                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              "#6b7280",
                            marginBottom:
                              6,
                            fontWeight: 600,
                          }}
                        >
                          Jednostka
                        </div>

                        <div
                          style={{
                            ...inputStyle,
                            background:
                              "#f9fafb",
                          }}
                        >
                          {product?.unit ||
                            ingredient.unit ||
                            "—"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              "#6b7280",
                            marginBottom:
                              6,
                            fontWeight: 600,
                          }}
                        >
                          Koszt
                        </div>

                        <div
                          style={{
                            ...inputStyle,
                            background:
                              "#f0fdf4",
                            color:
                              "#166534",
                            fontWeight: 700,
                          }}
                        >
                          {formatMoney(
                            ingredientCost
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeIngredient(
                            ingredient.id
                          )
                        }
                        disabled={
                          saving
                        }
                        title="Usuń składnik"
                        style={{
                          width: 42,
                          height: 42,
                          border: "none",
                          borderRadius: 10,
                          background:
                            "#fee2e2",
                          color:
                            "#b91c1c",
                          fontSize: 20,
                          cursor:
                            "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#eff6ff",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Koszt składników
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: 20,
                }}
              >
                {formatMoney(
                  ingredientsCost
                )}
              </strong>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#fefce8",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Koszty dodatkowe
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: 20,
                }}
              >
                {formatMoney(
                  additionalCosts
                )}
              </strong>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#f3e8ff",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Całkowity koszt
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: 20,
                }}
              >
                {formatMoney(
                  totalCost
                )}
              </strong>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#ecfdf5",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Cena sprzedaży
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: 20,
                  color: "#047857",
                }}
              >
                {formatMoney(
                  salePrice
                )}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...buttonStyle,
              marginTop: 20,
              width: "100%",
              background: saving
                ? "#9ca3af"
                : "#16a34a",
              color: "#fff",
              fontSize: 16,
            }}
          >
            {saving
              ? "Zapisywanie..."
              : editingId
                ? "Zapisz zmiany receptury"
                : "Zapisz recepturę"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
              }}
            >
              Zapisane receptury
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
              }}
            >
              {recipes.length}{" "}
              {recipes.length === 1
                ? "receptura"
                : recipes.length >= 2 &&
                    recipes.length <= 4
                  ? "receptury"
                  : "receptur"}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Szukaj receptury..."
              style={{
                ...inputStyle,
                width: 240,
              }}
            />

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              style={{
                ...inputStyle,
                width: 180,
              }}
            >
              <option value="all">
                Wszystkie kategorie
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Ładowanie receptur...
          </div>
        ) : filteredRecipes.length ===
          0 ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "#6b7280",
              background: "#f9fafb",
              borderRadius: 12,
            }}
          >
            Brak receptur
            spełniających kryteria.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {filteredRecipes.map(
              (recipe) => (
                <div
                  key={recipe.id}
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 18,
                    background:
                      recipe.active
                        ? "#fff"
                        : "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: 10,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 18,
                        }}
                      >
                        {recipe.name}
                      </h3>

                      {recipe.category && (
                        <div
                          style={{
                            marginTop: 5,
                            color: "#6b7280",
                            fontSize: 13,
                          }}
                        >
                          {recipe.category}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        padding:
                          "4px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          recipe.active
                            ? "#dcfce7"
                            : "#e5e7eb",
                        color:
                          recipe.active
                            ? "#166534"
                            : "#4b5563",
                      }}
                    >
                      {recipe.active
                        ? "AKTYWNA"
                        : "NIEAKTYWNA"}
                    </span>
                  </div>

                  {recipe.description && (
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {recipe.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: 8,
                      marginTop: 14,
                    }}
                  >
                    <div
                      style={{
                        padding: 10,
                        background:
                          "#f9fafb",
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color:
                            "#6b7280",
                        }}
                      >
                        Koszt
                      </div>

                      <strong>
                        {formatMoney(
                          recipe.cost
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: 10,
                        background:
                          "#ecfdf5",
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color:
                            "#6b7280",
                        }}
                      >
                        Cena
                      </div>

                      <strong
                        style={{
                          color:
                            "#047857",
                        }}
                      >
                        {formatMoney(
                          Number(
                            recipe.cost ??
                              0
                          ) *
                            (1 +
                              Number(
                                recipe.margin_percent ??
                                  0
                              ) /
                                100)
                        )}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void openPreview(
                          recipe
                        )
                      }
                      style={{
                        ...buttonStyle,
                        background:
                          "#eff6ff",
                        color:
                          "#1d4ed8",
                      }}
                    >
                      Podgląd
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void startEditing(
                          recipe
                        )
                      }
                      style={{
                        ...buttonStyle,
                        background:
                          "#f3f4f6",
                        color:
                          "#374151",
                      }}
                    >
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleRecipe(
                          recipe
                        )
                      }
                      style={{
                        ...buttonStyle,
                        background:
                          recipe.active
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          recipe.active
                            ? "#92400e"
                            : "#166534",
                      }}
                    >
                      {recipe.active
                        ? "Dezaktywuj"
                        : "Aktywuj"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteRecipe(
                          recipe
                        )
                      }
                      style={{
                        ...buttonStyle,
                        background:
                          "#fee2e2",
                        color:
                          "#b91c1c",
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {previewRecipe && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() =>
            setPreviewRecipe(null)
          }
        >
          <div
            style={{
              width: "100%",
              maxWidth: 700,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 18,
              padding: 24,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 15,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {previewRecipe.name}
                </h2>

                {previewRecipe.category && (
                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      color:
                        "#6b7280",
                    }}
                  >
                    {
                      previewRecipe.category
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewRecipe(null)
                }
                style={{
                  border: "none",
                  background:
                    "#f3f4f6",
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {previewRecipe.description && (
              <p
                style={{
                  color: "#4b5563",
                  lineHeight: 1.6,
                }}
              >
                {
                  previewRecipe.description
                }
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 10,
                margin:
                  "20px 0",
              }}
            >
              <div
                style={{
                  padding: 12,
                  background:
                    "#f9fafb",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color:
                      "#6b7280",
                  }}
                >
                  Porcje
                </div>

                <strong>
                  {previewRecipe.portions ??
                    "—"}
                </strong>
              </div>

              <div
                style={{
                  padding: 12,
                  background:
                    "#f9fafb",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color:
                      "#6b7280",
                  }}
                >
                  Średnica
                </div>

                <strong>
                  {previewRecipe.diameter_cm ??
                    "—"}{" "}
                  cm
                </strong>
              </div>

              <div
                style={{
                  padding: 12,
                  background:
                    "#f9fafb",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color:
                      "#6b7280",
                  }}
                >
                  Wysokość
                </div>

                <strong>
                  {previewRecipe.height_cm ??
                    "—"}{" "}
                  cm
                </strong>
              </div>
            </div>

            <h3>Składniki</h3>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 8,
              }}
            >
              {previewIngredients.map(
                (ingredient) => {
                  const product =
                    getProduct(
                      ingredient.productId
                    );

                  return (
                    <div
                      key={ingredient.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 12,
                        padding: 12,
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      <span>
                        {product?.name ??
                          "Nieznany produkt"}
                      </span>

                      <strong>
                        {
                          ingredient.quantity
                        }{" "}
                        {ingredient.unit ||
                          product?.unit ||
                          ""}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>

            <div
  style={{
    marginTop: 20,
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  }}
>
  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#eff6ff",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Koszt składników
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
      }}
    >
      {formatMoney(
        calculatePreviewCost()
      )}
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#fefce8",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Koszt pracy
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
      }}
    >
      {formatMoney(
        previewRecipe.labor_cost
      )}
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#fff7ed",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Koszt energii
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
      }}
    >
      {formatMoney(
        previewRecipe.energy_cost
      )}
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#fdf2f8",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Koszt opakowania
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
      }}
    >
      {formatMoney(
        previewRecipe.packaging_cost
      )}
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#f3f4f6",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Koszty dodatkowe
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
      }}
    >
      {formatMoney(
        Number(previewRecipe.labor_cost ?? 0) +
          Number(previewRecipe.energy_cost ?? 0) +
          Number(previewRecipe.packaging_cost ?? 0)
      )}
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#f3e8ff",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Całkowity koszt
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
      }}
    >
      {formatMoney(
        previewRecipe.cost
      )}
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#ecfdf5",
    }}
  >
    <div
      style={{
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      Marża
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 20,
        color: "#047857",
      }}
    >
      {Number(
        previewRecipe.margin_percent ?? 0
      ).toFixed(2).replace(".", ",")}%
    </strong>
  </div>

  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: "#dcfce7",
      border: "1px solid #86efac",
    }}
  >
    <div
      style={{
        color: "#166534",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      Cena sprzedaży
    </div>

    <strong
      style={{
        display: "block",
        marginTop: 4,
        fontSize: 24,
        color: "#047857",
      }}
    >
      {formatMoney(
        Number(previewRecipe.cost ?? 0) *
          (1 +
            Number(
              previewRecipe.margin_percent ?? 0
            ) / 100)
      )}
    </strong>
  </div>
</div>
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Koszt składników
              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: 4,
                  fontSize: 22,
                  color: "#047857",
                }}
              >
                {formatMoney(
                  calculatePreviewCost()
                )}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
