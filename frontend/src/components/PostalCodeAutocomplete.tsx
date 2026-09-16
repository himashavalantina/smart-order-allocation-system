"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import api from "@/lib/api";

export interface PostalCodeResult {
  postal_code: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
}

interface Props {
  /** Current selected postal code value */
  value: string;
  /** Called whenever the user picks (or clears) a result */
  onChange: (result: PostalCodeResult | null) => void;
  /** Whether this field is required */
  required?: boolean;
  /** Optional extra class for the wrapper div */
  className?: string;
  /** Placeholder hint text */
  placeholder?: string;
}

/**
 * PostalCodeAutocomplete
 * ──────────────────────
 * A debounced autocomplete input that fetches matching Sri Lankan postal
 * codes from `/api/locations/search` as the user types.  Once a result is
 * selected the field locks to display mode and shows the code + city/district.
 * The user can press ✕ to clear and search again.
 */
export default function PostalCodeAutocomplete({
  value,
  onChange,
  required = false,
  className = "",
  placeholder = "Type a postal code or area name…",
}: Props) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<PostalCodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PostalCodeResult | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with 300 ms debounce
  const fetchResults = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (q.length === 0) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get<PostalCodeResult[]>("/api/locations/search", {
          params: { query: q },
        });
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (!selected) fetchResults(query);
  }, [query, selected, fetchResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (result: PostalCodeResult) => {
    setSelected(result);
    setQuery(result.postal_code);
    setOpen(false);
    onChange(result);
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange(null);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input row */}
      <div className="relative flex items-center">
        {loading ? (
          <Loader2 className="absolute left-3 w-3.5 h-3.5 text-indigo-400 animate-spin pointer-events-none" />
        ) : (
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        )}

        <input
          id="postal_code_search"
          type="text"
          autoComplete="off"
          required={required}
          readOnly={!!selected}
          value={query}
          placeholder={selected ? "" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (!selected && results.length > 0) setOpen(true);
          }}
          className={`input-base pl-9 pr-8 font-mono text-xs w-full transition-all ${
            selected
              ? "cursor-default text-emerald-300 border-emerald-500/30 bg-emerald-500/5"
              : ""
          }`}
        />

        {/* Selected badge or clear button */}
        {selected ? (
          <button
            type="button"
            onClick={clear}
            title="Clear selection"
            className="absolute right-2.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          query.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2.5 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )
        )}
      </div>

      {/* Selected info pill */}
      {selected && (
        <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {selected.city} · {selected.district}
        </p>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {results.map((r) => (
            <li key={r.postal_code}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click registers
                  pick(r);
                }}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0 group-hover:text-indigo-300" />
                <div className="min-w-0">
                  <span className="font-mono text-white text-xs font-semibold">
                    {r.postal_code}
                  </span>
                  <span className="mx-1.5 text-slate-600">—</span>
                  <span className="text-slate-300 text-xs">{r.city}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {r.district} District
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
