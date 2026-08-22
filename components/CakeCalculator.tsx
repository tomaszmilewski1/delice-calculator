"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  portions: number | null;
  diameter_cm: number | null;
  height_cm: number | null;
  cost: number | null;
  active: boolean;
};

type Product = {
  id: string;
  name: string;
  unit: string | null;
  package_quantity: number | null;
  package_price: number | null;
  active: boolean;
};

type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string;
  quantity: number;
  unit: string;
};

type Accessory = {
  id: string;
  name: string;
  category: string | null;
  unit_price: number | null;
  stock_quantity: number | null;
};

type SelectedRecipeItem = {
  recipeId: string;
  recipeName: string;
  category: string;
  baseDiameter: number;
  baseHeight: number;
};

type SelectedAccessoryItem = {
  accessoryId: string;
  name: string;
  quantity: number;
  price: number;
};

function normalizeUnit(unit: string) {
  return unit
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ąćęłńóśźż]/g, (l) => {
      const map: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
      return map[l] ?? l;
    });
}

function calculateCost(
  quantity: number,
  quantityUnit: string,
  packageQuantity: number,
  packageUnit: string,
  packagePrice: number
) {
  if (!quantity || !packageQuantity || !packagePrice || quantity <= 0 || packageQuantity <= 0 || packagePrice < 0) {
    return 0;
  }

  const qU = normalizeUnit(quantityUnit);
  const pU = normalizeUnit(packageUnit);

  const pieceUnits = ["szt", "sztuka", "sztuki", "sztuk", "opak."];
  const weightUnits = ["g", "gram", "gramy", "kg", "kilogram"];
  const volumeUnits = ["ml", "mililitr", "l", "litr"];

  if (pieceUnits.includes(qU) && pieceUnits.includes(pU)) return (quantity / packageQuantity) * packagePrice;

  if (weightUnits.includes(qU) && weightUnits.includes(pU)) {
    let qGrams = quantity;
    let pGrams = packageQuantity;
    if (qU.startsWith("kg")) qGrams *= 1000;
    if (pU.startsWith("kg")) pGrams *= 1000;
    return (qGrams / pGrams) * packagePrice;
  }

  if (volumeUnits.includes(qU) && volumeUnits.includes(pU)) {
    let qMl = quantity;
    let pMl = packageQuantity;
    if (qU.startsWith("l")) qMl *= 1000;
    if (pU.startsWith("l")) pMl *= 1000;
    return (qMl / pMl) * packagePrice;
  }

  return (quantity / packageQuantity) * packagePrice;
}

function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const num = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(num) ? num : 0;
}

function formatMoney(value: number) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} zł`;
}

export default function CakeCalculator() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Wymiary docelowe tortu
  const [cakeName, setCakeName] = useState("Nowy Tort Kompozycja");
  const [targetDiameter, setTargetDiameter] = useState("18");
  const [targetHeight, setTargetHeight] = useState("12");
  const [targetPortions, setTargetPortions] = useState("14");

  // Receptury składowe w torcie
  const [selectedRecipes, setSelectedRecipes] = useState<SelectedRecipeItem[]>([]);
  const [recipeToAdd, setRecipeToAdd] = useState("");

  // Dodatki i opakowania
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessoryItem[]>([]);
  const [accessoryToAdd, setAccessoryToAdd] = useState("");

  // Koszty dodatkowe i marża
  const [laborCost, setLaborCost] = useState("40");
  const [energyCost, setEnergyCost] = useState("15");
  const [marginPercent, setMarginPercent] = useState("40");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [recRes, prodRes, ingRes, accRes] = await Promise.all([
        supabase.from("recipes").select("*").eq("active", true).order("name", { ascending: true }),
        supabase.from("products").select("*").eq("active", true).order("name", { ascending: true }),
        supabase.from("recipe_ingredients").select("*"),
        supabase.from("accessories").select("*").order("name", { ascending: true }),
      ]);

      if (recRes.error) throw recRes.error;
      if (prodRes.error) throw prodRes.error;
      if (ingRes.error) throw ingRes.error;

      setRecipes((recRes.data || []) as Recipe[]);
      setProducts((prodRes.data || []) as Product[]);
      setIngredients((ingRes.data || []) as RecipeIngredient[]);
      setAccessories((accRes.data || []) as Accessory[]);
    } catch (err: any) {
      setError(`Błąd wczytywania danych: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleAddRecipe() {
    if (!recipeToAdd) return;
    const r = recipes.find((x) => x.id === recipeToAdd);
    if (!r) return;

    setSelectedRecipes((curr) => [
      ...curr,
      {
        recipeId: r.id,
        recipeName: r.name,
        category: r.category || "Składnik tortu",
        baseDiameter: Number(r.diameter_cm) || Number(targetDiameter) || 18,
        baseHeight: Number(r.height_cm) || Number(targetHeight) || 10,
      },
    ]);
    setRecipeToAdd("");
  }

  function handleRemoveRecipe(index: number) {
    setSelectedRecipes((curr) => curr.filter((_, i) => i !== index));
  }

  function handleAddAccessory() {
    if (!accessoryToAdd) return;
    const a = accessories.find((x) => x.id === accessoryToAdd);
    if (!a) return;

    setSelectedAccessories((curr) => [
      ...curr,
      {
        accessoryId: a.id,
        name: a.name,
        quantity: 1,
        price: Number(a.unit_price) || 0,
      },
    ]);
    setAccessoryToAdd("");
  }

  function handleRemoveAccessory(index: number) {
    setSelectedAccessories((curr) => curr.filter((_, i) => i !== index));
  }

  // Wyliczenie surowców dla wszystkich dodanych receptur z uwzględnieniem skali wymiarów
  const calculatedIngredients = useMemo(() => {
    const curDiam = parseDecimal(targetDiameter) || 18;
    const curH = parseDecimal(targetHeight) || 12;

    const list: Array<{
      recipeName: string;
      productName: string;
      unit: string;
      quantity: number;
      cost: number;
    }> = [];

    selectedRecipes.forEach((sel) => {
      const baseD = sel.baseDiameter || 18;
      const baseH = sel.baseHeight || 10;
      // Współczynnik skali objętości (V = pi * r^2 * h)
      const scale = (curDiam * curDiam * curH) / (baseD * baseD * baseH);

      const recIngs = ingredients.filter((ing) => ing.recipe_id === sel.recipeId);

      recIngs.forEach((ing) => {
        const prod = products.find((p) => p.id === ing.product_id);
        const scaledQty = Number(ing.quantity || 0) * (scale > 0 ? scale : 1);
        const cost = prod
          ? calculateCost(
              scaledQty,
              ing.unit || prod.unit || "g",
              Number(prod.package_quantity) || 1,
              prod.unit || "g",
              Number(prod.package_price) || 0
            )
          : 0;

        list.push({
          recipeName: sel.recipeName,
          productName: prod?.name || "Nieznany surowiec",
          unit: ing.unit || prod?.unit || "g",
          quantity: scaledQty,
          cost,
        });
      });
    });

    return list;
  }, [selectedRecipes, targetDiameter, targetHeight, ingredients, products]);

  const totalIngredientsCost = useMemo(() => {
    return calculatedIngredients.reduce((sum, item) => sum + item.cost, 0);
  }, [calculatedIngredients]);

  const totalAccessoriesCost = useMemo(() => {
    return selectedAccessories.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedAccessories]);

  const parsedLabor = parseDecimal(laborCost);
  const parsedEnergy = parseDecimal(energyCost);
  const parsedMargin = parseDecimal(marginPercent);

  const totalCakeCost = totalIngredientsCost + totalAccessoriesCost + parsedLabor + parsedEnergy;
  const finalCakePrice = totalCakeCost * (1 + parsedMargin / 100);

  const parsedPortions = parseDecimal(targetPortions) || 14;
  const pricePerPortion = parsedPortions > 0 ? finalCakePrice / parsedPortions : 0;

  async function handleCreateOrderFromCalc() {
    setError("");
    setSuccess("");

    if (selectedRecipes.length === 0) {
      setError("Dodaj przynajmniej jedną recepturę składową do tortu.");
      return;
    }

    try {
      const notesArray = selectedRecipes.map((r) => r.recipeName);
      if (selectedAccessories.length > 0) {
        notesArray.push(`Dodatki: ${selectedAccessories.map((a) => a.name).join(", ")}`);
      }

      const orderPayload = {
        client_name: "Klient z kalkulatora (do uzupełnienia)",
        cake_name: cakeName,
        diameter_cm: parseDecimal(targetDiameter) || 18,
        height_cm: parseDecimal(targetHeight) || 12,
        portions: parsedPortions,
        total_price: Number(finalCakePrice.toFixed(2)),
        advance_payment: 0,
        delivery_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), // domyślnie za 3 dni
        delivery_time: "14:00",
        status: "nowe",
        description: `Kompozycja smaków: ${notesArray.join(" + ")}`,
      };

      const { error: insErr } = await supabase.from("orders").insert(orderPayload);
      if (insErr) throw insErr;

      setSuccess("Pomyślnie utworzono nowe zamówienie na podstawie tej kalkulacji! Znajdziesz je w zakładce Zamówienia.");
    } catch (err: any) {
      setError(`Błąd tworzenia zamówienia: ${err.message}`);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e9e2da",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 9,
    border: "1px solid #ddd3c9",
    fontSize: 14,
    background: "#fff",
    color: "#292522",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#514b46",
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", paddingBottom: 60 }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cake-calc-print, #cake-calc-print * { visibility: visible !important; }
          #cake-calc-print { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .delice-no-print { display: none !important; }
        }
      `}</style>

      <div className="delice-no-print" style={{ marginBottom: 24 }}>
        <div style={{ color: "#8a6d4b", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          KOMPOZYCJA I WYCENA TORTU
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 28, color: "#292522" }}>Kalkulator wielowarstwowy tortu</h2>
        <p style={{ margin: "6px 0 0", color: "#716b65" }}>
          Skomponuj tort z kilku receptur (biszkopt, kremy, żelki, tynk), dodaj opakowanie i otrzymaj dokładny kosztorys ze skalowaniem.
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 14, background: "#ecfdf5", color: "#047857", borderRadius: 12, marginBottom: 20 }}>
          {success}
        </div>
      )}

      <div id="cake-calc-print" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
        {/* LEWA KOLUMNA: PARAMETRY I WYBÓR RECEPTUR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Nazwa i rozmiar tortu */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#292522" }}>1. Rozmiar i nazwa tortu</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={labelStyle}>
                Nazwa kompozycji / stylu
                <input
                  type="text"
                  value={cakeName}
                  onChange={(e) => setCakeName(e.target.value)}
                  placeholder="np. Tort Pistacja-Malina z Chrupką"
                  style={inputStyle}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <label style={labelStyle}>
                  Średnica (cm)
                  <input
                    type="number"
                    value={targetDiameter}
                    onChange={(e) => setTargetDiameter(e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Wysokość (cm)
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Porcje
                  <input
                    type="number"
                    value={targetPortions}
                    onChange={(e) => setTargetPortions(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Wybór składowych receptur */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#292522" }}>2. Receptury składowe w torcie</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#716b65" }}>
              Dodaj biszkopt, kremy, żelki i tynk, które tworzą ten tort:
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <select
                value={recipeToAdd}
                onChange={(e) => setRecipeToAdd(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">-- Wybierz recepturę z bazy --</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.category ? `(${r.category})` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddRecipe}
                disabled={!recipeToAdd}
                style={{ ...buttonStyle, background: "#8a6d4b", color: "#fff", whiteSpace: "nowrap" }}
              >
                + Dodaj warstwę
              </button>
            </div>

            {selectedRecipes.length === 0 ? (
              <div style={{ padding: 18, border: "1px dashed #ddd3c9", borderRadius: 12, textAlign: "center", color: "#8a837d", fontSize: 13 }}>
                Brak dodanych receptur. Wybierz z listy powyżej (np. biszkopt + krem).
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedRecipes.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "#fdfbf9",
                      border: "1px solid #eee7e0",
                      borderRadius: 10,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: "#292522" }}>{item.recipeName}</strong>
                      <div style={{ fontSize: 11, color: "#8a6d4b" }}>
                        Kategoria: {item.category} | Baza: ⌀{item.baseDiameter}cm × {item.baseHeight}cm
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipe(idx)}
                      style={{ border: "none", background: "#fee2e2", color: "#b91c1c", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dodatki i opakowania */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#292522" }}>3. Dodatki niespożywcze i opakowania</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#716b65" }}>
              Wybierz podkład, pudełko lub topper:
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <select
                value={accessoryToAdd}
                onChange={(e) => setAccessoryToAdd(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">-- Wybierz dodatek / opakowanie --</option>
                {accessories.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatMoney(Number(a.unit_price || 0))})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddAccessory}
                disabled={!accessoryToAdd}
                style={{ ...buttonStyle, background: "#8a6d4b", color: "#fff", whiteSpace: "nowrap" }}
              >
                + Dodaj
              </button>
            </div>

            {selectedAccessories.map((acc, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#fdfbf9",
                  border: "1px solid #eee7e0",
                  borderRadius: 10,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, color: "#292522", fontWeight: 600 }}>{acc.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#047857", fontWeight: 700 }}>
                    {formatMoney(acc.price * acc.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAccessory(idx)}
                    style={{ border: "none", background: "#fee2e2", color: "#b91c1c", borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontWeight: 700 }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Koszty stałe i marża */}
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 14px", fontSize: 18, color: "#292522" }}>4. Robocizna, energia i marża</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Robocizna (zł)
                <input
                  type="text"
                  inputMode="decimal"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Prąd / gaz (zł)
                <input
                  type="text"
                  inputMode="decimal"
                  value={energyCost}
                  onChange={(e) => setEnergyCost(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Marża (%)
                <input
                  type="text"
                  inputMode="decimal"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        </div>

        {/* PRAWA KOLUMNA: KALKULACJA I PODSUMOWANIE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#292522" }}>Pełny kosztorys kompozycji</h3>
              <div style={{ background: "#ecfdf5", color: "#047857", padding: "6px 12px", borderRadius: 8, fontWeight: 800, fontSize: 18 }}>
                {formatMoney(finalCakePrice)}
              </div>
            </div>

            {calculatedIngredients.length === 0 ? (
              <div style={{ padding: 30, border: "1px dashed #ddd3c9", borderRadius: 12, textAlign: "center", color: "#8a837d" }}>
                Dodaj receptury po lewej stronie, aby zobaczyć przeliczone składniki i kosztorys.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8a6d4b", marginBottom: 10, textTransform: "uppercase" }}>
                  Składniki po przeskalowaniu (⌀{targetDiameter} cm × {targetHeight} cm):
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                  {calculatedIngredients.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "#fdfbf9",
                        border: "1px solid #eee7e0",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <strong>{item.productName}</strong>
                        <div style={{ fontSize: 11, color: "#716b65" }}>
                          Z receptury: <em>{item.recipeName}</em>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#292522" }}>
                          {item.quantity.toFixed(1).replace(".", ",")} {item.unit}
                        </div>
                        <div style={{ fontSize: 12, color: "#047857", fontWeight: 700 }}>
                          {formatMoney(item.cost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PODSUMOWANIE FINANSOWE */}
                <div style={{ marginTop: 20, borderTop: "2px solid #eee7e0", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#514b46" }}>
                    <span>Koszt surowców spożywczych:</span>
                    <strong>{formatMoney(totalIngredientsCost)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#514b46" }}>
                    <span>Dodatki i opakowania:</span>
                    <strong>{formatMoney(totalAccessoriesCost)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#514b46" }}>
                    <span>Robocizna i media:</span>
                    <strong>{formatMoney(parsedLabor + parsedEnergy)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#292522", borderTop: "1px solid #eee7e0", paddingTop: 8 }}>
                    <span>Łączny koszt wytworzenia:</span>
                    <span>{formatMoney(totalCakeCost)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fffdfa",
                      border: "2px solid #8a6d4b",
                      borderRadius: 12,
                      padding: 14,
                      marginTop: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#8a6d4b", fontWeight: 800, letterSpacing: 1 }}>
                        SUGEROWANA CENA DLA KLIENTA (MARŻA {parsedMargin}%)
                      </div>
                      <div style={{ fontSize: 12, color: "#716b65", marginTop: 2 }}>
                        ~ {formatMoney(pricePerPortion)} za 1 porcję ({parsedPortions} porcji)
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#8a6d4b" }}>
                      {formatMoney(finalCakePrice)}
                    </div>
                  </div>

                  <div className="delice-no-print" style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={handleCreateOrderFromCalc}
                      style={{
                        ...buttonStyle,
                        flex: 1,
                        background: "#8a6d4b",
                        color: "#ffffff",
                        padding: "12px 14px",
                        fontSize: 14,
                      }}
                    >
                      ✓ Zapisz jako zamówienie
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        ...buttonStyle,
                        background: "#f4f0ec",
                        color: "#514b46",
                        padding: "12px 16px",
                        fontSize: 13,
                      }}
                    >
                      🖨 Drukuj
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
