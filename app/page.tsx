"use client";

import { useEffect, useState } from "react";
import { supabase } from "../folder/lib/supabase";

type View =
  | "dashboard"
  | "newCake"
  | "products"
  | "recipes"
  | "orders";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [view, setView] = useState<View>("dashboard");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Błąd pobierania sesji:", error);
      }

      setSession(data.session);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoginError("");
    setLoginMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setLoginError("Podaj adres e-mail i hasło.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setLoginError(getAuthErrorMessage(error.message));
      return;
    }

    setSession(data.session);
    setView("dashboard");
    setPassword("");
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Błąd wylogowania:", error);
      return;
    }

    setSession(null);
    setView("dashboard");
    setEmail("");
    setPassword("");
    setLoginError("");
    setLoginMessage("");
  }

  async function handleResetPassword() {
    setLoginError("");
    setLoginMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setLoginError(
        "Najpierw wpisz adres e-mail, na który mamy wysłać link do zmiany hasła."
      );
      return;
    }

    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: redirectUrl,
      }
    );

    if (error) {
      setLoginError(getAuthErrorMessage(error.message));
      return;
    }

    setLoginMessage(
      "Jeżeli konto istnieje, wysłaliśmy wiadomość z instrukcją zmiany hasła."
    );
  }

  if (loading) {
    return (
      <main style={loginPageStyle}>
        <div style={loginBoxStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={brandStyle}>Délice</div>

            <h1
              style={{
                fontSize: "30px",
                margin: "0 0 10px",
              }}
            >
              Kalkulator tortów
            </h1>

            <p style={mutedStyle}>Sprawdzanie sesji...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
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
              <div style={labelTextStyle}>E-mail</div>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError("");
                }}
                placeholder="twoj@email.pl"
                autoComplete="email"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <div style={labelTextStyle}>Hasło</div>

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
              <div style={errorBoxStyle}>
                {loginError}
              </div>
            )}

            {loginMessage && (
              <div style={successBoxStyle}>
                {loginMessage}
              </div>
            )}

            <button
              type="submit"
              style={primaryButtonStyle}
            >
              Zaloguj się
            </button>
          </form>

          <button
            type="button"
            onClick={handleResetPassword}
            style={forgotPasswordButtonStyle}
          >
            Nie pamiętasz hasła?
          </button>

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

            <div
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "#8a6d4b",
              }}
            >
              Zalogowano jako: {session.user?.email}
            </div>
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
          </>
        )}

        {view === "newCake" && (
          <EmptyModule
            title="Nowy tort"
            description="Moduł kalkulacji tortów jest gotowy do dalszej rozbudowy."
          />
        )}

        {view === "products" && (
          <EmptyModule
            title="Produkty"
            description="Moduł produktów jest gotowy do dalszej rozbudowy."
          />
        )}

        {view === "recipes" && (
          <EmptyModule
            title="Receptury"
            description="Tutaj będziemy tworzyć i przeliczać własne receptury."
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

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "Nieprawidłowy e-mail lub hasło.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Adres e-mail nie został jeszcze potwierdzony.";
  }

  if (normalized.includes("too many requests")) {
    return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
  }

  if (normalized.includes("user not found")) {
    return "Nie znaleziono użytkownika.";
  }

  return "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.";
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

function EmptyModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>

      <p style={mutedStyle}>{description}</p>

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
        Moduł przygotowany do dalszej rozbudowy.
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

const forgotPasswordButtonStyle = {
  display: "block",
  width: "100%",
  marginTop: "15px",
  border: "none",
  background: "transparent",
  color: "#8a6d4b",
  fontSize: "14px",
  cursor: "pointer",
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "20px",
};

const errorBoxStyle = {
  marginBottom: "15px",
  padding: "12px",
  borderRadius: "9px",
  background: "#fdf0ee",
  border: "1px solid #e7c6c1",
  color: "#9b4d43",
  fontSize: "14px",
  lineHeight: 1.5,
};

const successBoxStyle = {
  marginBottom: "15px",
  padding: "12px",
  borderRadius: "9px",
  background: "#f3f8f1",
  border: "1px solid #cddfc7",
  color: "#56704e",
  fontSize: "14px",
  lineHeight: 1.5,
};
