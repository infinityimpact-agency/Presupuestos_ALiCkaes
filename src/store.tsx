import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { computeFixedRates, computeLaborRates, computeRecipeCost } from "./lib/costEngine";
import { uid } from "./lib/ids";
import { roundUpCurrency } from "./lib/money";
import { loadState, resetState as resetPersisted, saveState } from "./lib/storage";
import type {
  AppSettings,
  AppState,
  CurrencyCode,
  FixedCost,
  Ingredient,
  Quote,
  Recipe,
  RecipeLine,
  SalaryConfig,
  TabId,
} from "./types";

interface StoreValue {
  state: AppState;
  tab: TabId;
  setTab: (tab: TabId) => void;
  editingRecipeId: string | null;
  setEditingRecipeId: (id: string | null) => void;
  quotingRecipeId: string | null;
  setQuotingRecipeId: (id: string | null) => void;
  addIngredient: (ing: Omit<Ingredient, "id">) => void;
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void;
  removeIngredient: (id: string) => void;
  updateSalary: (patch: Partial<SalaryConfig>) => void;
  addFixedCost: (name: string, amount: number) => void;
  updateFixedCost: (id: string, patch: Partial<FixedCost>) => void;
  removeFixedCost: (id: string) => void;
  saveRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt"> & { id?: string }) => string;
  removeRecipe: (id: string) => void;
  addQuote: (quote: Omit<Quote, "id" | "createdAt">) => Quote;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  removeQuote: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetDemo: () => void;
  labor: ReturnType<typeof computeLaborRates>;
  fixed: ReturnType<typeof computeFixedRates>;
  currency: CurrencyCode;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<TabId>("despensa");
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [quotingRecipeId, setQuotingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const labor = useMemo(() => computeLaborRates(state.salary), [state.salary]);
  const fixed = useMemo(
    () => computeFixedRates(state.fixedCosts, labor.totalHoursMonth),
    [state.fixedCosts, labor.totalHoursMonth],
  );

  const addIngredient = useCallback((ing: Omit<Ingredient, "id">) => {
    setState((s) => ({ ...s, ingredients: [...s.ingredients, { ...ing, id: uid("ing") }] }));
  }, []);

  const updateIngredient = useCallback((id: string, patch: Partial<Ingredient>) => {
    setState((s) => ({
      ...s,
      ingredients: s.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setState((s) => ({ ...s, ingredients: s.ingredients.filter((i) => i.id !== id) }));
  }, []);

  const updateSalary = useCallback((patch: Partial<SalaryConfig>) => {
    setState((s) => ({ ...s, salary: { ...s.salary, ...patch } }));
  }, []);

  const addFixedCost = useCallback((name: string, amount: number) => {
    setState((s) => ({
      ...s,
      fixedCosts: [...s.fixedCosts, { id: uid("fx"), name, monthlyAmount: amount, active: true }],
    }));
  }, []);

  const updateFixedCost = useCallback((id: string, patch: Partial<FixedCost>) => {
    setState((s) => ({
      ...s,
      fixedCosts: s.fixedCosts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeFixedCost = useCallback((id: string) => {
    setState((s) => ({ ...s, fixedCosts: s.fixedCosts.filter((c) => c.id !== id) }));
  }, []);

  const saveRecipe = useCallback(
    (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const now = Date.now();
      let savedId = recipe.id ?? uid("rec");
      setState((s) => {
        if (recipe.id) {
          return {
            ...s,
            recipes: s.recipes.map((r) =>
              r.id === recipe.id ? { ...r, ...recipe, id: recipe.id, updatedAt: now } : r,
            ),
          };
        }
        const next: Recipe = { ...recipe, id: savedId, createdAt: now, updatedAt: now };
        return { ...s, recipes: [next, ...s.recipes] };
      });
      return savedId;
    },
    [],
  );

  const removeRecipe = useCallback((id: string) => {
    setState((s) => ({ ...s, recipes: s.recipes.filter((r) => r.id !== id) }));
  }, []);

  const addQuote = useCallback((quote: Omit<Quote, "id" | "createdAt">) => {
    const next: Quote = { ...quote, id: uid("qt"), createdAt: Date.now() };
    setState((s) => ({ ...s, quotes: [next, ...s.quotes] }));
    return next;
  }, []);

  const updateQuote = useCallback((id: string, patch: Partial<Quote>) => {
    setState((s) => ({
      ...s,
      quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch, id: q.id } : q)),
    }));
  }, []);

  const removeQuote = useCallback((id: string) => {
    setState((s) => ({ ...s, quotes: s.quotes.filter((q) => q.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(resetPersisted());
    setTab("despensa");
    setEditingRecipeId(null);
    setQuotingRecipeId(null);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      tab,
      setTab,
      editingRecipeId,
      setEditingRecipeId,
      quotingRecipeId,
      setQuotingRecipeId,
      addIngredient,
      updateIngredient,
      removeIngredient,
      updateSalary,
      addFixedCost,
      updateFixedCost,
      removeFixedCost,
      saveRecipe,
      removeRecipe,
      addQuote,
      updateQuote,
      removeQuote,
      updateSettings,
      resetDemo,
      labor,
      fixed,
      currency: state.settings.currency,
    }),
    [
      state,
      tab,
      editingRecipeId,
      quotingRecipeId,
      addIngredient,
      updateIngredient,
      removeIngredient,
      updateSalary,
      addFixedCost,
      updateFixedCost,
      removeFixedCost,
      saveRecipe,
      removeRecipe,
      addQuote,
      updateQuote,
      removeQuote,
      updateSettings,
      resetDemo,
      labor,
      fixed,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useRecipeCost(recipe: Recipe | undefined) {
  const { state } = useStore();
  return useMemo(() => {
    if (!recipe) return null;
    const raw = computeRecipeCost(recipe, state.ingredients, state.salary, state.fixedCosts);
    return {
      ...raw,
      roundedSalePrice: roundUpCurrency(raw.salePrice, state.settings.currency),
      roundedPortionSalePrice: roundUpCurrency(raw.portionSalePrice, state.settings.currency),
    };
  }, [recipe, state.ingredients, state.salary, state.fixedCosts, state.settings.currency]);
}

export function emptyLine(): RecipeLine {
  return { id: uid("ln"), ingredientId: "", quantity: 0, chargeMode: "fraction" };
}
