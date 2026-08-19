"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type Product = {
  id: string;
  name: string;
  unit: string;
  package_quantity: number;
  package_price: number;
  active: boolean;
};

type Ingredient = {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
};

const money = (value: number) =>
  `${value.toFixed(2).replace(".", ",")} zł`;

const numberText = (value: number) =>
  Number(value.toFixed(2)).toString().replace(".", ",");

function normalizeUnit(unit: string) {
  return unit.trim().toLowerCase().replace(/\s+/g, " ");
}

function toBase(quantity: number, unit: string) {
  const normalized = normalizeUnit(unit);

  if (normalized === "kg") {
    return { quantity: quantity * 1000, unit: "g" };
  }

  if (normalized === "g") {
    return { quantity, unit: "g" };
  }

  if (normalized === "l") {
    return { quantity: quantity * 1000, unit: "ml" };
  }

  if (normalized === "ml") {
    return { quantity, unit: "ml" };
  }

  if (["szt", "szt.", "sztuk"].includes(normalized)) {
    return { quantity, unit: "szt" };
  }

  if (["opak", "opak."].includes(normalized)) {
    return { quantity, unit: "opak." };
  }

  if (["łyżka", "łyżki"].includes(normalized)) {
    return { quantity, unit: "łyżka" };
  }

  if (["łyżeczka", "łyżeczki"].includes(normalized)) {
    return { quantity, unit: "łyżeczka" };
  }

  return null;
}

function ingredientCost(
  ingredient: Ingredient,
  product: Product | undefined
) {
  if (!product || product.package_quantity <= 0) {
    return null;
  }

  const ingredientBase = toBase(
    ingredient.quantity,
    ingredient.unit
  );

  const packageBase = toBase(
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

export default function CakeCalculator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [recipeId, setRecipeId] = useState("");

  const [diameter, setDiameter] = useState("");
  const [height, setHeight] = useState("");
  const [portions, setPortions] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [recipesResult, productsResult] =
        await Promise.all([
          supabase
            .from("recipes")
            .select("*")
            .eq("active", true)
            .order("name", { ascending: true }),

          supabase
            .from("products")
            .select("*")
            .order("name", { ascending: true }),
        ]);

      if (recipesResult.error) {
        setError(
          `Nie udało się pobrać receptur: ${recipesResult.error.message}`
        );
      } else {
        setRecipes(
          (recipesResult.data ?? []) as Recipe[]
        );
      }

      if (productsResult.error) {
        setError(
          `Nie udało się pobrać produktów: ${productsResult.error.message}`
        );
      } else {
        setProducts(
          (productsResult.data ?? []) as Product[]
        );
      }

      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    if (!recipeId) {
      setIngredients([]);
      setDiameter("");
      setHeight("");
      setPortions("");
      return;
    }

    const recipe = recipes.find(
      (item) => item.id === recipeId
    );

    if (recipe) {
      setDiameter(
        recipe.diameter_cm
          ? numberText(recipe.diameter_cm)
          : ""
      );

      setHeight(
        recipe.height_cm
          ? numberText(recipe.height_cm)
          : ""
      );

      setPortions(
        recipe.portions
          ? numberText(recipe.portions)
          : ""
      );
    }

    async function loadIngredients() {
      setLoadingIngredients(true);
      setError("");

      const { data, error: ingredientsError } =
        await supabase
          .from("recipe_ingredients")
          .select("*")
          .eq("recipe_id", recipeId)
          .order("created_at", {
            ascending: true,
          });

      if (ingredientsError) {
        setError(
          `Nie udało się pobrać składników: ${ingredientsError.message}`
        );
        setIngredients([]);
      } else {
        setIngredients(
          (data ?? []) as Ingredient[]
        );
      }

      setLoadingIngredients(false);
    }

    loadIngredients();
  }, [recipeId, recipes]);

  const selectedRecipe = useMemo(
    () =>
      recipes.find(
        (recipe) => recipe.id === recipeId
      ),
    [recipes, recipeId]
  );

  const parsedDiameter = Number(
    diameter.replace(",", ".")
  );

  const parsedHeight = Number(
    height.replace(",", ".")
  );

  const parsedPortions = Number(
    portions.replace(",", ".")
  );

  const factors = useMemo(() => {
    if (!selectedRecipe) {
      return {
        volume: null as number | null,
        portions: null as number | null,
      };
    }

    let volume: number | null = null;
    let portionsFactor: number | null = null;

    if (
      selectedRecipe.diameter_cm &&
      selectedRecipe.height_cm &&
      parsedDiameter > 0 &&
      parsedHeight > 0
    ) {
      const baseVolume =
        Math.PI *
        Math.pow(
          selectedRecipe.diameter_cm / 2,
          2
        ) *
        selectedRecipe.height_cm;

      const targetVolume =
        Math.PI *
        Math.pow(parsedDiameter / 2, 2) *
        parsedHeight;

      volume = targetVolume / baseVolume;
    }

    if (
      selectedRecipe.portions &&
      parsedPortions > 0
    ) {
      portionsFactor =
        parsedPortions /
        selectedRecipe.portions;
    }

    return {
      volume,
      portions: portionsFactor,
    };
  }, [
    selectedRecipe,
    parsedDiameter,
    parsedHeight,
    parsedPortions,
  ]);

  /*
   * Jeżeli użytkownik zwiększy zarówno wymiary,
   * jak i liczbę porcji, kalkulator bierze większy
   * współczynnik, żeby nie zaniżyć ilości składników.
   */
  const scaleFactor = useMemo(() => {
    const validFactors = [
      factors.volume,
      factors.portions,
    ].filter(
      (
        value
      ): value is number =>
        value !== null &&
        Number.isFinite(value) &&
        value > 0
    );

    if (validFactors.length === 0) {
      return 1;
    }

    return Math.max(...validFactors);
  }, [factors]);

  const calculation = useMemo(() => {
    const rows = ingredients.map(
      (ingredient) => {
        const product = products.find(
          (item) =>
            item.id === ingredient.product_id
        );

        const scaledQuantity =
          ingredient.quantity * scaleFactor;

        const baseCost = ingredientCost(
          ingredient,
          product
        );

        const cost =
          baseCost === null
            ? null
            : baseCost * scaleFactor;

        return {
          ingredient,
          product,
          scaledQuantity,
          cost,
        };
      }
    );

    const total = rows.reduce(
      (sum, row) =>
        sum + (row.cost ?? 0),
      0
    );

    const hasUnpriced = rows.some(
      (row) => row.cost === null
    );

    return {
      rows,
      total,
      hasUnpriced,
    };
  }, [
    ingredients,
    products,
    scaleFactor,
  ]);

  const estimatedPortions = useMemo(() => {
    if (
      !selectedRecipe?.portions ||
      !factors.volume
    ) {
      return null;
    }

    return (
      selectedRecipe.portions *
      factors.volume
    );
  }, [
    selectedRecipe,
    factors.volume,
  ]);

  function resetCalculator() {
    setRecipeId("");
    setDiameter("");
    setHeight("");
    setPortions("");
    setIngredients([]);
    setError("");
  }

  if (loading) {
    return (
      <section style={pageStyle}>
        <div style={emptyStyle}>
          Ładowanie kalkulatora...
        </div>
      </section>
    );
  }

  return (
    <section style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            NOWY TORT
          </div>

          <h2 style={titleStyle}>
            Kalkulator tortu
          </h2>

          <p style={subtitleStyle}>
            Wybierz recepturę, ustaw wielkość tortu
            i automatycznie oblicz koszt składników.
          </p>
        </div>

        <button
          type="button"
          onClick={resetCalculator}
          style={resetButtonStyle}
        >
          Wyczyść
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            Parametry tortu
          </h3>

          <p style={cardSubtitleStyle}>
            Dane receptury są pobierane bezpośrednio
            z bazy Supabase.
          </p>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Receptura *
            </span>

            <select
              value={recipeId}
              onChange={(event) =>
                setRecipeId(event.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Wybierz recepturę...
              </option>

              {recipes.map((recipe) => (
                <option
                  key={recipe.id}
                  value={recipe.id}
                >
                  {recipe.name}
                </option>
              ))}
            </select>
          </label>

          {selectedRecipe && (
            <div style={recipeInfoStyle}>
              <strong>
                {selectedRecipe.name}
              </strong>

              {selectedRecipe.description && (
                <span>
                  {selectedRecipe.description}
                </span>
              )}

              <div style={infoGridStyle}>
                <div>
                  <small>Bazowo</small>
                  <strong>
                    {selectedRecipe.portions ??
                      "—"}{" "}
                    porcji
                  </strong>
                </div>

                <div>
                  <small>Średnica</small>
                  <strong>
                    {selectedRecipe.diameter_cm
                      ? `${numberText(
                          selectedRecipe.diameter_cm
                        )} cm`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <small>Wysokość</small>
                  <strong>
                    {selectedRecipe.height_cm
                      ? `${numberText(
                          selectedRecipe.height_cm
                        )} cm`
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div style={twoColumnStyle}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Średnica tortu (cm)
              </span>

              <input
                value={diameter}
                onChange={(event) =>
                  setDiameter(event.target.value)
                }
                inputMode="decimal"
                placeholder="np. 24"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Wysokość tortu (cm)
              </span>

              <input
                value={height}
                onChange={(event) =>
                  setHeight(event.target.value)
                }
                inputMode="decimal"
                placeholder="np. 10"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Liczba porcji
            </span>

            <input
              value={portions}
              onChange={(event) =>
                setPortions(event.target.value)
              }
              inputMode="decimal"
              placeholder="np. 20"
              style={inputStyle}
            />
          </label>

          {selectedRecipe && (
            <div style={factorBoxStyle}>
              <div style={factorRowStyle}>
                <span>
                  Skalowanie wg wymiarów
                </span>

                <strong>
                  {factors.volume
                    ? `${numberText(
                        factors.volume
                      )}×`
                    : "—"}
                </strong>
              </div>

              <div style={factorRowStyle}>
                <span>
                  Skalowanie wg porcji
                </span>

                <strong>
                  {factors.portions
                    ? `${numberText(
                        factors.portions
                      )}×`
                    : "—"}
                </strong>
              </div>

              <div style={finalFactorStyle}>
                <span>
                  Użyty współczynnik
                </span>

                <strong>
                  {numberText(scaleFactor)}×
                </strong>
              </div>
            </div>
          )}

          <div style={hintStyle}>
            Kalkulator bierze większy z dwóch
            współczynników: wynikający z wymiarów
            oraz z liczby porcji. Dzięki temu koszt
            nie zostanie zaniżony przy większym
            torcie lub większej liczbie porcji.
          </div>
        </div>

        <div style={cardStyle}>
          <div style={resultHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                Koszt tortu
              </h3>

              <p style={cardSubtitleStyle}>
                Automatyczne wyliczenie na podstawie
                receptury i bazy produktów.
              </p>
            </div>

            <div style={totalBadgeStyle}>
              {money(calculation.total)}
            </div>
          </div>

          {!recipeId ? (
            <div style={emptyStyle}>
              Wybierz recepturę, aby rozpocząć
              kalkulację.
            </div>
          ) : loadingIngredients ? (
            <div style={emptyStyle}>
              Ładowanie składników...
            </div>
          ) : ingredients.length === 0 ? (
            <div style={emptyStyle}>
              Ta receptura nie ma jeszcze dodanych
              składników.
            </div>
          ) : (
            <>
              <div style={summaryGridStyle}>
                <div style={summaryItemStyle}>
                  <span>Składników</span>
                  <strong>
                    {ingredients.length}
                  </strong>
                </div>

                <div style={summaryItemStyle}>
                  <span>Współczynnik</span>
                  <strong>
                    {numberText(scaleFactor)}×
                  </strong>
                </div>

                <div style={summaryItemStyle}>
                  <span>Koszt / porcja</span>
                  <strong>
                    {parsedPortions > 0
                      ? money(
                          calculation.total /
                            parsedPortions
                        )
                      : "—"}
                  </strong>
                </div>

                <div style={summaryItemStyle}>
                  <span>
                    Szac. porcje z wymiarów
                  </span>

                  <strong>
                    {estimatedPortions
                      ? numberText(
                          estimatedPortions
                        )
                      : "—"}
                  </strong>
                </div>
              </div>

              <div style={tableStyle}>
                <div style={tableHeaderStyle}>
                  <span>Produkt</span>
                  <span>Ilość</span>
                  <span>Koszt</span>
                </div>

                {calculation.rows.map((row) => (
                  <div
                    key={row.ingredient.id}
                    style={rowStyle}
                  >
                    <div>
                      <strong>
                        {row.product?.name ??
                          "Nieznany produkt"}
                      </strong>

                      <small>
                        {row.ingredient.quantity}{" "}
                        {row.ingredient.unit} w bazowej
                        recepturze
                      </small>
                    </div>

                    <strong>
                      {numberText(
                        row.scaledQuantity
                      )}{" "}
                      {row.ingredient.unit}
                    </strong>

                    <strong
                      style={
                        row.cost === null
                          ? warningTextStyle
                          : undefined
                      }
                    >
                      {row.cost === null
                        ? "brak wyceny"
                        : money(row.cost)}
                    </strong>
                  </div>
                ))}
              </div>

              {calculation.hasUnpriced && (
                <div style={warningBoxStyle}>
                  Niektórych składników nie udało się
                  wycenić. Sprawdź, czy jednostka
                  składnika jest zgodna z jednostką
                  opakowania produktu oraz czy produkt
                  ma ilość i cenę opakowania.
                </div>
              )}

              <div style={grandTotalStyle}>
                <div style={grandTotalRowStyle}>
                  <span>
                    Łączny koszt składników
                  </span>

                  <strong>
                    {money(calculation.total)}
                  </strong>
                </div>
              </div>
            </>
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(300px, 380px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
  minWidth: 0,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "20px",
  color: "#292522",
};

const cardSubtitleStyle = {
  margin: "6px 0 20px",
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

const recipeInfoStyle = {
  background: "#faf8f5",
  border: "1px solid #eee7e0",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "16px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, 1fr)",
  gap: "8px",
  marginTop: "7px",
};

const factorBoxStyle = {
  background: "#f7f1ea",
  borderRadius: "12px",
  padding: "13px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "9px",
  marginTop: "2px",
};

const factorRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  fontSize: "12px",
  color: "#716b65",
};

const finalFactorStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  borderTop: "1px solid #e2d5c7",
  paddingTop: "9px",
  color: "#8a6d4b",
};

const hintStyle = {
  marginTop: "14px",
  color: "#817a74",
  fontSize: "11px",
  lineHeight: 1.5,
};

const resultHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
  marginBottom: "20px",
};

const totalBadgeStyle = {
  background: "#8a6d4b",
  color: "#ffffff",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "18px",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const summaryItemStyle = {
  background: "#faf8f5",
  border: "1px solid #eee7e0",
  borderRadius: "11px",
  padding: "12px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
};

const tableStyle = {
  border: "1px solid #eee7e0",
  borderRadius: "12px",
  overflow: "hidden",
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 130px 100px",
  gap: "12px",
  padding: "10px 12px",
  background: "#faf8f5",
  color: "#9a928b",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 130px 100px",
  gap: "12px",
  alignItems: "center",
  padding: "12px",
  borderTop: "1px solid #eee7e0",
  fontSize: "13px",
};

const grandTotalStyle = {
  marginTop: "18px",
  background: "#f7f1ea",
  borderRadius: "13px",
  padding: "16px",
};

const grandTotalRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  color: "#514b46",
};

const warningBoxStyle = {
  marginTop: "14px",
  background: "#fff8ec",
  border: "1px solid #ead6ad",
  color: "#876a36",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
  lineHeight: 1.5,
};

const warningTextStyle = {
  color: "#a6782f",
};

const emptyStyle = {
  minHeight: "220px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  color: "#716b65",
  padding: "20px",
  boxSizing: "border-box" as const,
};

const resetButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "9px",
  padding: "9px 13px",
  cursor: "pointer",
  fontSize: "12px",
};
