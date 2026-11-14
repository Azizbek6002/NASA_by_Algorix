"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, CornerDownLeft, Loader2 } from "lucide-react";

import { CATEGORIES, TYPE_LABEL } from "@/lib/constants";
import type { SearchIndexEntry } from "@/lib/types";
import { cn } from "@/lib/format";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    setQuery("");
    setResults([]);
    setActive(0);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    const id = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v1/search?q=${encodeURIComponent(q)}&limit=24`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search failed");
        const payload = (await response.json()) as { results: SearchIndexEntry[] };
        setResults(payload.results ?? []);
        setActive(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 140);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [query, open]);

  const go = useCallback(
    (entry: SearchIndexEntry | undefined) => {
      if (!entry) return;
      setOpen(false);
      router.push(entry.href);
    },
    [router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    const node = listRef.current?.children[active] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 border border-white/12 bg-white/[0.03] px-3 py-2 text-mist-500 transition-colors hover:border-white/30 hover:text-mist-300"
        aria-label="Search the archive"
      >
        <Search size={14} />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] md:inline">
          Search
        </span>
        <kbd className="hidden border border-white/12 px-1.5 py-0.5 font-mono text-[9px] text-mist-600 md:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-950/80 px-4 pt-[10vh] backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <div className="relative w-full max-w-2xl border border-white/15 bg-ink-900 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-mist-500" />
              ) : (
                <Search size={16} className="text-mist-500" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search satellites, landers, rovers, probes…"
                className="h-14 flex-1 bg-transparent font-mono text-sm text-mist-50 outline-none placeholder:text-mist-600"
                spellCheck={false}
                autoComplete="off"
              />
              <kbd className="border border-white/12 px-1.5 py-0.5 font-mono text-[9px] uppercase text-mist-600">
                Esc
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto scroll-thin">
              {query.trim().length < 2 ? (
                <div className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-mist-600">
                  Type at least two characters. Search by name, NORAD ID, agency or mission.
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-mist-600">
                  No catalogued object matches “{query.trim()}”.
                </div>
              ) : (
                <ul ref={listRef}>
                  {results.map((result, index) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(result)}
                        className={cn(
                          "flex w-full items-center gap-4 border-b border-white/[0.05] px-4 py-3 text-left transition-colors",
                          index === active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <span
                          className="h-8 w-[2px] shrink-0"
                          style={{ background: CATEGORIES[result.category].accent }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-mist-50">
                            {result.name}
                          </span>
                          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">
                            {CATEGORIES[result.category].short} · {TYPE_LABEL[result.type]}
                            {result.country ? ` · ${result.country}` : ""}
                          </span>
                        </span>
                        {index === active ? (
                          <CornerDownLeft size={13} className="text-mist-500" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-mist-600">
              <span>↑ ↓ to navigate · Enter to open</span>
              <span>{results.length ? `${results.length} matches` : "Archive index"}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
