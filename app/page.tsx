"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Products from "../components/Products";

type View =
  | "dashboard"
  | "cake"
  | "products"
  | "recipes"
  | "orders"
  | "customers"
  | "expenses";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const [view, setView] = useState<View>("dashboard");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError) {
        setDebugInfo(
          `Błąd sprawdzania sesji: ${sessionError.message}`
        );
      }

      setLoggedIn(!!session);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) {
          return;
        }

        setLoggedIn(!!session);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setDebugInfo("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Wpisz e-mail i hasło.");
      return;
    }

    setLoggingIn(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        setError(
          "Supabase zwrócił błąd podczas logowania."
        );

        setDebugInfo(
          [
            `message: ${loginError.message}`,
            `status: ${loginError.status ?? "brak"}`,
            `name: ${loginError.name ?? "brak"}`,
          ].join("\n")
        );

        setLoggingIn(false);
        return;
      }

      if (!data.session) {
        setError(
          "Logowanie zostało wykonane, ale nie otrzymano sesji."
        );

        setLoggingIn(false);
        return;
      }

      setLoggedIn(true);
      setView("dashboard");
      setPassword("");
      setError("");
      setDebugInfo("");
    } catch (unknownError) {
      if (unknownError instanceof Error) {
        setError(
          "Wystąpił nieoczekiwany błąd logowania."
        );

        setDebugInfo(
          `${unknownError.name}: ${unknownError.message}`
        );
      } else {
        setError(
          "Wystąpił nieoczekiwany błąd logowania."
        );

        setDebugInfo(String(unknownError));
      }
    }

    setLoggingIn(false);
  }

  async function handleLogout() {
    setError("");
    setDebugInfo("");

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      setError(
        `Błąd wylogowania: ${logoutError.message}`
      );
      return;
    }

    setLoggedIn(false);
    setEmail("");
    setPassword("");
    setView("dashboard");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>
          <div style={brandStyle}>Délice</div>

          <h1 style={titleStyle}>
            Kalkulator tortów
          </h1>

          <p style={mutedStyle}>
            Sprawdzanie sesji...
          </p>
        </div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main style={loginPageStyle}>
        <div style={loginBoxStyle}>
          <div style={loginHeaderStyle}>
            <div style={brandStyle}>
              Délice
            </div>

            <h1 style={loginTitleStyle}>
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
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Wpisz e-mail"
                autoComplete="email"
                disabled={loggingIn}
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
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Wpisz hasło"
                autoComplete="current-password"
                disabled={loggingIn}
                required
                style={inputStyle}
              />
            </label>

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            {debugInfo && (
              <pre style={debugStyle}>
                {debugInfo}
              </pre>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              style={{
                ...primaryButtonStyle,
                opacity: loggingIn ? 0.7 : 1,
                cursor: loggingIn
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loggingIn
                ? "Logowanie..."
                : "Zaloguj się"}
            </button>
          </form>

          <div style={loginFooterStyle}>
            Panel zarządzania Délice
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <div style={brandStyle}>
              Délice
            </div>

            <h1 style={titleStyle}>
              Kalkulator tortów
            </h1>

            <p style={subtitleStyle}>
              Panel zarządzania pracownią cukierniczą
            </p>
          </div>

          <button
            onClick={handleLogout}
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
                description="Oblicz koszt wykonania, cenę sprzedaży i zysk."
                onClick={() => setView("cake")}
              />

              <DashboardCard
                title="Produkty"
                description="Zarządzaj produktami, cenami i jednostkami."
                onClick={() => setView("products")}
              />

              <DashboardCard
                title="Receptury"
                description="Twórz i przechowuj własne receptury."
                onClick={() => setView("recipes")}
              />

              <DashboardCard
                title="Zamówienia"
                description="Kontroluj zamówienia, wpłaty i terminy."
                onClick={() => setView("orders")}
              />

              <DashboardCard
                title="Klienci"
                description="Przechowuj dane klientów i historię zamówień."
                onClick={() => setView("customers")}
              />

              <DashboardCard
                title="Koszty"
                description="Kontroluj dodatkowe koszty wykonania tortów."
                onClick={() => setView("expenses")}
              />
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                Podsumowanie
              </h2>

              <p style={mutedStyle}>
                Najważniejsze informacje z pracowni.
              </p>

              <div style={statsGridStyle}>
                <Stat
                  title="Torty"
                  value="0"
                />

                <Stat
                  title="Zamówienia"
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

            <section style={welcomeSectionStyle}>
              <div style={welcomeIconStyle}>
                D
              </div>

              <div>
                <h2 style={{ margin: 0 }}>
                  Witaj w panelu Délice
                </h2>

                <p style={welcomeTextStyle}>
                  Wybierz jeden z modułów powyżej,
                  aby rozpocząć pracę.
                </p>
              </div>
            </section>
          </>
        )}

        {view === "products" && (
          <Products />
        )}

        {view === "cake" && (
          <ModulePage
            title="Nowy tort"
            description="Moduł kalkulatora tortów przygotujemy w kolejnym kroku."
          />
        )}

        {view === "recipes" && (
          <ModulePage
            title="Receptury"
            description="Moduł receptur przygotujemy w kolejnym kroku."
          />
        )}

        {view === "orders" && (
          <ModulePage
            title="Zamówienia"
            description="Moduł zamówień przygotujemy w kolejnym kroku."
          />
        )}

        {view === "customers" && (
          <ModulePage
            title="Klienci"
            description="Moduł klientów przygotujemy w kolejnym kroku."
          />
        )}

        {view === "expenses" && (
          <ModulePage
            title="Koszty"
            description="Moduł kosztów przygotujemy w kolejnym kroku."
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
      type="button"
      onClick={onClick}
      style={dashboardCardStyle}
    >
      <div style={cardIconStyle}>
        {title.charAt(0)}
      </div>

      <h2 style={cardTitleStyle}>
        {title}
      </h2>

      <p style={cardDescriptionStyle}>
        {description}
      </p>

      <div style={cardArrowStyle}>
        Otwórz →
      </div>
    </button>
  );
}

function ModulePage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section style={sectionStyle}>
      <div style={moduleHeaderStyle}>
        <div style={moduleIconStyle}>
          {title.charAt(0)}
        </div>

        <div>
          <h2 style={moduleTitleStyle}>
            {title}
          </h2>

          <p style={mutedStyle}>
            {description}
          </p>
        </div>
      </div>
    </section>
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
    <div style={statStyle}>
      <div style={statTitleStyle}>
        {title}
      </div>

      <strong style={statValueStyle}>
        {value}
      </strong>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  color: "#292522",
  fontFamily: "Arial, Helvetica, sans-serif",
  padding: "40px 20px",
  boxSizing: "border-box" as const,
};

const containerStyle = {
  maxWidth: "1150px",
  margin: "0 auto",
};

const loginPageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#292522",
  boxSizing: "border-box" as const,
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

const loadingBoxStyle = {
  width: "100%",
  maxWidth: "420px",
  margin: "120px auto",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "35px",
  boxSizing: "border-box" as const,
  textAlign: "center" as const,
};

const loginHeaderStyle = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const brandStyle = {
  fontSize: "14px",
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
  color: "#8a6d4b",
  marginBottom: "10px",
};

const loginTitleStyle = {
  fontSize: "30px",
  margin: 0,
};

const titleStyle = {
  fontSize: "42px",
  margin: 0,
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

const welcomeTextStyle = {
  color: "rgba(255,255,255,0.82)",
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
  padding: "13px",
  border: "1px solid #ddd3c9",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#292522",
  fontSize: "14px",
  outline: "none",
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
};

const errorStyle = {
  background: "#fff1f0",
  border: "1px solid #e7b8b3",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "12px",
  marginBottom: "12px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const debugStyle = {
  background: "#f5f5f5",
  border: "1px solid #ddd3c9",
  color: "#292522",
  borderRadius: "9px",
  padding: "12px",
  marginBottom: "18px",
  fontSize: "12px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap" as const,
  overflowX: "auto" as const,
};

const loginFooterStyle = {
  textAlign: "center" as const,
  marginTop: "25px",
  fontSize: "13px",
  color: "#9a928b",
};

const headerStyle = {
  marginBottom: "35px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
};

const logoutButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "10px",
  padding: "10px 15px",
  cursor: "pointer",
  fontSize: "14px",
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
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const dashboardCardStyle = {
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "18px",
  padding: "25px",
  minHeight: "190px",
  textAlign: "left" as const,
  cursor: "pointer",
  color: "#292522",
  width: "100%",
  boxSizing: "border-box" as const,
};

const cardIconStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "18px",
  marginBottom: "18px",
};

const cardTitleStyle = {
  margin: "0 0 9px 0",
  fontSize: "21px",
};

const cardDescriptionStyle = {
  color: "#716b65",
  lineHeight: 1.55,
  margin: 0,
  minHeight: "48px",
};

const cardArrowStyle = {
  color: "#8a6d4b",
  fontSize: "14px",
  fontWeight: 600,
  marginTop: "18px",
};

const sectionStyle = {
  marginTop: "22px",
  background: "#ffffff",
  borderRadius: "18px",
  padding: "28px",
  border: "1px solid #e9e2da",
  boxSizing: "border-box" as const,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "24px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "15px",
  marginTop: "22px",
};

const statStyle = {
  background: "#faf8f5",
  borderRadius: "14px",
  padding: "22px",
  border: "1px solid #eee7e0",
};

const statTitleStyle = {
  color: "#8a6d4b",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  marginBottom: "9px",
};

const statValueStyle = {
  fontSize: "28px",
};

const welcomeSectionStyle = {
  marginTop: "22px",
  background: "#8a6d4b",
  color: "#ffffff",
  borderRadius: "18px",
  padding: "25px",
  display: "flex",
  alignItems: "center",
  gap: "18px",
  boxSizing: "border-box" as const,
};

const welcomeIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.16)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 700,
  flexShrink: 0,
};

const moduleHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const moduleIconStyle = {
  width: "54px",
  height: "54px",
  borderRadius: "14px",
  background: "#f2ebe4",
  color: "#8a6d4b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 700,
  flexShrink: 0,
};

const moduleTitleStyle = {
  margin: 0,
  fontSize: "30px",
};
