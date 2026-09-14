import { useState } from "react";
import { DEFAULT_FIXED_TEMPLATES } from "../lib/seed";
import { formatMoney } from "../lib/money";
import { useStore } from "../store";
import { Icons } from "./Icons";

export default function Gastos() {
  const { state, addFixedCost, updateFixedCost, removeFixedCost, fixed, labor, currency } = useStore();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addFixedCost(name.trim(), amount);
    setName("");
    setAmount(0);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Centro de costos fijos</h2>
          <p className="lede">
            Etapa 3. Arriendo, servicios y limpieza se prorratean por minuto de uso de cocina.
            No se mezclan con tu sueldo ni con la ganancia del negocio.
          </p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <span>Total costos fijos / mes</span>
          <strong>{formatMoney(fixed.totalMonthly, currency)}</strong>
        </div>
        <div className="kpi">
          <span>Valor hora C. fijo</span>
          <strong>{formatMoney(fixed.hourFixed, currency)}</strong>
        </div>
        <div className="kpi">
          <span>Valor minuto C. fijo</span>
          <strong>{formatMoney(fixed.minuteFixed, currency)}</strong>
        </div>
        <div className="kpi">
          <span>Base de horas (Mod. 2)</span>
          <strong>{labor.totalHoursMonth} h</strong>
        </div>
      </div>

      <div className="formula" style={{ marginBottom: 16 }}>
        Valor hora C.Fijo = Total costos fijos mes / Total horas mes
        <br />
        Valor minuto C.Fijo = Valor hora C.Fijo / 60
      </div>

      {fixed.totalMonthly <= 0 && (
        <div className="alert warning" style={{ marginBottom: 12 }}>
          No hay gastos fijos activos. Las recetas no cubriran arriendo ni servicios.
        </div>
      )}

      <form className="card grid" onSubmit={submit} style={{ marginBottom: 16 }}>
        <strong>Nuevo rubro mensual</strong>
        <div className="chips">
          {DEFAULT_FIXED_TEMPLATES.filter((t) => !state.fixedCosts.some((c) => c.name === t)).map(
            (t) => (
              <button key={t} type="button" className="chip" onClick={() => setName(t)}>
                {t}
              </button>
            ),
          )}
        </div>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="fx-name">Nombre del gasto</label>
            <input id="fx-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="fx-amt">Monto mensual</label>
            <input
              id="fx-amt"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <button className="btn" type="submit">
          <Icons.plus size={18} /> Agregar gasto
        </button>
      </form>

      <div className="list">
        {state.fixedCosts.map((c) => (
          <article className="card item" key={c.id}>
            <div className="item-top">
              <div className="field" style={{ flex: 1 }}>
                <label className="sr-only" htmlFor={`n-${c.id}`}>
                  Nombre
                </label>
                <input
                  id={`n-${c.id}`}
                  value={c.name}
                  onChange={(e) => updateFixedCost(c.id, { name: e.target.value })}
                />
              </div>
              <button
                className="btn-danger"
                type="button"
                onClick={() => removeFixedCost(c.id)}
                aria-label={`Eliminar ${c.name}`}
              >
                <Icons.trash size={16} />
              </button>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor={`a-${c.id}`}>Monto mensual</label>
                <input
                  id={`a-${c.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={c.monthlyAmount || ""}
                  onChange={(e) => updateFixedCost(c.id, { monthlyAmount: Number(e.target.value) || 0 })}
                />
              </div>
              <label className="chip" style={{ alignSelf: "end" }}>
                <input
                  type="checkbox"
                  checked={c.active}
                  onChange={(e) => updateFixedCost(c.id, { active: e.target.checked })}
                />{" "}
                Activo
              </label>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
