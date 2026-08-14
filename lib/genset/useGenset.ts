"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_ADDRESS, MS_TO_SECONDS_FIELDS, PROTECTION_RULES, STORAGE_KEY } from "./constants";
import { clean } from "./format";
import { GensetConfig, GensetData, SDFile, ToastState } from "./types";

const POLL_INTERVAL_MS = 1500;
const RECONNECT_INTERVAL_MS = 5000;
const TOAST_DURATION_MS = 3000;

let toastKeySeed = 0;

export function useGenset() {
  const [ip, setIp] = useState(DEFAULT_ADDRESS);
  const [ipInput, setIpInput] = useState(DEFAULT_ADDRESS);
  const [connected, setConnected] = useState(false);
  const [connectionLabel, setConnectionLabel] = useState("Node status: offline");
  const [data, setData] = useState<GensetData | null>(null);
  const [config, setConfig] = useState<GensetConfig | null>(null);
  const [sdFiles, setSdFiles] = useState<SDFile[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  const ipRef = useRef(ip);
  const connectedRef = useRef(connected);
  const editingAddressRef = useRef(false);
  const reconnectBusyRef = useRef(false);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ipRef.current = ip;
  }, [ip]);
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setIp(stored);
      setIpInput(stored);
    }
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" = "error") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastKeySeed += 1;
    setToast({ message, type, key: toastKeySeed });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const endpoint = useCallback((path: string) => `http://${ipRef.current}${path}`, []);

  const request = useCallback(
    async (path: string, opt: RequestInit = {}, timeout = 12000) => {
      const url = endpoint(path);
      try {
        const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(timeout) });
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        return r;
      } catch (e) {
        // include URL in error to aid debugging (CORS, timeouts, DNS, etc.)
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Request to ${url} failed:`, e);
        throw new Error(`${msg} (url: ${url})`);
      }
    },
    [endpoint]
  );

  const setConnectionState = useCallback(
    (ok: boolean, msg = "") => {
      const was = connectedRef.current;
      connectedRef.current = ok;
      setConnected(ok);
      if (ok) {
        setConnectionLabel(`Node status: online at ${ipRef.current}`);
        if (!was) showToast("ESP32 connected.", "success");
      } else {
        setConnectionLabel(msg || "Node status: offline");
        if (was) showToast("Communication with the ESP32 has been lost.");
      }
    },
    [showToast]
  );

  const poll = useCallback(async () => {
    try {
      const res = await request("/data", {}, 12000);
      const json = (await res.json()) as GensetData;
      setData(json);
      setConnectionState(true);
    } catch {
      setConnectionState(false);
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    }
  }, [request, setConnectionState]);

  const tryAddress = useCallback(
    async (addr: string, alertFail = false) => {
      const c = clean(addr);
      if (!c) return false;
      const prev = ipRef.current;
      ipRef.current = c;
      setIp(c);
      try {
        await request("/ping", {}, 12000);
        localStorage.setItem(STORAGE_KEY, c);
        setConnectionState(true);
        if (!editingAddressRef.current) setIpInput(c);
        if (pollerRef.current) clearInterval(pollerRef.current);
        await poll();
        pollerRef.current = setInterval(poll, POLL_INTERVAL_MS);
        return true;
      } catch (e) {
        ipRef.current = prev;
        setIp(prev);
        if (alertFail) {
          const em = e instanceof Error ? e.message : String(e);
          showToast(`Connection failed: ${em}`);
        }
        console.error("tryAddress failed", { addr: addr, error: e });
        return false;
      }
    },
    [request, poll, setConnectionState, showToast]
  );

  const connect = useCallback(async () => {
    await tryAddress(ipInput, true);
  }, [ipInput, tryAddress]);

  const reconnect = useCallback(async () => {
    if (connectedRef.current || reconnectBusyRef.current || editingAddressRef.current) return;
    reconnectBusyRef.current = true;
    const candidates = [clean(ipInput), clean(localStorage.getItem(STORAGE_KEY) || ""), DEFAULT_ADDRESS].filter(
      (v, i, a) => v && a.indexOf(v) === i
    );
    for (const c of candidates) {
      if (await tryAddress(c, false)) break;
    }
    reconnectBusyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tryAddress]);

  useEffect(() => {
    reconnect();
    const t = setInterval(reconnect, RECONNECT_INTERVAL_MS);
    return () => {
      clearInterval(t);
      if (pollerRef.current) clearInterval(pollerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const post = useCallback(
    async (path: string, confirmText = "") => {
      if (confirmText && !window.confirm(confirmText)) return;
      try {
        const r = await request(path, { method: "POST" }, 10000);
        showToast(await r.text(), "success");
        await poll();
      } catch (e) {
        showToast(e instanceof Error ? e.message : String(e));
      }
    },
    [request, showToast, poll]
  );

  const generatorCommand = useCallback((cmd: "on" | "off") => post(`/generator/${cmd}`), [post]);
  const resetFaults = useCallback(() => post("/fault/reset"), [post]);
  const resetMaintenance = useCallback(
    () => post("/maintenance/reset", "Confirm maintenance has been completed?"),
    [post]
  );

  const toggleOverride = useCallback(async () => {
    try {
      const d = (await (await request("/data")).json()) as GensetData;
      if (!d.manual_override) {
        const accepted = window.confirm(
          "WARNING: Enabling override bypasses automatic shutdown even while faults remain active. Continue operation only under responsible supervision. Enable override?"
        );
        if (!accepted) return;
        await post("/override/on");
      } else {
        await post("/override/off", "Disable override and restore automatic protection?");
      }
    } catch (e) {
      showToast(`Override command failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [request, post, showToast]);

  const toggleCurrentProtection = useCallback(async () => {
    try {
      const d = (await (await request("/data")).json()) as GensetData;
      if (!d.current_protection_enabled) {
        const accepted = window.confirm(
          "Enable current-based tripping? Overload and current-imbalance readings will be allowed to shut down the generator."
        );
        if (!accepted) return;
        await post("/protection/current/on");
      } else {
        const accepted = window.confirm(
          "Disable current-based tripping? Current remains visible and logged, but it will no longer shut down the generator."
        );
        if (!accepted) return;
        await post("/protection/current/off");
      }
    } catch (e) {
      showToast(`Current protection command failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [request, post, showToast]);

  const testSD = useCallback(() => post("/sd/test"), [post]);

  const syncRTC = useCallback(async () => {
    try {
      const epoch = Math.floor(Date.now() / 1000);
      const r = await request(
        "/rtc/set",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ epoch }) },
        12000
      );
      showToast(await r.text(), "success");
      await poll();
    } catch (e) {
      showToast(`RTC sync failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [request, showToast, poll]);

  const testOil = useCallback(async () => {
    try {
      const r = await request("/oil/test", { method: "POST" }, 15000);
      const d = await r.json();
      showToast(
        `${d.status}; valid samples ${d.valid_samples}; average ${
          d.average_cm == null ? "--" : Number(d.average_cm).toFixed(1) + " cm"
        }`,
        d.ok ? "success" : "error"
      );
      await poll();
    } catch (e) {
      showToast(`Oil sensor test failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [request, showToast, poll]);

  const refreshSDFiles = useCallback(async () => {
    try {
      const r = await request("/sd/files", {}, 12000);
      const d = await r.json();
      setSdFiles(d.files || []);
    } catch (e) {
      showToast(`SD file list failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [request, showToast]);

  const uploadSDFile = useCallback(
    async (file: File | null) => {
      if (!file) return showToast("Choose a file first.");
      const form = new FormData();
      form.append("file", file, file.name);
      try {
        const r = await request("/sd/upload", { method: "POST", body: form }, 30000);
        showToast(await r.text(), "success");
        await refreshSDFiles();
        await poll();
      } catch (e) {
        showToast(`SD upload failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [request, showToast, refreshSDFiles, poll]
  );

  const downloadSelectedSDFile = useCallback(
    (name: string) => {
      if (!name) return showToast("Select an SD file first.");
      window.open(`${endpoint("/sd/file")}?name=${encodeURIComponent(name)}`, "_blank");
    },
    [endpoint, showToast]
  );

  const calibrateCTs = useCallback(() => post("/ct/calibrate/no-load"), [post]);
  const downloadLog = useCallback(() => window.open(endpoint("/downloadlog"), "_blank"), [endpoint]);

  const loadConfig = useCallback(async () => {
    if (!connectedRef.current) return;
    try {
      const c = (await (await request("/config")).json()) as GensetConfig;
      setConfig(c);
    } catch (e) {
      showToast(`Configuration load failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [request, showToast]);

  const saveConfig = useCallback(
    async (form: GensetConfig) => {
      const c: GensetConfig = { ...form };
      MS_TO_SECONDS_FIELDS.forEach((k) => {
        c[k] = Math.round(Number(c[k] || 0) * 1000);
      });
      PROTECTION_RULES.forEach(([key]) => {
        c[`${key}_delay_ms`] = Math.round(Number(c[`${key}_delay_ms`] || 0) * 1000);
      });
      if (Number(c.oil_full_distance_cm) >= Number(c.oil_empty_distance_cm)) {
        showToast("Oil FULL distance must be smaller than EMPTY distance.");
        return false;
      }
      try {
        const r = await request(
          "/config",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) },
          8000
        );
        showToast(await r.text(), "success");
        await poll();
        return true;
      } catch (e) {
        showToast(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      }
    },
    [request, showToast, poll]
  );

  const restoreDefault = useCallback(async () => {
    await post("/config/reset", "Restore all default settings?");
    await loadConfig();
  }, [post, loadConfig]);

  const setEditingAddress = useCallback((v: boolean) => {
    editingAddressRef.current = v;
  }, []);

  return {
    ip,
    ipInput,
    setIpInput,
    connected,
    connectionLabel,
    data,
    config,
    sdFiles,
    toast,
    connect,
    setEditingAddress,
    generatorCommand,
    resetFaults,
    resetMaintenance,
    toggleOverride,
    toggleCurrentProtection,
    testSD,
    syncRTC,
    testOil,
    refreshSDFiles,
    uploadSDFile,
    downloadSelectedSDFile,
    calibrateCTs,
    downloadLog,
    loadConfig,
    saveConfig,
    restoreDefault,
  };
}
