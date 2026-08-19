"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

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

      console.log("SUPABASE LOGIN DATA:", data);
      console.log("SUPABASE LOGIN ERROR:", loginError);

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
          "Logowanie zostało wykonane, ale Supabase nie zwrócił sesji."
        );

        setDebugInfo(
          "signInWithPassword zakończyło się bez błędu, ale session = null."
        );

        setLoggingIn(false);
        return;
      }

      console.log(
        "ZALOGOWANO UID:",
        data.user?.id
      );

      setLoggedIn(true);
      setPassword("");
      setError("");
      setDebugInfo("");

      setLoggingIn(false);
    } catch (unknownError) {
      console.error(
        "NIEOCZEKIWANY BŁĄD LOGOWANIA:",
        unknownError
      );

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

        setDebugInfo(
          String(unknownError)
        );
      }

      setLoggingIn(false);
    }
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
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>
          <div style={brandStyle}>
            Délice
          </div>

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
  fontFamily: "Arial, sans-serif",
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
  marginBottom: "30px",
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
