import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type FilterPrimitive = string | number | boolean;

export interface UseUrlFiltersResult<T extends Record<string, FilterPrimitive>> {
  filters: T;
  isDefault: <K extends keyof T>(key: K) => boolean;
  setParam: <K extends keyof T>(key: K, value: T[K] | '' | null | undefined) => void;
  patch: (partial: Partial<T>) => void;
  reset: () => void;
}

/**
 * URL-as-state for list pages. Pass a module-level `defaults` object so
 * `filters` is stable across renders.
 *
 * Conventions:
 * - Changing any key other than `page` resets `page` to default.
 * - Numeric and boolean defaults trigger coercion when reading.
 * - Writes use `{ replace: true }` — no history spam.
 */
export function useUrlFilters<T extends Record<string, FilterPrimitive>>(
  defaults: T,
): UseUrlFiltersResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const out: Record<string, FilterPrimitive> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = searchParams.get(key);
      if (raw == null) continue;
      const def = defaults[key as keyof T];
      if (typeof def === 'number') {
        const n = Number(raw);
        out[key] = Number.isFinite(n) ? n : def;
      } else if (typeof def === 'boolean') {
        out[key] = raw === 'true' || raw === '1';
      } else {
        out[key] = raw;
      }
    }
    return out as T;
  }, [searchParams, defaults]);

  const isDefault = useCallback(<K extends keyof T>(key: K) => filters[key] === defaults[key], [filters, defaults]);

  const write = useCallback((partial: Partial<T>) => {
    const next = new URLSearchParams(searchParams);
    let touchedNonPage = false;
    for (const k of Object.keys(partial)) {
      const v = partial[k as keyof T];
      const def = defaults[k as keyof T];
      if (v == null || v === '' || v === def) next.delete(k);
      else next.set(k, String(v));
      if (k !== 'page') touchedNonPage = true;
    }
    if (touchedNonPage) next.delete('page');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, defaults]);

  const setParam = useCallback(<K extends keyof T>(key: K, value: T[K] | '' | null | undefined) => {
    write({ [key]: value } as Partial<T>);
  }, [write]);

  const reset = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, isDefault, setParam, patch: write, reset };
}
