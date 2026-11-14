import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INT = new Intl.NumberFormat("en-US");

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return INT.format(Math.round(value));
}

export function formatDecimal(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "UNKNOWN";
  if (Math.abs(value) >= 1_000_000) return `${formatDecimal(value / 1_000_000, 2)} million km`;
  return `${formatInt(value)} km`;
}

export function formatAu(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "UNKNOWN";
  if (value < 0.01) return `${formatDecimal(value, 5)} AU`;
  if (value < 10) return `${formatDecimal(value, 3)} AU`;
  return `${formatDecimal(value, 2)} AU`;
}

export function formatLightTime(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "UNKNOWN";
  if (hours < 1) return `${formatDecimal(hours * 60, 1)} min one-way`;
  if (hours < 48) return `${formatDecimal(hours, 1)} h one-way`;
  return `${formatDecimal(hours / 24, 1)} days one-way`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Deterministic UTC date, safe for SSR and hydration. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "UNKNOWN";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Deterministic UTC timestamp with minute precision. */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "UNKNOWN";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${date} ${time} UTC`;
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const minutes = abs / 60_000;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${formatDecimal(hours, 1)} h`;
  const days = hours / 24;
  if (days < 400) return `${formatDecimal(days, 1)} days`;
  return `${formatDecimal(days / 365.25, 1)} years`;
}

/** Decimal degrees → 18.4446° N / 77.4509° E. East-positive longitude. */
export function formatLatLon(lat: number | null, lon: number | null): string {
  if (lat === null || lon === null) return "UNKNOWN LOCATION";
  const ns = lat >= 0 ? "N" : "S";
  // Normalise longitude into -180..180 before choosing the hemisphere.
  const lonNorm = ((((lon + 180) % 360) + 360) % 360) - 180;
  const ew = lonNorm >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}  ${Math.abs(lonNorm).toFixed(4)}° ${ew}`;
}

export function formatAltitude(perigee: number | null, apogee: number | null): string {
  if (perigee === null && apogee === null) return "UNKNOWN";
  if (perigee !== null && apogee !== null) {
    if (Math.abs(apogee - perigee) < 20) return `${formatInt(perigee)} km`;
    return `${formatInt(perigee)}–${formatInt(apogee)} km`;
  }
  return formatKm(perigee ?? apogee);
}

/**
 * Title-case a CelesTrak object name that is stored in full caps.
 * Short tokens and tokens containing digits are kept as acronyms, so
 * "GPS BIIR-2 (PRN 13)" survives instead of becoming "Gps Biir-2".
 */
export function displayName(name: string): string {
  if (/[a-z]/.test(name)) return name;

  return name
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) return token;
      const core = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
      const isAcronym =
        /^[A-Z0-9-]+$/.test(core) &&
        (core.length <= 4 || /\d/.test(core));
      if (isAcronym) return token;
      return token.toLowerCase().replace(/[a-z]/, (letter) => letter.toUpperCase());
    })
    .join("");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${formatInt(count)} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}
