import { useState } from "react";
import Ajustes from "./components/Ajustes";
import Logo from "./components/Logo";
import Cotizar from "./components/Cotizar";
import Despensa from "./components/Despensa";
import Gastos from "./components/Gastos";
import { Icons } from "./components/Icons";
import Recetas from "./components/Recetas";
import Sueldo from "./components/Sueldo";
import { useStore } from "./store";
import type { TabId } from "./types";

const TABS: { id: TabId; label: string; stage: string; icon: keyof typeof Icons }[] = [
  { id: "despensa", label: "Ingredientes", stage: "Etapa 1", icon: "wheat" },
  { id: "sueldo", label: "Mi sueldo", stage: "Etapa 2", icon: "wallet" },
  { id: "gastos", label: "Gastos fijos", stage: "Etapa 3", icon: "package" },
  { id: "recetas", label: "Mis recetas", stage: "Etapa 4", icon: "chef" },
  { id: "cotizar", label: "Cotizar", stage: "Cliente", icon: "file" },
];

export default function App() {
  const { tab, setTab, state, labor, fixed } = useStore();
  const [ajustes, setAjustes] = useState(false);
  const missingFixed = fixed.totalMonthly <= 0;
  const missingSalary = !state.salary.monthlyDesired;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <header className="topbar no-print">
        <div className="brand">
          <Logo />
        </div>
        <div className="top-actions">
          {(missingFixed || missingSalary) && (
            <button
              className="icon-btn"
              type="button"
              onClick={() => setTab(missingSalary ? "sueldo" : "gastos")}
              aria-label="Alertas de configuracion"
              title="Hay datos pendientes"
            >
              <Icons.bell size={20} />
            </button>
          )}
          <button
            className="icon-btn"
            type="button"
            onClick={() => setAjustes(true)}
            aria-label="Ajustes de negocio y moneda"
          >
            <Icons.settings size={20} />
          </button>
        </div>
      </header>

      <nav className="stage-strip no-print" aria-label="Etapas del cuaderno">
        {TABS.filter((t) => t.id !== "cotizar").map((t) => (
          <button
            key={t.id}
            type="button"
            className={`stage-card ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <small>{t.stage}</small>
            <strong>{t.label}</strong>
          </button>
        ))}
      </nav>

      {missingFixed && tab !== "gastos" && (
        <div className="alert warning no-print" style={{ marginBottom: 12 }}>
          No has ingresado costos fijos. Las recetas pueden venderse por debajo del costo real.
        </div>
      )}

      <main id="main" className="notebook">
        {tab === "despensa" && <Despensa />}
        {tab === "sueldo" && <Sueldo />}
        {tab === "gastos" && <Gastos />}
        {tab === "recetas" && <Recetas />}
        {tab === "cotizar" && <Cotizar />}
      </main>

      <nav className="bottom-nav no-print" aria-label="Navegacion principal">
        {TABS.map((t) => {
          const Icon = Icons[t.icon];
          return (
            <button
              key={t.id}
              type="button"
              className={`nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={22} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {ajustes && <Ajustes onClose={() => setAjustes(false)} />}
      <span className="sr-only">
        {labor.totalHoursMonth} horas mensuales de referencia.
      </span>
    </div>
  );
}
