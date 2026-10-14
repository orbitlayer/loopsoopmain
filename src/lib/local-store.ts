/*
 * local-store — a tiny, SSR-safe "dummy database" backed by the browser's
 * localStorage. It stands in for a real backend (MySQL on Hostinger) so the
 * admin/CMS can be used and demoed before hosting is wired up. When the real
 * backend is ready, callers switch their storage mode from "local" back to
 * "server" and nothing else changes — the shapes are identical.
 *
 * Everything here is defensive: it never throws, works (as a no-op) on the
 * server where `window` is undefined, and tolerates private-mode / quota /
 * cleared-storage failures by degrading to an empty collection.
 *
 * It also exposes a subscribe/getSnapshot pair so React components can read it
 * through `useSyncExternalStore` — the snapshot is referentially stable until
 * the underlying data actually changes, and writes (here or in another tab)
 * notify subscribers so the UI stays in sync.
 */

const PREFIX = "loopsoop:";

/** A stable empty array so server/empty snapshots keep the same identity. */
const EMPTY: readonly unknown[] = Object.freeze([]);

/** True only in a browser with a usable localStorage. */
export function isBrowser(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    // Accessing localStorage can throw in sandboxed/blocked contexts.
    return false;
  }
}

/** Namespaced storage key, e.g. nsKey("billing") -> "loopsoop:billing". */
export function nsKey(name: string): string {
  return PREFIX + name;
}

/** A stable unique id (UUID where available, timestamp fallback otherwise). */
export function uid(): string {
  try {
    if (isBrowser() && typeof window.crypto?.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Current timestamp as an ISO string (matches MySQL `created_at` strings). */
export function nowISO(): string {
  return new Date().toISOString();
}

function rawItem(name: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(nsKey(name));
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Read a JSON array from a namespaced key. Returns [] on any problem. */
export function readCollection<T>(name: string): T[] {
  return parse<T>(rawItem(name));
}

/* ----------------------------------------------------- subscription layer */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
// Per-collection snapshot cache: keep the parsed array stable until the raw
// string changes, so useSyncExternalStore doesn't loop on new references.
const cache = new Map<string, { raw: string | null; value: unknown[] }>();

let storageBridged = false;
function bridgeStorageEvents(): void {
  if (storageBridged || !isBrowser()) return;
  storageBridged = true;
  try {
    window.addEventListener("storage", (e) => {
      if (!e.key || !e.key.startsWith(PREFIX)) return;
      const name = e.key.slice(PREFIX.length);
      cache.delete(name); // force a fresh read next getSnapshot
      listeners.get(name)?.forEach((cb) => cb());
    });
  } catch {
    /* ignore */
  }
}

function emit(name: string): void {
  cache.delete(name);
  listeners.get(name)?.forEach((cb) => cb());
}

/** Subscribe to changes of one collection. Returns an unsubscribe function. */
export function subscribe(name: string, cb: Listener): () => void {
  bridgeStorageEvents();
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(cb);
  return () => {
    set.delete(cb);
  };
}

/**
 * A referentially-stable snapshot of a collection, for useSyncExternalStore.
 * The same array instance is returned until the stored value changes.
 */
export function getSnapshot<T>(name: string): T[] {
  if (!isBrowser()) return EMPTY as T[];
  const raw = rawItem(name);
  const cached = cache.get(name);
  if (cached && cached.raw === raw) return cached.value as T[];
  const value = parse<T>(raw);
  cache.set(name, { raw, value });
  return value;
}

/** Server snapshot: always the stable empty array (no storage during SSR). */
export function getServerSnapshot<T>(): T[] {
  return EMPTY as T[];
}

/** Persist a JSON array to a namespaced key. Silently ignores write failures. */
export function writeCollection<T>(name: string, rows: T[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(nsKey(name), JSON.stringify(rows));
  } catch {
    // Quota exceeded or storage blocked — nothing we can safely do here.
  }
  emit(name);
}

/** Remove a whole collection (used when resetting demo data). */
export function clearCollection(name: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(nsKey(name));
  } catch {
    /* ignore */
  }
  emit(name);
}
