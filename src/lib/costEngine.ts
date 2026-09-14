import type {
  CostAlert,
  FixedCost,
  FixedRates,
  Ingredient,
  LaborRates,
  LineCost,
  Recipe,
  RecipeCostBreakdown,
  SalaryConfig,
} from "../types";

export function unitCost(ingredient: Ingredient): number {
  if (!ingredient.packageQty || ingredient.packageQty <= 0) return 0;
  return ingredient.packagePrice / ingredient.packageQty;
}

export function computeLaborRates(salary: SalaryConfig): LaborRates {
  const days = Math.max(salary.daysPerMonth || 0, 0);
  const hours = Math.max(salary.hoursPerDay || 0, 0);
  const totalHoursMonth = days * hours;
  const hourWage = totalHoursMonth > 0 ? salary.monthlyDesired / totalHoursMonth : 0;
  return {
    totalHoursMonth,
    hourWage,
    minuteWage: hourWage / 60,
  };
}

export function computeFixedRates(fixedCosts: FixedCost[], totalHoursMonth: number): FixedRates {
  const totalMonthly = fixedCosts
    .filter((c) => c.active)
    .reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
  const hourFixed = totalHoursMonth > 0 ? totalMonthly / totalHoursMonth : 0;
  return {
    totalMonthly,
    hourFixed,
    minuteFixed: hourFixed / 60,
  };
}

export function billedQuantity(qty: number, chargeMode: "fraction" | "whole"): number {
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  return chargeMode === "whole" ? Math.ceil(qty) : qty;
}

export function computeRecipeCost(
  recipe: Recipe,
  ingredients: Ingredient[],
  salary: SalaryConfig,
  fixedCosts: FixedCost[],
): RecipeCostBreakdown {
  const labor = computeLaborRates(salary);
  const fixed = computeFixedRates(fixedCosts, labor.totalHoursMonth);
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const lines: LineCost[] = recipe.lines.map((line) => {
    const ingredient = byId.get(line.ingredientId);
    const billedQty = billedQuantity(line.quantity, line.chargeMode);
    const uc = ingredient ? unitCost(ingredient) : 0;
    return {
      line,
      ingredient,
      billedQty,
      unitCost: uc,
      total: billedQty * uc,
    };
  });

  const ingredientCost = lines
    .filter((l) => l.ingredient?.kind !== "empaque")
    .reduce((s, l) => s + l.total, 0);
  const packagingCost = lines
    .filter((l) => l.ingredient?.kind === "empaque")
    .reduce((s, l) => s + l.total, 0);

  const laborCost = Math.max(recipe.laborMinutes || 0, 0) * labor.minuteWage;
  const kitchenCost = Math.max(recipe.kitchenMinutes || 0, 0) * fixed.minuteFixed;
  const productionCost = ingredientCost + packagingCost + laborCost + kitchenCost;
  const portions = Math.max(recipe.portions || 1, 1);
  const portionCost = productionCost / portions;
  const profitPct = Math.max(recipe.profitPercent || 0, 0) / 100;
  const profitAmount = productionCost * profitPct;
  const salePrice = productionCost + profitAmount;
  const portionSalePrice = salePrice / portions;

  const alerts: CostAlert[] = [];

  if (!salary.monthlyDesired || salary.monthlyDesired <= 0) {
    alerts.push({
      level: "warning",
      code: "no-salary",
      message: "No has configurado tu sueldo. El costo de mano de obra queda en 0.",
    });
  }
  if (fixed.totalMonthly <= 0) {
    alerts.push({
      level: "warning",
      code: "no-fixed",
      message: "No hay gastos fijos registrados. El costo operativo queda en 0 y puedes vender por debajo del costo real.",
    });
  }
  if (recipe.lines.length === 0) {
    alerts.push({
      level: "danger",
      code: "no-lines",
      message: "La receta no tiene insumos ni empaques. No se puede cotizar con exactitud.",
    });
  }
  const missing = lines.filter((l) => !l.ingredient);
  if (missing.length) {
    alerts.push({
      level: "danger",
      code: "missing-ingredient",
      message: `${missing.length} insumo(s) de la receta ya no existen en la despensa.`,
    });
  }
  const zeroPrice = lines.filter((l) => l.ingredient && unitCost(l.ingredient) <= 0);
  if (zeroPrice.length) {
    alerts.push({
      level: "warning",
      code: "zero-unit",
      message: `${zeroPrice.length} insumo(s) tienen costo por unidad en 0. Revisa precio o cantidad del paquete.`,
    });
  }
  if ((recipe.laborMinutes || 0) <= 0) {
    alerts.push({
      level: "info",
      code: "no-labor-time",
      message: "Sin minutos de mano de obra, tu sueldo no se cobra en esta receta.",
    });
  }
  if ((recipe.kitchenMinutes || 0) <= 0) {
    alerts.push({
      level: "info",
      code: "no-kitchen-time",
      message: "Sin minutos de uso de cocina, los gastos fijos no se prorratean en esta receta.",
    });
  }
  if (profitPct <= 0) {
    alerts.push({
      level: "danger",
      code: "no-profit",
      message: "Margen de ganancia en 0%. El precio de venta iguala el costo y no hay fondo de inversion.",
    });
  }

  return {
    ingredientCost,
    packagingCost,
    laborCost,
    fixedCost: kitchenCost,
    productionCost,
    portionCost,
    profitAmount,
    salePrice,
    roundedSalePrice: 0,
    portionSalePrice,
    roundedPortionSalePrice: 0,
    lines,
    alerts,
  };
}

export function sellingBelowCost(salePrice: number, productionCost: number): boolean {
  return salePrice + 1e-9 < productionCost;
}
