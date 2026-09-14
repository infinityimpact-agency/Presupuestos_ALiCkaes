import { uid } from "./ids";
import type { AppState, FixedCost, Ingredient, Recipe } from "../types";

function ing(
  name: string,
  kind: Ingredient["kind"],
  packagePrice: number,
  packageQty: number,
  unit: Ingredient["unit"],
): Ingredient {
  return { id: uid("ing"), name, kind, packagePrice, packageQty, unit, notes: "" };
}

export function createSeedState(): AppState {
  const harina = ing("Harina de trigo", "insumo", 4500, 1000, "g");
  const azucar = ing("Azucar blanca", "insumo", 3800, 1000, "g");
  const mantequilla = ing("Mantequilla", "insumo", 18000, 500, "g");
  const huevos = ing("Huevos", "insumo", 14000, 30, "ud");
  const leche = ing("Leche entera", "insumo", 4200, 1000, "ml");
  const vainilla = ing("Esencia de vainilla", "insumo", 8500, 120, "ml");
  const cacao = ing("Cacao en polvo", "insumo", 12000, 250, "g");
  const limon = ing("Limon", "insumo", 3000, 10, "ud");
  const caja = ing("Caja para torta 20cm", "empaque", 18000, 10, "ud");
  const base = ing("Base de carton", "empaque", 8000, 20, "ud");
  const liston = ing("Liston decorativo", "empaque", 4500, 10, "ud");

  const ingredients = [harina, azucar, mantequilla, huevos, leche, vainilla, cacao, limon, caja, base, liston];

  const fixedCosts: FixedCost[] = [
    { id: uid("fx"), name: "Arriendo / espacio de trabajo", monthlyAmount: 800000, active: true },
    { id: uid("fx"), name: "Luz", monthlyAmount: 120000, active: true },
    { id: uid("fx"), name: "Agua", monthlyAmount: 45000, active: true },
    { id: uid("fx"), name: "Gas", monthlyAmount: 70000, active: true },
    { id: uid("fx"), name: "Internet / atencion al cliente", monthlyAmount: 80000, active: true },
    { id: uid("fx"), name: "Productos de limpieza", monthlyAmount: 35000, active: true },
  ];

  const now = Date.now();
  const receta: Recipe = {
    id: uid("rec"),
    name: "Torta de chocolate 8 porciones",
    notes: "Receta de ejemplo para ver el metodo de 4 etapas.",
    portions: 8,
    laborMinutes: 90,
    kitchenMinutes: 150,
    profitPercent: 40,
    createdAt: now,
    updatedAt: now,
    lines: [
      { id: uid("ln"), ingredientId: harina.id, quantity: 250, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: azucar.id, quantity: 200, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: mantequilla.id, quantity: 120, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: huevos.id, quantity: 4, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: leche.id, quantity: 180, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: cacao.id, quantity: 40, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: vainilla.id, quantity: 5, chargeMode: "fraction" },
      { id: uid("ln"), ingredientId: caja.id, quantity: 1, chargeMode: "whole" },
      { id: uid("ln"), ingredientId: base.id, quantity: 1, chargeMode: "whole" },
    ],
  };

  return {
    ingredients,
    salary: {
      monthlyDesired: 2600000,
      daysPerMonth: 26,
      hoursPerDay: 8,
    },
    fixedCosts,
    recipes: [receta],
    quotes: [],
    settings: {
      currency: "COP",
      businessName: "AliCakes",
      businessContact: "",
    },
  };
}

export const DEFAULT_FIXED_TEMPLATES = [
  "Arriendo / espacio de trabajo",
  "Luz",
  "Agua",
  "Gas",
  "Internet / atencion al cliente",
  "Productos de limpieza",
];
