"use client";

import { ViewName } from "@/lib/genset/types";

interface HeaderProps {
  connectionLabel: string;
  connected: boolean;
  view: ViewName;
  onShowView: (v: ViewName) => void;
  ipInput: string;
  onIpInputChange: (v: string) => void;
  onEditingChange: (editing: boolean) => void;
  onConnect: () => void;
}

const VIEWS: { name: ViewName; label: string }[] = [
  { name: "dashboard", label: "Dashboard" },
  { name: "monitoring", label: "Parameter Monitoring" },
  { name: "configuration", label: "Configuration" },
];

export function Header({
  connectionLabel,
  connected,
  view,
  onShowView,
  ipInput,
  onIpInputChange,
  onEditingChange,
  onConnect,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="font-black tracking-wider uppercase text-sm">ScenarioOS Genset Monitor</h1>
          <p className={`text-[11px] font-mono ${connected ? "text-emerald-400" : "text-slate-500"}`}>
            {connectionLabel}
          </p>
        </div>

        <nav className="flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.name}
              className={`nav-btn ${view === v.name ? "active" : ""}`}
              onClick={() => onShowView(v.name)}
            >
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex gap-2 items-center">
          <input
            value={ipInput}
            onChange={(e) => {
              onIpInputChange(e.target.value);
              onEditingChange(true);
            }}
            onFocus={(e) => {
              onEditingChange(true);
              e.target.select();
            }}
            onBlur={() => onEditingChange(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onConnect();
              }
            }}
            placeholder="192.168.1.105 or generator.local"
            autoComplete="off"
            spellCheck={false}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-emerald-400 w-56"
          />
          <button className="connect-btn" onClick={onConnect}>
            CONNECT
          </button>
        </div>
      </div>
    </header>
  );
}
