import { useMemo, useState } from "react";
import { formatMoney } from "../lib/money";
import { useRecipeCost, useStore } from "../store";
import type { Recipe } from "../types";
import { Icons } from "./Icons";
import Logo from "./Logo";

export default function Cotizar() {
  const {
    state,
    quotingRecipeId,
    setQuotingRecipeId,
    addQuote,
    updateQuote,
    removeQuote,
    currency,
  } = useStore();
  const recipe = state.recipes.find((r) => r.id === quotingRecipeId) ?? state.recipes[0];
  const [clientName, setClientName] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [qty, setQty] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [showInternal, setShowInternal] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cost = useRecipeCost(recipe);
  if (!recipe || !cost) {
    return (
      <div className="page">
        <h2>Cotizar</h2>
        <p className="empty">Crea una receta primero para generar presupuestos.</p>
      </div>
    );
  }

  const unitPrice = customPrice === "" ? cost.roundedSalePrice : Number(customPrice);
  const total = unitPrice * Math.max(qty, 1);
  const below = unitPrice < cost.productionCost;

  const selectRecipe = (id: string) => {
    setQuotingRecipeId(id);
    setCustomPrice("");
  };

  const saveQuote = () => {
    const payload = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      clientName: clientName.trim() || "Cliente",
      clientNote,
      quantity: Math.max(qty, 1),
      unitPrice,
      total,
      includeBreakdown: false,
    };
    if (editingQuoteId) {
      updateQuote(editingQuoteId, payload);
      setEditingQuoteId(null);
    } else {
      addQuote(payload);
    }
  };

  const printQuote = () => {
    saveQuote();
    window.print();
  };

  const editQuote = (quoteId: string) => {
    const q = state.quotes.find((item) => item.id === quoteId);
    if (!q) return;
    setQuotingRecipeId(q.recipeId);
    setClientName(q.clientName === "Cliente" ? "" : q.clientName);
    setClientNote(q.clientNote);
    setQty(q.quantity);
    setCustomPrice(q.unitPrice);
    setEditingQuoteId(q.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicateQuote = async (quoteId: string) => {
    const q = state.quotes.find((item) => item.id === quoteId);
    if (!q) return;
    addQuote({
      recipeId: q.recipeId,
      recipeName: q.recipeName,
      clientName: q.clientName === "Cliente" ? "Copia de Cliente" : `${q.clientName} (copia)`,
      clientNote: q.clientNote,
      quantity: q.quantity,
      unitPrice: q.unitPrice,
      total: q.total,
      includeBreakdown: q.includeBreakdown,
    });
    setCopiedId(quoteId);
    try {
      await navigator.clipboard?.writeText(
        `${q.recipeName} · ${q.quantity} × ${formatMoney(q.unitPrice, currency)} = ${formatMoney(q.total, currency)}`,
      );
    } catch {
      /* clipboard not available */
    }
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const deleteQuote = (quoteId: string) => {
    const q = state.quotes.find((item) => item.id === quoteId);
    if (!q) return;
    if (!confirm(`¿Eliminar el presupuesto de ${q.clientName}?`)) return;
    removeQuote(quoteId);
    if (editingQuoteId === quoteId) setEditingQuoteId(null);
  };

  const shareWhatsApp = () => {
    const biz = state.settings.businessName || "AliCakes";
    const issued = new Intl.DateTimeFormat("es", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
    const lines = [
      `*Presupuesto ${biz}*`,
      `Fecha: ${issued}`,
      clientName ? `Cliente: ${clientName}` : "",
      "",
      `${Math.max(qty, 1)} × ${recipe.name}`,
      `Valor unitario: ${formatMoney(unitPrice, currency)}`,
      `*Total: ${formatMoney(total, currency)}*`,
      clientNote ? `\n${clientNote}` : "",
      state.settings.businessContact ? `\nContacto: ${state.settings.businessContact}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="page">
      <div className="page-head no-print">
        <div>
          <h2>Presupuesto para el cliente</h2>
          <p className="lede">
            El PDF y WhatsApp no muestran costos internos. Tu sueldo, gastos fijos y margen quedan
            solo en tu cuaderno.
          </p>
        </div>
      </div>

      {editingQuoteId && (
        <div className="alert info no-print" style={{ marginBottom: 12, alignItems: "center" }}>
          <span style={{ flex: 1 }}>Estas editando un presupuesto del historial.</span>
          <button className="btn btn-sm" type="button" onClick={saveQuote}>
            Guardar cambios
          </button>
          <button className="btn-ghost btn-sm" type="button" onClick={() => setEditingQuoteId(null)}>
            Cancelar edicion
          </button>
        </div>
      )}

      <div className="grid grid-2 no-print" style={{ marginBottom: 16 }}>
        <div className="card grid">
          <div className="field">
            <label htmlFor="q-recipe">Receta</label>
            <select
              id="q-recipe"
              value={recipe.id}
              onChange={(e) => selectRecipe(e.target.value)}
            >
              {state.recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="q-client">Nombre del cliente</label>
            <input
              id="q-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej. Ana Perez"
            />
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="q-qty">Cantidad</label>
              <input
                id="q-qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 1)}
              />
            </div>
            <div className="field">
              <label htmlFor="q-price">Precio unitario</label>
              <input
                id="q-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={customPrice === "" ? cost.roundedSalePrice : customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
              />
              <span className="hint">Sugerido redondeado: {formatMoney(cost.roundedSalePrice, currency)}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="q-note">Nota visible para el cliente</label>
            <textarea
              id="q-note"
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              placeholder="Incluye recado, velas, entrega..."
            />
          </div>
          <label className="chip" style={{ width: "fit-content" }}>
            <input
              type="checkbox"
              checked={showInternal}
              onChange={(e) => setShowInternal(e.target.checked)}
            />{" "}
            Ver costos internos (solo tu pantalla)
          </label>
        </div>

        <div className="card grid">
          <strong>Control interno</strong>
          <div className="breakdown">
            <div className="breakdown-row">
              <span>Costo produccion / unidad</span>
              <span>{formatMoney(cost.productionCost, currency)}</span>
            </div>
            <div className="breakdown-row">
              <span>Precio de venta / unidad</span>
              <span>{formatMoney(unitPrice, currency)}</span>
            </div>
            <div className="breakdown-row total">
              <span>Total presupuesto</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
          </div>
          {below && (
            <div className="alert danger">
              Estas vendiendo por debajo del costo total de produccion. Sube el precio o revisa
              tiempos y margen.
            </div>
          )}
          {cost.alerts
            .filter((a) => a.code === "no-fixed" || a.code === "no-salary" || a.code === "no-profit")
            .map((a) => (
              <div className={`alert ${a.level}`} key={a.code}>
                {a.message}
              </div>
            ))}
          {showInternal && <InternalBreakdown recipe={recipe} />}
          <div className="row">
            <button className="btn btn-energy" type="button" onClick={printQuote}>
              <Icons.file size={16} /> Imprimir / PDF
            </button>
            <button className="btn" type="button" onClick={shareWhatsApp}>
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>

      <ClientQuote
        recipe={recipe}
        clientName={clientName}
        clientNote={clientNote}
        qty={Math.max(qty, 1)}
        unitPrice={unitPrice}
        total={total}
        currency={currency}
        businessName={state.settings.businessName}
        contact={state.settings.businessContact}
      />

      {state.quotes.length > 0 && (
        <div className="card no-print" style={{ marginTop: 16 }}>
          <div className="item-top" style={{ marginBottom: 8 }}>
            <strong>Historial de presupuestos</strong>
            <span className="meta">{state.quotes.length} guardado(s)</span>
          </div>
          <div className="list">
            {state.quotes.map((q) => (
              <article
                className={`quote-history-item ${editingQuoteId === q.id ? "active" : ""}`}
                key={q.id}
              >
                <div className="quote-history-info">
                  <strong>{q.clientName}</strong>
                  <span className="meta">
                    {q.recipeName} × {q.quantity} ·{" "}
                    {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(
                      new Date(q.createdAt),
                    )}
                  </span>
                </div>
                <span className="quote-history-total">{formatMoney(q.total, currency)}</span>
                <div className="quote-history-actions">
                  <button
                    className="icon-btn icon-btn-sm"
                    type="button"
                    onClick={() => editQuote(q.id)}
                    aria-label={`Editar presupuesto de ${q.clientName}`}
                    title="Editar"
                  >
                    <Icons.pencil size={16} />
                  </button>
                  <button
                    className="icon-btn icon-btn-sm"
                    type="button"
                    onClick={() => duplicateQuote(q.id)}
                    aria-label={`Copiar presupuesto de ${q.clientName}`}
                    title="Copiar"
                  >
                    <Icons.copy size={16} />
                  </button>
                  <button
                    className="icon-btn icon-btn-sm icon-btn-danger"
                    type="button"
                    onClick={() => deleteQuote(q.id)}
                    aria-label={`Eliminar presupuesto de ${q.clientName}`}
                    title="Eliminar"
                  >
                    <Icons.trash size={16} />
                  </button>
                  {copiedId === q.id && <span className="copied-badge">Copiado</span>}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InternalBreakdown({ recipe }: { recipe: Recipe }) {
  const cost = useRecipeCost(recipe);
  const { currency } = useStore();
  if (!cost) return null;
  return (
    <div className="formula">
      Insumos {formatMoney(cost.ingredientCost, currency)} + Empaques{" "}
      {formatMoney(cost.packagingCost, currency)} + Sueldo {formatMoney(cost.laborCost, currency)} +
      C. fijos {formatMoney(cost.fixedCost, currency)} ={" "}
      {formatMoney(cost.productionCost, currency)}
    </div>
  );
}

function ClientQuote({
  recipe,
  clientName,
  clientNote,
  qty,
  unitPrice,
  total,
  currency,
  businessName,
  contact,
}: {
  recipe: Recipe;
  clientName: string;
  clientNote: string;
  qty: number;
  unitPrice: number;
  total: number;
  currency: string;
  businessName: string;
  contact: string;
}) {
  const issuedAt = useMemo(() => new Date(), []);
  const dateLabel = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(issuedAt);
  const timeLabel = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(issuedAt);

  return (
    <article className="quote-preview" id="quote-print">
      <div className="quote-brand">
        <Logo variant="quote" />
      </div>
      <div className="quote-date">
        <span className="quote-date-label">Fecha del presupuesto</span>
        <time dateTime={issuedAt.toISOString()}>
          {dateLabel} · {timeLabel}
        </time>
      </div>
      {businessName && businessName !== "AliCakes" && <h3>{businessName}</h3>}
      <p className="lede">Presupuesto de pasteleria</p>
      {clientName && (
        <p style={{ marginTop: 8 }}>
          <strong>Cliente:</strong> {clientName}
        </p>
      )}
      <table className="quote-table">
        <thead>
          <tr>
            <th>Detalle</th>
            <th>Cant.</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{recipe.name}</td>
            <td>{qty}</td>
            <td>{formatMoney(unitPrice, currency as never)}</td>
          </tr>
        </tbody>
      </table>
      {clientNote && <p>{clientNote}</p>}
      <p style={{ textAlign: "right", fontWeight: 700, fontSize: "1.15rem" }}>
        Total: {formatMoney(total, currency as never)}
      </p>
      {contact && <p className="meta">Contacto: {contact}</p>}
      <p className="hint">Validez sujeta a confirmacion de agenda e insumos.</p>
    </article>
  );
}
