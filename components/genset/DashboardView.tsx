"use client";

import { GensetData } from "@/lib/genset/types";
import { isValidFrequency, num } from "@/lib/genset/format";
import { LiveChart } from "./LiveChart";

function Meter({ percent, bad, warn }: { percent: number; bad?: boolean; warn?: boolean }) {
  const width = Math.max(0, Math.min(100, percent));
  const color = bad ? "#ef4444" : warn ? "#f59e0b" : "#10b981";
  return (
    <div className="meter">
      <i style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

interface DashboardViewProps {
  data: GensetData | null;
  onGeneratorCommand: (cmd: "on" | "off") => void;
  onResetFaults: () => void;
  onResetMaintenance: () => void;
  onToggleOverride: () => void;
  onToggleCurrentProtection: () => void;
}

export function DashboardView({
  data,
  onGeneratorCommand,
  onResetFaults,
  onResetMaintenance,
  onToggleOverride,
  onToggleCurrentProtection,
}: DashboardViewProps) {
  const d = data || {};
  const frequency = isValidFrequency(d.frequency) ? num(d.frequency, 2) : "0.00";
  const manualOverride = !!d.manual_override;
  const currentProtectionOn = !!d.current_protection_enabled;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <article className="metric-card">
          <span>Average Voltage</span>
          <strong>{num(d.voltage, 1)} V</strong>
          <Meter
            percent={(Number(d.voltage || 0) / Math.max(1, Number(d.rated_voltage || 1))) * 100}
            bad={!!(d.under_voltage || d.over_voltage)}
          />
        </article>
        <article className="metric-card">
          <span>Average Current</span>
          <strong>{num(d.current, 2)} A</strong>
          <Meter
            percent={(Number(d.current || 0) / Math.max(1, Number(d.current_trip || 1))) * 100}
            bad={!!d.overload}
            warn={Number(d.current || 0) >= Number(d.current_warning || 0)}
          />
        </article>
        <article className="metric-card">
          <span>Average Frequency</span>
          <strong>{frequency} Hz</strong>
          <Meter
            percent={(Number(d.frequency || 0) / Math.max(1, Number(d.rated_frequency || 50))) * 100}
            bad={!!d.frequency_fault}
          />
        </article>
        <article className="metric-card">
          <span>Overall Power Factor</span>
          <strong>{num(d.power_factor, 3)}</strong>
          <Meter percent={Number(d.power_factor || 0) * 100} bad={!!d.low_power_factor} />
        </article>
        <article className="metric-card">
          <span>Total Output Power</span>
          <strong>{num(d.output_power, 0)} W</strong>
          <Meter
            percent={(Number(d.output_power || 0) / Math.max(1, Number(d.power_trip || 1))) * 100}
            bad={!!d.overload}
          />
        </article>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="mini-stat">
          <span>Temperature</span>
          <b>{d.temperature == null ? "ERR" : `${num(d.temperature, 1)} °C`}</b>
        </div>
        <div className="mini-stat">
          <span>Vibration</span>
          <b>{num(d.vibration, 3)} m/s²</b>
        </div>
        <div className="mini-stat">
          <span>Tilt</span>
          <b>{num(d.tilt, 1)}°</b>
        </div>
        <div className="mini-stat">
          <span>Oil Level</span>
          <b>{num(d.oil_level, 1)}%</b>
        </div>
      </div>

      <div className="panel">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <div>
            <h3 className="section-title">Generator Control</h3>
            <p className="section-subtitle">Essential controls for immediate Actions</p>
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Override: {manualOverride ? "ON" : "OFF"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <button className="action-btn start-btn" onClick={() => onGeneratorCommand("on")}>
            ENABLE OUTPUT
          </button>
          <button className="action-btn stop-btn" onClick={() => onGeneratorCommand("off")}>
            REMOTE SHUTDOWN
          </button>
          <button className="action-btn amber-btn" onClick={onResetFaults}>
            RESET FAULT
          </button>
          <button className="action-btn neutral-btn" onClick={onResetMaintenance}>
            RESET MAINTENANCE
          </button>
        </div>

        <div className="mt-3 border border-slate-800 rounded-lg p-3 bg-slate-950/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current-based tripping
              </p>
              <p className="help-text mt-1">Current remains measured, displayed and logged.</p>
            </div>
            <button
              className={`action-btn ${currentProtectionOn ? "stop-btn" : "amber-btn"}`}
              onClick={onToggleCurrentProtection}
            >
              {currentProtectionOn ? "DISABLE CURRENT PROTECTION" : "ENABLE CURRENT PROTECTION"}
            </button>
          </div>
          <p className={`text-[11px] font-mono mt-2 ${currentProtectionOn ? "text-emerald-400" : "text-amber-400"}`}>
            Current trip protection: {currentProtectionOn ? "ENABLED" : "DISABLED"}
          </p>
        </div>

        <details className="mt-3 border border-slate-800 rounded-lg p-3 bg-slate-950/70">
          <summary className="cursor-pointer text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Emergency manual override
          </summary>
          <div className="mt-3">
            <p className="help-text">
              Override keeps faults visible but bypasses automatic shutdown. Use only under responsible supervision.
            </p>
            <button className="action-btn stop-btn mt-3" onClick={onToggleOverride}>
              {manualOverride ? "DISABLE OVERRIDE" : "ENABLE OVERRIDE"}
            </button>
          </div>
        </details>
      </div>

      <div className="panel">
        <h3 className="section-title">Live Average Trend</h3>
        <div className="h-72 mt-4">
          <LiveChart data={data} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="mini-stat">
          <span>Oil Distance</span>
          <b>{d.oil_distance_cm == null ? "ERR" : `${num(d.oil_distance_cm, 1)} cm`}</b>
        </div>
        <div className="mini-stat">
          <span>Oil Sensor</span>
          <b style={{ color: d.oil_sensor_ok ? "#34d399" : "#f87171" }}>
            {d.oil_sensor_ok ? "OK" : "ERROR"}
          </b>
        </div>
        <div className="mini-stat">
          <span>Voltage Imbalance</span>
          <b>{num(d.voltage_imbalance, 2)}%</b>
        </div>
        <div className="mini-stat">
          <span>Current Imbalance</span>
          <b>{num(d.current_imbalance, 2)}%</b>
        </div>
      </div>
    </section>
  );
}
