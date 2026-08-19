"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  package_quantity: number | null;
  package_price: number | null;
  notes: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
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
  packageQuantity: "",
  packagePrice: "",
  notes: "",
  active: true,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<"all" | "active" | "inactive">("all");

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error: loadError } =
      await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

    if (loadError) {
      setError(
        `Nie udało się pobrać produktów: ${loadError.message}`
      );
      setProducts([]);
      setLoading(false);
      return;
    }

    setProducts((data || []) as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateForm(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "",
      unit: product.unit || "g",
      packageQuantity:
        product.package_quantity !== null &&
        product.package_quantity !== undefined
          ? String(product.package_quantity)
          : "",
      packagePrice:
        product.package_price !== null &&
        product.package_price !== undefined
          ? String(product.package_price)
          : "",
      notes: product.notes || "",
      active: product.active,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function saveProduct() {
    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Podaj nazwę produktu.");
      return;
    }

    const packageQuantity =
      form.packageQuantity.trim() === ""
        ? null
        : Number(
            form.packageQuantity.replace(",", ".")
          );

    const packagePrice =
      form.packagePrice.trim() === ""
        ? null
        : Number(
            form.packagePrice.replace(",", ".")
          );

    if (
      packageQuantity !== null &&
      (!Number.isFinite(packageQuantity) ||
        packageQuantity < 0)
    ) {
      setError(
        "Ilość w opakowaniu musi być poprawną liczbą."
      );
      return;
    }

    if (
      packagePrice !== null &&
      (!Number.isFinite(packagePrice) ||
        packagePrice < 0)
    ) {
      setError(
        "Cena zakupu musi być poprawną liczbą."
      );
      return;
    }

    setSaving(true);

    const productData = {
      name,
      category:
        form.category.trim() || null,
      unit: form.unit,
      package_quantity: packageQuantity,
      package_price: packagePrice,
      notes: form.notes.trim() || null,
      active: form.active,
    };

    if (editingId) {
      const { error: updateError } =
        await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);

      if (updateError) {
        setError(
          `Nie udało się zapisać zmian: ${updateError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Produkt został zaktualizowany.");
    } else {
      const { error: insertError } =
        await supabase
          .from("products")
          .insert(productData);

      if (insertError) {
        setError(
          `Nie udało się dodać produktu: ${insertError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess("Produkt został dodany.");
    }

    setForm(emptyForm);
    setEditingId(null);

    await loadProducts();

    setSaving(false);
  }

  async function toggleActive(product: Product) {
    setError("");
    setSuccess("");

    const { error: updateError } =
      await supabase
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
        ? "Produkt został dezaktywowany."
        : "Produkt został aktywowany."
    );
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć produkt „${product.name}”?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(product.id);

    const { error: deleteError } =
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

    if (deleteError) {
      setError(
        `Nie udało się usunąć produktu: ${deleteError.message}`
      );
      setDeletingId(null);
      return;
    }

    setProducts((current) =>
      current.filter(
        (item) => item.id !== product.id
      )
    );

    if (editingId === product.id) {
      cancelEdit();
    }

    setSuccess("Produkt został usunięty.");
    setDeletingId(null);
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (product.category || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && product.active) ||
        (filter === "inactive" && !product.active);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const activeCount = products.filter(
    (product) => product.active
  ).length;

  const inactiveCount =
    products.length - activeCount;

  function calculateUnitPrice(product: Product) {
    const quantity = Number(
      product.package_quantity
    );

    const price = Number(product.package_price);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price)
    ) {
      return null;
    }

    let normalizedQuantity = quantity;

    if (product.unit === "kg") {
      normalizedQuantity = quantity * 1000;
    }

    if (product.unit === "l") {
      normalizedQuantity = quantity * 1000;
    }

    if (
      product.unit === "g" ||
      product.unit === "ml"
    ) {
      normalizedQuantity = quantity;
    }

    if (product.unit === "szt.") {
      return price / quantity;
    }

    return price / normalizedQuantity;
  }

  function formatMoney(value: number | null) {
    if (
      value === null ||
      !Number.isFinite(value)
    ) {
      return "—";
    }

    return (
      value.toFixed(2).replace(".", ",") +
      " zł"
    );
  }

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

          <p style={descriptionStyle}>
            Zarządzaj produktami, cenami zakupu,
            opakowaniami i jednostkami.
          </p>
        </div>

        <div style={summaryGridStyle}>
          <SummaryBox
            label="Wszystkie"
            value={products.length}
          />

          <SummaryBox
            label="Aktywne"
            value={activeCount}
          />

          <SummaryBox
            label="Nieaktywne"
            value={inactiveCount}
          />
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          <strong>Błąd</strong>
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div style={successStyle}>
          {success}
        </div>
      )}

      <div style={formCardStyle}>
        <div style={formHeaderStyle}>
          <div>
            <h3 style={formTitleStyle}>
              {editingId
                ? "Edytuj produkt"
                : "Dodaj produkt"}
            </h3>

            <p style={formDescriptionStyle}>
              {editingId
                ? "Zmień dane produktu i zapisz zmiany."
                : "Dodaj produkt, który będzie później wykorzystywany w recepturach i kalkulacji kosztów."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={secondaryButtonStyle}
            >
              Anuluj edycję
            </button>
          )}
        </div>

        <div style={formGridStyle}>
          <Field
            label="Nazwa produktu"
            value={form.name}
            onChange={(value) =>
              updateForm("name", value)
            }
            placeholder="np. Mąka tortowa"
          />

          <Field
            label="Kategoria"
            value={form.category}
            onChange={(value) =>
              updateForm("category", value)
            }
            placeholder="np. Mąki"
          />

          <label>
            <div style={labelStyle}>
              Jednostka
            </div>

            <select
              value={form.unit}
              onChange={(event) =>
                updateForm(
                  "unit",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="szt.">
                szt.
              </option>
            </select>
          </label>

          <Field
            label="Ilość w opakowaniu"
            value={form.packageQuantity}
            onChange={(value) =>
              updateForm(
                "packageQuantity",
                value
              )
            }
            placeholder="np. 1000"
            type="number"
          />

          <Field
            label="Cena opakowania"
            value={form.packagePrice}
            onChange={(value) =>
              updateForm(
                "packagePrice",
                value
              )
            }
            placeholder="np. 4,99"
            type="number"
            step="0.01"
          />

          <Field
            label="Uwagi"
            value={form.notes}
            onChange={(value) =>
              updateForm("notes", value)
            }
            placeholder="Opcjonalnie"
          />
        </div>

        <label style={activeFieldStyle}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) =>
              updateForm(
                "active",
                event.target.checked
              )
            }
          />

          <span>
            Produkt aktywny
          </span>
        </label>

        <button
          type="button"
          onClick={saveProduct}
          disabled={saving}
          style={{
            ...primaryButtonStyle,
            opacity: saving ? 0.65 : 1,
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
      </div>

      <div style={listCardStyle}>
        <div style={listHeaderStyle}>
          <div>
            <h3 style={listTitleStyle}>
              Lista produktów
            </h3>

            <p style={listDescriptionStyle}>
              Produkty zapisane bezpośrednio
              w bazie Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            style={secondaryButtonStyle}
            disabled={loading}
          >
            {loading
              ? "Odświeżanie..."
              : "↻ Odśwież"}
          </button>
        </div>

        <div style={filtersStyle}>
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Szukaj produktu lub kategorii..."
            style={searchInputStyle}
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as
                  | "all"
                  | "active"
                  | "inactive"
              )
            }
            style={filterSelectStyle}
          >
            <option value="all">
              Wszystkie produkty
            </option>

            <option value="active">
              Tylko aktywne
            </option>

            <option value="inactive">
              Tylko nieaktywne
            </option>
          </select>
        </div>

        {loading ? (
          <div style={emptyStyle}>
            Ładowanie produktów...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={emptyStyle}>
            <div style={emptyIconStyle}>
              P
            </div>

            <strong>
              {products.length === 0
                ? "Nie ma jeszcze produktów"
                : "Brak wyników"}
            </strong>

            <p style={{ marginBottom: 0 }}>
              {products.length === 0
                ? "Dodaj pierwszy produkt za pomocą formularza powyżej."
                : "Zmień wyszukiwanie lub filtr."}
            </p>
          </div>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    Produkt
                  </th>

                  <th style={thStyle}>
                    Kategoria
                  </th>

                  <th style={thStyle}>
                    Opakowanie
                  </th>

                  <th style={thStyle}>
                    Cena
                  </th>

                  <th style={thStyle}>
                    Cena jednostkowa
                  </th>

                  <th style={thStyle}>
                    Status
                  </th>

                  <th style={thStyle}>
                    Akcje
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => {
                    const unitPrice =
                      calculateUnitPrice(
                        product
                      );

                    return (
                      <tr key={product.id}>
                        <td style={tdStyle}>
                          <strong>
                            {product.name}
                          </strong>

                          {product.notes && (
                            <div
                              style={
                                noteStyle
                              }
                            >
                              {product.notes}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          {product.category ||
                            "—"}
                        </td>

                        <td style={tdStyle}>
                          {product.package_quantity ??
                            "—"}{" "}
                          {product.unit}
                        </td>

                        <td style={tdStyle}>
                          {formatMoney(
                            product.package_price
                          )}
                        </td>

                        <td style={tdStyle}>
                          {unitPrice === null
                            ? "—"
                            : formatMoney(
                                unitPrice
                              )}
                        </td>

                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(
                                product
                              )
                            }
                            style={{
                              ...statusButtonStyle,
                              background:
                                product.active
                                  ? "#eef7ef"
                                  : "#f3f0ee",
                              color:
                                product.active
                                  ? "#397348"
                                  : "#766f69",
                            }}
                          >
                            {product.active
                              ? "Aktywny"
                              : "Nieaktywny"}
                          </button>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={
                              actionsStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  product
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
                              onClick={() =>
                                deleteProduct(
                                  product
                                )
                              }
                              disabled={
                                deletingId ===
                                product.id
                              }
                              style={{
                                ...deleteButtonStyle,
                                opacity:
                                  deletingId ===
                                  product.id
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              {deletingId ===
                              product.id
                                ? "Usuwanie..."
                                : "Usuń"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <label>
      <div style={labelStyle}>
        {label}
      </div>

      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={summaryBoxStyle}>
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <strong style={summaryValueStyle}>
        {value}
      </strong>
    </div>
  );
}

const pageStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "28px",
  boxSizing: "border-box" as const,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "25px",
  marginBottom: "28px",
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  color: "#8a6d4b",
  fontSize: "11px",
  letterSpacing: "2px",
  fontWeight: 700,
  marginBottom: "7px",
};

const titleStyle = {
  margin: 0,
  fontSize: "32px",
  color: "#292522",
};

const descriptionStyle = {
  margin: "8px 0 0",
  color: "#716b65",
  lineHeight: 1.6,
};

const summaryGridStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const summaryBoxStyle = {
  minWidth: "90px",
  background: "#faf8f5",
  border: "1px solid #eee7e0",
  borderRadius: "12px",
  padding: "12px 15px",
  textAlign: "center" as const,
};

const summaryLabelStyle = {
  fontSize: "11px",
  color: "#716b65",
  marginBottom: "5px",
};

const summaryValueStyle = {
  fontSize: "22px",
  color: "#8a6d4b",
};

const errorStyle = {
  background: "#fff1ef",
  border: "1px solid #e7b8b1",
  color: "#9b4d43",
  padding: "13px 15px",
  borderRadius: "10px",
  marginBottom: "18px",
  lineHeight: 1.5,
};

const successStyle = {
  background: "#eef7ef",
  border: "1px solid #c8dfca",
  color: "#397348",
  padding: "13px 15px",
  borderRadius: "10px",
  marginBottom: "18px",
};

const formCardStyle = {
  background: "#faf8f5",
  border: "1px solid #eee7e0",
  borderRadius: "16px",
  padding: "22px",
  marginBottom: "22px",
};

const formHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
  marginBottom: "20px",
  flexWrap: "wrap" as const,
};

const formTitleStyle = {
  margin: 0,
  fontSize: "21px",
};

const formDescriptionStyle = {
  color: "#716b65",
  margin: "6px 0 0",
  fontSize: "14px",
  lineHeight: 1.5,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "16px",
  marginBottom: "17px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#716b65",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
};

const activeFieldStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#514b46",
  fontSize: "14px",
  marginBottom: "18px",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 20px",
  background: "#8a6d4b",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  padding: "10px 15px",
  background: "#ffffff",
  color: "#665b52",
  fontSize: "13px",
  cursor: "pointer",
};

const listCardStyle = {
  border: "1px solid #e9e2da",
  borderRadius: "16px",
  overflow: "hidden",
};

const listHeaderStyle = {
  padding: "22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
  flexWrap: "wrap" as const,
};

const listTitleStyle = {
  margin: 0,
  fontSize: "22px",
};

const listDescriptionStyle = {
  color: "#716b65",
  margin: "6px 0 0",
  fontSize: "14px",
};

const filtersStyle = {
  display: "flex",
  gap: "10px",
  padding: "0 22px 20px",
  flexWrap: "wrap" as const,
};

const searchInputStyle = {
  flex: "1 1 300px",
  minWidth: "220px",
  boxSizing: "border-box" as const,
  padding: "11px 13px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  fontSize: "14px",
};

const filterSelectStyle = {
  padding: "11px 13px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#514b46",
  fontSize: "14px",
};

const emptyStyle = {
  padding: "45px 25px",
  textAlign: "center" as const,
  color: "#716b65",
  borderTop: "1px solid #eee7e0",
  lineHeight: 1.6,
};

const emptyIconStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 13px",
  fontWeight: 700,
  fontSize: "18px",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "950px",
};

const thStyle = {
  padding: "12px 14px",
  borderTop: "1px solid #eee7e0",
  borderBottom: "1px solid #e9e2da",
  color: "#716b65",
  fontSize: "12px",
  fontWeight: 600,
  textAlign: "left" as const,
  background: "#faf8f5",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #f0ebe6",
  color: "#514b46",
  fontSize: "14px",
  verticalAlign: "top" as const,
};

const noteStyle = {
  marginTop: "5px",
  color: "#9a928b",
  fontSize: "12px",
  maxWidth: "250px",
};

const statusButtonStyle = {
  border: "none",
  borderRadius: "20px",
  padding: "6px 10px",
  fontSize: "12px",
  cursor: "pointer",
};

const actionsStyle = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap" as const,
};

const editButtonStyle = {
  border: "1px solid #ddd3c9",
  borderRadius: "7px",
  padding: "7px 10px",
  background: "#ffffff",
  color: "#665b52",
  cursor: "pointer",
  fontSize: "12px",
};

const deleteButtonStyle = {
  border: "1px solid #ead1cd",
  borderRadius: "7px",
  padding: "7px 10px",
  background: "#fff7f6",
  color: "#9b4d43",
  cursor: "pointer",
  fontSize: "12px",
};
