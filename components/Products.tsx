"use client";

import { useMemo, useState } from "react";
import Products from "../components/Products";

type View = "dashboard" | "newCake" | "products";

type Ingredient = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
};

const initialIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Mąka",
    quantity: 0,
    unit: "g",
    price: 0,
  },
  {
    id: 2,
    name: "Cukier",
    quantity: 0,
    unit: "g",
    price: 0,
  },
  {
    id: 3,
    name: "Jajka",
    quantity: 0,
    unit: "szt.",
    price: 0,
  },
];

export default function Home() {
  const [view, setView] = useState<View>("dashboard");

  const [cakeName, setCakeName] = useState("");
  const [diameter, setDiameter] = useState("");
  const [servings, setServings] = useState("");
  const [margin, setMargin] = useState("30");

  const [ingredients, setIngredients] =
    useState<Ingredient[]>(initialIngredients);

  const totalCost = useMemo(() => {
    return ingredients.reduce((sum, ingredient) => {
      return sum + ingredient.quantity * ingredient.price;
    }, 0);
  }, [ingredients]);

  const sellingPrice =
    totalCost * (1 + Number(margin || 0) / 100);

  const profit = sellingPrice - totalCost;

  function updateIngredient(
    id: number,
    field: keyof Ingredient,
    value: string
  ) {
    setIngredients((current) =>
      current.map((ingredient) => {
        if (ingredient.id !== id) {
          return ingredient;
        }

        if (field === "name" || field === "unit") {
          return {
            ...ingredient,
            [field]: value,
          };
        }

        return {
          ...ingredient,
          [field]: Number(value) || 0,
        };
      })
    );
  }

  function addIngredient() {
    setIngredients((current) => [
      ...current,
      {
        id: Date.now(),
        name: "",
        quantity: 0,
        unit: "g",
        price: 0,
      },
    ]);
  }

  function removeIngredient(id: number) {
    setIngredients((current) =>
      current.filter((ingredient) => ingredient.id !== id)
    );
  }

  if (view === "products") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#faf8f5",
          color: "#292522",
          fontFamily: "Arial, sans-serif",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => setView("dashboard")}
            style={backButtonStyle}
          >
            ← Powrót do panelu
          </button>

          <Products />
        </div>
      </main>
    );
  }

  if (view === "newCake") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#faf8f5",
          color: "#292522",
          fontFamily: "Arial, sans-serif",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => setView("dashboard")}
            style={backButtonStyle}
          >
            ← Powrót do panelu
          </button>

          <header style={{ marginBottom: "30px" }}>
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#8a6d4b",
                marginBottom: "8px",
              }}
            >
              Délice
            </div>

            <h1
              style={{
                fontSize: "38px",
                margin: 0,
              }}
            >
              Nowy tort
            </h1>

            <p
              style={{
                color: "#716b65",
                fontSize: "16px",
              }}
            >
              Oblicz koszt wykonania tortu i sugerowaną cenę
              sprzedaży.
            </p>
          </header>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>
              Informacje o torcie
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <Input
                label="Nazwa tortu"
                value={cakeName}
                onChange={setCakeName}
                placeholder="np. Tort malinowy"
              />

              <Input
                label="Średnica"
                value={diameter}
                onChange={setDiameter}
                placeholder="np. 20"
                type="number"
              />

              <Input
                label="Liczba porcji"
                value={servings}
                onChange={setServings}
                placeholder="np. 12"
                type="number"
              />

              <Input
                label="Marża (%)"
                value={margin}
                onChange={setMargin}
                type="number"
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Składniki
              </h2>

              <button
                onClick={addIngredient}
                style={primaryButtonStyle}
              >
                + Dodaj składnik
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Składnik</th>
                    <th style={thStyle}>Ilość</th>
                    <th style={thStyle}>Jednostka</th>
                    <th style={thStyle}>
                      Cena / jednostkę
                    </th>
                    <th style={thStyle}>Koszt</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>

                <tbody>
                  {ingredients.map((ingredient) => {
                    const cost =
                      ingredient.quantity *
                      ingredient.price;

                    return (
                      <tr key={ingredient.id}>
                        <td style={tdStyle}>
                          <input
                            value={ingredient.name}
                            onChange={(e) =>
                              updateIngredient(
                                ingredient.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Nazwa"
                            style={inputStyle}
                          />
                        </td>

                        <td style={tdStyle}>
                          <input
                            type="number"
                            min="0"
                            value={ingredient.quantity}
                            onChange={(e) =>
                              updateIngredient(
                                ingredient.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            style={inputStyle}
                          />
                        </td>

                        <td style={tdStyle}>
                          <select
                            value={ingredient.unit}
                            onChange={(e) =>
                              updateIngredient(
                                ingredient.id,
                                "unit",
                                e.target.value
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
                        </td>

                        <td style={tdStyle}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingredient.price}
                            onChange={(e) =>
                              updateIngredient(
                                ingredient.id,
                                "price",
                                e.target.value
                              )
                            }
                            style={inputStyle}
                          />
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {formatMoney(cost)} zł
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              removeIngredient(
                                ingredient.id
                              )
                            }
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#9b4d43",
                              cursor: "pointer",
                            }}
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <ResultCard
              title="Koszt składników"
              value={`${formatMoney(totalCost)} zł`}
            />

            <ResultCard
              title="Zysk"
              value={`${formatMoney(profit)} zł`}
            />

            <ResultCard
              title="Sugerowana cena"
              value={`${formatMoney(sellingPrice)} zł`}
              highlighted
            />
          </section>

          <section
            style={{
              ...sectionStyle,
              marginTop: "20px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Podsumowanie tortu
            </h2>

            <p>
              <strong>Nazwa:</strong>{" "}
              {cakeName || "Nie podano"}
            </p>

            <p>
              <strong>Średnica:</strong>{" "}
              {diameter
                ? `${diameter} cm`
                : "Nie podano"}
            </p>

            <p>
              <strong>Porcje:</strong>{" "}
              {servings || "Nie podano"}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        color: "#292522",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#8a6d4b",
              marginBottom: "8px",
            }}
          >
            Délice
          </div>

          <h1
            style={{
              fontSize: "42px",
              margin: 0,
              fontWeight: 700,
            }}
          >
            Kalkulator tortów
          </h1>

          <p
            style={{
              color: "#716b65",
              fontSize: "17px",
              marginTop: "12px",
            }}
          >
            Zarządzaj recepturami, kosztami i
            zamówieniami w jednym miejscu.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <DashboardCard
            title="Nowy tort"
            description="Oblicz składniki, koszt i cenę sprzedaży."
            onClick={() => setView("newCake")}
          />

          <DashboardCard
            title="Produkty"
            description="Dodawaj produkty, ceny zakupu, opakowania i jednostki."
            onClick={() => setView("products")}
          />

          <DashboardCard
            title="Receptury"
            description="Twórz i przeliczaj własne receptury."
          />

          <DashboardCard
            title="Zamówienia"
            description="Kontroluj zamówienia i terminy odbioru."
          />
        </section>

        <section
          style={{
            marginTop: "40px",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "30px",
            border: "1px solid #e9e2da",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Podsumowanie
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
            }}
          >
            <Stat title="Zamówienia" value="0" />
            <Stat title="Torty" value="0" />
            <Stat title="Sprzedaż" value="0,00 zł" />
            <Stat title="Zysk" value="0,00 zł" />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        background: "#ffffff",
        border: "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "26px",
        minHeight: "150px",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        color: "#292522",
        width: "100%",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "10px",
          fontSize: "21px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "#716b65",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </p>
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: "13px",
          color: "#716b65",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={inputStyle}
      />
    </label>
  );
}

function ResultCard({
  title,
  value,
  highlighted = false,
}: {
  title: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        background: highlighted
          ? "#8a6d4b"
          : "#ffffff",
        color: highlighted
          ? "#ffffff"
          : "#292522",
        border: "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "25px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "10px",
          opacity: 0.8,
        }}
      >
        {title}
      </div>

      <strong style={{ fontSize: "28px" }}>
        {value}
      </strong>
    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#8a6d4b",
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <strong style={{ fontSize: "26px" }}>
        {value}
      </strong>
    </div>
  );
}

function formatMoney(value: number) {
  return value.toFixed(2).replace(".", ",");
}

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "25px",
  marginBottom: "20px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "11px 12px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#fff",
  color: "#292522",
  fontSize: "14px",
};

const thStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #e9e2da",
  color: "#716b65",
  fontSize: "13px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid #f0ebe6",
};

const primaryButtonStyle = {
  background: "#8a6d4b",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const backButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#8a6d4b",
  cursor: "pointer",
  fontSize: "15px",
  padding: 0,
  marginBottom: "20px",
};
