"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  package_quantity: number | null;
  package_price: number | null;
  stock_quantity?: number | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  name: string;
  category: string;
  unit: string;
  packageQuantity: string;
  packagePrice: string;
  notes: string;
  active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  unit: "g",
  packageQuantity: "1000",
  packagePrice: "",
  notes: "",
  active: true,
};

const allowedUnits = [
  "g",
  "kg",
  "ml",
  "l",
  "szt",
  "opak.",
  "łyżka",
  "łyżeczka",
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (productsError) {
      setError(
        `Nie udało się pobrać produktów: ${productsError.message}`
      );
      setLoading(false);
      return;
    }

    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }

  function updateForm(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name ?? "",
      category: product.category ?? "",
      unit: product.unit ?? "g",
      packageQuantity:
        product.package_quantity !== null
          ? String(product.package_quantity).replace(".", ",")
          : "",
      packagePrice:
        product.package_price !== null
          ? String(product.package_price).replace(".", ",")
          : "",
      notes: product.notes ?? "",
      active: product.active,
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
      setError("Podaj nazwę produktu.");
      return;
    }

    const cleanUnit = form.unit.trim() || null;

    if (
      cleanUnit !== null &&
      !allowedUnits.includes(cleanUnit)
    ) {
      setError("Wybierz prawidłową jednostkę.");
      return;
    }

    if (!form.packageQuantity.trim()) {
      setError("Podaj ilość w opakowaniu (np. 1000 dla 1 kg mąki lub 500 dla mascarpone).");
      return;
    }

    if (!form.packagePrice.trim()) {
      setError("Podaj cenę opakowania (np. 4,50).");
      return;
    }

    const quantityValue = Number(
      form.packageQuantity.replace(",", ".").trim()
    );

    const priceValue = Number(
      form.packagePrice.replace(",", ".").trim()
    );

    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setError("Ilość w opakowaniu musi być liczbą większą od zera.");
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Cena opakowania musi być prawidłową liczbą dodatnią.");
      return;
    }

    const productData: any = {
      name: cleanName,
      category: form.category.trim() || null,
      unit: cleanUnit,
      package_quantity: quantityValue,
      package_price: priceValue,
      notes: form.notes.trim() || null,
      active: form.active,
    };

    setSaving(true);

    if (editingId) {
      const { error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingId);

      if (updateError) {
        setError(
          `Nie udało się zaktualizować produktu: ${updateError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Produkt został zaktualizowany.");
    } else {
      productData.stock_quantity = 0;

      const { error: insertError } = await supabase
        .from("products")
        .insert(productData);

      if (insertError) {
        setError(
          `Nie udało się zapisać produktu: ${insertError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Produkt został dodany do bazy i magazynu.");
    }

    setForm(emptyForm);
    setEditingId(null);

    await loadProducts();

    setSaving(false);
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć produkt "${product.name}"?\n\nTej operacji nie można cofnąć.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await supabase.from("recipe_ingredients").delete().eq("product_id", product.id);
      await supabase.from("recipe_items").delete().eq("product_id", product.id);

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        setError(
          `Nie udało się usunąć produktu: ${deleteError.message}`
        );
        return;
      }

      if (editingId === product.id) {
        cancelEditing();
      }

      setSuccess(
        `Produkt "${product.name}" został usunięty.`
      );

      await loadProducts();
    } catch (err: any) {
      setError(`Nie udało się usunąć produktu: ${err.message}`);
    }
  }

  async function toggleActive(product: Product) {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("products")
      .update({
        active: !product.active,
      })
      .eq("id", product.id);

    if (updateError) {
      setError(
        `Nie udało się zmienić statusu produktu: ${updateError.message}`
      );
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );

    setSuccess(
      product.active
        ? `Produkt "${product.name}" został wyłączony.`
        : `Produkt "${product.name}" został aktywowany.`
    );
  }

  function formatPrice(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
    }

    return `${Number(value)
      .toFixed(2)
      .replace(".", ",")} zł`;
  }

  function formatQuantity(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
    }

    return Number(value)
      .toString()
      .replace(".", ",");
  }

  function getUnitPrice(product: Product) {
    if (
      product.package_quantity === null ||
      product.package_price === null ||
      product.package_quantity <= 0
    ) {
      return null;
    }

    return (
      Number(product.package_price) /
      Number(product.package_quantity)
    );
  }

  function getUnitPriceLabel(product: Product) {
    const unitPrice = getUnitPrice(product);

    if (unitPrice === null) {
      return "—";
    }

    return `${unitPrice
      .toFixed(4)
      .replace(".", ",")} zł / ${product.unit || "jedn."}`;
  }

  const categories = useMemo(() => {
    const uniqueCategories = products
      .map((product) => product.category?.trim())
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(
      new Set(uniqueCategories)
    ).sort((a, b) =>
      a.localeCompare(b, "pl")
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const cleanSearch = search
      .trim()
      .toLocaleLowerCase("pl");

    return products.filter((product) => {
      const matchesSearch =
        cleanSearch === "" ||
        product.name
          .toLocaleLowerCase("pl")
          .includes(cleanSearch) ||
        (product.category ?? "")
          .toLocaleLowerCase("pl")
          .includes(cleanSearch);

      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    categoryFilter,
  ]);

  return (
    <section style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            BAZA PRODUKTÓW
          </div>

          <h2 style={titleStyle}>
            Produkty
          </h2>

          <p style={subtitleStyle}>
            Zarządzaj produktami, cenami i jednostkami
            wykorzystywanymi przy wyliczaniu kosztów tortów.
          </p>
        </div>

        <div style={countBadgeStyle}>
          {products.length}{" "}
          {products.length === 1
            ? "produkt"
            : products.length >= 2 &&
              products.length <= 4
            ? "produkty"
            : "produktów"}
        </div>
      </div>

      <div style={contentGridStyle}>
        <div style={formCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                {editingId
                  ? "Edytuj produkt"
                  : "Dodaj produkt"}
              </h3>

              <p style={cardSubtitleStyle}>
                {editingId
                  ? "Zmień dane produktu i zapisz zmiany."
                  : "Produkt zostanie zapisany bezpośrednio w Supabase."}
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
                Nazwa produktu *
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
                placeholder="np. Mąka pszenna"
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
                placeholder="np. Produkty sypkie"
                disabled={saving}
                style={inputStyle}
              />
            </label>

            <div style={twoColumnStyle}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>
                  Jednostka
                </span>

                <select
                  value={form.unit}
                  onChange={(event) =>
                    updateForm(
                      "unit",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  style={inputStyle}
                >
                  <option value="g">
                    g — gram
                  </option>

                  <option value="kg">
                    kg — kilogram
                  </option>

                  <option value="ml">
                    ml — mililitr
                  </option>

                  <option value="l">
                    l — litr
                  </option>

                  <option value="szt">
                    szt — sztuka
                  </option>

                  <option value="opak.">
                    opak. — opakowanie
                  </option>

                  <option value="łyżka">
                    łyżka
                  </option>

                  <option value="łyżeczka">
                    łyżeczka
                  </option>
                </select>
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>
                  Ilość w opakowaniu *
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={form.packageQuantity}
                  onChange={(event) =>
                    updateForm(
                      "packageQuantity",
                      event.target.value
                    )
                  }
                  placeholder="np. 1000"
                  disabled={saving}
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Cena opakowania (zł) *
              </span>

              <div
                style={priceInputWrapperStyle}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.packagePrice}
                  onChange={(event) =>
                    updateForm(
                      "packagePrice",
                      event.target.value
                    )
                  }
                  placeholder="np. 4,50"
                  disabled={saving}
                  style={priceInputStyle}
                />

                <span style={currencyStyle}>
                  zł
                </span>
              </div>
            </label>

            {form.packageQuantity &&
              form.packagePrice &&
              form.unit && (
                <div style={formUnitPriceStyle}>
                  <span style={formUnitPriceLabelStyle}>
                    Cena za 1 {form.unit}
                  </span>

                  <strong style={formUnitPriceValueStyle}>
                    {(
                      Number(
                        form.packagePrice.replace(",", ".")
                      ) /
                      Number(
                        form.packageQuantity.replace(",", ".")
                      )
                    )
                      .toFixed(4)
                      .replace(".", ",")}{" "}
                    zł
                  </strong>
                </div>
              )}

            <label style={labelStyle}>
              <span style={labelTextStyle}>
                Uwagi
              </span>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateForm(
                    "notes",
                    event.target.value
                  )
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
                Produkt aktywny
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
                : "+ Dodaj produkt"}
            </button>
          </form>
        </div>

        <div style={listCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h3 style={cardTitleStyle}>
                Lista produktów
              </h3>

              <p style={cardSubtitleStyle}>
                Produkty zapisane w bazie Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
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
                placeholder="Szukaj produktu lub kategorii..."
                style={searchInputStyle}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
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

          {!loading && products.length > 0 && (
            <div style={resultsInfoStyle}>
              Wyświetlono{" "}
              <strong>
                {filteredProducts.length}
              </strong>{" "}
              z{" "}
              <strong>
                {products.length}
              </strong>{" "}
              produktów
            </div>
          )}

          {loading ? (
            <div style={emptyStyle}>
              Ładowanie produktów...
            </div>
          ) : products.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                P
              </div>

              <strong>
                Brak produktów
              </strong>

              <p style={emptyTextStyle}>
                Dodaj pierwszy produkt za pomocą formularza.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                ?
              </div>

              <strong>
                Nie znaleziono produktów
              </strong>

              <p style={emptyTextStyle}>
                Zmień wyszukiwanie lub wybierz inną kategorię.
              </p>
            </div>
          ) : (
            <div style={productsListStyle}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  style={productRowStyle}
                >
                  <div style={productMainStyle}>
                    <div style={productIconStyle}>
                      {product.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div style={productNameStyle}>
                        {product.name}
                      </div>

                      <div style={productMetaStyle}>
                        {product.category ||
                          "Bez kategorii"}

                        {product.unit
                          ? ` • ${product.unit}`
                          : ""}
                      </div>
                    </div>
                  </div>

                  <div style={productDetailsStyle}>
                    <div>
                      <span style={detailLabelStyle}>
                        Opakowanie
                      </span>

                      <strong>
                        {formatQuantity(
                          product.package_quantity
                        )}{" "}
                        {product.unit || ""}
                      </strong>
                    </div>

                    <div>
                      <span style={detailLabelStyle}>
                        Cena
                      </span>

                      <strong>
                        {formatPrice(
                          product.package_price
                        )}
                      </strong>
                    </div>

                    <div>
                      <span style={detailLabelStyle}>
                        Cena / jednostkę
                      </span>

                      <strong>
                        {getUnitPriceLabel(product)}
                      </strong>
                    </div>

                    <div>
                      <span style={detailLabelStyle}>
                        Status
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(product)
                        }
                        style={{
                          ...statusStyle,
                          ...(product.active
                            ? activeStatusStyle
                            : inactiveStatusStyle),
                        }}
                      >
                        {product.active
                          ? "Aktywny"
                          : "Nieaktywny"}
                      </button>
                    </div>
                  </div>

                  <div style={actionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(product)
                      }
                      style={editButtonStyle}
                    >
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteProduct(product)
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

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const priceInputWrapperStyle = {
  position: "relative" as const,
};

const priceInputStyle = {
  ...inputStyle,
  paddingRight: "35px",
};

const currencyStyle = {
  position: "absolute" as const,
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#8a837d",
  fontSize: "13px",
};

const formUnitPriceStyle = {
  background: "#f7f3ef",
  border: "1px solid #e6d9cd",
  borderRadius: "10px",
  padding: "11px 13px",
  marginTop: "-4px",
  marginBottom: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const formUnitPriceLabelStyle = {
  color: "#716b65",
  fontSize: "12px",
};

const formUnitPriceValueStyle = {
  color: "#8a6d4b",
  fontSize: "14px",
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

const productsListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const productRowStyle = {
  border: "1px solid #eee7e0",
  borderRadius: "13px",
  padding: "15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const productMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: "190px",
};

const productIconStyle = {
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

const productNameStyle = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#292522",
};

const productMetaStyle = {
  marginTop: "4px",
  color: "#8a837d",
  fontSize: "12px",
};

const productDetailsStyle = {
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
