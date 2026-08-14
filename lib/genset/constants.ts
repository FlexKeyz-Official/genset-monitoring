export const STORAGE_KEY = "generator_esp_ip";
export const DEFAULT_ADDRESS = "generator.local";

export const PROTECTION_RULES: [key: string, label: string][] = [
  ["phase_loss", "Phase loss"],
  ["under_voltage_protection", "Under voltage"],
  ["over_voltage_protection", "Over voltage"],
  ["frequency_protection", "Under/over frequency"],
  ["voltage_imbalance_protection", "Voltage imbalance"],
  ["current_imbalance_protection", "Current imbalance"],
  ["over_current", "Overcurrent / power overload"],
  ["low_pf_protection", "Low power factor"],
  ["harmonic_protection", "High harmonic distortion"],
  ["temperature_protection", "High temperature"],
  ["vibration_protection", "High vibration"],
  ["tilt_protection", "Excessive tilt"],
  ["low_oil_protection", "Low oil level"],
];

// Maps config payload keys to the values in seconds (rather than ms) shown in the form.
export const MS_TO_SECONDS_FIELDS = new Set(["startup_ignore_ms", "log_interval_ms"]);

export const CONFIG_FIELD_KEYS = [
  "generator_name",
  "rated_voltage",
  "rated_current",
  "rated_power",
  "rated_frequency",
  "current_valid_voltage",
  "under_voltage",
  "over_voltage",
  "under_frequency",
  "over_frequency",
  "current_warning",
  "current_trip",
  "power_trip",
  "low_pf",
  "voltage_imbalance_limit",
  "current_imbalance_limit",
  "thd_limit",
  "startup_ignore_ms",
  "temperature_warning",
  "temperature_trip",
  "vibration_warning",
  "vibration_trip",
  "tilt_trip",
  "low_oil_limit",
  "oil_full_distance_cm",
  "oil_empty_distance_cm",
  "service_interval_hours",
  "log_interval_ms",
] as const;

export const FAULT_REGISTERS: [id: string, dataKey: string, label: string][] = [
  ["fault-phase-loss", "phase_loss", "PHASE LOSS"],
  ["fault-undervoltage", "under_voltage", "UNDER-VOLTAGE"],
  ["fault-overvoltage", "over_voltage", "OVER-VOLTAGE"],
  ["fault-overload", "overload", "OVERLOAD"],
  ["fault-frequency", "frequency_fault", "FREQUENCY"],
  ["fault-vimb", "voltage_imbalance_fault", "V-IMBALANCE"],
  ["fault-iimb", "current_imbalance_fault", "I-IMBALANCE"],
  ["fault-thd", "harmonic_fault", "HIGH THD"],
  ["fault-pf", "low_power_factor", "LOW PF"],
  ["fault-thermal", "thermal_trip", "THERMAL"],
  ["fault-vibration", "vibration_fault", "VIBRATION"],
  ["fault-tilt", "tilt_fault", "TILT"],
  ["fault-oil", "low_oil", "LOW OIL"],
  ["fault-maintenance", "maintenance_due", "SERVICE DUE"],
];
