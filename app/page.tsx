"use client";

import { useState } from "react";

type View =
  | "login"
  | "dashboard"
  | "newCake"
  | "products";

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
  const [view, setView] = useState<View>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [cakeName, setCakeName] = useState("");
  const [diameter, setDiameter] = useState("");
  const [servings, setServings] = useState("");
  const [margin, setMargin] = useState("30");

  const [ingredients, setIngredients] =
    useState<Ingredient[]>(initialIngredients);

  const totalCost = ingredients.reduce(
    (sum, ingredient) =>
      sum + ingredient.quantity * ingredient.price,
    0
  );

  const sellingPrice =
    totalCost * (1 + Number(margin || 0) / 100);

  const profit = sellingPrice - totalCost;

  function handleLogin() {
    setLoginError("");

    if (!email.trim() || !password.trim()) {
      setLoginError(
        "Wpisz adres e-mail oraz hasło."
      );
      return;
    }

    setView("dashboard");
  }

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

        if (
          field === "name" ||
          field === "unit"
        ) {
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
      current.filter(
        (ingredient) =>
          ingredient.id !== id
      )
    );
  }

  function logout() {
    setEmail("");
    setPassword("");
    setView("login");
  }

  if (view === "login") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#faf8f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily:
            "Arial, sans-serif",
          color: "#292522",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#ffffff",
            border:
              "1px solid #e9e2da",
            borderRadius: "22px",
            padding: "40px",
            boxSizing: "border-box",
            boxShadow:
              "0 10px 35px rgba(80, 60, 40, 0.08)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "4px",
                textTransform:
                  "uppercase",
                color: "#8a6d4b",
                marginBottom: "10px",
              }}
            >
              Délice
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              Logowanie
            </h1>

            <p
              style={{
                color: "#716b65",
                marginTop: "10px",
                lineHeight: 1.5,
              }}
            >
              Zaloguj się do swojego
              kalkulatora tortów.
            </p>
          </div>

          <label
            style={{
              display: "block",
              marginBottom: "18px",
            }}
          >
            <div
              style={labelStyle}
            >
              E-mail
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="twoj@email.pl"
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "18px",
            }}
          >
            <div
              style={labelStyle}
            >
              Hasło
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Wpisz hasło"
              style={inputStyle}
            />
          </label>

          {loginError && (
            <div
              style={{
                background: "#fdf0ee",
                border:
                  "1px solid #e8c9c3",
                color: "#9b4d43",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "18px",
                fontSize: "14px",
              }}
            >
              {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              background: "#8a6d4b",
              color: "#ffffff",
              border: "none",
              borderRadius: "11px",
              padding: "14px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Zaloguj się
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "24px",
              color: "#716b65",
              fontSize: "14px",
            }}
          >
            Nie masz jeszcze konta?
            <br />

            <button
              style={{
                border: "none",
                background:
                  "transparent",
                color: "#8a6d4b",
                cursor: "pointer",
                fontWeight: 600,
                marginTop: "6px",
              }}
            >
              Utwórz konto
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (view === "products") {
    return (
      <main
        style={pageStyle}
      >
        <div
          style={containerStyle}
        >
          <button
            onClick={() =>
              setView("dashboard")
            }
            style={backButtonStyle}
          >
            ← Powrót do panelu
          </button>

          <section
            style={sectionStyle}
          >
            <div
              style={{
                fontSize: "13px",
                letterSpacing: "3px",
                textTransform:
                  "uppercase",
                color: "#8a6d4b",
                marginBottom: "8px",
              }}
            >
              Délice
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              Produkty
            </h1>

            <p
              style={{
                color: "#716b65",
              }}
            >
              Zarządzaj produktami
              i ich aktualnymi cenami.
            </p>

            <div
              style={{
                marginTop: "25px",
                padding: "25px",
                background:
                  "#faf8f5",
                border:
                  "1px dashed #ddd3c9",
                borderRadius: "14px",
                textAlign: "center",
                color: "#716b65",
              }}
            >
              Moduł produktów
              pozostaje aktywny.
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (view === "newCake") {
    return (
      <main
        style={pageStyle}
      >
        <div
          style={containerStyle}
        >
          <button
            onClick={() =>
              setView("dashboard")
            }
            style={backButtonStyle}
          >
            ← Powrót do panelu
          </button>

          <header
            style={{
              marginBottom: "25px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "3px",
                textTransform:
                  "uppercase",
                color: "#8a6d4b",
              }}
            >
              Délice
            </div>

            <h1
              style={{
                fontSize: "38px",
                margin: "8px 0",
              }}
            >
              Nowy tort
            </h1>
          </header>

          <section
            style={sectionStyle}
          >
            <h2>
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
                type="number"
              />

              <Input
                label="Liczba porcji"
                value={servings}
                onChange={setServings}
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

          <section
            style={sectionStyle}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>
                Składniki
              </h2>

              <button
                onClick={
                  addIngredient
                }
                style={
                  primaryButtonStyle
                }
              >
                + Dodaj składnik
              </button>
            </div>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "700px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={thStyle}
                    >
                      Składnik
                    </th>
                    <th
                      style={thStyle}
                    >
                      Ilość
                    </th>
                    <th
                      style={thStyle}
                    >
                      Jednostka
                    </th>
                    <th
                      style={thStyle}
                    >
                      Cena / jednostkę
                    </th>
                    <th
                      style={thStyle}
                    >
                      Koszt
                    </th>
                    <th
                      style={thStyle}
                    />
                  </tr>
                </thead>

                <tbody>
                  {ingredients.map(
                    (ingredient) => {
                      const cost =
                        ingredient.quantity *
                        ingredient.price;

                      return (
                        <tr
                          key={
                            ingredient.id
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <input
                              value={
                                ingredient.name
                              }
                              onChange={(
                                e
                              ) =>
                                updateIngredient(
                                  ingredient.id,
                                  "name",
                                  e.target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <input
                              type="number"
                              value={
                                ingredient.quantity
                              }
                              onChange={(
                                e
                              ) =>
                                updateIngredient(
                                  ingredient.id,
                                  "quantity",
                                  e.target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <select
                              value={
                                ingredient.unit
                              }
                              onChange={(
                                e
                              ) =>
                                updateIngredient(
                                  ingredient.id,
                                  "unit",
                                  e.target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            >
                              <option value="g">
                                g
                              </option>
                              <option value="kg">
                                kg
                              </option>
                              <option value="ml">
                                ml
                              </option>
                              <option value="l">
                                l
                              </option>
                              <option value="szt.">
                                szt.
                              </option>
                            </select>
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <input
                              type="number"
                              step="0.01"
                              value={
                                ingredient.price
                              }
                              onChange={(
                                e
                              ) =>
                                updateIngredient(
                                  ingredient.id,
                                  "price",
                                  e.target
                                    .value
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <strong>
                              {formatMoney(
                                cost
                              )}{" "}
                              zł
                            </strong>
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            <button
                              onClick={() =>
                                removeIngredient(
                                  ingredient.id
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "transparent",
                                color:
                                  "#9b4d43",
                                cursor:
                                  "pointer",
                              }}
                            >
                              Usuń
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <ResultCard
              title="Koszt składników"
              value={`${formatMoney(
                totalCost
              )} zł`}
            />

            <ResultCard
              title="Zysk"
              value={`${formatMoney(
                profit
              )} zł`}
            />

            <ResultCard
              title="Sugerowana cena"
              value={`${formatMoney(
                sellingPrice
              )} zł`}
              highlighted
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={pageStyle}
    >
      <div
        style={containerStyle}
      >
        <header
          style={{
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  letterSpacing: "3px",
                  textTransform:
                    "uppercase",
                  color: "#8a6d4b",
                }}
              >
                Délice
              </div>

              <h1
                style={{
                  fontSize: "42px",
                  margin:
                    "8px 0",
                }}
              >
                Kalkulator tortów
              </h1>

              <p
                style={{
                  color: "#716b65",
                  fontSize: "17px",
                }}
              >
                Zarządzaj recepturami,
                kosztami i zamówieniami
                w jednym miejscu.
              </p>
            </div>

            <button
              onClick={logout}
              style={{
                border:
                  "1px solid #ddd3c9",
                background:
                  "#ffffff",
                color: "#716b65",
                borderRadius:
                  "9px",
                padding:
                  "10px 14px",
                cursor:
                  "pointer",
              }}
            >
              Wyloguj
            </button>
          </div>
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
            onClick={() =>
              setView("newCake")
            }
          />

          <DashboardCard
            title="Produkty"
            description="Zarządzaj produktami i ich aktualnymi cenami."
            onClick={() =>
              setView("products")
            }
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
            ...sectionStyle,
            marginTop: "40px",
          }}
        >
          <h2>
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
            <Stat
              title="Zamówienia"
              value="0"
            />

            <Stat
              title="Torty"
              value="0"
            />

            <Stat
              title="Sprzedaż"
              value="0,00 zł"
            />

            <Stat
              title="Zysk"
              value="0,00 zł"
            />
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
        border:
          "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "26px",
        minHeight: "150px",
        textAlign: "left",
        cursor: onClick
          ? "pointer"
          : "default",
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
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      <div
        style={labelStyle}
      >
        {label}
      </div>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
          )
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
        background:
          highlighted
            ? "#8a6d4b"
            : "#ffffff",
        color:
          highlighted
            ? "#ffffff"
            : "#292522",
        border:
          "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "25px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          textTransform:
            "uppercase",
          letterSpacing:
            "1px",
          marginBottom:
            "10px",
          opacity: 0.8,
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "28px",
        }}
      >
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
          textTransform:
            "uppercase",
          letterSpacing:
            "1px",
          marginBottom:
            "8px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "26px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatMoney(
  value: number
) {
  return value
    .toFixed(2)
    .replace(".", ",");
}

const pageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  color: "#292522",
  fontFamily:
    "Arial, sans-serif",
  padding: "30px 20px",
};

const containerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const sectionStyle = {
  background: "#ffffff",
  border:
    "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "25px",
};

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding: "12px",
  border:
    "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#716b65",
  marginBottom: "7px",
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

const primaryButtonStyle = {
  background: "#8a6d4b",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const thStyle = {
  padding: "12px 8px",
  borderBottom:
    "1px solid #e9e2da",
  color: "#716b65",
  fontSize: "13px",
  textAlign:
    "left" as const,
};

const tdStyle = {
  padding: "10px 8px",
  borderBottom:
    "1px solid #f0ebe6",
};
