"use client";

import { useState } from "react";
import Recipes from "../components/recipes";
import Products from "../components/products";

type ActivePanel = "products" | "recipes";

export default function Home() {
  const [activePanel, setActivePanel] =
    useState<ActivePanel>("recipes");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f4f1",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e9e2da",
            borderRadius: "14px",
            padding: "6px",
            display: "flex",
            gap: "6px",
            marginBottom: "24px",
            width: "fit-content",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setActivePanel("recipes")
            }
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "11px 20px",
              background:
                activePanel === "recipes"
                  ? "#8a6d4b"
                  : "transparent",
              color:
                activePanel === "recipes"
                  ? "#ffffff"
                  : "#716b65",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Receptury
          </button>

          <button
            type="button"
            onClick={() =>
              setActivePanel("products")
            }
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "11px 20px",
              background:
                activePanel === "products"
                  ? "#8a6d4b"
                  : "transparent",
              color:
                activePanel === "products"
                  ? "#ffffff"
                  : "#716b65",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Produkty
          </button>
        </div>

        {activePanel === "recipes" ? (
          <Recipes />
        ) : (
          <Products />
        )}
      </div>
    </main>
  );
}
