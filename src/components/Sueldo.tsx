import { formatMoney, formatNumber } from "../lib/money";
import { useStore } from "../store";

const PRESETS = [22, 26];

export default function Sueldo() {
  const { state, updateSalary, labor, currency } = useStore();
  const s = state.salary;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Calculadora de sueldo</h2>
          <p className="lede">
            Etapa 2. Tu tiempo no es ganancia del negocio: es tu salario. Define lo que quieres
            ganar al mes y AliCakes obtiene el valor del minuto de mano de obra.
          </p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <span>Horas al mes</span>
          <strong>{formatNumber(labor.totalHoursMonth, 1)}</strong>
        </div>
        <div className="kpi">
          <span>Valor hora sueldo</span>
          <strong>{formatMoney(labor.hourWage, currency)}</strong>
        </div>
        <div className="kpi">
          <span>Valor minuto sueldo</span>
          <strong>{formatMoney(labor.minuteWage, currency)}</strong>
        </div>
        <div className="kpi">
          <span>Sueldo objetivo</span>
          <strong>{formatMoney(s.monthlyDesired, currency)}</strong>
        </div>
      </div>

      <div className="formula" style={{ marginBottom: 16 }}>
        Total horas mes = Dias × Horas/dia
        <br />
        Valor hora = Sueldo mensual / Total horas mes
        <br />
        Valor minuto = Valor hora / 60
      </div>

      {!s.monthlyDesired && (
        <div className="alert warning" style={{ marginBottom: 12 }}>
          Sin sueldo configurado, las recetas no cobran tu tiempo.
        </div>
      )}

      <div className="card grid">
        <div className="field">
          <label htmlFor="sueldo">Sueldo mensual deseado</label>
          <input
            id="sueldo"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={s.monthlyDesired || ""}
            onChange={(e) => updateSalary({ monthlyDesired: Number(e.target.value) || 0 })}
          />
          <span className="hint">Lo que tu, como repostero, quieres retirar como salario.</span>
        </div>
        <div className="field">
          <label>Dias trabajados al mes</label>
          <div className="chips">
            {PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                className={`chip ${s.daysPerMonth === d ? "active" : ""}`}
                onClick={() => updateSalary({ daysPerMonth: d })}
              >
                {d} dias
              </button>
            ))}
            <button
              type="button"
              className={`chip ${![22, 26].includes(s.daysPerMonth) ? "active" : ""}`}
              onClick={() => updateSalary({ daysPerMonth: 20 })}
            >
              Personalizado
            </button>
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={s.daysPerMonth || ""}
            onChange={(e) => updateSalary({ daysPerMonth: Number(e.target.value) || 0 })}
            aria-label="Dias personalizados"
          />
          <span className="hint">Predeterminado: 26. Tambien 22 o el numero que uses.</span>
        </div>
        <div className="field">
          <label htmlFor="horas">Horas trabajadas por dia</label>
          <input
            id="horas"
            type="number"
            inputMode="decimal"
            min={1}
            max={24}
            step="0.5"
            value={s.hoursPerDay || ""}
            onChange={(e) => updateSalary({ hoursPerDay: Number(e.target.value) || 0 })}
          />
          <span className="hint">Predeterminado: 8 horas.</span>
        </div>
      </div>
    </div>
  );
}
