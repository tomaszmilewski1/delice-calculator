"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setLoggedIn(!!session);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setLoggedIn(!!session);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");
  setLoggingIn(true);

  const cleanEmail = email.trim();

  if (!cleanEmail || !password) {
    setError("Wpisz e-mail i hasło.");
    setLoggingIn(false);
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  console.log("SUPABASE LOGIN DATA:", data);
  console.log("SUPABASE LOGIN ERROR:", error);

  if (error) {
    setError(
      `Supabase: ${error.message}`
    );
    setLoggingIn(false);
    return;
  }

  if (!data.session) {
    setError("Logowanie nie utworzyło sesji.");
    setLoggingIn(false);
    return;
  }

  setPassword("");
  setLoggingIn(false);
}
    event.preventDefault();

    setError("");
    setLoggingIn(true);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Wpisz e-mail i hasło.");
      setLoggingIn(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setError("Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.");
      setLoggingIn(false);
      return;
    }

    setPassword("");
    setLoggingIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>
          <div style={brandStyle}>Délice</div>
          <h1 style={loadingTitleStyle}>Kalkulator tortów</h1>
          <p style={mutedStyle}>Sprawdzanie sesji...</p>
        </div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main style={loginPageStyle}>
        <div style={loginBoxStyle}>
          <div style={loginHeaderStyle}>
            <div style={brandStyle}>Délice</div>

            <h1 style={loginTitleStyle}>
              Kalkulator tortów
            </h1>

            <p style={mutedStyle}>
              Zaloguj się do swojego panelu.
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
                style={inputStyle}
              />
            </label>

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
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
            <div style={brandStyle}>Délice</div>

            <h1 style={mainTitleStyle}>
              Kalkulator tortów
            </h1>

            <p style={subtitleStyle}>
              Zalogowano pomyślnie. Panel kalkulatora jest gotowy.
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={logoutButtonStyle}
          >
            Wyloguj się
          </button>
        </header>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  color: "#292522",
  fontFamily: "Arial, sans-serif",
  padding: "40px 20px",
  boxSizing: "border-box" as const,
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
  boxSizing: "border-box" as const,
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

const loadingBoxStyle = {
  maxWidth: "500px",
  margin: "100px auto",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "35px",
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

const loadingTitleStyle = {
  fontSize: "30px",
  margin: "0 0 10px",
};

const mainTitleStyle = {
  fontSize: "42px",
  margin: 0,
  fontWeight: 700,
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

const logoutButtonStyle = {
  border: "1px solid #ddd3c9",
  background: "#ffffff",
  color: "#8a6d4b",
  borderRadius: "10px",
  padding: "10px 15px",
  cursor: "pointer",
  fontSize: "14px",
};

const errorStyle = {
  background: "#fff1f0",
  border: "1px solid #e5b8b3",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "11px 12px",
  marginBottom: "15px",
  fontSize: "14px",
};

const loginFooterStyle = {
  textAlign: "center" as const,
  marginTop: "25px",
  fontSize: "13px",
  color: "#9a928b",
};

const headerStyle = {
  marginBottom: "30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
};
