import { useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";

export default function TimerField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const started = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (started.current == null) return;
      setSeconds(Math.floor((Date.now() - started.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="field">
      <label>{label}</label>
      <span className="hint">{hint}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="1"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        aria-label={label}
      />
      <div className="timer">
        <span className="timer-display" aria-live="polite">
          {mm}:{ss}
        </span>
        {!running ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              started.current = Date.now() - seconds * 1000;
              setRunning(true);
            }}
          >
            <Icons.clock size={16} /> Iniciar cronometro
          </button>
        ) : (
          <button type="button" className="btn-ghost" onClick={() => setRunning(false)}>
            Pausar
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => {
            setRunning(false);
            const mins = Math.max(1, Math.ceil(seconds / 60));
            onChange(mins);
          }}
        >
          Usar minutos
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setRunning(false);
            setSeconds(0);
            started.current = null;
          }}
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}
