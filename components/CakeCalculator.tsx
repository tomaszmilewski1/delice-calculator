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

type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string;
  quantity: number;
  unit: string;
};

type IngredientWithProduct = RecipeIngredient & {
  product: Product;
};

export default function CakeCalculator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<
    IngredientWithProduct[]
  >([]);

  const [recipeId, setRecipeId] = useState("");
  const [diameter, setDiameter] = useState("");
  const [height, setHeight] = useState("");
  const [portions, setPortions] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      { data: recipesData, error: recipesError },
      { data: productsData, error: productsError },
    ] = await Promise.all([
      supabase
        .from("recipes")
        .select(
          "id, name, description, category, portions, diameter_cm, height_cm, active"
        )
        .eq("active", true)
        .order("name", { ascending: true }),

      supabase
        .from("products")
        .select(
          "id, name, unit, package_quantity, package_price, active"
        )
        .eq("active", true)
        .order("name", { ascending: true }),
    ]);

    if (recipesError) {
      setError(
        `Nie udało się pobrać receptur: ${recipesError.message}`
      );
      setLoading(false);
      return;
    }

    if (productsError) {
      setError(
        `Nie udało się pobrać produktów: ${productsError.message}`
      );
      setLoading(false);
      return;
    }

    setRecipes((recipesData ?? []) as Recipe[]);
    setProducts((productsData ?? []) as Product[]);

    setLoading(false);
  }

  async function loadIngredients(
    selectedRecipeId: string
  ) {
    if (!selectedRecipeId) {
      setIngredients([]);
      return;
    }

    setLoadingIngredients(true);
    setError("");

    const { data, error: ingredientsError } =
      await supabase
        .from("recipe_ingredients")
        .select(
          "id, recipe_id, product_id, quantity, unit"
        )
        .eq("recipe_id", selectedRecipeId)
        .order("id", { ascending: true });

    if (ingredientsError) {
      setError(
        `Nie udało się pobrać składników receptury: ${ingredientsError.message}`
      );
      setIngredients([]);
      setLoadingIngredients(false);
      return;
    }

    const ingredientRows =
      (data ?? []) as RecipeIngredient[];

    const combined = ingredientRows
      .map((ingredient) => {
        const product = products.find(
          (item) => item.id === ingredient.product_id
        );

        if (!product) {
          return null;
        }

        return {
          ...ingredient,
          product,
        };
      })
      .filter(
        (
          item
        ): item is IngredientWithProduct =>
          item !== null
      );

    setIngredients(combined);
    setLoadingIngredients(false);
  }

  function handleRecipeChange(value: string) {
    setRecipeId(value);

    const selectedRecipe = recipes.find(
      (recipe) => recipe.id === value
    );

    if (!selectedRecipe) {
      setDiameter("");
      setHeight("");
      setPortions("");
      setIngredients([]);
      return;
    }

    if (
      selectedRecipe.diameter_cm !== null &&
      selectedRecipe.diameter_cm !== undefined
    ) {
      setDiameter(
        String(selectedRecipe.diameter_cm).replace(
          ".",
          ","
        )
      );
    } else {
      setDiameter("");
    }

    if (
      selectedRecipe.height_cm !== null &&
      selectedRecipe.height_cm !== undefined
    ) {
      setHeight(
        String(selectedRecipe.height_cm).replace(
          ".",
          ","
        )
      );
    } else {
      setHeight("");
    }

    if (
      selectedRecipe.portions !== null &&
      selectedRecipe.portions !== undefined
    ) {
      setPortions(
        String(selectedRecipe.portions).replace(
          ".",
          ","
        )
      );
    } else {
      setPortions("");
    }

    loadIngredients(value);
  }

  const selectedRecipe = recipes.find(
    (recipe) => recipe.id === recipeId
  );

  const baseDiameter =
    selectedRecipe?.diameter_cm ?? null;

  const baseHeight =
    selectedRecipe?.height_cm ?? null;

  const basePortions =
    selectedRecipe?.portions ?? null;

  const currentDiameter = Number(
    diameter.replace(",", ".")
  );

  const currentHeight = Number(
    height.replace(",", ".")
  );

  const currentPortions = Number(
    portions.replace(",", ".")
  );

  const diameterScale =
    baseDiameter &&
    baseDiameter > 0 &&
    currentDiameter > 0
      ? Math.pow(
          currentDiameter / baseDiameter,
          2
        )
      : 1;

  const heightScale =
    baseHeight &&
    baseHeight > 0 &&
    currentHeight > 0
      ? currentHeight / baseHeight
      : 1;

  const portionScale =
    basePortions &&
    basePortions > 0 &&
    currentPortions > 0
      ? currentPortions / basePortions
      : 1;

  /*
   * Skala końcowa:
   * - średnica wpływa powierzchnią
   * - wysokość wpływa liniowo
   * - porcje dodatkowo pozwalają ręcznie zwiększyć/zmniejszyć
   *   recepturę
   */
  const scale =
    diameterScale *
    heightScale *
    portionScale;

  /*
   * Przeliczanie jednostek.
   *
   * Dzięki temu:
   * 500 g mąki z opakowania 1 kg
   * = 500 / 1000 * cena opakowania
   * = 2,50 zł przy cenie 5 zł/kg.
   *
   * Obsługujemy:
   * g / kg
   * ml / l
   * szt
   */
  function unitToBase(
    value: number,
    unit: string
  ): number {
    const normalized = unit
      .trim()
      .toLowerCase()
      .replace(" ", "");

    switch (normalized) {
      case "kg":
      case "kilogram":
      case "kilogramy":
      case "kilogramów":
        return value * 1000;

      case "g":
      case "gram":
      case "gramy":
      case "gramów":
        return value;

      case "l":
      case "litry":
      case "litr":
      case "litrów":
        return value * 1000;

      case "ml":
      case "mililitr":
      case "mililitry":
      case "mililitrów":
        return value;

      case "szt":
      case "szt.":
      case "sztuka":
      case "sztuki":
      case "sztuk":
        return value;

      default:
        return value;
    }
  }

  function calculateCost(
    quantity: number,
    quantityUnit: string,
    packageQuantity: number,
    packageUnit: string,
    packagePrice: number
  ) {
    if (
      quantity <= 0 ||
      packageQuantity <= 0 ||
      packagePrice < 0
    ) {
      return 0;
    }

    const quantityUnitNormalized = quantityUnit
      .trim()
      .toLowerCase()
      .replace(" ", "");

    const packageUnitNormalized = packageUnit
      .trim()
      .toLowerCase()
      .replace(" ", "");

    /*
     * sztuki liczymy bezpośrednio.
     */
    const quantityIsPieces =
      quantityUnitNormalized === "szt" ||
      quantityUnitNormalized === "szt." ||
      quantityUnitNormalized === "sztuka" ||
      quantityUnitNormalized === "sztuki" ||
      quantityUnitNormalized === "sztuk";

    const packageIsPieces =
      packageUnitNormalized === "szt" ||
      packageUnitNormalized === "szt." ||
      packageUnitNormalized === "sztuka" ||
      packageUnitNormalized === "sztuki" ||
      packageUnitNormalized === "sztuk";

    if (
      quantityIsPieces &&
      packageIsPieces
    ) {
      return (
        (quantity / packageQuantity) *
        packagePrice
      );
    }

    /*
     * Jeżeli obie jednostki są wagowe,
     * przeliczamy wszystko na gramy.
     */
    const weightUnits = [
      "g",
      "gram",
      "gramy",
      "gramów",
      "kg",
      "kilogram",
      "kilogramy",
      "kilogramów",
    ];

    const quantityIsWeight =
      weightUnits.includes(
        quantityUnitNormalized
      );

    const packageIsWeight =
      weightUnits.includes(
        packageUnitNormalized
      );

    if (
      quantityIsWeight &&
      packageIsWeight
    ) {
      const quantityInGrams =
        unitToBase(
          quantity,
          quantityUnit
        );

      const packageInGrams =
        unitToBase(
          packageQuantity,
          packageUnit
        );

      if (packageInGrams <= 0) {
        return 0;
      }

      return (
        (quantityInGrams /
          packageInGrams) *
        packagePrice
      );
    }

    /*
     * Jeżeli obie jednostki są objętościowe,
     * przeliczamy wszystko na ml.
     */
    const volumeUnits = [
      "ml",
      "mililitr",
      "mililitry",
      "mililitrów",
      "l",
      "litr",
      "litry",
      "litrów",
    ];

    const quantityIsVolume =
      volumeUnits.includes(
        quantityUnitNormalized
      );

    const packageIsVolume =
      volumeUnits.includes(
        packageUnitNormalized
      );

    if (
      quantityIsVolume &&
      packageIsVolume
    ) {
      const quantityInMl =
        unitToBase(
          quantity,
          quantityUnit
        );

      const packageInMl =
        unitToBase(
          packageQuantity,
          packageUnit
        );

      if (packageInMl <= 0) {
        return 0;
      }

      return (
        (quantityInMl /
          packageInMl) *
        packagePrice
      );
    }

    /*
     * Awaryjnie, jeżeli jednostki są takie same.
     */
    if (
      quantityUnitNormalized ===
      packageUnitNormalized
    ) {
      return (
        (quantity / packageQuantity) *
        packagePrice
      );
    }

    /*
     * Ostateczny fallback dla nieznanych jednostek.
     */
    return (
      (quantity / packageQuantity) *
      packagePrice
    );
  }

  const calculatedIngredients =
    useMemo(() => {
      return ingredients.map((ingredient) => {
        const quantity =
          Number(ingredient.quantity) || 0;

        const scaledQuantity =
          quantity * scale;

        const packageQuantity =
          Number(
            ingredient.product
              .package_quantity
          ) || 0;

        const packagePrice =
          Number(
            ingredient.product
              .package_price
          ) || 0;

        const cost = calculateCost(
          scaledQuantity,
          ingredient.unit,
          packageQuantity,
          ingredient.product.unit,
          packagePrice
        );

        return {
          ...ingredient,
          scaledQuantity,
          cost,
        };
      });
    }, [ingredients, scale]);

  const ingredientsCost =
    calculatedIngredients.reduce(
      (sum, ingredient) =>
        sum + ingredient.cost,
      0
    );

  const totalCost = ingredientsCost;

  const costPerPortion =
    currentPortions > 0
      ? totalCost / currentPortions
      : 0;

  function formatNumber(value: number) {
    return value
      .toFixed(2)
      .replace(".", ",");
  }

  function formatMoney(value: number) {
    return `${formatNumber(value)} zł`;
  }

  if (loading) {
    return (
      <section style={pageStyle}>
        <div style={loadingStyle}>
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
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={mainGridStyle}>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>
            Parametry tortu
          </h3>

          <p style={cardSubtitleStyle}>
            Dane możesz zmienić w dowolnym
            momencie.
          </p>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Receptura
            </span>

            <select
              value={recipeId}
              onChange={(event) =>
                handleRecipeChange(
                  event.target.value
                )
              }
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

          <div style={threeColumnStyle}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Średnica
              </span>

              <div
                style={
                  inputWithSuffixStyle
                }
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={diameter}
                  onChange={(event) =>
                    setDiameter(
                      event.target.value
                    )
                  }
                  placeholder="np. 20"
                  style={inputStyle}
                />

                <span style={suffixStyle}>
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
                  inputWithSuffixStyle
                }
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={height}
                  onChange={(event) =>
                    setHeight(
                      event.target.value
                    )
                  }
                  placeholder="np. 10"
                  style={inputStyle}
                />

                <span style={suffixStyle}>
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
                inputMode="numeric"
                value={portions}
                onChange={(event) =>
                  setPortions(
                    event.target.value
                  )
                }
                placeholder="np. 12"
                style={inputStyle}
              />
            </label>
          </div>

          {selectedRecipe && (
            <div style={infoBoxStyle}>
              <strong>
                {selectedRecipe.name}
              </strong>

              {selectedRecipe.description && (
                <p style={infoTextStyle}>
                  {
                    selectedRecipe.description
                  }
                </p>
              )}

              <div style={baseInfoStyle}>
                Bazowa receptura:{" "}
                {baseDiameter
                  ? `${formatNumber(
                      baseDiameter
                    )} cm`
                  : "—"}{" "}
                ×{" "}
                {baseHeight
                  ? `${formatNumber(
                      baseHeight
                    )} cm`
                  : "—"}{" "}
                {basePortions
                  ? `• ${formatNumber(
                      basePortions
                    )} porcji`
                  : ""}
              </div>
            </div>
          )}
        </div>

        <div style={resultCardStyle}>
          <div style={resultHeaderStyle}>
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

            <div style={totalCostStyle}>
              {formatMoney(totalCost)}
            </div>
          </div>

          {loadingIngredients ? (
            <div style={loadingStyle}>
              Ładowanie składników...
            </div>
          ) : !recipeId ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                T
              </div>

              <strong>
                Wybierz recepturę
              </strong>

              <p style={emptyTextStyle}>
                Po wybraniu receptury
                zobaczysz wszystkie składniki
                i ich koszt.
              </p>
            </div>
          ) : ingredients.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                !
              </div>

              <strong>
                Brak składników
              </strong>

              <p style={emptyTextStyle}>
                Ta receptura nie ma jeszcze
                przypisanych produktów.
              </p>
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
                      <div>
                        <div
                          style={
                            ingredientNameStyle
                          }
                        >
                          {
                            ingredient.product
                              .name
                          }
                        </div>

                        <div
                          style={
                            ingredientMetaStyle
                          }
                        >
                          Receptura:{" "}
                          {formatNumber(
                            Number(
                              ingredient.quantity
                            )
                          )}{" "}
                          {ingredient.unit}
                        </div>

                        <div
                          style={
                            packageInfoStyle
                          }
                        >
                          Opakowanie:{" "}
                          {formatNumber(
                            Number(
                              ingredient
                                .product
                                .package_quantity
                            )
                          )}{" "}
                          {
                            ingredient.product
                              .unit
                          }{" "}
                          •{" "}
                          {formatMoney(
                            Number(
                              ingredient
                                .product
                                .package_price
                            )
                          )}
                        </div>
                      </div>

                      <div
                        style={
                          ingredientRightStyle
                        }
                      >
                        <div
                          style={
                            quantityStyle
                          }
                        >
                          {formatNumber(
                            ingredient.scaledQuantity
                          )}{" "}
                          {ingredient.unit}
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
                      ingredientsCost
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
                    {currentPortions > 0
                      ? formatNumber(
                          currentPortions
                        )
                      : "—"}
                  </strong>
                </div>

                <div
                  style={{
                    ...summaryRowStyle,
                    ...summaryTotalStyle,
                  }}
                >
                  <span>
                    Koszt 1 porcji
                  </span>

                  <strong>
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

      <div style={formulaCardStyle}>
        <h3 style={formulaTitleStyle}>
          Jak liczony jest koszt?
        </h3>

        <p style={formulaTextStyle}>
          Każdy składnik jest przeliczany na
          podstawie ilości potrzebnej do
          przygotowania tortu oraz ceny
          opakowania produktu.
        </p>

        <div style={formulaBoxStyle}>
          <strong>
            Koszt składnika =
          </strong>{" "}
          ilość potrzebna w jednostkach
          produktu ÷ ilość w opakowaniu ×
          cena opakowania
        </div>

        <p style={formulaTextStyle}>
          Kalkulator automatycznie przelicza
          jednostki, np. 1 kg = 1000 g oraz
          1 l = 1000 ml.
        </p>

        <p style={formulaTextStyle}>
          Wielkość tortu jest skalowana względem
          średnicy, wysokości i liczby porcji
          zapisanych w bazowej recepturze.
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
    "minmax(320px, 420px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const resultCardStyle = {
  ...cardStyle,
  minWidth: 0,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "20px",
  color: "#292522",
};

const cardSubtitleStyle = {
  margin: "6px 0 22px",
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
  position: "relative" as const,
};

const suffixStyle = {
  position: "absolute" as const,
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9a928b",
  fontSize: "12px",
  pointerEvents: "none" as const,
};

const infoBoxStyle = {
  marginTop: "6px",
  background: "#fcfaf7",
  border: "1px solid #eee7e0",
  borderRadius: "11px",
  padding: "14px",
  color: "#514b46",
  fontSize: "13px",
};

const infoTextStyle = {
  margin: "7px 0 0",
  color: "#716b65",
  lineHeight: 1.5,
};

const baseInfoStyle = {
  marginTop: "9px",
  color: "#8a837d",
  fontSize: "12px",
};

const resultHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "20px",
};

const totalCostStyle = {
  color: "#477451",
  fontSize: "25px",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
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

const ingredientNameStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#292522",
};

const ingredientMetaStyle = {
  marginTop: "4px",
  color: "#8a837d",
  fontSize: "12px",
};

const packageInfoStyle = {
  marginTop: "3px",
  color: "#aaa19a",
  fontSize: "11px",
};

const ingredientRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  flexShrink: 0,
};

const quantityStyle = {
  color: "#716b65",
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
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

const summaryTotalStyle = {
  marginTop: "6px",
  paddingTop: "12px",
  borderTop: "1px solid #eee7e0",
  color: "#477451",
  fontSize: "15px",
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
  maxWidth: "360px",
  lineHeight: 1.5,
};

const loadingStyle = {
  minHeight: "120px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#8a837d",
  fontSize: "13px",
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

const formulaCardStyle = {
  marginTop: "20px",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
};

const formulaTitleStyle = {
  margin: 0,
  fontSize: "17px",
  color: "#292522",
};

const formulaTextStyle = {
  color: "#716b65",
  fontSize: "13px",
  lineHeight: 1.6,
};

const formulaBoxStyle = {
  background: "#fcfaf7",
  border: "1px solid #eee7e0",
  borderRadius: "10px",
  padding: "13px",
  color: "#514b46",
  fontSize: "13px",
  margin: "14px 0",
};
