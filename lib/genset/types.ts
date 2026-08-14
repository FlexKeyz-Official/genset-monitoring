// Generator telemetry / config payloads are dynamic (ESP32 firmware defined),
// so we model them as loosely-typed records with helper accessors in format.ts.
export type GensetData = Record<string, number | boolean | string | null | undefined>;
export type GensetConfig = Record<string, number | boolean | string | null | undefined>;

export interface SDFile {
  name: string;
  size: number;
}

export type ToastType = "success" | "error";

export interface ToastState {
  message: string;
  type: ToastType;
  key: number;
}

export type ViewName = "dashboard" | "monitoring" | "configuration";
