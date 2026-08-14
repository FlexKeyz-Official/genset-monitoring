"use client";

import { useRef, useState } from "react";
import { FAULT_REGISTERS } from "@/lib/genset/constants";
import { bytes, isValidFrequency, num } from "@/lib/genset/format";
import { GensetData, SDFile } from "@/lib/genset/types";

function GoodBad({ ok, good = "OK", bad = "FAULT" }: { ok: boolean; good?: string; bad?: string }) {
  return <b style={{ color: ok ? "#34d399" : "#f87171" }}>{ok ? good : bad}</b>;
}

interface PhaseRowProps {
  phase: string;
  d: GensetData;
}

function PhaseRow({ phase, d }: PhaseRowProps) {
  const s = phase.toLowerCase();
  return (
    <tr>
      <td>{phase}</td>
      <td>{num(d[`voltage_${s}`], 1)}</td>
      <td>{num(d[`current_${s}`], 2)}</td>
      <td>{num(d[`frequency_${s}`], 2)}</td>
      <td>{num(d[`power_${s}`], 0)}</td>
      <td>{num(d[`apparent_${s}`], 0)}</td>
      <td>{num(d[`pf_${s}`], 3)}</td>
      <td>{num(d[`raw_current_${s}`], 2)}</td>
      <td>{num(d[`current_noise_${s}`], 2)}</td>
      <td>{num(d[`current_offset_${s}`], 0)}</td>
      <td>
        <GoodBad ok={!!d[`ct_valid_${s}`]} bad="INVALID" />
      </td>
    </tr>
  );
}

interface MonitoringViewProps {
  data: GensetData | null;
  sdFiles: SDFile[];
  onTestSD: () => void;
  onDownloadLog: () => void;
  onSyncRTC: () => void;
  onTestOil: () => void;
  onRefreshSDFiles: () => void;
  onUploadSDFile: (file: File | null) => void;
  onDownloadSelectedSDFile: (name: string) => void;
  onCalibrateCTs: () => void;
}

export function MonitoringView({
  data,
  sdFiles,
  onTestSD,
  onDownloadLog,
  onSyncRTC,
  onTestOil,
  onRefreshSDFiles,
  onUploadSDFile,
  onDownloadSelectedSDFile,
  onCalibrateCTs,
}: MonitoringViewProps) {
  const d = data || {};
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState("");

  const phaseFreqs = ["a", "b", "c"].map((s) => Number(d[`frequency_${s}`] || 0));
  const validFreqs = phaseFreqs.filter((v) => v >= 40 && v <= 70);
  const freqQualityText =
    validFreqs.length === 3 ? "All phase frequencies valid" : `${validFreqs.length}/3 phase frequencies valid`;
  const freqQualityColor = validFreqs.length === 3 ? "#34d399" : "#fbbf24";

  return (
    <section className="space-y-6">
      <div className="panel overflow-x-auto">
        <div className="flex flex-wrap justify-between gap-3 items-center mb-4">
          <div>
            <h3 className="section-title">Per-Phase Electrical Parameters</h3>
            <p className="section-subtitle">
              Independent voltage, current and frequency readings for all three phases, plus averages.
            </p>
          </div>
          <span className="badge" style={{ color: freqQualityColor }}>
            {freqQualityText}
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Voltage (V)</th>
              <th>Current (A)</th>
              <th>Frequency (Hz)</th>
              <th>Real P (W)</th>
              <th>Apparent S (VA)</th>
              <th>PF</th>
              <th>Raw I (A)</th>
              <th>Noise baseline (A)</th>
              <th>ADC offset</th>
              <th>CT</th>
            </tr>
          </thead>
          <tbody>
            <PhaseRow phase="A" d={d} />
            <PhaseRow phase="B" d={d} />
            <PhaseRow phase="C" d={d} />
            <tr className="average-row">
              <td>AVERAGE</td>
              <td>{num(d.voltage, 1)}</td>
              <td>{num(d.current, 2)}</td>
              <td>{isValidFrequency(d.frequency) ? num(d.frequency, 2) : "0.00"}</td>
              <td>{num(d.average_real_power, 0)}</td>
              <td>{num(d.average_apparent_power, 0)}</td>
              <td>{num(d.power_factor, 3)}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="mini-stat">
            <span>Voltage Imbalance</span>
            <b>{num(d.voltage_imbalance, 2)}%</b>
          </div>
          <div className="mini-stat">
            <span>Current Imbalance</span>
            <b>{num(d.current_imbalance, 2)}%</b>
          </div>
          <div className="mini-stat">
            <span>Voltage THD</span>
            <b>{num(d.voltage_thd, 2)}%</b>
          </div>
          <div className="mini-stat">
            <span>Total Apparent Power</span>
            <b>{num(d.apparent_power, 0)} VA</b>
          </div>
        </div>

        <button className="action-btn amber-btn mt-4" onClick={onCalibrateCTs}>
          CONFIRM SCT CALIBRATION SETTINGS
        </button>
        <p className="help-text mt-2">
          Uses the proven settings: raw noise limit 0.70 A and calibration factor 2.84 for all three phases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel">
          <h3 className="section-title">Protection Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {FAULT_REGISTERS.map(([id, key, label]) => (
              <div key={id} className={`register ${d[key] ? "active" : ""}`}>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="section-title">Hardware and SD Logging</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div className="hardware-stat">
              <span>Wi-Fi</span>
              <GoodBad ok={!!d.wifi_ok} />
            </div>
            <div className="hardware-stat">
              <span>SD Mount</span>
              <GoodBad ok={!!d.sd_ok} />
            </div>
            <div className="hardware-stat">
              <span>SD Write</span>
              <GoodBad ok={!!d.sd_write_ok} />
            </div>
            <div className="hardware-stat">
              <span>RTC</span>
              <GoodBad ok={!!d.rtc_ok} />
            </div>
            <div className="hardware-stat">
              <span>RTC Detail</span>
              <b>--</b>
            </div>
            <div className="hardware-stat">
              <span>SD Card Type</span>
              <b>--</b>
            </div>
            <div className="hardware-stat">
              <span>SD Capacity</span>
              <b>--</b>
            </div>
            <div className="hardware-stat">
              <span>SD Used</span>
              <b>--</b>
            </div>
            <div className="hardware-stat">
              <span>MPU6050</span>
              <GoodBad ok={!d.mpu_fault} />
            </div>
          </div>

          <div className="status-list mt-4">
            <div>
              <span>SD status</span>
              <b>{(d.sd_status as string) || "--"}</b>
            </div>
            <div>
              <span>Records this session</span>
              <b>{(d.sd_log_records as number) || 0}</b>
            </div>
            <div>
              <span>Log file size</span>
              <b>{bytes(d.sd_log_file_size)}</b>
            </div>
            <div>
              <span>Last successful log</span>
              <b>{(d.sd_last_log_time as string) || "NEVER"}</b>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <button className="action-btn amber-btn" onClick={onTestSD}>
              RUN SD MODULE WRITE/READ TEST
            </button>
            <button className="action-btn neutral-btn" onClick={onDownloadLog}>
              DOWNLOAD MAIN CSV LOG
            </button>
            <button className="action-btn green-btn" onClick={onSyncRTC}>
              SYNC RTC FROM THIS DEVICE
            </button>
            <button className="action-btn amber-btn" onClick={onTestOil}>
              TEST OIL SENSOR MODULE
            </button>
            <button className="action-btn neutral-btn" onClick={onRefreshSDFiles}>
              REFRESH SD FILES
            </button>
          </div>

          <div className="mt-5 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <h3 className="section-title">Manual SD Card Data Transfer</h3>
            <p className="help-text mt-2">
              Upload a data file from this device directly to the SD card, or download any file stored on the SD
              card module.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.log,.json" />
              <button
                className="action-btn green-btn"
                onClick={() => onUploadSDFile(fileInputRef.current?.files?.[0] ?? null)}
              >
                UPLOAD FILE TO SD CARD
              </button>
            </div>
            <div className="mt-3">
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-emerald-400"
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
              >
                {sdFiles.length === 0 && <option value="">No files found</option>}
                {sdFiles.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({bytes(f.size)})
                  </option>
                ))}
              </select>
              <button className="action-btn neutral-btn mt-3" onClick={() => onDownloadSelectedSDFile(selectedFile)}>
                DOWNLOAD SELECTED SD FILE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
