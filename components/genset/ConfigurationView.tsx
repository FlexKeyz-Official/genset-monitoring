"use client";

import { FormEvent, useEffect, useState } from "react";
import { MS_TO_SECONDS_FIELDS, PROTECTION_RULES } from "@/lib/genset/constants";
import { GensetConfig } from "@/lib/genset/types";

interface FieldSpec {
  key: string;
  label: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
  maxLength?: number;
}

const FIELD_GROUPS: FieldSpec[] = [
  { key: "generator_name", label: "Generator name", type: "text", maxLength: 39, required: true },
  { key: "rated_voltage", label: "Rated phase voltage (V)", step: "0.1", min: "1", required: true },
  { key: "rated_current", label: "Rated phase current (A)", step: "0.01", min: "0.01", required: true },
  { key: "rated_power", label: "Rated total power (kW)", step: "0.01", min: "0.01", required: true },
  { key: "rated_frequency", label: "Rated frequency (Hz)", step: "0.01", required: true },
  { key: "current_valid_voltage", label: "Current valid above voltage (V)", step: "0.1", required: true },
  { key: "under_voltage", label: "Under-voltage (V)", step: "0.1", required: true },
  { key: "over_voltage", label: "Over-voltage (V)", step: "0.1", required: true },
  { key: "under_frequency", label: "Under-frequency (Hz)", step: "0.01", required: true },
  { key: "over_frequency", label: "Over-frequency (Hz)", step: "0.01", required: true },
  { key: "current_warning", label: "Current warning (A)", step: "0.01", required: true },
  { key: "current_trip", label: "Current trip (A)", step: "0.01", required: true },
  { key: "power_trip", label: "Total power trip (W)", step: "1", required: true },
  { key: "low_pf", label: "Low PF limit", step: "0.01", min: "0", max: "1", required: true },
  { key: "voltage_imbalance_limit", label: "Voltage imbalance limit (%)", step: "0.1", required: true },
  { key: "current_imbalance_limit", label: "Current imbalance limit (%)", step: "0.1", required: true },
  { key: "thd_limit", label: "THD limit (%)", step: "0.1", required: true },
  { key: "startup_ignore_ms", label: "Startup ignore time (s)", step: "1", required: true },
  { key: "temperature_warning", label: "Temperature warning (°C)", step: "0.1", required: true },
  { key: "temperature_trip", label: "Temperature trip (°C)", step: "0.1", required: true },
  { key: "vibration_warning", label: "Vibration warning (m/s²)", step: "0.01", required: true },
  { key: "vibration_trip", label: "Vibration trip (m/s²)", step: "0.01", required: true },
  { key: "tilt_trip", label: "Tilt trip (°)", step: "0.1", required: true },
  { key: "low_oil_limit", label: "Low oil limit (%)", step: "0.1", required: true },
  { key: "oil_full_distance_cm", label: "Oil FULL distance (cm)", step: "0.1", min: "2", required: true },
  { key: "oil_empty_distance_cm", label: "Oil EMPTY distance (cm)", step: "0.1", min: "2", required: true },
  { key: "service_interval_hours", label: "Service interval (h)", step: "0.1", required: true },
];

interface ProtectionFormRow {
  enable: boolean;
  trip: boolean;
  sms: boolean;
  delay: string;
}

function initialProtection(): Record<string, ProtectionFormRow> {
  const p: Record<string, ProtectionFormRow> = {};
  PROTECTION_RULES.forEach(([key]) => {
    p[key] = { enable: false, trip: false, sms: false, delay: "0" };
  });
  return p;
}

interface ConfigurationViewProps {
  config: GensetConfig | null;
  onLoadConfig: () => void;
  onSaveConfig: (config: GensetConfig) => Promise<boolean>;
  onRestoreDefault: () => void;
}

export function ConfigurationView({ config, onLoadConfig, onSaveConfig, onRestoreDefault }: ConfigurationViewProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [logInterval, setLogInterval] = useState("60");
  const [protection, setProtection] = useState<Record<string, ProtectionFormRow>>(initialProtection);

  useEffect(() => {
    if (!config) return;
    const v: Record<string, string> = {};
    FIELD_GROUPS.forEach(({ key }) => {
      const raw = config[key];
      v[key] = MS_TO_SECONDS_FIELDS.has(key) ? String(Number(raw || 0) / 1000) : String(raw ?? "");
    });
    setValues(v);
    setLogInterval(String(Number(config.log_interval_ms || 0) / 1000));
    const p: Record<string, ProtectionFormRow> = {};
    PROTECTION_RULES.forEach(([key]) => {
      p[key] = {
        enable: !!config[`${key}_enable`],
        trip: !!config[`${key}_trip`],
        sms: !!config[`${key}_sms`],
        delay: String(Number(config[`${key}_delay_ms`] || 0) / 1000),
      };
    });
    setProtection(p);
  }, [config]);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setProtectionField(key: string, field: keyof ProtectionFormRow, value: boolean | string) {
    setProtection((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: GensetConfig = {};
    FIELD_GROUPS.forEach(({ key }) => {
      payload[key] = key === "generator_name" ? values[key]?.trim() ?? "" : Number(values[key] || 0);
    });
    payload.log_interval_ms = Number(logInterval || 0);
    PROTECTION_RULES.forEach(([key]) => {
      const row = protection[key];
      payload[`${key}_enable`] = row.enable;
      payload[`${key}_trip`] = row.trip;
      payload[`${key}_sms`] = row.sms;
      payload[`${key}_delay_ms`] = Number(row.delay || 0);
    });
    onSaveConfig(payload);
  }

  return (
    <section className="space-y-5">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="panel">
          <h2 className="section-title">Generator and Protection Configuration</h2>
          <div className="form-grid mt-4">
            {FIELD_GROUPS.map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  type={f.type || "number"}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  maxLength={f.maxLength}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValue(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="section-title">Individual Protection Behaviour</h3>
            <p className="help-text mt-2">
              Enable determines whether the fault is monitored. Trip determines whether it opens the relay. SMS
              determines whether a trip alert is sent. Delay prevents nuisance trips from short transients.
            </p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="text-left p-2">Protection</th>
                    <th className="p-2">Enable</th>
                    <th className="p-2">Trip</th>
                    <th className="p-2">SMS</th>
                    <th className="p-2">Delay (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {PROTECTION_RULES.map(([key, label]) => {
                    const row = protection[key] ?? { enable: false, trip: false, sms: false, delay: "0" };
                    return (
                      <tr key={key} className="border-b border-slate-900">
                        <td className="p-2 text-slate-300">{label}</td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.enable}
                            onChange={(e) => setProtectionField(key, "enable", e.target.checked)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.trip}
                            onChange={(e) => setProtectionField(key, "trip", e.target.checked)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.sms}
                            onChange={(e) => setProtectionField(key, "sms", e.target.checked)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                            type="number"
                            min="0"
                            step="0.1"
                            value={row.delay}
                            onChange={(e) => setProtectionField(key, "delay", e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="section-title">Logging Configuration</h3>
            <div className="form-grid mt-3">
              <label>
                SD log interval (seconds)
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={logInterval}
                  onChange={(e) => setLogInterval(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <button className="action-btn start-btn" type="submit">
              SAVE CONFIGURATION
            </button>
            <button className="action-btn neutral-btn" type="button" onClick={onLoadConfig}>
              RELOAD FROM ESP32
            </button>
            <button className="action-btn amber-btn" type="button" onClick={onRestoreDefault}>
              RESTORE DEFAULTS
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
