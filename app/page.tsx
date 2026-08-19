"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setLoggedIn(!!session);
        setLoading(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoggingIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(
        "Nieprawidłowy e-mail lub hasło."
      );
      setLoggingIn(false);
      return;
    }

    setPassword("");
    setLoggingIn(false);
  }

  async function logout() {
    await supabase.auth.signOut();

    setLoggedIn(false);
    setEmail("");
    setPassword("");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>
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
            Ładowanie panelu...
          </p>
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
                fontWeight: 700,
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Wpisz adres e-mail"
                required
                autoComplete="email"
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
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Wpisz hasło"
                required
                autoComplete="current-password"
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
                  ? "wait"
                  : "pointer",
              }}
            >
              {loggingIn
                ? "Logowanie..."
                : "Zaloguj się"}
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
      <div style={successBoxStyle}>
        <div style={brandStyle}>Délice</div>

        <h1
          style={{
            fontSize: "36px",
            margin: "0 0 12px",
            fontWeight: 700,
          }}
        >
          Kalkulator tortów
        </h1>

        <p
          style={{
            color: "#716b65",
            fontSize: "17px",
            margin: "0 0 30px",
          }}
        >
          Zalogowano pomyślnie. Panel kalkulatora
          jest gotowy.
        </p>

        <button
          onClick={logout}
          style={logoutButtonStyle}
        >
          Wyloguj się
        </button>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#faf8f5",
  color: "#292522",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box" as const,
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
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.05)",
};

const loadingBoxStyle = {
  width: "100%",
  maxWidth: "500px",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "40px",
  boxSizing: "border-box" as const,
  textAlign: "center" as const,
};

const successBoxStyle = {
  width: "100%",
  maxWidth: "700px",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "45px",
  boxSizing: "border-box" as const,
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.05)",
  textAlign: "center" as const,
};

const brandStyle = {
  fontSize: "14px",
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
  color: "#8a6d4b",
  marginBottom: "10px",
};

const mutedStyle = {
  color: "#716b65",
  lineHeight: 1.6,
  marginTop: "12px",
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
  padding: "14px",
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
  padding: "12px 22px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
};

const errorStyle = {
  background: "#fff3f1",
  border: "1px solid #e7c5bf",
  color: "#9b4d43",
  borderRadius: "9px",
  padding: "11px 12px",
  marginBottom: "16px",
  fontSize: "14px",
};
