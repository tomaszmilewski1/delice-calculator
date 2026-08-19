"use client";

import { useEffect, useState } from "react";
import { supabase } from "../folder/lib/supabase";

type View = "dashboard" | "newCake" | "products" | "recipes" | "orders";

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
    quantity: 500,
    unit: "g",
    price: 0.01,
  },
  {
    id: 2,
    name: "Cukier",
    quantity: 300,
    unit: "g",
    price: 0.01,
  },
  {
    id: 3,
    name: "Jajka",
    quantity: 6,
    unit: "szt.",
    price: 1.5,
  },
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [view, setView] = useState<View>("dashboard");

  const [cakeName, setCakeName] = useState("");
  const [diameter, setDiameter] = useState("");
  const [servings, setServings] = useState("");
  const [margin, setMargin] = useState("30");

  const [ingredients, setIngredients] =
    useState<Ingredient[]>(initialIngredients);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setLoggedIn(!!session);
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoginError("");

    if (!email.trim() || !password.trim()) {
      setLoginError("Podaj e-mail i hasło.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError(
        "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie."
      );
      return;
    }

    setView("dashboard");
  }

  async function logout() {
    await supabase.auth.signOut();

    setLoggedIn(false);
    setEmail("");
    setPassword("");
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

  const totalCost = ingredients.reduce((sum, ingredient) => {
    return sum + ingredient.quantity * ingredient.price;
  }, 0);

  const sellingPrice =
    totalCost * (1 + Number(margin || 0) / 100);

  const profit = sellingPrice - totalCost;

  if (loading) {
    return (
      <main style={loginPageStyle}>
        <div style={loginBoxStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={brandStyle}>Délice</div>

            <h1
              style={{
                fontSize: "30px",
                margin: 0,
              }}
            >
              Kalkulator tortów
            </h1>

            <p style={mutedStyle}>
              Sprawdzanie sesji...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main style={loginPageStyle}>
        <div style={loginBoxStyle}>
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <div style={brandStyle}>Délice</div>

            <h1
              style={{
                fontSize: "30px",
                margin: 0,
              }}
            >
              Kalkulator tortów
            </h1>

            <p style={mutedStyle}>
              Zaloguj się do swojego panelu
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <label style={labelStyle}>
              <div style={labelTextStyle}>
                E-mail
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError("");
                }}
                placeholder="E-mail"
                autoComplete="email"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <div style={labelTextStyle}>
                Hasło
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError("");
                }}
                placeholder="Hasło"
                autoComplete="current-password"
                required
                style={inputStyle}
              />
            </label>

            {loginError && (
              <div
                style={{
                  background: "#fff1ef",
                  border: "1px solid #e8c4bf",
                  color: "#9b4d43",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "14px",
                  marginBottom: "18px",
                }}
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              style={primaryButtonStyle}
            >
              Zaloguj się
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "25px",
              fontSize: "13px",
              color: "#9a928b",
            }}
          >
            Panel zarządzania Délice
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header
          style={{
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <div>
            <div style={brandStyle}>Délice</div>

            <h1
              style={{
                fontSize: "42px",
                margin: 0,
              }}
            >
              Kalkulator tortów
            </h1>

            <p style={subtitleStyle}>
              Zarządzaj recepturami, kosztami i zamówieniami
              w jednym miejscu.
            </p>
          </div>

          <button
            onClick={logout}
            style={logoutButtonStyle}
          >
            Wyloguj się
          </button>
        </header>

        {view !== "dashboard" && (
          <button
            onClick={() => setView("dashboard")}
            style={backButtonStyle}
          >
            ← Powrót do panelu
          </button>
        )}

        {view === "dashboard" && (
          <>
            <section style={cardsGridStyle}>
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
                onClick={() => setView("recipes")}
              />

              <DashboardCard
                title="Zamówienia"
                description="Kontroluj zamówienia i terminy odbioru."
                onClick={() => setView("orders")}
              />
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>
                Podsumowanie
              </h2>

              <div style={statsGridStyle}>
                <Stat title="Zamówienia" value="0" />
                <Stat title="Torty" value="0" />
                <Stat title="Sprzedaż" value="0,00 zł" />
                <Stat title="Zysk" value="0,00 zł" />
              </div>
            </section>
          </>
        )}

        {view === "newCake" && (
          <>
            <header style={{ marginBottom: "25px" }}>
              <h2
                style={{
                  fontSize: "32px",
                  marginBottom: "8px",
                }}
              >
                Nowy tort
              </h2>

              <p style={mutedStyle}>
                Oblicz koszt wykonania tortu i sugerowaną
                cenę sprzedaży.
              </p>
            </header>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                Informacje o torcie
              </h2>

              <div style={formGridStyle}>
                <Input
                  label="Nazwa tortu"
                  value={cakeName}
                  onChange={setCakeName}
                  placeholder="np. Tort malinowy"
                />

                <Input
                  label="Średnica (cm)"
                  value={diameter}
                  onChange={setDiameter}
                  type="number"
                  placeholder="np. 20"
                />

                <Input
                  label="Liczba porcji"
                  value={servings}
                  onChange={setServings}
                  type="number"
                  placeholder="np. 12"
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
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>
                  Składniki
                </h2>

                <button
                  onClick={addIngredient}
                  style={primarySmallButtonStyle}
                >
                  + Dodaj składnik
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "750px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        Składnik
                      </th>
                      <th style={thStyle}>
                        Ilość
                      </th>
                      <th style={thStyle}>
                        Jednostka
                      </th>
                      <th style={thStyle}>
                        Cena / jednostkę
                      </th>
                      <th style={thStyle}>
                        Koszt
                      </th>
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
                              style={inputStyle}
                            />
                          </td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              min="0"
                              value={
                                ingredient.quantity
                              }
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
                              {formatMoney(cost)}
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            <button
                              onClick={() =>
                                removeIngredient(
                                  ingredient.id
                                )
                              }
                              style={
                                deleteButtonStyle
                              }
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

            <section style={resultsGridStyle}>
              <ResultCard
                title="Koszt składników"
                value={formatMoney(totalCost)}
              />

              <ResultCard
                title="Zysk"
                value={formatMoney(profit)}
              />

              <ResultCard
                title="Sugerowana cena"
                value={formatMoney(
                  sellingPrice
                )}
                highlighted
              />
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
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
          </>
        )}

        {view === "products" && (
          <EmptyModule
            title="Produkty"
            description="Tutaj będziemy zarządzać produktami, cenami zakupu, opakowaniami i jednostkami."
          />
        )}

        {view === "recipes" && (
          <EmptyModule
            title="Receptury"
            description="Tutaj będziemy tworzyć i zapisywać własne receptury."
          />
        )}

        {view === "orders" && (
          <EmptyModule
            title="Zamówienia"
            description="Tutaj będziemy zarządzać zamówieniami i terminami odbioru."
          />
        )}
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
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#ffffff",
        border: "1px solid #e9e2da",
        borderRadius: "18px",
        padding: "26px",
        minHeight: "150px",
        textAlign: "left",
        cursor: "pointer",
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
    <label style={labelStyle}>
      <div style={labelTextStyle}>
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

function EmptyModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <p style={mutedStyle}>
        {description}
      </p>

      <div
        style={{
          marginTop: "25px",
          padding: "25px",
          background: "#faf8f5",
          borderRadius: "12px",
          border: "1px dashed #ddd3c9",
          color: "#716b65",
        }}
      >
        Moduł przygotowany do dalszej
        rozbudowy.
      </div>
    </section>
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
  return `${value.toFixed(2).replace(".", ",")} zł`;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  color: "#292522",
  fontFamily: "Arial, sans-serif",
  padding: "40px 20px",
};

const containerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const loginPageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
  color: "#292522",
};

const loginBoxStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "35px",
  boxSizing: "border-box" as const,
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const brandStyle = {
  fontSize: "14px",
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
  color: "#8a6d4b",
  marginBottom: "10px",
};

const subtitleStyle = {
  color: "#716b65",
  fontSize: "17px",
  marginTop: "12px",
};

const mutedStyle = {
  color: "#716b65",
  lineHeight: 1.6,
};

const labelStyle = {
  display: "block",
  marginBottom: "18px",
};

const labelTextStyle = {
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
  background: "#fff",
  color: "#292522",
  fontSize: "14px",
};

const primaryButtonStyle = {
  width: "100%",
  border: "none",
  borderRadius: "10px",
  padding: "13px",
  background: "#8a6d4b",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
};

const primarySmallButtonStyle = {
  background: "#8a6d4b",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "11px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const logoutButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "10px",
  padding: "10px 15px",
  cursor: "pointer",
};

const backButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#8a6d4b",
  cursor: "pointer",
  fontSize: "15px",
  padding: 0,
  marginBottom: "25px",
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
};

const sectionStyle = {
  marginTop: "20px",
  background: "#ffffff",
  borderRadius: "18px",
  padding: "25px",
  border: "1px solid #e9e2da",
};

const sectionTitleStyle = {
  marginTop: 0,
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  marginBottom: "20px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "20px",
};

const resultsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginTop: "20px",
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

const deleteButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#9b4d43",
  cursor: "pointer",
};
