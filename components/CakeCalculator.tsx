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

type CalculatedIngredient = {
  id: string;
  name: string;
  originalQuantity: number;
  calculatedQuantity: number;
  unit: string;
  cost: number;
};

function normalizeUnit(unit: string) {
  return unit
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ąćęłńóśźż]/g, (letter) => {
      const map: Record<string, string> = {
        ą: "a",
        ć: "c",
        ę: "e",
        ł: "l",
        ń: "n",
        ó: "o",
        ś: "s",
        ź: "z",
        ż: "z",
      };

      return map[letter] ?? letter;
    });
}

function calculateCost(
  quantity: number,
  quantityUnit: string,
  packageQuantity: number,
  packageUnit: string,
  packagePrice: number
) {
  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(packageQuantity) ||
    !Number.isFinite(packagePrice) ||
    quantity <= 0 ||
    packageQuantity <= 0 ||
    packagePrice < 0
  ) {
    return 0;
  }

  const quantityUnitNormalized = normalizeUnit(quantityUnit);
  const packageUnitNormalized = normalizeUnit(packageUnit);

  const pieceUnits = [
    "szt",
    "sztuka",
    "sztuki",
    "sztuk",
  ];

  const weightUnits = [
    "g",
    "gram",
    "gramy",
    "gramow",
    "kg",
    "kilogram",
    "kilogramy",
    "kilogramow",
  ];

  const volumeUnits = [
    "ml",
    "mililitr",
    "mililitry",
    "mililitrow",
    "l",
    "litr",
    "litry",
    "litrow",
  ];

  const quantityIsPieces =
    pieceUnits.includes(quantityUnitNormalized);

  const packageIsPieces =
    pieceUnits.includes(packageUnitNormalized);

  if (quantityIsPieces && packageIsPieces) {
    return (
      (quantity / packageQuantity) *
      packagePrice
    );
  }

  const quantityIsWeight =
    weightUnits.includes(quantityUnitNormalized);

  const packageIsWeight =
    weightUnits.includes(packageUnitNormalized);

  if (quantityIsWeight && packageIsWeight) {
    let quantityInGrams = quantity;
    let packageInGrams = packageQuantity;

    if (
      quantityUnitNormalized === "kg" ||
      quantityUnitNormalized === "kilogram" ||
      quantityUnitNormalized === "kilogramy" ||
      quantityUnitNormalized === "kilogramow"
    ) {
      quantityInGrams *= 1000;
    }

    if (
      packageUnitNormalized === "kg" ||
      packageUnitNormalized === "kilogram" ||
      packageUnitNormalized === "kilogramy" ||
      packageUnitNormalized === "kilogramow"
    ) {
      packageInGrams *= 1000;
    }

    return (
      (quantityInGrams / packageInGrams) *
      packagePrice
    );
  }

  const quantityIsVolume =
    volumeUnits.includes(quantityUnitNormalized);

  const packageIsVolume =
    volumeUnits.includes(packageUnitNormalized);

  if (quantityIsVolume && packageIsVolume) {
    let quantityInMl = quantity;
    let packageInMl = packageQuantity;

    if (
      quantityUnitNormalized === "l" ||
      quantityUnitNormalized === "litr" ||
      quantityUnitNormalized === "litry" ||
      quantityUnitNormalized === "litrow"
    ) {
      quantityInMl *= 1000;
    }

    if (
      packageUnitNormalized === "l" ||
      packageUnitNormalized === "litr" ||
      packageUnitNormalized === "litry" ||
      packageUnitNormalized === "litrow"
    ) {
      packageInMl *= 1000;
    }

    return (
      (quantityInMl / packageInMl) *
      packagePrice
    );
  }

  if (
    quantityUnitNormalized ===
    packageUnitNormalized
  ) {
    return (
      (quantity / packageQuantity) *
      packagePrice
    );
  }

  return 0;
}

function formatNumber(value: number) {
  return value
    .toFixed(2)
    .replace(".", ",");
}

function formatMoney(value: number) {
  return `${value
    .toFixed(2)
    .replace(".", ",")} zł`;
}

export default function CakeCalculator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<
    RecipeIngredient[]
  >([]);

  const [selectedRecipeId, setSelectedRecipeId] =
    useState("");

  const [diameter, setDiameter] = useState("");
  const [height, setHeight] = useState("");
  const [portions, setPortions] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      recipesResult,
      productsResult,
      ingredientsResult,
    ] = await Promise.all([
      supabase
        .from("recipes")
        .select("*")
        .eq("active", true)
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("recipe_ingredients")
        .select("*")
        .order("created_at", {
          ascending: true,
        }),
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

    const loadedRecipes =
      (recipesResult.data ?? []) as Recipe[];

    setRecipes(loadedRecipes);
    setProducts(
      (productsResult.data ?? []) as Product[]
    );
    setIngredients(
      (ingredientsResult.data ??
        []) as RecipeIngredient[]
    );

    if (loadedRecipes.length > 0) {
      const firstRecipe = loadedRecipes[0];

      setSelectedRecipeId(firstRecipe.id);

      setDiameter(
        firstRecipe.diameter_cm !== null
          ? String(firstRecipe.diameter_cm)
          : ""
      );

      setHeight(
        firstRecipe.height_cm !== null
          ? String(firstRecipe.height_cm)
          : ""
      );

      setPortions(
        firstRecipe.portions !== null
          ? String(firstRecipe.portions)
          : ""
      );
    }

    setLoading(false);
  }

  const selectedRecipe = useMemo(() => {
    return (
      recipes.find(
        (recipe) =>
          recipe.id === selectedRecipeId
      ) ?? null
    );
  }, [recipes, selectedRecipeId]);

  const selectedIngredients = useMemo(() => {
    return ingredients.filter(
      (ingredient) =>
        ingredient.recipe_id ===
        selectedRecipeId
    );
  }, [ingredients, selectedRecipeId]);

  function changeRecipe(recipeId: string) {
    const recipe = recipes.find(
      (item) => item.id === recipeId
    );

    if (!recipe) {
      return;
    }

    setSelectedRecipeId(recipeId);

    setDiameter(
      recipe.diameter_cm !== null
        ? String(recipe.diameter_cm)
        : ""
    );

    setHeight(
      recipe.height_cm !== null
        ? String(recipe.height_cm)
        : ""
    );

    setPortions(
      recipe.portions !== null
        ? String(recipe.portions)
        : ""
    );

    setError("");
  }

  const calculatedIngredients =
    useMemo<CalculatedIngredient[]>(() => {
      if (!selectedRecipe) {
        return [];
      }

      const baseDiameter =
        Number(selectedRecipe.diameter_cm);

      const baseHeight =
        Number(selectedRecipe.height_cm);

      const basePortions =
        Number(selectedRecipe.portions);

      const currentDiameter =
        Number(
          diameter.replace(",", ".")
        );

      const currentHeight =
        Number(
          height.replace(",", ".")
        );

      const currentPortions =
        Number(
          portions.replace(",", ".")
        );

      /*
       * Każdy wymiar traktujemy jako niezależny
       * parametr skalowania.
       *
       * Średnica:
       * pole przekroju rośnie według kwadratu
       *
       * Wysokość:
       * liniowo
       *
       * Porcje:
       * liniowo
       *
       * Jeżeli wszystkie trzy parametry są
       * ustawione, najpierw liczymy zmianę
       * wielkości tortu z wymiarów, a następnie
       * uwzględniamy zmianę liczby porcji.
       */

      let scale = 1;

      if (
        Number.isFinite(baseDiameter) &&
        baseDiameter > 0 &&
        Number.isFinite(currentDiameter) &&
        currentDiameter > 0
      ) {
        scale *=
          Math.pow(
            currentDiameter /
              baseDiameter,
            2
          );
      }

      if (
        Number.isFinite(baseHeight) &&
        baseHeight > 0 &&
        Number.isFinite(currentHeight) &&
        currentHeight > 0
      ) {
        scale *=
          currentHeight /
          baseHeight;
      }

      /*
       * Liczba porcji jest dodatkowym parametrem.
       * Jeżeli zmieniono porcje względem receptury,
       * skaluje ilość proporcjonalnie.
       */
      if (
        Number.isFinite(basePortions) &&
        basePortions > 0 &&
        Number.isFinite(currentPortions) &&
        currentPortions > 0
      ) {
        scale *=
          currentPortions /
          basePortions;
      }

      return selectedIngredients.map(
        (ingredient) => {
          const product = products.find(
            (item) =>
              item.id ===
              ingredient.product_id
          );

          if (!product) {
            return {
              id: ingredient.id,
              name: "Nieznany produkt",
              originalQuantity:
                Number(ingredient.quantity),
              calculatedQuantity:
                Number(ingredient.quantity) *
                scale,
              unit: ingredient.unit,
              cost: 0,
            };
          }

          const originalQuantity =
            Number(ingredient.quantity);

          const calculatedQuantity =
            originalQuantity * scale;

          const cost = calculateCost(
            calculatedQuantity,
            ingredient.unit,
            Number(
              product.package_quantity
            ),
            product.unit,
            Number(product.package_price)
          );

          return {
            id: ingredient.id,
            name: product.name,
            originalQuantity,
            calculatedQuantity,
            unit: ingredient.unit,
            cost,
          };
        }
      );
    }, [
      selectedRecipe,
      selectedIngredients,
      products,
      diameter,
      height,
      portions,
    ]);

  const totalCost = useMemo(() => {
    return calculatedIngredients.reduce(
      (sum, ingredient) =>
        sum + ingredient.cost,
      0
    );
  }, [calculatedIngredients]);

  const currentPortions = Number(
    portions.replace(",", ".")
  );

  const costPerPortion =
    Number.isFinite(currentPortions) &&
    currentPortions > 0
      ? totalCost / currentPortions
      : 0;

  return (
    <section style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            KALKULATOR TORTU
          </div>

          <h2 style={titleStyle}>
            Kalkulator kosztu tortu
          </h2>

          <p style={subtitleStyle}>
            Wybierz recepturę, podaj rozmiar
            tortu i otrzymaj automatyczne
            wyliczenie kosztu.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={refreshButtonStyle}
        >
          {loading
            ? "Ładowanie..."
            : "Odśwież"}
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={mainGridStyle}>
        <div style={parametersCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                Parametry tortu
              </h3>

              <p style={cardSubtitleStyle}>
                Dane możesz zmienić w dowolnym
                momencie.
              </p>
            </div>
          </div>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Receptura
            </span>

            <select
              value={selectedRecipeId}
              onChange={(event) =>
                changeRecipe(
                  event.target.value
                )
              }
              disabled={loading}
              style={inputStyle}
            >
              <option value="">
                Wybierz recepturę
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
            <>
              <div style={threeColumnStyle}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Średnica
                  </span>

                  <div style={inputWithSuffixStyle}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={diameter}
                      onChange={(event) =>
                        setDiameter(
                          event.target.value
                        )
                      }
                      style={suffixInputStyle}
                    />

                    <span
                      style={
                        inputSuffixStyle
                      }
                    >
                      cm
                    </span>
                  </div>
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Wysokość
                  </span>

                  <div style={inputWithSuffixStyle}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={height}
                      onChange={(event) =>
                        setHeight(
                          event.target.value
                        )
                      }
                      style={suffixInputStyle}
                    />

                    <span
                      style={
                        inputSuffixStyle
                      }
                    >
                      cm
                    </span>
                  </div>
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>
                    Porcje
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={portions}
                    onChange={(event) =>
                      setPortions(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={recipeInfoBoxStyle}>
                <strong>
                  {selectedRecipe.name}
                </strong>

                {selectedRecipe.description && (
                  <div style={descriptionStyle}>
                    {
                      selectedRecipe.description
                    }
                  </div>
                )}

                <div style={baseRecipeStyle}>
                  Bazowa receptura:{" "}
                  {selectedRecipe.diameter_cm !==
                  null
                    ? `${formatNumber(
                        Number(
                          selectedRecipe.diameter_cm
                        )
                      )} cm`
                    : "—"}

                  {" × "}

                  {selectedRecipe.height_cm !==
                  null
                    ? `${formatNumber(
                        Number(
                          selectedRecipe.height_cm
                        )
                      )} cm`
                    : "—"}

                  {" • "}

                  {selectedRecipe.portions !==
                  null
                    ? `${formatNumber(
                        Number(
                          selectedRecipe.portions
                        )
                      )} porcji`
                    : "brak danych"}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={resultCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                Koszt tortu
              </h3>

              <p style={cardSubtitleStyle}>
                Automatycznie przeliczony na
                podstawie receptury i cen
                produktów.
              </p>
            </div>

            <div style={totalBadgeStyle}>
              {formatMoney(totalCost)}
            </div>
          </div>

          {!selectedRecipe ? (
            <div style={emptyStyle}>
              Wybierz recepturę, aby zobaczyć
              koszt tortu.
            </div>
          ) : calculatedIngredients.length ===
            0 ? (
            <div style={emptyStyle}>
              Ta receptura nie ma jeszcze
              składników.
            </div>
          ) : (
            <>
              <div style={ingredientsListStyle}>
                {calculatedIngredients.map(
                  (ingredient) => (
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
                          {ingredient.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div
                            style={
                              ingredientNameStyle
                            }
                          >
                            {ingredient.name}
                          </div>

                          <div
                            style={
                              ingredientMetaStyle
                            }
                          >
                            Receptura:{" "}
                            {formatNumber(
                              ingredient.originalQuantity
                            )}{" "}
                            {
                              ingredient.unit
                            }
                          </div>

                          <div
                            style={
                              calculatedQuantityStyle
                            }
                          >
                            {formatNumber(
                              ingredient.calculatedQuantity
                            )}{" "}
                            {
                              ingredient.unit
                            }
                          </div>
                        </div>
                      </div>

                      <strong
                        style={
                          ingredientCostStyle
                        }
                      >
                        {formatMoney(
                          ingredient.cost
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>

              <div style={summaryStyle}>
                <div
                  style={summaryRowStyle}
                >
                  <span>
                    Koszt składników
                  </span>

                  <strong>
                    {formatMoney(
                      totalCost
                    )}
                  </strong>
                </div>

                <div
                  style={summaryRowStyle}
                >
                  <span>
                    Liczba porcji
                  </span>

                  <strong>
                    {Number.isFinite(
                      currentPortions
                    ) &&
                    currentPortions > 0
                      ? formatNumber(
                          currentPortions
                        )
                      : "—"}
                  </strong>
                </div>

                <div
                  style={{
                    ...summaryRowStyle,
                    ...finalSummaryRowStyle,
                  }}
                >
                  <span>
                    Koszt 1 porcji
                  </span>

                  <strong
                    style={
                      finalValueStyle
                    }
                  >
                    {formatMoney(
                      costPerPortion
                    )}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={infoCardStyle}>
        <h3 style={infoTitleStyle}>
          Jak liczony jest koszt?
        </h3>

        <p style={infoTextStyle}>
          Każdy składnik jest przeliczany na
          podstawie ilości potrzebnej do
          przygotowania tortu oraz ceny
          opakowania produktu.
        </p>

        <div style={formulaStyle}>
          <strong>
            Koszt składnika =
          </strong>{" "}
          ilość potrzebna ÷ ilość w opakowaniu
          × cena opakowania
        </div>

        <p style={infoTextStyle}>
          Wielkość tortu jest skalowana
          względem średnicy, wysokości oraz
          liczby porcji zapisanych w bazowej
          recepturze.
        </p>
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

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(300px, 430px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
};

const parametersCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const resultCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
  minWidth: 0,
};

const infoCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  marginTop: "20px",
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

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr 1fr",
  gap: "10px",
};

const inputWithSuffixStyle = {
  display: "flex",
  alignItems: "stretch",
};

const suffixInputStyle = {
  ...inputStyle,
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
};

const inputSuffixStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
  border: "1px solid #ddd3c9",
  borderLeft: "none",
  borderRadius:
    "0 9px 9px 0",
  background: "#f8f5f2",
  color: "#8a837d",
  fontSize: "12px",
};

const recipeInfoBoxStyle = {
  marginTop: "4px",
  padding: "14px",
  borderRadius: "11px",
  background: "#fcfaf7",
  border: "1px solid #eee7e0",
  color: "#514b46",
  fontSize: "13px",
};

const descriptionStyle = {
  marginTop: "5px",
  color: "#8a837d",
  fontSize: "12px",
};

const baseRecipeStyle = {
  marginTop: "9px",
  color: "#8a6d4b",
  fontSize: "12px",
};

const totalBadgeStyle = {
  background: "#f0f8f2",
  color: "#477451",
  border: "1px solid #bdd9c3",
  borderRadius: "11px",
  padding: "10px 13px",
  fontSize: "17px",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

const refreshButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "9px",
  padding: "9px 13px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};

const errorStyle = {
  background: "#fff1f0",
  border: "1px solid #e7b8b3",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "11px",
  marginBottom: "18px",
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
  padding: "12px",
};

const ingredientMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  minWidth: 0,
};

const ingredientIconStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
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
  fontWeight: 700,
  color: "#292522",
};

const ingredientMetaStyle = {
  marginTop: "3px",
  color: "#8a837d",
  fontSize: "11px",
};

const calculatedQuantityStyle = {
  marginTop: "3px",
  color: "#477451",
  fontSize: "13px",
  fontWeight: 600,
};

const ingredientCostStyle = {
  color: "#477451",
  fontSize: "15px",
  whiteSpace: "nowrap" as const,
};

const summaryStyle = {
  marginTop: "18px",
  paddingTop: "16px",
  borderTop: "1px solid #eee7e0",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  padding: "7px 0",
  color: "#514b46",
  fontSize: "13px",
};

const finalSummaryRowStyle = {
  marginTop: "6px",
  paddingTop: "13px",
  borderTop: "1px solid #eee7e0",
  fontSize: "15px",
  fontWeight: 700,
};

const finalValueStyle = {
  color: "#477451",
  fontSize: "20px",
};

const calculatedQuantityHintStyle = {
  color: "#8a837d",
};

const emptyStyle = {
  minHeight: "220px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  color: "#8a837d",
  fontSize: "13px",
};

const infoTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "16px",
};

const infoTextStyle = {
  margin: "8px 0 0",
  color: "#716b65",
  fontSize: "13px",
  lineHeight: 1.6,
};

const formulaStyle = {
  marginTop: "13px",
  padding: "13px",
  borderRadius: "10px",
  background: "#f8f5f2",
  color: "#514b46",
  fontSize: "13px",
};

void calculatedQuantityHintStyle;
