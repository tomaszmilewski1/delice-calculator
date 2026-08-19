"use client";

import Recipes from "../components/recipes";

export default function Home() {
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
        <Recipes />
      </div>
    </main>
  );
}
