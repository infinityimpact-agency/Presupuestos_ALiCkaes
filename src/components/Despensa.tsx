import { useMemo, useState } from "react";
import { formatMoney, formatNumber } from "../lib/money";
import { unitCost } from "../lib/costEngine";
import { useStore } from "../store";
import type { ChargeMode, Ingredient, IngredientKind, Unit } from "../types";
import { Icons } from "./Icons";

const UNITS: { value: Unit; label: string }[] = [
  { value: "g", label: "Gramos (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "ud", label: "Unidades" },
];

const emptyForm = (): Omit<Ingredient, "id"> => ({
  name: "",
  kind: "insumo",
  packagePrice: 0,
  packageQty: 0,
  unit: "g",
  notes: "",
});

export default function Despensa() {
  const { state, addIngredient, updateIngredient, removeIngredient, currency } = useStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | IngredientKind>("todos");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return state.ingredients.filter((i) => {
      const kindOk = filter === "todos" || i.kind === filter;
      const qOk = i.name.toLowerCase().includes(q.trim().toLowerCase());
      return kindOk && qOk;
    });
  }, [state.ingredients, filter, q]);

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setForm({
      name: ing.name,
      kind: ing.kind,
      packagePrice: ing.packagePrice,
      packageQty: ing.packageQty,
      unit: ing.unit,
      notes: ing.notes,
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.packageQty <= 0) return;
    if (editingId) {
      updateIngredient(editingId, form);
      setEditingId(null);
    } else {
      addIngredient(form);
    }
    setForm(emptyForm());
  };

  const affected = (id: string) =>
    state.recipes.filter((r) => r.lines.some((l) => l.ingredientId === id)).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Despensa e insumos</h2>
          <p className="lede">
            Etapa 1. Registra el precio del paquete y su contenido. AliCakes calcula el costo por
            gramo, ml o unidad. Si cambias un precio, las recetas se recalculan solas.
          </p>
        </div>
      </div>

      <div className="formula" style={{ marginBottom: 16 }}>
        Costo por unidad = Precio del paquete / Cantidad comprada
      </div>

      <form className="card grid" onSubmit={submit} style={{ marginBottom: 16 }}>
        <strong>{editingId ? "Editar insumo" : "Nuevo insumo o empaque"}</strong>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="ing-name">Nombre</label>
            <input
              id="ing-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Harina de trigo"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ing-kind">Tipo</label>
            <select
              id="ing-kind"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as IngredientKind })}
            >
              <option value="insumo">Ingrediente</option>
              <option value="empaque">Empaque / presentacion</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ing-price">Precio de compra del paquete</label>
            <input
              id="ing-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={form.packagePrice || ""}
              onChange={(e) => setForm({ ...form, packagePrice: Number(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ing-qty">Cantidad comprada del paquete</label>
            <input
              id="ing-qty"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={form.packageQty || ""}
              onChange={(e) => setForm({ ...form, packageQty: Number(e.target.value) || 0 })}
              required
            />
            <span className="hint">Ej: 1000 g, 1000 ml o 30 unidades</span>
          </div>
          <div className="field">
            <label htmlFor="ing-unit">Unidad</label>
            <select
              id="ing-unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ing-notes">Notas (opcional)</label>
            <input
              id="ing-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Marca, proveedor, merma..."
            />
          </div>
        </div>
        <div className="row">
          <button className="btn" type="submit">
            <Icons.plus size={18} />
            {editingId ? "Guardar cambios" : "Agregar a la despensa"}
          </button>
          {editingId && (
            <button
              className="btn-ghost"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="chips">
          {(["todos", "insumo", "empaque"] as const).map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "todos" ? "Todos" : f === "insumo" ? "Ingredientes" : "Empaques"}
            </button>
          ))}
        </div>
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label className="sr-only" htmlFor="ing-search">
            Buscar
          </label>
          <input
            id="ing-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en la despensa"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">Aun no hay insumos. Agrega el primero para empezar a costear.</div>
      ) : (
        <div className="list">
          {list.map((ing) => {
            const uc = unitCost(ing);
            const n = affected(ing.id);
            return (
              <article className="card item" key={ing.id}>
                <div className="item-top">
                  <div>
                    <strong>{ing.name}</strong>
                    <div className="meta">
                      {ing.kind === "empaque" ? "Empaque" : "Ingrediente"} · paquete{" "}
                      {formatMoney(ing.packagePrice, currency)} / {formatNumber(ing.packageQty)}{" "}
                      {ing.unit}
                    </div>
                  </div>
                  <div className="row">
                    <button className="btn-ghost" type="button" onClick={() => startEdit(ing)}>
                      Editar
                    </button>
                    <button
                      className="btn-danger"
                      type="button"
                      onClick={() => {
                        if (n > 0 && !confirm(`Se usa en ${n} receta(s). ¿Eliminar igual?`)) return;
                        removeIngredient(ing.id);
                      }}
                      aria-label={`Eliminar ${ing.name}`}
                    >
                      <Icons.trash size={16} />
                    </button>
                  </div>
                </div>
                <div className="kpi" style={{ margin: 0 }}>
                  <span>Costo por {ing.unit}</span>
                  <strong>{formatMoney(uc, currency)}</strong>
                </div>
                {n > 0 && (
                  <p className="hint">
                    Actualiza {n} receta{n === 1 ? "" : "s"} en tiempo real.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChargeModeField({
  value,
  onChange,
}: {
  value: ChargeMode;
  onChange: (v: ChargeMode) => void;
}) {
  return (
    <div className="chips">
      <button
        type="button"
        className={`chip ${value === "fraction" ? "active" : ""}`}
        onClick={() => onChange("fraction")}
      >
        Solo la fraccion
      </button>
      <button
        type="button"
        className={`chip ${value === "whole" ? "active" : ""}`}
        onClick={() => onChange("whole")}
      >
        Unidad entera
      </button>
    </div>
  );
}
