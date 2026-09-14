import { CURRENCIES } from "../lib/money";
import { useStore } from "../store";
import type { CurrencyCode } from "../types";

export default function Ajustes({ onClose }: { onClose: () => void }) {
  const { state, updateSettings, resetDemo } = useStore();

  return (
    <div className="modal-scrim" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-labelledby="ajustes-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="page-head">
          <h2 id="ajustes-title">Negocio y moneda</h2>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="grid">
          <div className="field">
            <label htmlFor="biz">Nombre del negocio</label>
            <input
              id="biz"
              value={state.settings.businessName}
              onChange={(e) => updateSettings({ businessName: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="contact">Contacto (WhatsApp / telefono)</label>
            <input
              id="contact"
              value={state.settings.businessContact}
              onChange={(e) => updateSettings({ businessContact: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="cur">Moneda</label>
            <select
              id="cur"
              value={state.settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value as CurrencyCode })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
            <span className="hint">
              El redondeo se adapta a cada moneda (sin centavos en COP, ARS y CLP).
            </span>
          </div>
          <button
            className="btn-danger"
            type="button"
            onClick={() => {
              if (confirm("Esto restaura datos de ejemplo y borra tus cambios locales.")) resetDemo();
              onClose();
            }}
          >
            Restaurar datos de demostracion
          </button>
        </div>
      </div>
    </div>
  );
}
