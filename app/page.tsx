"use client";

import { useState } from "react";
import Products from "../components/Products";
import Recipes from "../components/Recipes";
import CakeCalculator from "../components/CakeCalculator";

export default function Page() {
  const [activeTab, setActiveTab] = useState<
    "products" | "recipes" | "calculator"
  >("calculator");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f3ef",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#292522",
              fontSize: "30px",
            }}
          >
            Délice — Kalkulator tortów
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#716b65",
            }}
          >
            Baza produktów, receptur oraz automatyczne wyliczanie kosztu tortu.
          </p>
        </header>

        <nav
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            style={{
              padding: "11px 16px",
              borderRadius: "9px",
              border: "1px solid #d8c8b8",
              background:
                activeTab === "calculator" ? "#8a6d4b" : "#ffffff",
              color:
                activeTab === "calculator" ? "#ffffff" : "#8a6d4b",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Kalkulator tortu
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            style={{
              padding: "11px 16px",
              borderRadius: "9px",
              border: "1px solid #d8c8b8",
              background:
                activeTab === "recipes" ? "#8a6d4b" : "#ffffff",
              color:
                activeTab === "recipes" ? "#ffffff" : "#8a6d4b",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Receptury
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            style={{
              padding: "11px 16px",
              borderRadius: "9px",
              border: "1px solid #d8c8b8",
              background:
                activeTab === "products" ? "#8a6d4b" : "#ffffff",
              color:
                activeTab === "products" ? "#ffffff" : "#8a6d4b",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Produkty
          </button>
        </nav>

        {activeTab === "calculator" && <CakeCalculator />}

        {activeTab === "recipes" && <Recipes />}

        {activeTab === "products" && <Products />}
      </div>
    </main>
  );
}
