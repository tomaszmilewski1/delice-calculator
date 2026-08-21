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
      .toString()
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

    const normalized = value
      .toString()
      .replace(",", ".")
      .trim();

    const number = Number(normalized);

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
      return;
    }

    const firstProduct = products[0];

    setIngredients((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        productId: firstProduct.id,
        quantity: "",
        unit: firstProduct.unit ?? "",
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
  ): number {
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
      packagePrice < 0 ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(packageQuantity) ||
      !Number.isFinite(packagePrice)
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
    const total = ingredients.reduce(
      (sum, ingredient) =>
        sum +
        calculateIngredientCost(ingredient),
      0
    );

    return Number(total.toFixed(2));
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

  function calculatePreviewProductsCost() {
    return Number(
      previewIngredients
        .reduce(
          (sum, ingredient) => {
            const product = products.find(
              (item) =>
                item.id ===
                ingredient.productId
            );

            if (!product) {
              return sum;
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
              packageQuantity <= 0
            ) {
              return sum;
            }

            return (
              sum +
              quantity *
                (packagePrice /
                  packageQuantity)
            );
          },
          0
        )
        .toFixed(2)
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

      const quantity = parseNumber(
        ingredient.quantity
      );

      if (quantity <= 0) {
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
      parseNumber(
        form.laborCost
      );

    const currentEnergyCost =
      parseNumber(
        form.energyCost
      );

    const currentPackagingCost =
      parseNumber(
        form.packagingCost
      );

    const currentMarginPercent =
      parseNumber(
        form.marginPercent
      );

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

    if (
      currentLaborCost < 0 ||
      currentEnergyCost < 0 ||
      currentPackagingCost < 0
    ) {
      setError(
        "Koszty dodatkowe nie mogą być ujemne."
      );
      return;
    }

    if (
      currentMarginPercent < 0
    ) {
      setError(
        "Marża nie może być ujemna."
      );
      return;
    }

    let calculatedProductsCost = 0;

    for (const ingredient of ingredients) {
      const product =
        products.find(
          (item) =>
            item.id ===
            ingredient.productId
        );

      if (!product) {
        setError(
          "Nie znaleziono produktu dla składnika."
        );
        return;
      }

      const quantity =
        parseNumber(
          ingredient.quantity
        );

      const packageQuantity =
        Number(
          product.package_quantity
        );

      const packagePrice =
        Number(
          product.package_price
        );

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setError(
          `Nieprawidłowa ilość produktu "${product.name}".`
        );
        return;
      }

      if (
        !Number.isFinite(
          packageQuantity
        ) ||
        packageQuantity <= 0
      ) {
        setError(
          `Produkt "${product.name}" ma nieprawidłową ilość opakowania.`
        );
        return;
      }

      if (
        !Number.isFinite(
          packagePrice
        ) ||
        packagePrice < 0
      ) {
        setError(
          `Produkt "${product.name}" ma nieprawidłową cenę opakowania.`
        );
        return;
      }

      calculatedProductsCost +=
        quantity *
        (packagePrice /
          packageQuantity);
    }

    calculatedProductsCost =
      Number(
        calculatedProductsCost.toFixed(
          2
        )
      );

    const calculatedAdditionalCosts =
      Number(
        (
          currentLaborCost +
          currentEnergyCost +
          currentPackagingCost
        ).toFixed(2)
      );

    const calculatedTotalCost =
      Number(
        (
          calculatedProductsCost +
          calculatedAdditionalCosts
        ).toFixed(2)
      );

    const recipeData = {
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

      cost: calculatedTotalCost,

      labor_cost:
        Number(
          currentLaborCost.toFixed(2)
        ),

      energy_cost:
        Number(
          currentEnergyCost.toFixed(2)
        ),

      packaging_cost:
        Number(
          currentPackagingCost.toFixed(2)
        ),

      margin_percent:
        Number(
          currentMarginPercent.toFixed(
            2
          )
        ),
    };

    setSaving(true);

    /*
     * POPRAWKA BŁĘDU BUILD:
     *
     * było:
     * let recipeId: | string | null = editingId;
     *
     * jest:
     */
    let recipeId: string | null =
      editingId;

    if (editingId) {
      const {
        error: updateError,
      } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq(
          "id",
          editingId
        );

      if (updateError) {
        setError(
          `Nie udało się zaktualizować receptury: ${updateError.message}`
        );
        setSaving(false);
        return;
      }

      const {
        error:
          deleteIngredientsError,
      } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq(
          "recipe_id",
          editingId
        );

      if (deleteIngredientsError) {
        setError(
          `Nie udało się zaktualizować składników receptury: ${deleteIngredientsError.message}`
        );
        setSaving(false);
        return;
      }
    } else {
      const {
        data,
        error: insertError,
      } = await supabase
        .from("recipes")
        .insert(recipeData)
        .select("id")
        .single();

      if (
        insertError ||
        !data
      ) {
        setError(
          `Nie udało się zapisać receptury: ${
            insertError?.message ??
            "Brak identyfikatora receptury."
          }`
        );

        setSaving(false);
        return;
      }

      recipeId = data.id;
    }

    if (!recipeId) {
      setError(
        "Nie udało się ustalić identyfikatora receptury."
      );

      setSaving(false);
      return;
    }

    const ingredientData =
      ingredients.map(
        (ingredient) => ({
          recipe_id: recipeId,
          product_id:
            ingredient.productId,

          quantity: Number(
            parseNumber(
              ingredient.quantity
            ).toFixed(3)
          ),

          unit: ingredient.unit,
        })
      );

    const {
      error:
        ingredientsInsertError,
    } = await supabase
      .from("recipe_ingredients")
      .insert(
        ingredientData
      );

    if (
      ingredientsInsertError
    ) {
      setError(
        `Receptura została zapisana, ale nie udało się zapisać składników: ${ingredientsInsertError.message}`
      );

      setSaving(false);
      return;
    }

    setSuccess(
      editingId
        ? `Receptura została zaktualizowana. Koszt całkowity: ${formatMoney(
            calculatedTotalCost
          )}.`
        : `Receptura została dodana. Koszt całkowity: ${formatMoney(
            calculatedTotalCost
          )}.`
    );

    setForm(
      emptyRecipeForm
    );

    setIngredients([]);
    setEditingId(null);

    await loadData();

    setSaving(false);
  }

  async function deleteRecipe(
    recipe: Recipe
  ) {
    const confirmed =
      window.confirm(
        `Czy na pewno chcesz usunąć recepturę "${recipe.name}"?\n\nZostaną również usunięte jej składniki.`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

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
      setError(
        `Nie udało się usunąć składników receptury: ${ingredientsError.message}`
      );
      return;
    }

    const {
      error: recipeError,
    } = await supabase
      .from("recipes")
      .delete()
      .eq(
        "id",
        recipe.id
      );

    if (recipeError) {
      setError(
        `Nie udało się usunąć receptury: ${recipeError.message}`
      );
      return;
    }

    if (
      editingId === recipe.id
    ) {
      cancelEditing();
    }

    setSuccess(
      `Receptura "${recipe.name}" została usunięta.`
    );

    await loadData();
  }

  async function toggleActive(
    recipe: Recipe
  ) {
    setError("");
    setSuccess("");

    const newStatus =
      !recipe.active;

    const {
      error: updateError,
    } = await supabase
      .from("recipes")
      .update({
        active: newStatus,
      })
      .eq(
        "id",
        recipe.id
      );

    if (updateError) {
      setError(
        `Nie udało się zmienić statusu receptury: ${updateError.message}`
      );
      return;
    }

    setRecipes(
      (current) =>
        current.map(
          (item) =>
            item.id === recipe.id
              ? {
                  ...item,
                  active:
                    newStatus,
                }
              : item
        )
    );

    setSuccess(
      newStatus
        ? `Receptura "${recipe.name}" została aktywowana.`
        : `Receptura "${recipe.name}" została wyłączona.`
    );
  }

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        recipes
          .map(
            (recipe) =>
              recipe.category?.trim()
          )
          .filter(
            (
              category
            ): category is string =>
              Boolean(category)
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b, "pl")
    );
  }, [recipes]);

  const filteredRecipes =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "pl"
          );

      return recipes.filter(
        (recipe) => {
          const matchesSearch =
            cleanSearch === "" ||
            recipe.name
              .toLocaleLowerCase(
                "pl"
              )
              .includes(
                cleanSearch
              ) ||
            (
              recipe.category ??
              ""
            )
              .toLocaleLowerCase(
                "pl"
              )
              .includes(
                cleanSearch
              );

          const matchesCategory =
            categoryFilter ===
              "all" ||
            recipe.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      recipes,
      search,
      categoryFilter,
    ]);

  return (
    <section
      style={pageStyle}
    >
      <div
        style={headerStyle}
      >
        <div>
          <div
            style={
              eyebrowStyle
            }
          >
            BAZA RECEPTUR
          </div>

          <h2
            style={titleStyle}
          >
            Receptury
          </h2>

          <p
            style={
              subtitleStyle
            }
          >
            Twórz receptury z
            produktów zapisanych w
            bazie i automatycznie
            wyliczaj ich koszt.
          </p>
        </div>

        <div
          style={
            countBadgeStyle
          }
        >
          {recipes.length}{" "}
          {recipes.length ===
          1
            ? "receptura"
            : recipes.length >=
                  2 &&
              recipes.length <=
                4
            ? "receptury"
            : "receptur"}
        </div>
      </div>

      <div
        style={
          contentGridStyle
        }
      >
        <div
          style={
            formCardStyle
          }
        >
          <div
            style={
              cardHeaderStyle
            }
          >
            <div>
              <h3
                style={
                  cardTitleStyle
                }
              >
                {editingId
                  ? "Edytuj recepturę"
                  : "Dodaj recepturę"}
              </h3>

              <p
                style={
                  cardSubtitleStyle
                }
              >
                {editingId
                  ? "Zmień dane i składniki receptury."
                  : "Wybierz produkty z istniejącej bazy."}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={
                  cancelEditing
                }
                style={
                  cancelButtonStyle
                }
              >
                Anuluj
              </button>
            )}
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <label
              style={labelStyle}
            >
              <span
                style={
                  labelTextStyle
                }
              >
                Nazwa receptury *
              </span>

              <input
                type="text"
                value={form.name}
                onChange={(
                  event
                ) =>
                  updateForm(
                    "name",
                    event.target
                      .value
                  )
                }
                placeholder="np. Biszkopt waniliowy"
                disabled={saving}
                style={
                  inputStyle
                }
              />
            </label>

            <label
              style={labelStyle}
            >
              <span
                style={
                  labelTextStyle
                }
              >
                Kategoria
              </span>

              <input
                type="text"
                value={
                  form.category
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "category",
                    event.target
                      .value
                  )
                }
                placeholder="np. Biszkopty"
                disabled={saving}
                style={
                  inputStyle
                }
              />
            </label>

            <label
              style={labelStyle}
            >
              <span
                style={
                  labelTextStyle
                }
              >
                Opis
              </span>

              <textarea
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "description",
                    event.target
                      .value
                  )
                }
                placeholder="Opcjonalny opis receptury"
                disabled={saving}
                rows={3}
                style={
                  textareaStyle
                }
              />
            </label>

            <div
              style={
                twoColumnStyle
              }
            >
              <label
                style={labelStyle}
              >
                <span
                  style={
                    labelTextStyle
                  }
                >
                  Porcje
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    form.portions
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "portions",
                      event.target
                        .value
                    )
                  }
                  placeholder="np. 12"
                  disabled={saving}
                  style={
                    inputStyle
                  }
                />
              </label>

              <label
                style={labelStyle}
              >
                <span
                  style={
                    labelTextStyle
                  }
                >
                  Średnica cm
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    form.diameterCm
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "diameterCm",
                      event.target
                        .value
                    )
                  }
                  placeholder="np. 20"
                  disabled={saving}
                  style={
                    inputStyle
                  }
                />
              </label>
            </div>

            <label
              style={labelStyle}
            >
              <span
                style={
                  labelTextStyle
                }
              >
                Wysokość cm
              </span>

              <input
                type="text"
                inputMode="decimal"
                value={
                  form.heightCm
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "heightCm",
                    event.target
                      .value
                  )
                }
                placeholder="np. 10"
                disabled={saving}
                style={
                  inputStyle
                }
              />
            </label>

            <div
              style={
                sectionHeaderStyle
              }
            >
              <div>
                <h4
                  style={
                    sectionTitleStyle
                  }
                >
                  Składniki receptury
                </h4>

                <p
                  style={
                    sectionSubtitleStyle
                  }
                >
                  Wybierz produkt z bazy
                  i podaj ilość.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addIngredient
                }
                disabled={
                  saving ||
                  products.length ===
                    0
                }
                style={{
                  ...addIngredientButtonStyle,
                  opacity:
                    saving ||
                    products.length ===
                      0
                      ? 0.5
                      : 1,
                }}
              >
                + Dodaj składnik
              </button>
            </div>

            {products.length ===
            0 ? (
              <div
                style={
                  warningStyle
                }
              >
                <strong>
                  Brak aktywnych
                  produktów
                </strong>

                <p
                  style={
                    warningTextStyle
                  }
                >
                  Najpierw dodaj
                  produkty w module
                  „Produkty”.
                </p>
              </div>
            ) : ingredients.length ===
              0 ? (
              <div
                style={
                  ingredientsEmptyStyle
                }
              >
                Nie dodano jeszcze
                żadnych składników.
              </div>
            ) : (
              <div
                style={
                  ingredientsListStyle
                }
              >
                {ingredients.map(
                  (
                    ingredient,
                    index
                  ) => {
                    const product =
                      getProduct(
                        ingredient.productId
                      );

                    return (
                      <div
                        key={
                          ingredient.id
                        }
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
                            ingredientProductStyle
                          }
                        >
                          <span
                            style={
                              smallLabelStyle
                            }
                          >
                            Produkt
                          </span>

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
                            <option value="">
                              Wybierz produkt
                            </option>

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
                        </div>

                        <div
                          style={
                            ingredientQuantityStyle
                          }
                        >
                          <span
                            style={
                              smallLabelStyle
                            }
                          >
                            Ilość
                          </span>

                          <input
                            type="text"
                            inputMode="decimal"
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
                            placeholder="np. 500"
                            disabled={
                              saving
                            }
                            style={
                              inputStyle
                            }
                          />
                        </div>

                        <div
                          style={
                            ingredientUnitStyle
                          }
                        >
                          <span
                            style={
                              smallLabelStyle
                            }
                          >
                            Jednostka
                          </span>

                          <div
                            style={
                              ingredientUnitValueStyle
                            }
                          >
                            {ingredient.unit ||
                              product?.unit ||
                              "—"}
                          </div>
                        </div>

                        <div
                          style={
                            ingredientCostStyle
                          }
                        >
                          <span
                            style={
                              smallLabelStyle
                            }
                          >
                            Koszt
                          </span>

                          <strong>
                            {formatMoney(
                              calculateIngredientCost(
                                ingredient
                              )
                            )}
                          </strong>
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
                          style={
                            removeIngredientButtonStyle
                          }
                        >
                          Usuń
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            <div
              style={
                costSummaryStyle
              }
            >
              <div>
                <span
                  style={
                    costSummaryLabelStyle
                  }
                >
                  Koszt produktów
                </span>

                <strong
                  style={
                    costSummaryValueStyle
                  }
                >
                  {formatMoney(
                    ingredientsCost
                  )}
                </strong>
              </div>

              <div>
                <span
                  style={
                    costSummaryLabelStyle
                  }
                >
                  Koszty dodatkowe
                </span>

                <strong
                  style={
                    costSummaryValueStyle
                  }
                >
                  {formatMoney(
                    additionalCosts
                  )}
                </strong>
              </div>

              <div
                style={
                  totalCostBoxStyle
                }
              >
                <span
                  style={
                    totalCostLabelStyle
                  }
                >
                  Łączny koszt receptury
                </span>

                <strong
                  style={
                    totalCostValueStyle
                  }
                >
                  {formatMoney(
                    totalCost
                  )}
                </strong>
              </div>
            </div>

            <div
              style={
                additionalCostsHeaderStyle
              }
            >
              Koszty dodatkowe
            </div>

            <div
              style={
                twoColumnStyle
              }
            >
              <label
                style={labelStyle}
              >
                <span
                  style={
                    labelTextStyle
                  }
                >
                  Koszt pracy
                </span>

                <div
                  style={
                    priceInputWrapperStyle
                  }
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      form.laborCost
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "laborCost",
                        event.target
                          .value
                      )
                    }
                    placeholder="0,00"
                    disabled={
                      saving
                    }
                    style={
                      priceInputStyle
                    }
                  />

                  <span
                    style={
                      currencyStyle
                    }
                  >
                    zł
                  </span>
                </div>
              </label>

              <label
                style={labelStyle}
              >
                <span
                  style={
                    labelTextStyle
                  }
                >
                  Koszt energii
                </span>

                <div
                  style={
                    priceInputWrapperStyle
                  }
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      form.energyCost
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "energyCost",
                        event.target
                          .value
                      )
                    }
                    placeholder="0,00"
                    disabled={
                      saving
                    }
                    style={
                      priceInputStyle
                    }
                  />

                  <span
                    style={
                      currencyStyle
                    }
                  >
                    zł
                  </span>
                </div>
              </label>
            </div>

            <label
              style={labelStyle}
            >
              <span
                style={
                  labelTextStyle
                }
              >
                Koszt opakowania
              </span>

              <div
                style={
                  priceInputWrapperStyle
                }
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    form.packagingCost
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "packagingCost",
                      event.target
                        .value
                    )
                  }
                  placeholder="0,00"
                  disabled={saving}
                  style={
                    priceInputStyle
                  }
                />

                <span
                  style={
                    currencyStyle
                  }
                >
                  zł
                </span>
              </div>
            </label>

            <label
              style={labelStyle}
            >
              <span
                style={
                  labelTextStyle
                }
              >
                Marża %
              </span>

              <div
                style={
                  priceInputWrapperStyle
                }
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    form.marginPercent
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "marginPercent",
                      event.target
                        .value
                    )
                  }
                  placeholder="np. 30"
                  disabled={saving}
                  style={
                    priceInputStyle
                  }
                />

                <span
                  style={
                    currencyStyle
                  }
                >
                  %
                </span>
              </div>
            </label>

            <div
              style={
                salePriceBoxStyle
              }
            >
              <span>
                Cena po dodaniu
                marży
              </span>

              <strong>
                {formatMoney(
                  salePrice
                )}
              </strong>
            </div>

            <label
              style={
                checkboxLabelStyle
              }
            >
              <input
                type="checkbox"
                checked={
                  form.active
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "active",
                    event.target
                      .checked
                  )
                }
                disabled={saving}
              />

              <span>
                Receptura aktywna
              </span>
            </label>

            {error && (
              <div
                style={
                  errorStyle
                }
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={
                  successStyle
                }
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={
                saving ||
                products.length ===
                  0
              }
              style={{
                ...buttonStyle,
                opacity:
                  saving ||
                  products.length ===
                    0
                    ? 0.6
                    : 1,
                cursor:
                  saving ||
                  products.length ===
                    0
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

        {previewRecipe && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "25px",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  marginBottom:
                    "20px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#292522",
                    }}
                  >
                    {
                      previewRecipe.name
                    }
                  </h2>

                  {previewRecipe.category && (
                    <div
                      style={{
                        marginTop:
                          "5px",
                        color:
                          "#8a837d",
                        fontSize:
                          "13px",
                      }}
                    >
                      {
                        previewRecipe.category
                      }
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewRecipe(
                      null
                    )
                  }
                  style={
                    refreshButtonStyle
                  }
                >
                  Zamknij
                </button>
              </div>

              {previewRecipe.description && (
                <p
                  style={{
                    color:
                      "#716b65",
                    fontSize:
                      "14px",
                    lineHeight: 1.5,
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
                    "repeat(3, 1fr)",
                  gap: "12px",
                  marginBottom:
                    "20px",
                }}
              >
                <div>
                  <strong>
                    Porcje
                  </strong>

                  <div>
                    {
                      previewRecipe.portions ??
                      "-"
                    }
                  </div>
                </div>

                <div>
                  <strong>
                    Średnica
                  </strong>

                  <div>
                    {
                      previewRecipe.diameter_cm ??
                      "-"
                    }{" "}
                    cm
                  </div>
                </div>

                <div>
                  <strong>
                    Wysokość
                  </strong>

                  <div>
                    {
                      previewRecipe.height_cm ??
                      "-"
                    }{" "}
                    cm
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop:
                    "1px solid #eee7e0",
                  paddingTop:
                    "18px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    color:
                      "#292522",
                  }}
                >
                  Składniki
                </h3>

                {previewIngredients.length ===
                0 ? (
                  <p
                    style={{
                      color:
                        "#8a837d",
                    }}
                  >
                    Brak składników.
                  </p>
                ) : (
                  previewIngredients.map(
                    (
                      ingredient
                    ) => {
                      const product =
                        products.find(
                          (item) =>
                            item.id ===
                            ingredient.productId
                        );

                      return (
                        <div
                          key={
                            ingredient.id
                          }
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap: "15px",
                            padding:
                              "8px 0",
                            borderBottom:
                              "1px solid #f1ece7",
                          }}
                        >
                          <span>
                            {
                              product?.name ??
                              "Nieznany produkt"
                            }
                          </span>

                          <strong>
                            {
                              ingredient.quantity
                            }{" "}
                            {
                              ingredient.unit ||
                              product?.unit ||
                              ""
                            }
                          </strong>
                        </div>
                      );
                    }
                  )
                )}

                <h3
                  style={{
                    marginTop:
                      "25px",
                    color:
                      "#292522",
                  }}
                >
                  Koszt receptury
                </h3>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >
                  <span>
                    Koszt produktów
                  </span>

                  <strong>
                    {formatMoney(
                      calculatePreviewProductsCost()
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >
                  <span>
                    Koszt pracy
                  </span>

                  <strong>
                    {formatMoney(
                      previewRecipe.labor_cost
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >
                  <span>
                    Koszt energii
                  </span>

                  <strong>
                    {formatMoney(
                      previewRecipe.energy_cost
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >
                  <span>
                    Opakowanie
                  </span>

                  <strong>
                    {formatMoney(
                      previewRecipe.packaging_cost
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginTop:
                      "15px",
                    paddingTop:
                      "15px",
                    borderTop:
                      "1px solid #eee7e0",
                    fontSize:
                      "18px",
                  }}
                >
                  <strong>
                    Łączny koszt
                  </strong>

                  <strong
                    style={{
                      color:
                        "#8a6d4b",
                    }}
                  >
                    {formatMoney(
                      previewRecipe.cost
                    )}
                  </strong>
                </div>

                {previewRecipe.margin_percent !==
                  null && (
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      marginTop:
                        "10px",
                    }}
                  >
                    <span>
                      Marża
                    </span>

                    <strong>
                      {
                        previewRecipe.margin_percent
                      }{" "}
                      %
                    </strong>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop:
                    "25px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setPreviewRecipe(
                      null
                    )
                  }
                  style={{
                    ...buttonStyle,
                    width: "auto",
                    background:
                      "#fff",
                    color:
                      "#8a6d4b",
                    border:
                      "1px solid #d8c8b8",
                  }}
                >
                  Zamknij
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                  style={{
                    ...buttonStyle,
                    width: "auto",
                    background:
                      "#111827",
                  }}
                >
                  🖨️ Drukuj kartę
                  receptury
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          style={
            listCardStyle
          }
        >
          <div
            style={
              cardHeaderStyle
            }
          >
            <div>
              <h3
                style={
                  cardTitleStyle
                }
              >
                Lista receptur
              </h3>

              <p
                style={
                  cardSubtitleStyle
                }
              >
                Receptury zapisane w
                bazie Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              disabled={loading}
              style={
                refreshButtonStyle
              }
            >
              Odśwież
            </button>
          </div>

          <div
            style={
              filtersStyle
            }
          >
            <div
              style={
                searchWrapperStyle
              }
            >
              <span
                style={
                  searchIconStyle
                }
              >
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Szukaj receptury lub kategorii..."
                style={
                  searchInputStyle
                }
              />
            </div>

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event.target
                    .value
                )
              }
              style={
                filterSelectStyle
              }
            >
              <option value="all">
                Wszystkie kategorie
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            {(search !== "" ||
              categoryFilter !==
                "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter(
                    "all"
                  );
                }}
                style={
                  clearFilterButtonStyle
                }
              >
                Wyczyść
              </button>
            )}
          </div>

          {!loading &&
            recipes.length >
              0 && (
              <div
                style={
                  resultsInfoStyle
                }
              >
                Wyświetlono{" "}
                <strong>
                  {
                    filteredRecipes.length
                  }
                </strong>{" "}
                z{" "}
                <strong>
                  {recipes.length}
                </strong>{" "}
                receptur
              </div>
            )}

          {loading ? (
            <div
              style={
                emptyStyle
              }
            >
              Ładowanie
              receptur...
            </div>
          ) : recipes.length ===
            0 ? (
            <div
              style={
                emptyStyle
              }
            >
              <div
                style={
                  emptyIconStyle
                }
              >
                R
              </div>

              <strong>
                Brak receptur
              </strong>

              <p
                style={
                  emptyTextStyle
                }
              >
                Dodaj pierwszą
                recepturę za pomocą
                formularza.
              </p>
            </div>
          ) : filteredRecipes.length ===
            0 ? (
            <div
              style={
                emptyStyle
              }
            >
              <div
                style={
                  emptyIconStyle
                }
              >
                ?
              </div>

              <strong>
                Nie znaleziono
                receptur
              </strong>

              <p
                style={
                  emptyTextStyle
                }
              >
                Zmień wyszukiwanie
                lub kategorię.
              </p>
            </div>
          ) : (
            <div
              style={
                recipesListStyle
              }
            >
              {filteredRecipes.map(
                (recipe) => (
                  <div
                    key={recipe.id}
                    style={
                      recipeRowStyle
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
                          {
                            recipe.name
                          }
                        </div>

                        <div
                          style={
                            recipeMetaStyle
                          }
                        >
                          {recipe.category ||
                            "Bez kategorii"}

                          {recipe.portions
                            ? ` • ${recipe.portions} porcji`
                            : ""}

                          {recipe.diameter_cm
                            ? ` • Ø ${recipe.diameter_cm} cm`
                            : ""}
                        </div>
                      </div>
                    </div>

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
                          Koszt
                        </span>

                        <strong>
                          {formatMoney(
                            recipe.cost
                          )}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            detailLabelStyle
                          }
                        >
                          Marża
                        </span>

                        <strong>
                          {recipe.margin_percent !==
                          null
                            ? `${Number(
                                recipe.margin_percent
                              )
                                .toFixed(
                                  0
                                )
                                .replace(
                                  ".",
                                  ","
                                )}%`
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
                            void toggleActive(
                              recipe
                            )
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

                    <div
                      style={
                        actionsStyle
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          void startEditing(
                            recipe
                          )
                        }
                        style={
                          editButtonStyle
                        }
                      >
                        Edytuj
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setError("");
                          setPreviewIngredients(
                            []
                          );
                          setPreviewRecipe(
                            recipe
                          );

                          await loadPreviewIngredients(
                            recipe.id
                          );
                        }}
                        style={{
                          ...editButtonStyle,
                          background:
                            "#f5f1eb",
                          color:
                            "#6b5138",
                          border:
                            "1px solid #ddd0c1",
                        }}
                      >
                        Podgląd
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void deleteRecipe(
                            recipe
                          )
                        }
                        style={
                          deleteButtonStyle
                        }
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
      </div>
    </section>
  );
}

/* =====================================================
   STYLES
===================================================== */

const pageStyle = {
  width: "100%",
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
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
  whiteSpace:
    "nowrap" as const,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(360px, 520px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
};

const formCardStyle = {
  background: "#ffffff",
  border:
    "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing:
    "border-box" as const,
};

const listCardStyle = {
  background: "#ffffff",
  border:
    "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing:
    "border-box" as const,
  minWidth: 0,
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
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
  boxSizing:
    "border-box" as const,
  border:
    "1px solid #ddd3c9",
  borderRadius: "9px",
  padding: "11px 12px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  resize:
    "vertical" as const,
  minHeight: "80px",
  fontFamily: "inherit",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap: "12px",
};

const priceInputWrapperStyle = {
  position:
    "relative" as const,
};

const priceInputStyle = {
  ...inputStyle,
  paddingRight: "35px",
};

const currencyStyle = {
  position:
    "absolute" as const,
  right: "12px",
  top: "50%",
  transform:
    "translateY(-50%)",
  color: "#8a837d",
  fontSize: "13px",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "12px",
  marginTop: "25px",
  marginBottom: "14px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "15px",
};

const sectionSubtitleStyle = {
  margin: "4px 0 0",
  color: "#8a837d",
  fontSize: "11px",
};

const addIngredientButtonStyle = {
  border:
    "1px solid #d8c8b8",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "9px",
  padding: "8px 11px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace:
    "nowrap" as const,
};

const warningStyle = {
  background: "#fff8ed",
  border:
    "1px solid #ead7b8",
  color: "#8a6d4b",
  borderRadius: "10px",
  padding: "13px",
  marginBottom: "16px",
  fontSize: "13px",
};

const warningTextStyle = {
  margin: "5px 0 0",
  color: "#716b65",
  fontSize: "12px",
};

const ingredientsEmptyStyle = {
  border:
    "1px dashed #ddd3c9",
  borderRadius: "10px",
  padding: "20px",
  textAlign:
    "center" as const,
  color: "#8a837d",
  fontSize: "12px",
  marginBottom: "16px",
};

const ingredientsListStyle = {
  display: "flex",
  flexDirection:
    "column" as const,
  gap: "10px",
  marginBottom: "16px",
};

const ingredientRowStyle = {
  border:
    "1px solid #eee7e0",
  borderRadius: "11px",
  padding: "11px",
  display: "grid",
  gridTemplateColumns:
    "28px minmax(150px, 1.5fr) minmax(80px, 0.7fr) 70px 85px auto",
  gap: "8px",
  alignItems: "end",
};

const ingredientNumberStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "center",
  fontSize: "11px",
  fontWeight: 700,
  marginBottom: "2px",
};

const ingredientProductStyle = {
  minWidth: 0,
};

const ingredientQuantityStyle = {
  minWidth: 0,
};

const ingredientUnitStyle = {
  minWidth: 0,
};

const ingredientCostStyle = {
  minWidth: 0,
  paddingBottom: "11px",
};

const smallLabelStyle = {
  display: "block",
  color: "#9a928b",
  fontSize: "9px",
  textTransform:
    "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "5px",
};

const ingredientUnitValueStyle = {
  height: "40px",
  display: "flex",
  alignItems: "center",
  color: "#514b46",
  fontSize: "13px",
  fontWeight: 600,
};

const removeIngredientButtonStyle = {
  border:
    "1px solid #e3c1bd",
  background: "#fff8f7",
  color: "#a34f46",
  borderRadius: "8px",
  padding: "8px 9px",
  cursor: "pointer",
  fontSize: "11px",
  marginBottom: "1px",
};

const costSummaryStyle = {
  background: "#f7f3ef",
  border:
    "1px solid #e6d9cd",
  borderRadius: "11px",
  padding: "13px",
  display: "flex",
  flexDirection:
    "column" as const,
  gap: "9px",
  marginBottom: "20px",
};

const costSummaryLabelStyle = {
  display: "block",
  color: "#716b65",
  fontSize: "11px",
  marginBottom: "2px",
};

const costSummaryValueStyle = {
  color: "#514b46",
  fontSize: "13px",
};

const totalCostBoxStyle = {
  borderTop:
    "1px solid #dfd2c6",
  paddingTop: "10px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
};

const totalCostLabelStyle = {
  color: "#292522",
  fontSize: "13px",
  fontWeight: 700,
};

const totalCostValueStyle = {
  color: "#8a6d4b",
  fontSize: "19px",
};

const additionalCostsHeaderStyle = {
  color: "#514b46",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "13px",
};

const salePriceBoxStyle = {
  background: "#f0f8f2",
  border:
    "1px solid #bdd9c3",
  borderRadius: "10px",
  padding: "12px 13px",
  marginBottom: "17px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  color: "#477451",
  fontSize: "12px",
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
  border:
    "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#716b65",
  borderRadius: "9px",
  padding: "8px 11px",
  cursor: "pointer",
  fontSize: "12px",
};

const refreshButtonStyle = {
  border:
    "1px solid #ddd3c9",
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
  position:
    "relative" as const,
};

const searchIconStyle = {
  position:
    "absolute" as const,
  left: "12px",
  top: "50%",
  transform:
    "translateY(-50%)",
  fontSize: "13px",
  opacity: 0.6,
};

const searchInputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  border:
    "1px solid #ddd3c9",
  borderRadius: "9px",
  padding:
    "11px 12px 11px 34px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "13px",
  outline: "none",
};

const filterSelectStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  border:
    "1px solid #ddd3c9",
  borderRadius: "9px",
  padding: "11px 12px",
  background: "#ffffff",
  color: "#514b46",
  fontSize: "13px",
  outline: "none",
};

const clearFilterButtonStyle = {
  border:
    "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "9px",
  padding: "0 13px",
  cursor: "pointer",
  fontSize: "12px",
  whiteSpace:
    "nowrap" as const,
};

const resultsInfoStyle = {
  color: "#8a837d",
  fontSize: "12px",
  marginBottom: "12px",
};

const errorStyle = {
  background: "#fff1f0",
  border:
    "1px solid #e7b8b3",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "11px",
  marginBottom: "14px",
  fontSize: "13px",
  lineHeight: 1.5,
};

const successStyle = {
  background: "#f0f8f2",
  border:
    "1px solid #bdd9c3",
  color: "#477451",
  borderRadius: "9px",
  padding: "11px",
  marginBottom: "14px",
  fontSize: "13px",
};

const emptyStyle = {
  minHeight: "250px",
  display: "flex",
  flexDirection:
    "column" as const,
  alignItems: "center",
  justifyContent:
    "center",
  textAlign:
    "center" as const,
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
  justifyContent:
    "center",
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
  flexDirection:
    "column" as const,
  gap: "10px",
};

const recipeRowStyle = {
  border:
    "1px solid #eee7e0",
  borderRadius: "13px",
  padding: "15px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap:
    "wrap" as const,
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
  justifyContent:
    "center",
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

const recipeDetailsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "25px",
  flexWrap:
    "wrap" as const,
};

const detailLabelStyle = {
  display: "block",
  color: "#9a928b",
  fontSize: "10px",
  textTransform:
    "uppercase" as const,
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
  border:
    "1px solid #d8c8b8",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};

const deleteButtonStyle = {
  border:
    "1px solid #e3c1bd",
  background: "#fff8f7",
  color: "#a34f46",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};
