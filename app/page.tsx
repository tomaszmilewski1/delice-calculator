"use client";

import { useState } from "react";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (email.trim() && password.trim()) {
      setLoggedIn(true);
    }
  }

  function logout() {
    setLoggedIn(false);
    setEmail("");
    setPassword("");
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Wpisz adres e-mail"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wpisz hasło"
                required
                style={inputStyle}
              />
            </label>

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
          Zalogowano pomyślnie. Panel kalkulatora jest gotowy.
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
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const successBoxStyle = {
  width: "100%",
  maxWidth: "700px",
  background: "#ffffff",
  border: "1px solid #e9e2da",
  borderRadius: "20px",
  padding: "45px",
  boxSizing: "border-box" as const,
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
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
  cursor: "pointer",
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
