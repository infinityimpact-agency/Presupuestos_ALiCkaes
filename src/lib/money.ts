import type { CurrencyCode, CurrencyMeta } from "../types";

export const CURRENCIES: CurrencyMeta[] = [
  { code: "COP", label: "Peso colombiano", symbol: "$", locale: "es-CO", decimals: 0 },
  { code: "ARS", label: "Peso argentino", symbol: "$", locale: "es-AR", decimals: 0 },
  { code: "MXN", label: "Peso mexicano", symbol: "$", locale: "es-MX", decimals: 2 },
  { code: "CLP", label: "Peso chileno", symbol: "$", locale: "es-CL", decimals: 0 },
  { code: "PEN", label: "Sol peruano", symbol: "S/", locale: "es-PE", decimals: 2 },
  { code: "USD", label: "Dolar estadounidense", symbol: "US$", locale: "en-US", decimals: 2 },
  { code: "BRL", label: "Real brasileno", symbol: "R$", locale: "pt-BR", decimals: 2 },
  { code: "EUR", label: "Euro", symbol: "€", locale: "es-ES", decimals: 2 },
];

export function getCurrency(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  const currency = getCurrency(code);
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(amount);
  } catch {
    const n = amount.toFixed(currency.decimals);
    return `${currency.symbol} ${n}`;
  }
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function roundUpCurrency(amount: number, code: CurrencyCode): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const currency = getCurrency(code);
  if (currency.decimals === 0) {
    if (amount >= 100000) return Math.ceil(amount / 1000) * 1000;
    if (amount >= 10000) return Math.ceil(amount / 100) * 100;
    if (amount >= 1000) return Math.ceil(amount / 50) * 50;
    return Math.ceil(amount);
  }
  const factor = Math.pow(10, currency.decimals);
  return Math.ceil(amount * factor) / factor;
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
