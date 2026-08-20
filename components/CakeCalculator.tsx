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

type IngredientCalculation = {
  ingredient: RecipeIngredient;
  product: Product | null;
  scaledQuantity: number;
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

function formatNumber(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return Number(value)
    .toFixed(2)
    .replace(".", ",");
}

function formatMoney(value: number) {
  return `${value
    .toFixed(2)
    .replace(".", ",")} zł`;
}

function getPortionsLabel(value: number) {
  if (value === 1) {
    return "porcja";
  }

  if (value >= 2 && value <= 4) {
    return "porcje";
  }

  return "porcji";
}

export default function CakeCalculator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] =
    useState<RecipeIngredient[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRecipeId, setSelectedRecipeId] =
    useState("");

  const [diameter, setDiameter] = useState("");
  const [height, setHeight] = useState("");
  const [portions, setPortions] = useState("");

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

    setRecipes(
      (recipesResult.data ?? []) as Recipe[]
    );

    setProducts(
      (productsResult.data ?? []) as Product[]
    );

    setIngredients(
      (ingredientsResult.data ?? []) as RecipeIngredient[]
    );

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

  const recipeIngredients = useMemo(() => {
    if (!selectedRecipeId) {
      return [];
    }

    return ingredients.filter(
      (ingredient) =>
        ingredient.recipe_id ===
        selectedRecipeId
    );
  }, [ingredients, selectedRecipeId]);

  function getProduct(productId: string) {
    return (
      products.find(
        (product) => product.id === productId
      ) ?? null
    );
  }

  function handleRecipeChange(
    recipeId: string
  ) {
    setSelectedRecipeId(recipeId);
    setError("");

    const recipe = recipes.find(
      (item) => item.id === recipeId
    );

    if (!recipe) {
      setDiameter("");
      setHeight("");
      setPortions("");
      return;
    }

    setDiameter(
      recipe.diameter_cm !== null
        ? String(recipe.diameter_cm).replace(
            ".",
            ","
          )
        : ""
    );

    setHeight(
      recipe.height_cm !== null
        ? String(recipe.height_cm).replace(
            ".",
            ","
          )
        : ""
    );

    setPortions(
      recipe.portions !== null
        ? String(recipe.portions).replace(
            ".",
            ","
          )
        : ""
    );
  }

  const baseDiameter =
    selectedRecipe?.diameter_cm ?? null;

  const baseHeight =
    selectedRecipe?.height_cm ?? null;

  const basePortions =
    selectedRecipe?.portions ?? null;

  const currentDiameter =
    diameter.trim() === ""
      ? baseDiameter
      : Number(
          diameter.replace(",", ".")
        );

  const currentHeight =
    height.trim() === ""
      ? baseHeight
      : Number(
          height.replace(",", ".")
        );

  const currentPortions =
    portions.trim() === ""
      ? basePortions
      : Number(
          portions.replace(",", ".")
        );

  /*
   * SKALA WYMIARÓW
   *
   * Objętość walca:
   *
   * średnica² × wysokość
   *
   * Dzięki temu zmiana średnicy ma
   * większy wpływ na ilość składników.
   */

  const dimensionScale = useMemo(() => {
    if (
      !baseDiameter ||
      !baseHeight ||
      !currentDiameter ||
      !currentHeight ||
      !Number.isFinite(baseDiameter) ||
      !Number.isFinite(baseHeight) ||
      !Number.isFinite(currentDiameter) ||
      !Number.isFinite(currentHeight) ||
      baseDiameter <= 0 ||
      baseHeight <= 0 ||
      currentDiameter <= 0 ||
      currentHeight <= 0
    ) {
      return 1;
    }

    return (
      (currentDiameter *
        currentDiameter *
        currentHeight) /
      (baseDiameter *
        baseDiameter *
        baseHeight)
    );
  }, [
    baseDiameter,
    baseHeight,
    currentDiameter,
    currentHeight,
  ]);

  /*
   * SKALA PORCJI
   *
   * Jeżeli użytkownik zmienia tylko liczbę
   * porcji, receptura również zostaje
   * odpowiednio przeliczona.
   *
   * Jeżeli zmienia zarówno wymiary,
   * jak i porcje, bierzemy większą z
   * dwóch informacji jako docelowy
   * współczynnik receptury.
   */

  const portionScale = useMemo(() => {
    if (
      !basePortions ||
      !currentPortions ||
      !Number.isFinite(basePortions) ||
      !Number.isFinite(currentPortions) ||
      basePortions <= 0 ||
      currentPortions <= 0
    ) {
      return 1;
    }

    return currentPortions / basePortions;
  }, [basePortions, currentPortions]);

  /*
   * Główna skala składników.
   *
   * Gdy użytkownik zmieni wymiary tortu,
   * korzystamy ze skali objętości.
   *
   * Gdy użytkownik zmieni porcje ręcznie,
   * wykorzystujemy skalę porcji.
   *
   * Jeżeli zmienione są oba parametry,
   * wymiary mają pierwszeństwo, ponieważ
   * opisują rzeczywistą wielkość tortu.
   */

  const finalScale = useMemo(() => {
    const dimensionsChanged =
      hasNumber(dimensionScale) &&
      Math.abs(dimensionScale - 1) >
        0.000001;

    const portionsChanged =
      portions.trim() !== "" &&
      hasNumber(portionScale) &&
      Math.abs(portionScale - 1) >
        0.000001;

    if (
      dimensionsChanged &&
      currentDiameter &&
      currentHeight
    ) {
      return dimensionScale;
    }

    if (portionsChanged) {
      return portionScale;
    }

    return 1;
  }, [
    dimensionScale,
    portionScale,
    portions,
    currentDiameter,
    currentHeight,
  ]);

  const calculatedIngredients =
    useMemo<IngredientCalculation[]>(() => {
      return recipeIngredients.map(
        (ingredient) => {
          const product = getProduct(
            ingredient.product_id
          );

          const scaledQuantity =
            Number(ingredient.quantity) *
            finalScale;

          const cost = product
            ? calculateCost(
                scaledQuantity,
                ingredient.unit,
                Number(
                  product.package_quantity
                ),
                product.unit,
                Number(
                  product.package_price
                )
              )
            : 0;

          return {
            ingredient,
            product,
            scaledQuantity,
            cost,
          };
        }
      );
    }, [
      recipeIngredients,
      products,
      finalScale,
    ]);

  const totalCost = useMemo(() => {
    return calculatedIngredients.reduce(
      (sum, item) => sum + item.cost,
      0
    );
  }, [calculatedIngredients]);

  const calculatedPortions = useMemo(() => {
    if (
      currentPortions !== null &&
      Number.isFinite(currentPortions) &&
      currentPortions > 0
    ) {
      return currentPortions;
    }

    if (
      basePortions !== null &&
      Number.isFinite(basePortions) &&
      basePortions > 0
    ) {
      return basePortions * finalScale;
    }

    return 0;
  }, [
    currentPortions,
    basePortions,
    finalScale,
  ]);

  const costPerPortion =
    calculatedPortions > 0
      ? totalCost / calculatedPortions
      : 0;

  const hasValidDimensions =
    !!selectedRecipe &&
    !!baseDiameter &&
    !!baseHeight &&
    !!currentDiameter &&
    !!currentHeight &&
    Number.isFinite(currentDiameter) &&
    Number.isFinite(currentHeight) &&
    currentDiameter > 0 &&
    currentHeight > 0;

  const scaleChanged =
    Math.abs(finalScale - 1) >
    0.0001;

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
                handleRecipeChange(
                  event.target.value
                )
              }
              disabled={loading}
              style={inputStyle}
            >
              <option value="">
                {loading
                  ? "Ładowanie receptur..."
                  : "Wybierz recepturę"}
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

                  <div
                    style={
                      inputWithUnitStyle
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
                      placeholder="np. 21"
                      style={
                        unitInputStyle
                      }
                    />

                    <span
                      style={unitStyle}
                    >
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
                      inputWithUnitStyle
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
                      style={
                        unitInputStyle
                      }
                    />

                    <span
                      style={unitStyle}
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
                    placeholder="np. 12"
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={recipeInfoBoxStyle}>
                <div
                  style={
                    recipeInfoTitleStyle
                  }
                >
                  {selectedRecipe.name}
                </div>

                <div
                  style={
                    recipeInfoTextStyle
                  }
                >
                  Bazowa receptura:{" "}
                  <strong>
                    {formatNumber(
                      baseDiameter
                    )}{" "}
                    cm ×{" "}
                    {formatNumber(
                      baseHeight
                    )}{" "}
                    cm
                  </strong>

                  {" • "}

                  <strong>
                    {formatNumber(
                      basePortions
                    )}
                  </strong>{" "}
                  {basePortions
                    ? getPortionsLabel(
                        basePortions
                      )
                    : "porcji"}
                </div>
              </div>

              {scaleChanged && (
                <div
                  style={
                    scaleInfoStyle
                  }
                >
                  <strong>
                    Skala receptury:{" "}
                    {finalScale
                      .toFixed(3)
                      .replace(
                        ".",
                        ","
                      )}
                    ×
                  </strong>

                  <span>
                    Ilości składników zostały
                    automatycznie przeliczone
                    dla wybranego rozmiaru
                    tortu.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={costCardStyle}>
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

            {selectedRecipe && (
              <div style={totalBadgeStyle}>
                {formatMoney(totalCost)}
              </div>
            )}
          </div>

          {!selectedRecipe ? (
            <div style={emptyStyle}>
              <div
                style={emptyIconStyle}
              >
                T
              </div>

              <strong>
                Wybierz recepturę
              </strong>

              <p
                style={emptyTextStyle}
              >
                Wybierz recepturę po lewej,
                aby zobaczyć składniki
                i koszt tortu.
              </p>
            </div>
          ) : recipeIngredients.length ===
            0 ? (
            <div style={emptyStyle}>
              <div
                style={emptyIconStyle}
              >
                !
              </div>

              <strong>
                Brak składników
              </strong>

              <p
                style={emptyTextStyle}
              >
                Ta receptura nie ma jeszcze
                dodanych składników.
              </p>
            </div>
          ) : (
            <>
              <div
                style={
                  ingredientsListStyle
                }
              >
                {calculatedIngredients.map(
                  (item) => {
                    const {
                      ingredient,
                      product,
                      scaledQuantity,
                      cost,
                    } = item;

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
                            ingredientMainStyle
                          }
                        >
                          <div
                            style={
                              ingredientIconStyle
                            }
                          >
                            {product?.name
                              ?.charAt(
                                0
                              )
                              .toUpperCase() ??
                              "P"}
                          </div>

                          <div
                            style={
                              ingredientDetailsStyle
                            }
                          >
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
                                ingredientRecipeQuantityStyle
                              }
                            >
                              Receptura:{" "}
                              {formatNumber(
                                ingredient.quantity
                              )}{" "}
                              {
                                ingredient.unit
                              }
                            </div>

                            {product && (
                              <div
                                style={
                                  productInfoStyle
                                }
                              >
                                Opakowanie:{" "}
                                {formatNumber(
                                  Number(
                                    product.package_quantity
                                  )
                                )}{" "}
                                {
                                  product.unit
                                }{" "}
                                •{" "}
                                {formatMoney(
                                  Number(
                                    product.package_price
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={
                            ingredientCalculationStyle
                          }
                        >
                          <div
                            style={
                              scaledQuantityStyle
                            }
                          >
                            {formatNumber(
                              scaledQuantity
                            )}{" "}
                            {
                              ingredient.unit
                            }
                          </div>

                          <strong
                            style={
                              ingredientCostStyle
                            }
                          >
                            {formatMoney(
                              cost
                            )}
                          </strong>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div
                style={
                  summaryStyle
                }
              >
                <div
                  style={
                    summaryRowStyle
                  }
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
                  style={
                    summaryRowStyle
                  }
                >
                  <span>
                    Liczba porcji
                  </span>

                  <strong>
                    {formatNumber(
                      calculatedPortions
                    )}
                  </strong>
                </div>

                <div
                  style={
                    finalSummaryRowStyle
                  }
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

      {selectedRecipe && (
        <div style={explanationCardStyle}>
          <h3
            style={
              explanationTitleStyle
            }
          >
            Jak liczony jest koszt?
          </h3>

          <p
            style={
              explanationTextStyle
            }
          >
            Każdy składnik jest przeliczany
            na podstawie ilości potrzebnej do
            przygotowania tortu oraz ceny
            opakowania produktu.
          </p>

          <div
            style={
              formulaStyle
            }
          >
            <strong>
              Koszt składnika =
            </strong>{" "}
            ilość potrzebna ÷ ilość w
            opakowaniu × cena opakowania
          </div>

          <p
            style={
              explanationTextStyle
            }
          >
            Zmiana średnicy i wysokości
            przelicza recepturę według
            objętości tortu. Zmiana liczby
            porcji pozwala natomiast
            bezpośrednio zwiększyć lub
            zmniejszyć recepturę według
            liczby potrzebnych porcji.
          </p>
        </div>
      )}
    </section>
  );
}

function hasNumber(
  value: number
) {
  return (
    Number.isFinite(value) &&
    value > 0
  );
}

const pageStyle = {
  width: "100%",
};

const headerStyle = {
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

const parametersCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const costCardStyle = {
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

const inputWithUnitStyle = {
  display: "flex",
  alignItems: "stretch",
};

const unitInputStyle = {
  ...inputStyle,
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
};

const unitStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0 11px",
  border: "1px solid #ddd3c9",
  borderLeft: "none",
  borderTopRightRadius: "9px",
  borderBottomRightRadius: "9px",
  background: "#f7f3ef",
  color: "#8a837d",
  fontSize: "13px",
};

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr 1fr",
  gap: "10px",
};

const recipeInfoBoxStyle = {
  background: "#f7f3ef",
  border: "1px solid #e9e2da",
  borderRadius: "11px",
  padding: "13px",
  marginTop: "4px",
};

const recipeInfoTitleStyle = {
  color: "#292522",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "5px",
};

const recipeInfoTextStyle = {
  color: "#716b65",
  fontSize: "12px",
  lineHeight: 1.5,
};

const scaleInfoStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  background: "#f0f8f2",
  border: "1px solid #bdd9c3",
  color: "#477451",
  borderRadius: "10px",
  padding: "11px",
  marginTop: "12px",
  fontSize: "12px",
  lineHeight: 1.4,
};

const totalBadgeStyle = {
  background: "#f0f8f2",
  color: "#477451",
  border: "1px solid #bdd9c3",
  borderRadius: "10px",
  padding: "9px 12px",
  fontSize: "16px",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
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
  maxWidth: "350px",
  lineHeight: 1.5,
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
  padding: "11px 12px",
};

const ingredientMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
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

const ingredientDetailsStyle = {
  minWidth: 0,
};

const ingredientNameStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#292522",
};

const ingredientRecipeQuantityStyle = {
  marginTop: "4px",
  color: "#8a837d",
  fontSize: "12px",
};

const productInfoStyle = {
  marginTop: "3px",
  color: "#a09891",
  fontSize: "11px",
};

const ingredientCalculationStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-end",
  gap: "3px",
  flexShrink: 0,
};

const scaledQuantityStyle = {
  color: "#292522",
  fontSize: "13px",
  fontWeight: 600,
};

const ingredientCostStyle = {
  color: "#477451",
  fontSize: "15px",
};

const summaryStyle = {
  marginTop: "18px",
  paddingTop: "15px",
  borderTop: "1px solid #eee7e0",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  padding: "7px 0",
  color: "#716b65",
  fontSize: "13px",
};

const finalSummaryRowStyle = {
  ...summaryRowStyle,
  marginTop: "7px",
  paddingTop: "14px",
  borderTop: "1px solid #eee7e0",
  color: "#292522",
  fontSize: "15px",
};

const explanationCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "24px",
  marginTop: "20px",
};

const explanationTitleStyle = {
  margin: 0,
  color: "#292522",
  fontSize: "17px",
};

const explanationTextStyle = {
  margin: "8px 0 0",
  color: "#716b65",
  fontSize: "13px",
  lineHeight: 1.6,
};

const formulaStyle = {
  marginTop: "14px",
  background: "#f7f3ef",
  border: "1px solid #e9e2da",
  borderRadius: "10px",
  padding: "12px",
  color: "#514b46",
  fontSize: "13px",
  lineHeight: 1.5,
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
