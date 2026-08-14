import { GensetData } from "./types";

export function num(v: unknown, digits = 0): string {
  return Number(v ?? 0).toFixed(digits);
}

export function bytes(v: unknown): string {
  const n = Number(v || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

export function clean(v: string): string {
  return String(v || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export function get(d: GensetData | null, key: string) {
  return d ? d[key] : undefined;
}

export function isValidFrequency(f: unknown): boolean {
  const n = Number(f);
  return n >= 40 && n <= 70;
}
