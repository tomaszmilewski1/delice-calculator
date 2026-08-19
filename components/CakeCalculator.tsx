function calculateCost(
  quantity: number,
  quantityUnit: string,
  packageQuantity: number,
  packageUnit: string,
  packagePrice: number
) {
  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(packageQuantity) ||
    !Number.isFinite(packagePrice) ||
    quantity <= 0 ||
    packageQuantity <= 0 ||
    packagePrice < 0
  ) {
    return 0;
  }

  function normalizeUnit(unit: string) {
    return unit
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[ąćęłńóśźż]/g, (letter) => {
        const map: Record<string, string> = {
          ą: "a",
          ć: "c",
          ę: "e",
          ł: "l",
          ń: "n",
          ó: "o",
          ś: "s",
          ź: "z",
          ż: "z",
        };

        return map[letter] ?? letter;
      });
  }

  const quantityUnitNormalized =
    normalizeUnit(quantityUnit);

  const packageUnitNormalized =
    normalizeUnit(packageUnit);

  const pieceUnits = [
    "szt",
    "szt.",
    "sztuka",
    "sztuki",
    "sztuk",
  ];

  const weightUnits = [
    "g",
    "gram",
    "gramy",
    "gramow",
    "kg",
    "kilogram",
    "kilogramy",
    "kilogramow",
  ];

  const volumeUnits = [
    "ml",
    "mililitr",
    "mililitry",
    "mililitrow",
    "l",
    "litr",
    "litry",
    "litrow",
  ];

  const quantityIsPieces =
    pieceUnits.includes(quantityUnitNormalized);

  const packageIsPieces =
    pieceUnits.includes(packageUnitNormalized);

  /*
   * SZTUKI
   *
   * np.:
   * 3 szt / 10 szt × 9 zł = 2,70 zł
   */
  if (quantityIsPieces && packageIsPieces) {
    return (
      (quantity / packageQuantity) *
      packagePrice
    );
  }

  /*
   * WAGA
   *
   * Wszystko przeliczamy na gramy.
   *
   * 500 g / 1 kg
   * 500 g / 1000 g
   * = 0,5 opakowania
   */
  const quantityIsWeight =
    weightUnits.includes(quantityUnitNormalized);

  const packageIsWeight =
    weightUnits.includes(packageUnitNormalized);

  if (quantityIsWeight && packageIsWeight) {
    let quantityInGrams = quantity;
    let packageInGrams = packageQuantity;

    if (
      quantityUnitNormalized === "kg" ||
      quantityUnitNormalized === "kilogram" ||
      quantityUnitNormalized === "kilogramy" ||
      quantityUnitNormalized === "kilogramow"
    ) {
      quantityInGrams *= 1000;
    }

    if (
      packageUnitNormalized === "kg" ||
      packageUnitNormalized === "kilogram" ||
      packageUnitNormalized === "kilogramy" ||
      packageUnitNormalized === "kilogramow"
    ) {
      packageInGrams *= 1000;
    }

    return (
      (quantityInGrams / packageInGrams) *
      packagePrice
    );
  }

  /*
   * OBJĘTOŚĆ
   *
   * Wszystko przeliczamy na ml.
   */
  const quantityIsVolume =
    volumeUnits.includes(quantityUnitNormalized);

  const packageIsVolume =
    volumeUnits.includes(packageUnitNormalized);

  if (quantityIsVolume && packageIsVolume) {
    let quantityInMl = quantity;
    let packageInMl = packageQuantity;

    if (
      quantityUnitNormalized === "l" ||
      quantityUnitNormalized === "litr" ||
      quantityUnitNormalized === "litry" ||
      quantityUnitNormalized === "litrow"
    ) {
      quantityInMl *= 1000;
    }

    if (
      packageUnitNormalized === "l" ||
      packageUnitNormalized === "litr" ||
      packageUnitNormalized === "litry" ||
      packageUnitNormalized === "litrow"
    ) {
      packageInMl *= 1000;
    }

    return (
      (quantityInMl / packageInMl) *
      packagePrice
    );
  }

  /*
   * Jeżeli jednostki są identyczne,
   * liczymy bezpośrednio.
   */
  if (
    quantityUnitNormalized ===
    packageUnitNormalized
  ) {
    return (
      (quantity / packageQuantity) *
      packagePrice
    );
  }

  /*
   * Nieznane jednostki.
   * Nie próbujemy błędnie przeliczać kg jako g.
   */
  return 0;
}
