"use client";

import { useState } from "react";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (email && password) {
      setLoggedIn(true);
    }
  }

  if (!loggedIn) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#faf8f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          color: "#292522",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#ffffff",
            border: "1px solid #e9e2da",
            borderRadius: "20px",
            padding: "35px",
            boxSizing: "border-box",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: "#8a6d4b",
                marginBottom: "10px",
              }}
            >
              Délice
            </div>

            <h1
              style={{
                fontSize: "30px",
                margin: 0,
              }}
            >
              Kalkulator tortów
            </h1>

            <p
              style={{
                color: "#716b65",
                marginTop: "10px",
                marginBottom: 0,
              }}
            >
              Zaloguj się do swojego panelu
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <label
              style={{
                display: "block",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#716b65",
                  marginBottom: "7px",
                }}
              >
                E-mail
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="np. delice@example.com"
                required
                style={inputStyle}
              />
            </label>

            <label
              style={{
                display: "block",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#716b65",
                  marginBottom: "7px",
                }}
              >
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
              style={{
                width: "100%",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                background: "#8a6d4b",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
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
    <main
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#292522",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header>
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#8a6d4b",
            }}
          >
            Délice
          </div>

          <h1>Kalkulator tortów</h1>

          <p>
            Zalogowano pomyślnie. Panel kalkulatora jest gotowy.
          </p>
        </header>

        <button
          onClick={() => setLoggedIn(false)}
          style={{
            marginTop: "20px",
            border: "none",
            background: "#8a6d4b",
            color: "#ffffff",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Wyloguj się
        </button>
      </div>
    </main>
  );
}

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
