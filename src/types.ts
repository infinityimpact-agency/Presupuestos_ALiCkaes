export type Unit = "g" | "ml" | "ud";

export type IngredientKind = "insumo" | "empaque";

export type ChargeMode = "fraction" | "whole";

export type CurrencyCode = "COP" | "ARS" | "USD" | "PEN" | "MXN" | "CLP" | "BRL" | "EUR";

export interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
  decimals: number;
}

export interface Ingredient {
  id: string;
  name: string;
  kind: IngredientKind;
  packagePrice: number;
  packageQty: number;
  unit: Unit;
  notes: string;
}

export interface SalaryConfig {
  monthlyDesired: number;
  daysPerMonth: number;
  hoursPerDay: number;
}

export interface FixedCost {
  id: string;
  name: string;
  monthlyAmount: number;
  active: boolean;
}

export interface RecipeLine {
  id: string;
  ingredientId: string;
  quantity: number;
  chargeMode: ChargeMode;
}

export interface Recipe {
  id: string;
  name: string;
  notes: string;
  portions: number;
  laborMinutes: number;
  kitchenMinutes: number;
  profitPercent: number;
  lines: RecipeLine[];
  createdAt: number;
  updatedAt: number;
}

export interface Quote {
  id: string;
  recipeId: string;
  recipeName: string;
  clientName: string;
  clientNote: string;
  quantity: number;
  unitPrice: number;
  total: number;
  includeBreakdown: boolean;
  createdAt: number;
}

export interface AppSettings {
  currency: CurrencyCode;
  businessName: string;
  businessContact: string;
}

export interface AppState {
  ingredients: Ingredient[];
  salary: SalaryConfig;
  fixedCosts: FixedCost[];
  recipes: Recipe[];
  quotes: Quote[];
  settings: AppSettings;
}

export interface LaborRates {
  totalHoursMonth: number;
  hourWage: number;
  minuteWage: number;
}

export interface FixedRates {
  totalMonthly: number;
  hourFixed: number;
  minuteFixed: number;
}

export interface LineCost {
  line: RecipeLine;
  ingredient: Ingredient | undefined;
  billedQty: number;
  unitCost: number;
  total: number;
}

export interface RecipeCostBreakdown {
  ingredientCost: number;
  packagingCost: number;
  laborCost: number;
  fixedCost: number;
  productionCost: number;
  portionCost: number;
  profitAmount: number;
  salePrice: number;
  roundedSalePrice: number;
  portionSalePrice: number;
  roundedPortionSalePrice: number;
  lines: LineCost[];
  alerts: CostAlert[];
}

export interface CostAlert {
  level: "warning" | "danger" | "info";
  code: string;
  message: string;
}

export type TabId = "despensa" | "sueldo" | "gastos" | "recetas" | "cotizar";
