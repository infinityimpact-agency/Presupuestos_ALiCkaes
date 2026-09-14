import { useMemo, useState } from "react";
import { computeRecipeCost } from "../lib/costEngine";
import { uid } from "../lib/ids";
import { formatMoney, roundUpCurrency } from "../lib/money";
import { emptyLine, useRecipeCost, useStore } from "../store";
import type { ChargeMode, Recipe, RecipeLine } from "../types";
import { ChargeModeField } from "./Despensa";
import { Icons } from "./Icons";
import TimerField from "./TimerField";

function blankRecipe(): Omit<Recipe, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    notes: "",
    portions: 8,
    laborMinutes: 0,
    kitchenMinutes: 0,
    profitPercent: 40,
    lines: [emptyLine()],
  };
}

export default function Recetas() {
  const {
    state,
    saveRecipe,
    removeRecipe,
    setTab,
    setQuotingRecipeId,
    editingRecipeId,
    setEditingRecipeId,
    currency,
  } = useStore();
  const editing = state.recipes.find((r) => r.id === editingRecipeId);
  const [draft, setDraft] = useState(() => blankRecipe());

  const openNew = () => {
    setDraft(blankRecipe());
    setEditingRecipeId("__new__");
  };

  const openEdit = (r: Recipe) => {
    setDraft({
      name: r.name,
      notes: r.notes,
      portions: r.portions,
      laborMinutes: r.laborMinutes,
      kitchenMinutes: r.kitchenMinutes,
      profitPercent: r.profitPercent,
      lines: r.lines.map((l) => ({ ...l })),
    });
    setEditingRecipeId(r.id);
  };

  if (editingRecipeId) {
    return (
      <RecipeEditor
        existingId={editingRecipeId === "__new__" ? undefined : editingRecipeId}
        draft={draft}
        setDraft={setDraft}
        onCancel={() => setEditingRecipeId(null)}
        onSave={() => {
          if (!draft.name.trim()) return;
          const cleanLines = draft.lines.filter((l) => l.ingredientId && l.quantity > 0);
          saveRecipe({
            ...draft,
            lines: cleanLines.length ? cleanLines : draft.lines,
            id: editing?.id,
          });
          setEditingRecipeId(null);
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Mis recetas y cotizador</h2>
          <p className="lede">
            Etapa 4. Junta insumos, tu sueldo por minuto y los gastos fijos de cocina. El precio
            sugerido incluye el margen de ganancia del negocio, separado de tu salario.
          </p>
        </div>
        <button className="btn" type="button" onClick={openNew}>
          <Icons.plus size={18} /> Nueva receta
        </button>
      </div>

      {state.recipes.length === 0 ? (
        <div className="empty">
          No hay recetas. Crea la primera para calcular costo y precio de venta.
        </div>
      ) : (
        <div className="list">
          {state.recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              currency={currency}
              onEdit={() => openEdit(r)}
              onQuote={() => {
                setQuotingRecipeId(r.id);
                setTab("cotizar");
              }}
              onDelete={() => {
                if (confirm(`¿Eliminar la receta "${r.name}"?`)) removeRecipe(r.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  currency,
  onEdit,
  onQuote,
  onDelete,
}: {
  recipe: Recipe;
  currency: string;
  onEdit: () => void;
  onQuote: () => void;
  onDelete: () => void;
}) {
  const cost = useRecipeCost(recipe);
  if (!cost) return null;
  const below = cost.roundedSalePrice < cost.productionCost;
  return (
    <article className="card item">
      <div className="item-top">
        <div>
          <strong>{recipe.name}</strong>
          <div className="meta">
            {recipe.portions} porciones · {recipe.laborMinutes} min mano de obra ·{" "}
            {recipe.kitchenMinutes} min cocina · ganancia {recipe.profitPercent}%
          </div>
        </div>
      </div>
      <div className="kpi-row" style={{ marginBottom: 0 }}>
        <div className="kpi">
          <span>Costo produccion</span>
          <strong>{formatMoney(cost.productionCost, currency as never)}</strong>
        </div>
        <div className="kpi">
          <span>Precio sugerido</span>
          <strong>{formatMoney(cost.roundedSalePrice, currency as never)}</strong>
        </div>
      </div>
      {below && (
        <div className="alert danger">Estas vendiendo por debajo del costo total de produccion.</div>
      )}
      {cost.alerts
        .filter((a) => a.level !== "info")
        .slice(0, 2)
        .map((a) => (
          <div className={`alert ${a.level}`} key={a.code}>
            {a.message}
          </div>
        ))}
      <div className="row">
        <button className="btn btn-energy" type="button" onClick={onQuote}>
          Cotizar
        </button>
        <button className="btn-ghost" type="button" onClick={onEdit}>
          Editar
        </button>
        <button className="btn-danger" type="button" onClick={onDelete} aria-label="Eliminar receta">
          <Icons.trash size={16} />
        </button>
      </div>
    </article>
  );
}

function RecipeEditor({
  existingId,
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  existingId?: string;
  draft: Omit<Recipe, "id" | "createdAt" | "updatedAt">;
  setDraft: (d: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { state, currency } = useStore();
  const previewRecipe: Recipe = useMemo(
    () => ({
      ...draft,
      id: existingId ?? "preview",
      createdAt: 0,
      updatedAt: 0,
    }),
    [draft, existingId],
  );
  const cost = useMemo(
    () => computeRecipeCost(previewRecipe, state.ingredients, state.salary, state.fixedCosts),
    [previewRecipe, state.ingredients, state.salary, state.fixedCosts],
  );

  const setLine = (id: string, patch: Partial<RecipeLine>) => {
    setDraft({
      ...draft,
      lines: draft.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>{existingId ? "Editar receta" : "Nueva receta"}</h2>
          <p className="lede">Insumos, tiempos y margen. El costo se actualiza al instante.</p>
        </div>
        <div className="row">
          <button className="btn-ghost" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn" type="button" onClick={onSave}>
            Guardar receta
          </button>
        </div>
      </div>

      <form
        className="grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="card grid">
          <div className="field">
            <label htmlFor="r-name">Nombre de la receta</label>
            <input
              id="r-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="r-portions">Porciones / rendimiento</label>
              <input
                id="r-portions"
                type="number"
                inputMode="numeric"
                min={1}
                value={draft.portions || ""}
                onChange={(e) => setDraft({ ...draft, portions: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="field">
              <label htmlFor="r-profit">Margen de ganancia del negocio (%)</label>
              <input
                id="r-profit"
                type="number"
                inputMode="decimal"
                min={0}
                max={300}
                value={draft.profitPercent}
                onChange={(e) => setDraft({ ...draft, profitPercent: Number(e.target.value) || 0 })}
              />
              <span className="hint">Rango sugerido: 30% a 60%. Esto NO es tu sueldo.</span>
            </div>
          </div>
          <div className="chips">
            {[30, 40, 50, 60].map((p) => (
              <button
                key={p}
                type="button"
                className={`chip ${draft.profitPercent === p ? "active" : ""}`}
                onClick={() => setDraft({ ...draft, profitPercent: p })}
              >
                {p}%
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="r-notes">Notas internas</label>
            <textarea
              id="r-notes"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="card grid">
          <strong>Insumos y empaques</strong>
          {draft.lines.map((line, idx) => {
            const ing = state.ingredients.find((i) => i.id === line.ingredientId);
            return (
              <div className="card item" key={line.id} style={{ background: "var(--color-crema-fondo)" }}>
                <div className="item-top">
                  <span className="meta">Linea {idx + 1}</span>
                  <button
                    className="btn-danger"
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, lines: draft.lines.filter((l) => l.id !== line.id) })
                    }
                    aria-label="Quitar linea"
                  >
                    <Icons.trash size={16} />
                  </button>
                </div>
                <div className="field">
                  <label>Ingrediente</label>
                  <select
                    value={line.ingredientId}
                    onChange={(e) => setLine(line.id, { ingredientId: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {state.ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.kind === "empaque" ? "empaque" : "insumo"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-2">
                  <div className="field">
                    <label>Cantidad usada {ing ? `(${ing.unit})` : ""}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={line.quantity || ""}
                      onChange={(e) => setLine(line.id, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="field">
                    <label>Si se usa parcialmente</label>
                    <ChargeModeField
                      value={line.chargeMode}
                      onChange={(v: ChargeMode) => setLine(line.id, { chargeMode: v })}
                    />
                    <span className="hint">
                      Entera si se daña el resto (ej. medio limon). Fraccion si el resto se guarda.
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setDraft({ ...draft, lines: [...draft.lines, { ...emptyLine(), id: uid("ln") }] })}
          >
            <Icons.plus size={16} /> Agregar insumo
          </button>
        </div>

        <div className="card grid grid-2">
          <TimerField
            label="Minutos de mano de obra"
            hint="Tiempo activo: pesado, batido, rellenos, decorado, lavado."
            value={draft.laborMinutes}
            onChange={(n) => setDraft({ ...draft, laborMinutes: n })}
          />
          <TimerField
            label="Minutos de uso de cocina"
            hint="Tiempo que la instalacion esta ocupada, incluye horneado y estufa."
            value={draft.kitchenMinutes}
            onChange={(n) => setDraft({ ...draft, kitchenMinutes: n })}
          />
        </div>

        <CostPanel cost={cost} currency={currency} portions={draft.portions} profit={draft.profitPercent} />
        <button className="btn" type="submit">
          Guardar receta
        </button>
      </form>
    </div>
  );
}

export function CostPanel({
  cost,
  currency,
  portions,
  profit,
}: {
  cost: ReturnType<typeof computeRecipeCost>;
  currency: string;
  portions: number;
  profit: number;
}) {
  const roundedSalePrice = roundUpCurrency(cost.salePrice, currency as never);
  const roundedPortion = roundUpCurrency(cost.portionSalePrice, currency as never);

  return (
    <div className="card grid">
      <strong>Costo de produccion y precio</strong>
      <div className="breakdown">
        <div className="breakdown-row">
          <span>Ingredientes</span>
          <span>{formatMoney(cost.ingredientCost, currency as never)}</span>
        </div>
        <div className="breakdown-row">
          <span>Empaques</span>
          <span>{formatMoney(cost.packagingCost, currency as never)}</span>
        </div>
        <div className="breakdown-row">
          <span>Sueldo (mano de obra)</span>
          <span>{formatMoney(cost.laborCost, currency as never)}</span>
        </div>
        <div className="breakdown-row">
          <span>Gastos fijos (uso de cocina)</span>
          <span>{formatMoney(cost.fixedCost, currency as never)}</span>
        </div>
        <div className="breakdown-row total">
          <span>Costo total de produccion</span>
          <span>{formatMoney(cost.productionCost, currency as never)}</span>
        </div>
        <div className="breakdown-row">
          <span>Costo por porcion ({portions})</span>
          <span>{formatMoney(cost.portionCost, currency as never)}</span>
        </div>
        <div className="breakdown-row">
          <span>Ganancia del negocio ({profit}%)</span>
          <span>{formatMoney(cost.profitAmount, currency as never)}</span>
        </div>
        <div className="breakdown-row sale">
          <span>Precio de venta sugerido (redondeado)</span>
          <span>{formatMoney(roundedSalePrice, currency as never)}</span>
        </div>
        <div className="breakdown-row">
          <span>Precio por porcion (redondeado)</span>
          <span>{formatMoney(roundedPortion, currency as never)}</span>
        </div>
      </div>
      {cost.alerts.map((a) => (
        <div className={`alert ${a.level}`} key={a.code}>
          {a.message}
        </div>
      ))}
    </div>
  );
}
